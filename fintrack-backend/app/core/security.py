import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Tuple

import bcrypt
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from jose import jwt, JWTError

from app.core.config import settings
import requests


# ── Password Hashing (Direct native bcrypt) ───────────────────────────────────

def hash_password(plain: str) -> str:
    """Return BCrypt hash of a plaintext password."""
    # Truncate to 72 bytes per BCrypt spec
    pwd_bytes = plain.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored BCrypt hash."""
    try:
        pwd_bytes = plain.encode("utf-8")[:72]
        hashed_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


# ── Access Token (JWT) ─────────────────────────────────────────────────────────

def create_access_token(user_id: int, email: str) -> str:
    """
    Issue a short-lived HS256 JWT access token.
    Claims: sub (user_id as str), email, type, iat, exp.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "access",
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.
    Raises ValueError with a safe message on any failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        return payload
    except JWTError:
        raise ValueError("Invalid or expired token")


# ── Refresh Token ──────────────────────────────────────────────────────────────

def create_refresh_token() -> Tuple[str, str]:
    """
    Generate a cryptographically random refresh token.
    Returns (raw_token, bcrypt_hash).
    - raw_token  → stored in HttpOnly cookie, never persisted to DB.
    - bcrypt_hash → stored in DB.
    """
    raw = secrets.token_urlsafe(48)
    token_hash = hash_password(raw)
    return raw, token_hash


def verify_refresh_token(raw: str, stored_hash: str) -> bool:
    """Return True if raw refresh token matches the stored BCrypt hash."""
    return verify_password(raw, stored_hash)


# ── Password Reset Token (itsdangerous) ───────────────────────────────────────

_reset_serializer = URLSafeTimedSerializer(settings.JWT_SECRET_KEY, salt="pw-reset")


def generate_password_reset_token(email: str) -> str:
    """Return a signed, time-limited token encoding the user's email (1 h TTL)."""
    return _reset_serializer.dumps(email)


def verify_password_reset_token(token: str, max_age_seconds: int = 3600) -> str:
    """
    Verify the password reset token and return the email it encodes.
    Raises ValueError if the token is invalid or expired.
    """
    try:
        email = _reset_serializer.loads(token, max_age=max_age_seconds)
        return email
    except SignatureExpired:
        raise ValueError("Password reset link has expired. Please request a new one.")
    except BadSignature:
        raise ValueError("Invalid password reset link.")


# ── CSRF Token ─────────────────────────────────────────────────────────────────

def generate_csrf_token() -> str:
    """Generate a random CSRF token for the double-submit cookie pattern."""
    return secrets.token_urlsafe(32)


# ── Email Sending ──────────────────────────────────────────────────────────────

def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """
    Send a password reset email using Resend, SMTP, or console fallback.
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    html_body = f"""
    <html><body>
      <h2>Reset your FinTrack password</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="{reset_url}">Reset Password</a></p>
      <p>If you didn't request this, ignore this email — your password won't change.</p>
    </body></html>
    """

    # 1. Try Resend API
    if settings.RESEND_API_KEY:
        try:
            response = requests.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json={
                    "from": settings.SMTP_FROM,
                    "to": [to_email],
                    "subject": "FinTrack — Password Reset",
                    "html": html_body,
                },
            )
            response.raise_for_status()
            return
        except Exception as exc:
            print(f"[WARNING] Failed to send via Resend: {exc}")

    # 2. Try SMTP fallback
    if settings.SMTP_HOST:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "FinTrack — Password Reset"
            msg["From"] = settings.SMTP_FROM
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.starttls()
                if settings.SMTP_USER:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
            return
        except Exception as exc:
            print(f"[WARNING] Failed to send via SMTP: {exc}")

    # 3. Console fallback
    print("\n" + "=" * 60)
    print(" [EMAIL]  PASSWORD RESET LINK (dev console fallback)")
    print(f"    To: {to_email}")
    print(f"    URL: {reset_url}")
    print("=" * 60 + "\n")
