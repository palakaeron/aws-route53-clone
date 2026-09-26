"""Tests for simulated Route 53 features: Traffic Policies, Health Checks, Resolver Endpoints, and Profiles."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

def login(client: TestClient, email: str = "demo@aws.local", password: str = "demo123") -> None:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200


def test_traffic_policies_crud() -> None:
    with TestClient(app) as client:
        login(client)

        # List initial
        res = client.get("/api/v1/traffic-policies")
        assert res.status_code == 200
        items = res.json()["data"]
        assert isinstance(items, list)

        # Create
        res = client.post("/api/v1/traffic-policies", json={
            "name": "Test Policy",
            "description": "Test policy description",
            "routing_strategy": "Latency",
            "status": "Active"
        })
        assert res.status_code == 201
        created = res.json()["data"]
        policy_id = created["id"]
        assert created["name"] == "Test Policy"

        # Read
        res = client.get(f"/api/v1/traffic-policies/{policy_id}")
        assert res.status_code == 200
        assert res.json()["data"]["routing_strategy"] == "Latency"

        # Update
        res = client.put(f"/api/v1/traffic-policies/{policy_id}", json={
            "description": "Updated description",
            "status": "Inactive"
        })
        assert res.status_code == 200
        assert res.json()["data"]["description"] == "Updated description"
        assert res.json()["data"]["status"] == "Inactive"

        # Delete
        res = client.delete(f"/api/v1/traffic-policies/{policy_id}")
        assert res.status_code == 204

        # Read deleted -> 404
        res = client.get(f"/api/v1/traffic-policies/{policy_id}")
        assert res.status_code == 404


def test_health_checks_crud() -> None:
    with TestClient(app) as client:
        login(client)

        res = client.post("/api/v1/health-checks", json={
            "name": "App Health Check",
            "endpoint": "status.example.com",
            "protocol": "HTTPS",
            "port": 443,
            "path": "/health",
            "status": "Healthy",
            "failure_threshold": 3
        })
        assert res.status_code == 201
        hc_id = res.json()["data"]["id"]

        res = client.get(f"/api/v1/health-checks/{hc_id}")
        assert res.status_code == 200
        assert res.json()["data"]["name"] == "App Health Check"

        res = client.delete(f"/api/v1/health-checks/{hc_id}")
        assert res.status_code == 204


def test_resolver_endpoints_crud() -> None:
    with TestClient(app) as client:
        login(client)

        res = client.post("/api/v1/resolver-endpoints", json={
            "name": "Corporate Inbound",
            "direction": "Inbound",
            "status": "Operational",
            "ip_addresses": ["10.0.10.5", "10.0.10.6"],
            "description": "Corporate DNS Inbound"
        })
        assert res.status_code == 201
        ep_id = res.json()["data"]["id"]
        assert len(res.json()["data"]["ip_addresses"]) == 2

        res = client.get(f"/api/v1/resolver-endpoints/{ep_id}")
        assert res.status_code == 200
        assert res.json()["data"]["direction"] == "Inbound"

        res = client.delete(f"/api/v1/resolver-endpoints/{ep_id}")
        assert res.status_code == 204


def test_profiles_crud() -> None:
    with TestClient(app) as client:
        login(client)

        res = client.post("/api/v1/profiles", json={
            "name": "Staging Profile",
            "description": "Staging environment profile",
            "status": "Active",
            "associated_vpcs": ["vpc-11223344"]
        })
        assert res.status_code == 201
        prof_id = res.json()["data"]["id"]

        res = client.get(f"/api/v1/profiles/{prof_id}")
        assert res.status_code == 200
        assert res.json()["data"]["associated_vpcs"] == ["vpc-11223344"]

        res = client.delete(f"/api/v1/profiles/{prof_id}")
        assert res.status_code == 204
