from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import time

from app.core.config import settings


def hash_password(password: str, salt: str | None = None) -> str:
    salt_value = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt_value),
        100_000,
    )
    return f"{salt_value}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        salt, expected = encoded.split("$", 1)
    except ValueError:
        return False
    actual = hash_password(password, salt).split("$", 1)[1]
    return hmac.compare_digest(actual, expected)


def create_token(user_id: int, username: str, expires_in: int = 60 * 60 * 24 * 7) -> str:
    expires_at = int(time.time()) + expires_in
    payload = f"{user_id}:{username}:{expires_at}"
    signature = hmac.new(
        settings.secret_key.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    token = f"{payload}:{signature}".encode("utf-8")
    return base64.urlsafe_b64encode(token).decode("utf-8").rstrip("=")


def decode_token(token: str) -> tuple[int, str]:
    padded = token + "=" * (-len(token) % 4)
    raw = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
    user_id_s, username, expires_at_s, signature = raw.rsplit(":", 3)
    payload = f"{user_id_s}:{username}:{expires_at_s}"
    expected_signature = hmac.new(
        settings.secret_key.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError("invalid signature")
    if int(expires_at_s) < int(time.time()):
        raise ValueError("token expired")
    return int(user_id_s), username

