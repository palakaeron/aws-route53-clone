"""Runtime configuration loaded from environment variables."""

from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", DATA_DIR / "route53.db"))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}")
API_PREFIX = "/api/v1"
SESSION_COOKIE_NAME = "route53_session"
SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "8"))
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
DEFAULT_FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

env_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]

FRONTEND_ORIGINS = list(dict.fromkeys(DEFAULT_FRONTEND_ORIGINS + env_origins))

