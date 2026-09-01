from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from app.core.security import verify_refresh_token
from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    @staticmethod
    def create(
        db: Session,
        user_id: int,
        token_hash: str,
        expires_at: datetime,
        device_hint: Optional[str] = None,
    ) -> RefreshToken:
        rt = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            revoked=False,
            device_hint=device_hint,
        )
        db.add(rt)
        db.flush()
        return rt

    @staticmethod
    def find_valid_for_user(db: Session, user_id: int, raw_token: str) -> Optional[RefreshToken]:
        """
        Find an active, non-expired RefreshToken for user_id whose stored hash
        matches the given raw_token. Returns None if not found or already revoked.
        """
        now = datetime.utcnow()
        stmt = (
            select(RefreshToken)
            .where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.revoked == False,  # noqa: E712
                    RefreshToken.expires_at > now,
                )
            )
        )
        candidates = list(db.scalars(stmt).all())
        for rt in candidates:
            if verify_refresh_token(raw_token, rt.token_hash):
                return rt
        return None

    @staticmethod
    def find_any_valid(db: Session, raw_token: str) -> Optional[RefreshToken]:
        """
        Find a valid RefreshToken across all users by verifying the raw token
        against stored hashes. Used during /auth/refresh where we only have
        the raw token from the cookie (not the user_id yet).
        """
        now = datetime.utcnow()
        stmt = (
            select(RefreshToken)
            .where(
                and_(
                    RefreshToken.revoked == False,  # noqa: E712
                    RefreshToken.expires_at > now,
                )
            )
        )
        candidates = list(db.scalars(stmt).all())
        for rt in candidates:
            if verify_refresh_token(raw_token, rt.token_hash):
                return rt
        return None

    @staticmethod
    def revoke(db: Session, token: RefreshToken) -> None:
        token.revoked = True
        db.flush()

    @staticmethod
    def revoke_all_for_user(db: Session, user_id: int) -> None:
        """Revoke all active refresh tokens for a user (logout from all devices)."""
        stmt = (
            select(RefreshToken)
            .where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.revoked == False,  # noqa: E712
                )
            )
        )
        tokens = list(db.scalars(stmt).all())
        for t in tokens:
            t.revoked = True
        db.flush()

    @staticmethod
    def cleanup_expired(db: Session) -> int:
        """Delete expired refresh tokens. Returns count deleted."""
        now = datetime.utcnow()
        stmt = select(RefreshToken).where(RefreshToken.expires_at <= now)
        expired = list(db.scalars(stmt).all())
        for t in expired:
            db.delete(t)
        db.flush()
        return len(expired)
