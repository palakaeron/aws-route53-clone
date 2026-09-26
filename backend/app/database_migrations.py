"""Lightweight, additive database version tracking for the SQLite assessment app.

This deliberately does not reset application tables. Future schema changes are
registered as explicit migrations here, making upgrades safe for an existing
local database rather than relying on an implicit destructive rebuild.
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from .database import Base

CURRENT_SCHEMA_VERSION = 4


def apply_migrations(engine: Engine) -> None:
    """Create an initial schema or mark a pre-versioning installation as v1."""
    with engine.begin() as connection:
        inspector = inspect(connection)
        table_names = set(inspector.get_table_names())

        if "schema_migrations" not in table_names:
            connection.execute(
                text(
                    "CREATE TABLE schema_migrations ("
                    "version INTEGER PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)"
                )
            )
            # Existing installations use the original v1 table shapes. They are
            # recorded rather than recreated, preserving all user data.
            if table_names:
                connection.execute(text("INSERT INTO schema_migrations (version) VALUES (1)"))
            else:
                Base.metadata.create_all(bind=connection)
                connection.execute(text("INSERT INTO schema_migrations (version) VALUES (1)"))

        version = connection.execute(text("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")).scalar_one()
        if version > CURRENT_SCHEMA_VERSION:
            raise RuntimeError("Database schema is newer than this application supports.")

        if version < 2:
            _migrate_to_v2(connection)
            connection.execute(text("INSERT INTO schema_migrations (version) VALUES (2)"))
            version = 2
        if version < 3:
            _migrate_to_v3(connection)
            connection.execute(text("INSERT INTO schema_migrations (version) VALUES (3)"))
            version = 3
        if version < 4:
            _migrate_to_v4(connection)
            connection.execute(text("INSERT INTO schema_migrations (version) VALUES (4)"))


def _has_column(connection, table_name: str, column_name: str) -> bool:
    return column_name in {column["name"] for column in inspect(connection).get_columns(table_name)}


def _migrate_to_v2(connection) -> None:
    """Add secure session and ownership fields without replacing existing data."""
    from .core.security import hash_password

    if not _has_column(connection, "users", "password_hash"):
        connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(512)"))
    if not _has_column(connection, "hosted_zones", "owner_id"):
        connection.execute(text("ALTER TABLE hosted_zones ADD COLUMN owner_id INTEGER"))

    connection.execute(
        text(
            "CREATE TABLE IF NOT EXISTS sessions ("
            "id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, token VARCHAR(255) NOT NULL UNIQUE, "
            "expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "
            "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)"
        )
    )
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_sessions_user_id ON sessions (user_id)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_sessions_expires_at ON sessions (expires_at)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_hosted_zones_owner_id ON hosted_zones (owner_id)"))

    users = connection.execute(text("SELECT id, password, password_hash FROM users")).mappings().all()
    for user in users:
        if not user["password_hash"]:
            # This runs exactly once for legacy rows, then overwrites the former
            # plaintext value so it cannot be used by application code again.
            connection.execute(
                text("UPDATE users SET password_hash = :password_hash, password = :marker WHERE id = :id"),
                {"id": user["id"], "password_hash": hash_password(user["password"]), "marker": "MIGRATED"},
            )

    default_owner_id = connection.execute(text("SELECT id FROM users ORDER BY id LIMIT 1")).scalar()
    if default_owner_id is not None:
        connection.execute(
            text("UPDATE hosted_zones SET owner_id = :owner_id WHERE owner_id IS NULL"), {"owner_id": default_owner_id}
        )


def _migrate_to_v3(connection) -> None:
    """Add immutable public zone IDs, timestamps, indexes, and JSON record values."""
    import json

    from .validators.record_validators import normalize_record_data

    if not _has_column(connection, "hosted_zones", "zone_id"):
        connection.execute(text("ALTER TABLE hosted_zones ADD COLUMN zone_id VARCHAR(32)"))
    if not _has_column(connection, "hosted_zones", "updated_at"):
        connection.execute(text("ALTER TABLE hosted_zones ADD COLUMN updated_at DATETIME"))
    if not _has_column(connection, "dns_records", "updated_at"):
        connection.execute(text("ALTER TABLE dns_records ADD COLUMN updated_at DATETIME"))

    zones = connection.execute(text("SELECT id, zone_id, created_at FROM hosted_zones")).mappings().all()
    for zone in zones:
        connection.execute(
            text("UPDATE hosted_zones SET zone_id = :zone_id, updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) WHERE id = :id"),
            {"id": zone["id"], "zone_id": zone["zone_id"] or _legacy_zone_id(zone["id"])},
        )
    connection.execute(text("UPDATE dns_records SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_hosted_zones_zone_id ON hosted_zones (zone_id)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_hosted_zones_name ON hosted_zones (name)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_dns_records_hosted_zone_id ON dns_records (hosted_zone_id)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_dns_records_zone_name_type ON dns_records (hosted_zone_id, name, type)"))

    records = connection.execute(text("SELECT id, type, value FROM dns_records")).mappings().all()
    for record in records:
        try:
            data = normalize_record_data(record["type"], record["value"])
        except Exception:
            data = {"legacy_value": record["value"]}
        connection.execute(text("UPDATE dns_records SET value = :value WHERE id = :id"), {"id": record["id"], "value": json.dumps(data, separators=(",", ":"), sort_keys=True)})


def _legacy_zone_id(database_id: int) -> str:
    return f"Z{database_id:013X}"


def _migrate_to_v4(connection) -> None:
    """Create tables for simulated Route 53 features: Traffic Policies, Health Checks, Resolver, Profiles."""
    connection.execute(text(
        "CREATE TABLE IF NOT EXISTS traffic_policies ("
        "id INTEGER PRIMARY KEY, "
        "owner_id INTEGER NOT NULL, "
        "name VARCHAR(255) NOT NULL, "
        "description TEXT DEFAULT '', "
        "routing_strategy VARCHAR(50) NOT NULL DEFAULT 'Simple', "
        "status VARCHAR(30) NOT NULL DEFAULT 'Active', "
        "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
        "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
        "FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE)"
    ))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_traffic_policies_owner_id ON traffic_policies (owner_id)"))

    connection.execute(text(
        "CREATE TABLE IF NOT EXISTS health_checks ("
        "id INTEGER PRIMARY KEY, "
        "owner_id INTEGER NOT NULL, "
        "name VARCHAR(255) NOT NULL, "
        "endpoint VARCHAR(500) NOT NULL, "
        "protocol VARCHAR(20) NOT NULL DEFAULT 'HTTPS', "
        "port INTEGER NOT NULL DEFAULT 443, "
        "path VARCHAR(500) NOT NULL DEFAULT '/', "
        "status VARCHAR(30) NOT NULL DEFAULT 'Unknown', "
        "failure_threshold INTEGER NOT NULL DEFAULT 3, "
        "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
        "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
        "FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE)"
    ))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_health_checks_owner_id ON health_checks (owner_id)"))

    connection.execute(text(
        "CREATE TABLE IF NOT EXISTS resolver_endpoints ("
        "id INTEGER PRIMARY KEY, "
        "owner_id INTEGER NOT NULL, "
        "name VARCHAR(255) NOT NULL, "
        "direction VARCHAR(20) NOT NULL DEFAULT 'Inbound', "
        "status VARCHAR(30) NOT NULL DEFAULT 'Operational', "
        "ip_addresses TEXT NOT NULL DEFAULT '[]', "
        "description TEXT DEFAULT '', "
        "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
        "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
        "FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE)"
    ))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_resolver_endpoints_owner_id ON resolver_endpoints (owner_id)"))

    connection.execute(text(
        "CREATE TABLE IF NOT EXISTS profiles ("
        "id INTEGER PRIMARY KEY, "
        "owner_id INTEGER NOT NULL, "
        "name VARCHAR(255) NOT NULL, "
        "description TEXT DEFAULT '', "
        "status VARCHAR(30) NOT NULL DEFAULT 'Active', "
        "associated_vpcs TEXT NOT NULL DEFAULT '[]', "
        "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
        "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
        "FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE)"
    ))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_profiles_owner_id ON profiles (owner_id)"))
