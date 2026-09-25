"""DNS record model, JSON normalization, validation, and full REST API behavior tests."""

from uuid import uuid4
from fastapi.testclient import TestClient
import pytest

from app.main import app


def authenticated_client() -> TestClient:
    client = TestClient(app)
    response = client.post("/api/v1/auth/login", json={"email": "demo@aws.local", "password": "demo123"})
    assert response.status_code == 200
    return client


def demo_zone(client: TestClient) -> dict:
    response = client.get("/api/v1/hosted-zones")
    assert response.status_code == 200
    for z in response.json()["data"]:
        if z["name"] == "example.com":
            return z
    return response.json()["data"][0]


def test_hosted_zone_id_is_route53_shaped_and_persistent() -> None:
    with authenticated_client() as client:
        name = f"id-{uuid4().hex[:12]}.example"
        created = client.post("/api/v1/hosted-zones", json={"name": name, "type": "Public", "description": "ID test"})
        assert created.status_code == 201
        zone = created.json()["data"]
        assert zone["zone_id"].startswith("Z")
        assert len(zone["zone_id"]) == 14

        updated = client.put(f"/api/v1/hosted-zones/{zone['id']}", json={"name": name, "type": "Public", "description": "Updated"})
        assert updated.status_code == 200
        assert updated.json()["data"]["zone_id"] == zone["zone_id"]


@pytest.mark.parametrize(("record_type", "value"), [
    ("A", {"addresses": ["192.0.2.11"]}),
    ("AAAA", {"addresses": ["2001:db8::11"]}),
    ("CNAME", {"target": "target.example.com"}),
    ("TXT", {"texts": ["v=spf1 include:example.com -all"]}),
    ("MX", {"priority": 10, "exchange": "mail.example.com"}),
    ("NS", {"nameservers": ["ns1.example.com", "ns2.example.com"]}),
    ("PTR", {"target": "host.example.com"}),
    ("SRV", {"priority": 10, "weight": 5, "port": 443, "target": "service.example.com"}),
    ("CAA", {"flags": 0, "tag": "issue", "value": "letsencrypt.org"}),
])
def test_all_required_record_types_accept_valid_json(record_type: str, value: dict[str, object]) -> None:
    with authenticated_client() as client:
        zone = demo_zone(client)
        zone_id = zone["id"]
        zone_name = zone["name"]
        response = client.post(
            f"/api/v1/hosted-zones/{zone_id}/records",
            json={
                "name": f"{record_type.lower()}-valid-{uuid4().hex[:6]}.{zone_name}",
                "type": record_type,
                "value": value,
                "ttl": 300,
                "priority": None,
            },
        )

        assert response.status_code == 201
        record = response.json()["data"]
        assert record["type"] == record_type
        assert record["data"] == value


@pytest.mark.parametrize(("record_type", "value"), [
    ("A", {"addresses": ["999.1.1.1"]}),
    ("AAAA", {"addresses": ["192.0.2.1"]}),
    ("CNAME", {"target": "-bad.example.com"}),
    ("TXT", {"texts": ["x" * 256]}),
    ("MX", {"priority": 70000, "exchange": "mail.example.com"}),
    ("NS", {"nameservers": ["not a hostname"]}),
    ("PTR", {"target": "invalid host"}),
    ("SRV", {"priority": 1, "weight": 1, "port": 70000, "target": "service.example.com"}),
    ("CAA", {"flags": 256, "tag": "Issue!", "value": ""}),
])
def test_all_required_record_types_reject_invalid_json(record_type: str, value: dict[str, object]) -> None:
    with authenticated_client() as client:
        zone = demo_zone(client)
        zone_id = zone["id"]
        zone_name = zone["name"]
        response = client.post(
            f"/api/v1/hosted-zones/{zone_id}/records",
            json={
                "name": f"invalid-{record_type.lower()}.{zone_name}",
                "type": record_type,
                "value": value,
                "ttl": 300,
            },
        )

        assert response.status_code == 422
        assert response.json()["error"]["code"] == "INVALID_RECORD_DATA"


def test_ttl_must_be_positive_and_record_data_must_be_valid() -> None:
    with authenticated_client() as client:
        zone = demo_zone(client)
        zone_id = zone["id"]
        zone_name = zone["name"]
        response = client.post(
            f"/api/v1/hosted-zones/{zone_id}/records",
            json={"name": f"ttl.{zone_name}", "type": "A", "value": {"addresses": ["192.0.2.1"]}, "ttl": 0},
        )
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_get_record_by_id_and_guessed_record_id_rejection() -> None:
    with authenticated_client() as client:
        zone = demo_zone(client)
        zone_id = zone["id"]
        zone_name = zone["name"]
        pub_zone_id = zone["zone_id"]

        created = client.post(
            f"/api/v1/hosted-zones/{zone_id}/records",
            json={"name": f"get-test-{uuid4().hex[:6]}.{zone_name}", "type": "A", "value": {"addresses": ["192.0.2.50"]}, "ttl": 300},
        )
        assert created.status_code == 201
        rec_id = created.json()["data"]["id"]

        fetched = client.get(f"/api/v1/hosted-zones/{zone_id}/records/{rec_id}")
        assert fetched.status_code == 200
        assert fetched.json()["data"]["id"] == rec_id

        # Also test accessing via public Route 53 zone ID string
        pub_fetched = client.get(f"/api/v1/hosted-zones/{pub_zone_id}/records/{rec_id}")
        assert pub_fetched.status_code == 200
        assert pub_fetched.json()["data"]["id"] == rec_id

        # Non-existent record ID
        not_found = client.get(f"/api/v1/hosted-zones/{zone_id}/records/9999999")
        assert not_found.status_code == 404
        assert not_found.json()["error"]["code"] == "RECORD_NOT_FOUND"


def test_put_and_patch_record_semantics() -> None:
    with authenticated_client() as client:
        zone = demo_zone(client)
        zone_id = zone["id"]
        zone_name = zone["name"]

        created = client.post(
            f"/api/v1/hosted-zones/{zone_id}/records",
            json={"name": f"put-patch-{uuid4().hex[:6]}.{zone_name}", "type": "A", "value": {"addresses": ["192.0.2.60"]}, "ttl": 300},
        )
        assert created.status_code == 201
        rec_id = created.json()["data"]["id"]
        rec_name = created.json()["data"]["name"]

        # PUT full replacement
        put_resp = client.put(
            f"/api/v1/hosted-zones/{zone_id}/records/{rec_id}",
            json={"name": rec_name, "type": "A", "value": {"addresses": ["192.0.2.61"]}, "ttl": 600},
        )
        assert put_resp.status_code == 200
        assert put_resp.json()["data"]["ttl"] == 600
        assert put_resp.json()["data"]["data"]["addresses"] == ["192.0.2.61"]

        # PATCH partial update (only TTL)
        patch_resp = client.patch(
            f"/api/v1/hosted-zones/{zone_id}/records/{rec_id}",
            json={"ttl": 900},
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["data"]["ttl"] == 900
        assert patch_resp.json()["data"]["data"]["addresses"] == ["192.0.2.61"]


def test_delete_record_returns_204() -> None:
    with authenticated_client() as client:
        zone = demo_zone(client)
        zone_id = zone["id"]
        zone_name = zone["name"]

        created = client.post(
            f"/api/v1/hosted-zones/{zone_id}/records",
            json={"name": f"delete-me-{uuid4().hex[:6]}.{zone_name}", "type": "TXT", "value": {"texts": ["hello"]}, "ttl": 300},
        )
        assert created.status_code == 201
        rec_id = created.json()["data"]["id"]

        del_resp = client.delete(f"/api/v1/hosted-zones/{zone_id}/records/{rec_id}")
        assert del_resp.status_code == 204
        assert del_resp.content == b""

        get_resp = client.get(f"/api/v1/hosted-zones/{zone_id}/records/{rec_id}")
        assert get_resp.status_code == 404


def test_record_search_type_filtering_and_pagination() -> None:
    prefix = f"search-{uuid4().hex[:6]}"
    with authenticated_client() as client:
        zone = demo_zone(client)
        zone_id = zone["id"]
        zone_name = zone["name"]

        client.post(f"/api/v1/hosted-zones/{zone_id}/records", json={"name": f"{prefix}-1.{zone_name}", "type": "A", "value": {"addresses": ["192.0.2.71"]}, "ttl": 300})
        client.post(f"/api/v1/hosted-zones/{zone_id}/records", json={"name": f"{prefix}-2.{zone_name}", "type": "AAAA", "value": {"addresses": ["2001:db8::72"]}, "ttl": 300})
        client.post(f"/api/v1/hosted-zones/{zone_id}/records", json={"name": f"{prefix}-3.{zone_name}", "type": "A", "value": {"addresses": ["192.0.2.73"]}, "ttl": 300})

        # Search filter
        search_resp = client.get(f"/api/v1/hosted-zones/{zone_id}/records", params={"search": prefix})
        assert search_resp.status_code == 200
        assert len(search_resp.json()["data"]) == 3
        assert search_resp.json()["meta"]["total"] >= 3

        # Type filter
        type_resp = client.get(f"/api/v1/hosted-zones/{zone_id}/records", params={"search": prefix, "type": "AAAA"})
        assert type_resp.status_code == 200
        assert len(type_resp.json()["data"]) == 1
        assert type_resp.json()["data"][0]["type"] == "AAAA"

        # Pagination
        page1 = client.get(f"/api/v1/hosted-zones/{zone_id}/records", params={"search": prefix, "page": 1, "page_size": 2})
        page2 = client.get(f"/api/v1/hosted-zones/{zone_id}/records", params={"search": prefix, "page": 2, "page_size": 2})
        assert page1.status_code == 200
        assert page1.json()["meta"] == {"page": 1, "page_size": 2, "total": 3, "total_pages": 2}
        assert len(page1.json()["data"]) == 2
        assert page2.status_code == 200
        assert len(page2.json()["data"]) == 1


def test_zone_apex_and_name_normalization() -> None:
    with authenticated_client() as client:
        zone_resp = client.post("/api/v1/hosted-zones", json={"name": f"apex-{uuid4().hex[:8]}.org", "type": "Public", "description": "Apex test"})
        assert zone_resp.status_code == 201
        zone = zone_resp.json()["data"]
        zone_id = zone["id"]
        zone_name = zone["name"]

        # Zone apex via '@'
        apex_rec = client.post(f"/api/v1/hosted-zones/{zone_id}/records", json={"name": "@", "type": "A", "value": {"addresses": ["192.0.2.100"]}, "ttl": 300})
        assert apex_rec.status_code == 201
        assert apex_rec.json()["data"]["name"] == zone_name

        # Normalization of upper case, trailing dots, and relative subdomains
        sub_rec = client.post(f"/api/v1/hosted-zones/{zone_id}/records", json={"name": f"MAIL.{zone_name.upper()}.", "type": "MX", "value": {"priority": 10, "exchange": f"mail.{zone_name}"}, "ttl": 300})
        assert sub_rec.status_code == 201
        assert sub_rec.json()["data"]["name"] == f"mail.{zone_name}"


def test_duplicate_and_conflict_rejection() -> None:
    with authenticated_client() as client:
        zone = demo_zone(client)
        zone_id = zone["id"]
        zone_name = zone["name"]

        rec_name = f"conflict-{uuid4().hex[:6]}.{zone_name}"
        created = client.post(f"/api/v1/hosted-zones/{zone_id}/records", json={"name": rec_name, "type": "A", "value": {"addresses": ["192.0.2.110"]}, "ttl": 300})
        assert created.status_code == 201

        # Exact duplicate (same name & type)
        dup = client.post(f"/api/v1/hosted-zones/{zone_id}/records", json={"name": rec_name, "type": "A", "value": {"addresses": ["192.0.2.111"]}, "ttl": 300})
        assert dup.status_code == 409
        assert dup.json()["error"]["code"] == "RECORD_CONFLICT"

        # CNAME conflict (adding CNAME when A record exists)
        cname_conflict = client.post(f"/api/v1/hosted-zones/{zone_id}/records", json={"name": rec_name, "type": "CNAME", "value": {"target": f"target.{zone_name}"}, "ttl": 300})
        assert cname_conflict.status_code == 409
        assert cname_conflict.json()["error"]["code"] == "RECORD_CONFLICT"


def test_cross_user_isolation_and_guessed_ids() -> None:
    from app.core.security import hash_password
    from app.database import SessionLocal
    from app.models import HostedZone, User, DNSRecord

    db = SessionLocal()
    try:
        user_b = db.query(User).filter(User.email == "userb@aws.local").first()
        if not user_b:
            user_b = User(name="User B", email="userb@aws.local", legacy_password="MIGRATED", password_hash=hash_password("userb-pass"))
            db.add(user_b)
            db.flush()
        zone_b = db.query(HostedZone).filter(HostedZone.name == "userb-private.example").first()
        if not zone_b:
            zone_b = HostedZone(name="userb-private.example", zone_id="ZUSERB00000001", type="Public", description="Isolation", owner_id=user_b.id)
            db.add(zone_b)
            db.flush()
            rec_b = DNSRecord(hosted_zone_id=zone_b.id, name="userb-private.example", type="A", value='{"addresses": ["192.0.2.200"]}', ttl=300)
            db.add(rec_b)
            db.flush()
        db.commit()
        zone_b_id = zone_b.id
        rec_b_id = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_b_id).first().id
    finally:
        db.close()

    with authenticated_client() as client:
        # User A trying to access User B's zone records list
        assert client.get(f"/api/v1/hosted-zones/{zone_b_id}/records").status_code == 404
        # User A trying to get User B's specific record
        assert client.get(f"/api/v1/hosted-zones/{zone_b_id}/records/{rec_b_id}").status_code == 404
        # User A trying to post record into User B's zone
        assert client.post(f"/api/v1/hosted-zones/{zone_b_id}/records", json={"name": "test.userb-private.example", "type": "A", "value": {"addresses": ["192.0.2.201"]}, "ttl": 300}).status_code == 404
        # User A trying to delete User B's record
        assert client.delete(f"/api/v1/hosted-zones/{zone_b_id}/records/{rec_b_id}").status_code == 404
