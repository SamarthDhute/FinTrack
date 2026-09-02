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
# pyrefly: ignore [missing-import]
import httpx


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
    frontend_base = settings.FRONTEND_URL.rstrip("/") if settings.FRONTEND_URL else "http://localhost:3000"
    reset_url = f"{frontend_base}/?token={reset_token}#reset-password"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; margin: 0;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
        <h2 style="color: #f8fafc; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.5;">
          We received a request to reset the password for your FinTrack account (<strong>{to_email}</strong>).
        </p>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.5;">
          Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="{reset_url}" style="background-color: #6366f1; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="word-break: break-all; font-size: 13px;">
          <a href="{reset_url}" style="color: #818cf8;">{reset_url}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
          If you didn't request this email, you can safely ignore it. Your password will not change until you access the link above.
        </p>
      </div>
    </body>
    </html>
    """

    # 1. Try Resend API
    if settings.RESEND_API_KEY:
        try:
            with httpx.Client() as client:
                response = client.post(
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
