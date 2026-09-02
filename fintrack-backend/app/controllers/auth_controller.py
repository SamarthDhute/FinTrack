from typing import Optional
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, Header, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth_schema import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["Authentication"])

# ── Google OAuth Client Setup ──────────────────────────────────────────────────
oauth = OAuth()
if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def _set_auth_cookies(response: Response, raw_rt: str, csrf_token: str) -> None:
    is_prod = settings.APP_ENV == "production"
    # Set HttpOnly refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=raw_rt,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )
    # Set readable CSRF cookie for double-submit verification
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=is_prod,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")
    response.delete_cookie(key="csrf_token", path="/")


# ── Registration ───────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(
    request: Request,
    response: Response,
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    device_hint = request.headers.get("User-Agent", "")[:100]
    token_resp, raw_rt, _ = AuthService.register(
        db=db,
        email=data.email,
        password=data.password,
        display_name=data.display_name,
        device_hint=device_hint,
    )
    _set_auth_cookies(response, raw_rt, token_resp.csrf_token)
    return token_resp


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate with email and password",
)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    device_hint = request.headers.get("User-Agent", "")[:100]
    token_resp, raw_rt, _ = AuthService.login(
        db=db,
        email=data.email,
        password=data.password,
        device_hint=device_hint,
    )
    _set_auth_cookies(response, raw_rt, token_resp.csrf_token)
    return token_resp


# ── Token Refresh ──────────────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Silently refresh the access token using HttpOnly refresh cookie",
)
def refresh_token(
    request: Request,
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    csrf_token_cookie: Optional[str] = Cookie(None, alias="csrf_token"),
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    device_hint = request.headers.get("User-Agent", "")[:100]
    token_resp, new_raw_rt = AuthService.refresh_tokens(
        db=db,
        raw_rt=refresh_token,
        csrf_header=x_csrf_token,
        csrf_cookie=csrf_token_cookie,
        device_hint=device_hint,
    )
    _set_auth_cookies(response, new_raw_rt, token_resp.csrf_token)
    return token_resp


# ── Logout ─────────────────────────────────────────────────────────────────────

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Log out of the current device/session",
)
def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
):
    AuthService.logout(db=db, raw_rt=refresh_token)
    _clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


# ── Logout All Devices ─────────────────────────────────────────────────────────

@router.post(
    "/logout-all",
    status_code=status.HTTP_200_OK,
    summary="Log out from all devices/sessions",
)
def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    AuthService.logout_all(db=db, user_id=current_user.id)
    _clear_auth_cookies(response)
    return {"message": "Logged out from all devices"}


# ── Current User Profile ───────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get profile of the currently authenticated user",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ── Forgot / Reset Password ────────────────────────────────────────────────────

@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Request a password reset link by email",
)
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    AuthService.forgot_password(db=db, email=data.email, background_tasks=background_tasks)
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Set a new password using a signed reset token",
)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    AuthService.reset_password(db=db, token=data.token, new_password=data.new_password)
    return {"message": "Password reset successfully. Please log in with your new password."}


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change password for authenticated user",
)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    AuthService.change_password(
        db=db,
        user=current_user,
        current_password=data.current_password,
        new_password=data.new_password,
    )
    return {"message": "Password changed successfully."}


# ── Google OAuth 2.0 ───────────────────────────────────────────────────────────

@router.get(
    "/google/authorize",
    summary="Redirect user to Google OAuth consent screen",
)
async def google_authorize(request: Request):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google Sign-In is not configured on this server.",
        )
    return await oauth.google.authorize_redirect(request, settings.GOOGLE_REDIRECT_URI)


@router.get(
    "/google/callback",
    summary="Handle Google OAuth 2.0 callback",
)
async def google_callback(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google Sign-In is not configured on this server.",
        )

    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication failed: {str(exc)}",
        )

    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve user info from Google.",
        )

    email = userinfo.get("email")
    google_id = userinfo.get("sub")
    display_name = userinfo.get("name") or userinfo.get("given_name")

    if not email or not google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google profile data.",
        )

    device_hint = request.headers.get("User-Agent", "")[:100]
    token_resp, raw_rt, _ = AuthService.handle_google_user(
        db=db,
        email=email,
        google_id=google_id,
        display_name=display_name,
        device_hint=device_hint,
    )

    # Redirect to frontend with tokens in fragment / query
    redirect_url = f"{settings.FRONTEND_URL}/#access_token={token_resp.access_token}&csrf_token={token_resp.csrf_token}"
    resp = RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
    _set_auth_cookies(resp, raw_rt, token_resp.csrf_token)
    return resp
