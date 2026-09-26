"""Behavior tests for cookie sessions and user-scoped resource access."""

import os
from datetime import datetime, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory

_temporary_directory = TemporaryDirectory()
os.environ["DATABASE_PATH"] = str(Path(_temporary_directory.name) / "route53-test.db")

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

from app.core.security import verify_password  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.database_migrations import apply_migrations  # noqa: E402
from app.main import app  # noqa: E402
from app.models import DNSRecord, HostedZone, User, UserSession  # noqa: E402


def login(client: TestClient, email: str = "demo@aws.local", password: str = "demo123") -> None:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200


def test_successful_login_sets_an_http_only_session_cookie() -> None:
    with TestClient(app) as client:
        response = client.post("/api/v1/auth/login", json={"email": "demo@aws.local", "password": "demo123"})

        assert response.status_code == 200
        assert response.json()["data"]["email"] == "demo@aws.local"
        assert "httponly" in response.headers["set-cookie"].lower()
        assert "route53_session=" in response.headers["set-cookie"]


def test_invalid_credentials_are_rejected() -> None:
    with TestClient(app) as client:
        response = client.post("/api/v1/auth/login", json={"email": "demo@aws.local", "password": "wrong"})

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_me_restores_a_valid_session_and_rejects_missing_session() -> None:
    with TestClient(app) as client:
        assert client.get("/api/v1/auth/me").status_code == 401
        login(client)
        response = client.get("/api/v1/auth/me")

        assert response.status_code == 200
        assert response.json()["data"]["name"] == "Demo User"


def test_logout_invalidates_the_server_side_session() -> None:
    with TestClient(app) as client:
        login(client)
        assert client.post("/api/v1/auth/logout").status_code == 204
        response = client.get("/api/v1/auth/me")

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


def test_expired_and_unknown_sessions_are_rejected() -> None:
    with TestClient(app) as client:
        login(client)
        token = client.cookies.get("route53_session")
        assert token
        db = SessionLocal()
        try:
            session = db.query(UserSession).filter(UserSession.token == token).one()
            session.expires_at = datetime.utcnow() - timedelta(seconds=1)
            db.commit()
        finally:
            db.close()

        expired = client.get("/api/v1/auth/me")
        assert expired.status_code == 401
        assert expired.json()["error"]["code"] == "INVALID_SESSION"

        client.cookies.set("route53_session", "unknown-token")
        unknown = client.get("/api/v1/auth/me")
        assert unknown.status_code == 401
        assert unknown.json()["error"]["code"] == "INVALID_SESSION"


def test_protected_endpoints_require_authentication() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/hosted-zones")

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


def test_hosted_zone_and_record_access_is_isolated_by_owner() -> None:
    db = SessionLocal()
    try:
        other = db.query(User).filter(User.email == "other@aws.local").first()
        if not other:
            other = User(name="Other User", email="other@aws.local", legacy_password="MIGRATED", password_hash=hash_password("other-pass"))
            db.add(other)
            db.flush()
        zone = db.query(HostedZone).filter(HostedZone.name == "private-other.example").first()
        if not zone:
            zone = HostedZone(name="private-other.example", zone_id="ZOTHER00000001", type="Public", description="Ownership test", owner_id=other.id)
            db.add(zone)
            db.flush()
            db.add(DNSRecord(hosted_zone_id=zone.id, name="private-other.example", type="A", value="192.0.2.88", ttl=300))
        elif not zone.zone_id:
            zone.zone_id = "ZOTHER00000001"
        db.commit()
        zone_id = zone.id
    finally:
        db.close()

    with TestClient(app) as demo_client, TestClient(app) as other_client:
        login(demo_client)
        assert demo_client.get(f"/api/v1/hosted-zones/{zone_id}").status_code == 404
        assert demo_client.get(f"/api/v1/hosted-zones/{zone_id}/records").status_code == 404

        login(other_client, "other@aws.local", "other-pass")
        own_zone = other_client.get(f"/api/v1/hosted-zones/{zone_id}")
        assert own_zone.status_code == 200
        assert own_zone.json()["data"]["name"] == "private-other.example"


def test_v2_migration_preserves_legacy_rows_and_scrubs_plaintext(tmp_path: Path) -> None:
    database_path = tmp_path / "legacy.db"
    engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL)"))
        connection.execute(text("CREATE TABLE hosted_zones (id INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, type VARCHAR(30) NOT NULL, description TEXT, created_at DATETIME)"))
        connection.execute(text("CREATE TABLE dns_records (id INTEGER PRIMARY KEY, hosted_zone_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, type VARCHAR(20) NOT NULL, value TEXT NOT NULL, ttl INTEGER, priority INTEGER, created_at DATETIME)"))
        connection.execute(text("INSERT INTO users (id, name, email, password) VALUES (1, 'Legacy User', 'legacy@example.test', 'legacy-secret')"))
        connection.execute(text("INSERT INTO hosted_zones (id, name, type, description) VALUES (1, 'legacy.example', 'Public', 'Legacy zone')"))

    apply_migrations(engine)

    with engine.connect() as connection:
        user = connection.execute(text("SELECT password, password_hash FROM users WHERE id = 1")).mappings().one()
        zone = connection.execute(text("SELECT owner_id FROM hosted_zones WHERE id = 1")).mappings().one()
        version = connection.execute(text("SELECT MAX(version) FROM schema_migrations")).scalar_one()

    assert user["password"] == "MIGRATED"
    assert verify_password("legacy-secret", user["password_hash"])
    assert zone["owner_id"] == 1
    assert version >= 3
