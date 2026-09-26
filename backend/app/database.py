from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

from .core.config import DATABASE_URL


database_url = make_url(DATABASE_URL)
if database_url.get_backend_name() == "sqlite" and database_url.database not in (None, ":memory:"):
    from pathlib import Path

    Path(database_url.database).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)

engine_options = {"connect_args": {"check_same_thread": False}} if database_url.get_backend_name() == "sqlite" else {}
engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
