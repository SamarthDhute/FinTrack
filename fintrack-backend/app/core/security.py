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


# ── Email Verification Token (itsdangerous) ───────────────────────────────────

_verify_serializer = URLSafeTimedSerializer(settings.JWT_SECRET_KEY, salt="email-verify")


def generate_email_verification_token(email: str) -> str:
    """Return a signed, time-limited token encoding the user's email (24 h TTL)."""
    return _verify_serializer.dumps(email)


def verify_email_token(token: str, max_age_seconds: int = 86400) -> str:
    """
    Verify the email verification token and return the email it encodes.
    Raises ValueError if the token is invalid or expired.
    """
    try:
        email = _verify_serializer.loads(token, max_age=max_age_seconds)
        return email
    except SignatureExpired:
        raise ValueError("Verification link has expired. Please request a new one.")
    except BadSignature:
        raise ValueError("Invalid verification link.")


# ── CSRF Token ─────────────────────────────────────────────────────────────────

def generate_csrf_token() -> str:
    """Generate a random CSRF token for the double-submit cookie pattern."""
    return secrets.token_urlsafe(32)


def _get_resend_api_key() -> Optional[str]:
    """Retrieve Resend API key from RESEND_API_KEY or auto-detect from SMTP_PASSWORD."""
    if settings.RESEND_API_KEY and settings.RESEND_API_KEY.strip():
        return settings.RESEND_API_KEY.strip()
    if settings.SMTP_PASSWORD and settings.SMTP_PASSWORD.strip().startswith("re_"):
        return settings.SMTP_PASSWORD.strip()
    return None


def _get_resend_from_email() -> str:
    """Return a valid sender email for Resend, preventing unverified public domain 403 errors."""
    from_email = settings.SMTP_FROM.strip() if settings.SMTP_FROM else ""
    public_domains = ("gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com")
    if not from_email or any(f"@{d}" in from_email.lower() for d in public_domains):
        return "FinTrack <onboarding@resend.dev>"
    if "<" not in from_email and "@" in from_email:
        return f"FinTrack <{from_email}>"
    return from_email


def _dispatch_email(to_email: str, subject: str, html_body: str, fallback_url: str) -> None:
    """
    Unified email dispatcher supporting:
    - EMAIL_PROVIDER="smtp" -> Uses SMTP (Gmail, etc.)
    - EMAIL_PROVIDER="resend" -> Uses Resend HTTPS REST API
    - EMAIL_PROVIDER="auto" -> Tries Resend first if key present, else SMTP
    - EMAIL_PROVIDER="console" -> Prints link to console
    """
    provider = settings.EMAIL_PROVIDER.lower().strip() if settings.EMAIL_PROVIDER else "auto"

    def _send_resend() -> bool:
        resend_key = _get_resend_api_key()
        if not resend_key:
            return False
        try:
            from_email = _get_resend_from_email()
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": from_email,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_body,
                    },
                )
                if response.status_code < 400:
                    print(f"[INFO] Resend email successfully sent to {to_email}: {response.text}")
                    return True
                else:
                    print(f"[ERROR] Resend API error ({response.status_code}) for {to_email}: {response.text}")
                    return False
        except Exception as exc:
            print(f"[WARNING] Failed to send via Resend: {exc}")
            return False

    def _send_smtp() -> bool:
        if not settings.SMTP_HOST:
            return False
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            from_addr = settings.SMTP_FROM or settings.SMTP_USER
            msg["From"] = from_addr
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.starttls()
                if settings.SMTP_USER:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(from_addr, to_email, msg.as_string())
            print(f"[INFO] SMTP ({settings.SMTP_HOST}) email successfully sent to {to_email}")
            return True
        except Exception as exc:
            print(f"[WARNING] Failed to send via SMTP: {exc}")
            return False

    if provider == "resend":
        if _send_resend():
            return
    elif provider == "smtp":
        if _send_smtp():
            return
    elif provider == "auto":
        if _get_resend_api_key() and _send_resend():
            return
        if settings.SMTP_HOST and _send_smtp():
            return

    # Console fallback (for dev or if configured providers fail)
    print("\n" + "=" * 60)
    print(f" [EMAIL]  {subject.upper()} (dev console fallback)")
    print(f"    To: {to_email}")
    print(f"    URL: {fallback_url}")
    print("=" * 60 + "\n")


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
    _dispatch_email(to_email=to_email, subject="FinTrack — Password Reset", html_body=html_body, fallback_url=reset_url)


def send_verification_email(to_email: str, verify_token: str) -> None:
    """
    Send an email verification link using Resend, SMTP, or console fallback.
    """
    frontend_base = settings.FRONTEND_URL.rstrip("/") if settings.FRONTEND_URL else "http://localhost:3000"
    verify_url = f"{frontend_base}/?token={verify_token}#verify-email"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; margin: 0;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
        <h2 style="color: #f8fafc; margin-top: 0;">Verify Your Email Address</h2>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.5;">
          Welcome to FinTrack! Please confirm your email address (<strong>{to_email}</strong>) to activate your account.
        </p>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.5;">
          Click the button below to verify your email. This link is valid for <strong>24 hours</strong>.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="{verify_url}" style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="word-break: break-all; font-size: 13px;">
          <a href="{verify_url}" style="color: #34d399;">{verify_url}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
          If you did not create a FinTrack account, please ignore this email.
        </p>
      </div>
    </body>
    </html>
    """
    _dispatch_email(to_email=to_email, subject="FinTrack — Verify Your Email", html_body=html_body, fallback_url=verify_url)
