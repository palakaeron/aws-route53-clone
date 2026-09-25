"""Hosted-zone API behavior and Route 53-style contract tests."""

from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def authenticated_client() -> TestClient:
    client = TestClient(app)
    assert client.post('/api/v1/auth/login', json={'email': 'demo@aws.local', 'password': 'demo123'}).status_code == 200
    return client


def create_zone(client: TestClient, name: str) -> dict:
    response = client.post('/api/v1/hosted-zones', json={'name': name, 'type': 'Public', 'description': 'Hosted-zone API test'})
    assert response.status_code == 201
    return response.json()['data']


def test_list_search_and_server_side_pagination_envelope() -> None:
    prefix = f'page{uuid4().hex[:9]}'
    with authenticated_client() as client:
        for suffix in ('one', 'two', 'three'):
            create_zone(client, f'{prefix}-{suffix}.example')

        page_one = client.get('/api/v1/hosted-zones', params={'search': prefix, 'page': 1, 'page_size': 2})
        page_two = client.get('/api/v1/hosted-zones', params={'search': prefix, 'page': 2, 'page_size': 2})

        assert page_one.status_code == 200
        assert set(page_one.json()) == {'data', 'meta'}
        assert page_one.json()['meta'] == {'page': 1, 'page_size': 2, 'total': 3, 'total_pages': 2}
        assert len(page_one.json()['data']) == 2
        assert page_two.json()['meta']['page'] == 2
        assert len(page_two.json()['data']) == 1


def test_invalid_pagination_and_hosted_zone_name_are_rejected() -> None:
    with authenticated_client() as client:
        assert client.get('/api/v1/hosted-zones', params={'page': 0}).status_code == 422
        assert client.get('/api/v1/hosted-zones', params={'page_size': 101}).status_code == 422
        invalid = client.post('/api/v1/hosted-zones', json={'name': 'bad name.example', 'type': 'Public', 'description': ''})
        assert invalid.status_code == 422
        assert invalid.json()['error']['code'] == 'INVALID_HOSTED_ZONE_NAME'


def test_create_retrieve_update_patch_and_duplicate_contract() -> None:
    name = f'zone-{uuid4().hex[:10]}.example'
    with authenticated_client() as client:
        zone = create_zone(client, name.upper() + '.')
        assert zone['name'] == name
        assert zone['zone_id'].startswith('Z')

        fetched = client.get(f"/api/v1/hosted-zones/{zone['zone_id']}")
        assert fetched.status_code == 200
        assert fetched.json()['data']['id'] == zone['id']

        updated = client.put(f"/api/v1/hosted-zones/{zone['zone_id']}", json={'name': name, 'type': 'Private', 'description': 'Updated'})
        assert updated.status_code == 200
        assert updated.json()['data']['zone_id'] == zone['zone_id']
        assert updated.json()['data']['type'] == 'Private'

        patched = client.patch(f"/api/v1/hosted-zones/{zone['zone_id']}", json={'description': 'Patched'})
        assert patched.status_code == 200
        assert patched.json()['data']['description'] == 'Patched'
        assert patched.json()['data']['zone_id'] == zone['zone_id']

        duplicate = client.post('/api/v1/hosted-zones', json={'name': name, 'type': 'Public', 'description': ''})
        assert duplicate.status_code == 409
        assert duplicate.json()['error']['code'] == 'HOSTED_ZONE_CONFLICT'


def test_delete_returns_204_and_cascades_records() -> None:
    with authenticated_client() as client:
        zone = create_zone(client, f'delete-{uuid4().hex[:10]}.example')
        record = client.post(f"/api/v1/hosted-zones/{zone['id']}/records", json={'name': 'delete.example', 'type': 'A', 'value': {'addresses': ['192.0.2.99']}, 'ttl': 300})
        assert record.status_code == 201

        deleted = client.delete(f"/api/v1/hosted-zones/{zone['zone_id']}")
        assert deleted.status_code == 204
        assert deleted.content == b''
        assert client.get(f"/api/v1/hosted-zones/{zone['zone_id']}").status_code == 404
        assert client.get(f"/api/v1/hosted-zones/{zone['id']}/records").status_code == 404
