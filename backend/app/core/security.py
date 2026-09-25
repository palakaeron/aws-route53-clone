"""Password and opaque-session primitives built on the Python standard library."""

from base64 import b64decode, b64encode
from hashlib import scrypt
import hmac
import secrets


_SALT_BYTES = 16
_HASH_BYTES = 32
_SCRYPT_N = 2**14


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(_SALT_BYTES)
    digest = scrypt(password.encode("utf-8"), salt=salt, n=_SCRYPT_N, r=8, p=1, dklen=_HASH_BYTES)
    return "scrypt$16384$8$1${}${}".format(
        b64encode(salt).decode("ascii"), b64encode(digest).decode("ascii")
    )


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False
    try:
        algorithm, n, r, p, encoded_salt, encoded_digest = stored_hash.split("$")
        if algorithm != "scrypt":
            return False
        digest = scrypt(
            password.encode("utf-8"),
            salt=b64decode(encoded_salt),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(b64decode(encoded_digest)),
        )
        return hmac.compare_digest(digest, b64decode(encoded_digest))
    except (ValueError, TypeError):
        return False


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)
