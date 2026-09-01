from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ── Registration ───────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100, description="Optional display name")
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 characters)")


# ── Login ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


# ── Token Response ─────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access token expires
    csrf_token: str  # for double-submit cookie CSRF protection


# ── User Profile ───────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: int
    email: str
    display_name: Optional[str] = None
    is_verified: bool
    google_id: Optional[str] = None  # non-null means Google account linked
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Password Management ────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address to send the reset link to")


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Signed password reset token from the email link")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password (min 8 characters)")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="Current password for verification")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password (min 8 characters)")
