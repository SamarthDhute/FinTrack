from datetime import datetime, timedelta
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    generate_csrf_token,
    generate_password_reset_token,
    verify_password_reset_token,
    send_password_reset_email,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.schemas.auth_schema import TokenResponse, UserResponse


class AuthService:
    @staticmethod
    def _issue_tokens(
        db: Session, user: User, device_hint: Optional[str] = None
    ) -> Tuple[TokenResponse, str]:
        """
        Helper: creates a new Access Token + Refresh Token for the user.
        Persists hashed RT in DB.
        Returns (TokenResponse, raw_refresh_token_string).
        """
        access_token = create_access_token(user_id=user.id, email=user.email)
        raw_rt, rt_hash = create_refresh_token()
        rt_expires = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        RefreshTokenRepository.create(
            db=db,
            user_id=user.id,
            token_hash=rt_hash,
            expires_at=rt_expires,
            device_hint=device_hint,
        )
        db.commit()

        csrf_token = generate_csrf_token()
        token_resp = TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            csrf_token=csrf_token,
        )
        return token_resp, raw_rt

    @staticmethod
    def register(
        db: Session,
        email: str,
        password: str,
        display_name: Optional[str] = None,
        device_hint: Optional[str] = None,
    ) -> Tuple[TokenResponse, str, User]:
        # 1. Check if email already exists
        existing = UserRepository.get_by_email(db, email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        # 2. Hash password & create user
        hashed = hash_password(password)
        user = UserRepository.create(
            db=db,
            email=email,
            hashed_password=hashed,
            display_name=display_name,
            is_verified=False,
        )

        # 3. Seed 10 default categories
        UserRepository.seed_default_categories(db, user_id=user.id)
        db.commit()
        db.refresh(user)

        # 4. Issue tokens
        token_resp, raw_rt = AuthService._issue_tokens(db, user, device_hint=device_hint)
        return token_resp, raw_rt, user

    @staticmethod
    def login(
        db: Session,
        email: str,
        password: str,
        device_hint: Optional[str] = None,
    ) -> Tuple[TokenResponse, str, User]:
        # Generic error message to prevent user enumeration
        invalid_credentials = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

        user = UserRepository.get_by_email(db, email)
        if not user:
            raise invalid_credentials

        if not user.hashed_password:
            # User signed up with Google OAuth only
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account uses Google Sign-In. Please sign in with Google.",
            )

        if not verify_password(password, user.hashed_password):
            raise invalid_credentials

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated.",
            )

        token_resp, raw_rt = AuthService._issue_tokens(db, user, device_hint=device_hint)
        return token_resp, raw_rt, user

    @staticmethod
    def refresh_tokens(
        db: Session,
        raw_rt: Optional[str],
        csrf_header: Optional[str],
        csrf_cookie: Optional[str],
        device_hint: Optional[str] = None,
    ) -> Tuple[TokenResponse, str]:
        if not raw_rt:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token missing.",
            )

        # CSRF validation (double-submit cookie)
        if not csrf_header or not csrf_cookie or csrf_header != csrf_cookie:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token validation failed.",
            )

        # Find matching active RT
        rt_record = RefreshTokenRepository.find_any_valid(db, raw_token=raw_rt)
        if not rt_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        user = UserRepository.get_by_id(db, rt_record.user_id)
        if not user or not user.is_active:
            RefreshTokenRepository.revoke(db, rt_record)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account inactive or deleted.",
            )

        # Token Rotation: revoke old RT
        RefreshTokenRepository.revoke(db, rt_record)

        # Issue new tokens
        token_resp, new_raw_rt = AuthService._issue_tokens(db, user, device_hint=device_hint)
        return token_resp, new_raw_rt

    @staticmethod
    def logout(db: Session, raw_rt: Optional[str]) -> None:
        if raw_rt:
            rt_record = RefreshTokenRepository.find_any_valid(db, raw_token=raw_rt)
            if rt_record:
                RefreshTokenRepository.revoke(db, rt_record)
                db.commit()

    @staticmethod
    def logout_all(db: Session, user_id: int) -> None:
        RefreshTokenRepository.revoke_all_for_user(db, user_id)
        db.commit()

    @staticmethod
    def forgot_password(db: Session, email: str) -> None:
        user = UserRepository.get_by_email(db, email)
        # Always return success to prevent email enumeration
        if user:
            token = generate_password_reset_token(user.email)
            send_password_reset_email(to_email=user.email, reset_token=token)

    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> None:
        try:
            email = verify_password_reset_token(token)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

        user = UserRepository.get_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User no longer exists.",
            )

        hashed = hash_password(new_password)
        UserRepository.update_password(db, user, hashed)

        # Invalidate all existing sessions on password reset
        RefreshTokenRepository.revoke_all_for_user(db, user.id)
        db.commit()

    @staticmethod
    def change_password(
        db: Session, user: User, current_password: str, new_password: str
    ) -> None:
        if not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account authenticated via Google. Password change not supported.",
            )

        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

        hashed = hash_password(new_password)
        UserRepository.update_password(db, user, hashed)
        db.commit()

    @staticmethod
    def handle_google_user(
        db: Session,
        email: str,
        google_id: str,
        display_name: Optional[str] = None,
        device_hint: Optional[str] = None,
    ) -> Tuple[TokenResponse, str, User]:
        """
        Link or create user from validated Google OAuth ID token claims.
        """
        user = UserRepository.get_by_google_id(db, google_id)
        if not user:
            # Check if user exists with the same email (account linking)
            user = UserRepository.get_by_email(db, email)
            if user:
                UserRepository.update_google_id(db, user, google_id)
                db.commit()
                db.refresh(user)
            else:
                # Create brand new user
                user = UserRepository.create(
                    db=db,
                    email=email,
                    hashed_password=None,
                    display_name=display_name,
                    google_id=google_id,
                    is_verified=True,  # Google verifies email
                )
                UserRepository.seed_default_categories(db, user_id=user.id)
                db.commit()
                db.refresh(user)

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated.",
            )

        token_resp, raw_rt = AuthService._issue_tokens(db, user, device_hint=device_hint)
        return token_resp, raw_rt, user
