"""REST API for simulated Route 53 features: Traffic Policies, Health Checks, Resolver, Profiles.

All four features follow identical CRUD patterns. Each endpoint is user-scoped
via the authenticated session, ensuring ownership isolation.
"""

import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from ..core.config import API_PREFIX
from ..core.dependencies import get_current_user
from ..core.responses import data_response, list_response
from ..database import get_db
from ..models import HealthCheck, Profile, ResolverEndpoint, TrafficPolicy, User
from ..repositories.simulated_crud_repository import SimulatedCrudRepository
from ..schemas_simulated import (
    HealthCheckCreate,
    HealthCheckOut,
    HealthCheckUpdate,
    ProfileCreate,
    ProfileOut,
    ProfileUpdate,
    ResolverEndpointCreate,
    ResolverEndpointOut,
    ResolverEndpointUpdate,
    TrafficPolicyCreate,
    TrafficPolicyOut,
    TrafficPolicyUpdate,
)

router = APIRouter(prefix=API_PREFIX, tags=["Simulated Features"])

# Repositories
_traffic_repo = SimulatedCrudRepository(TrafficPolicy)
_health_repo = SimulatedCrudRepository(HealthCheck)
_resolver_repo = SimulatedCrudRepository(ResolverEndpoint)
_profile_repo = SimulatedCrudRepository(Profile)

# Allowed enum values
ROUTING_STRATEGIES = {"Simple", "Weighted", "Latency", "Geolocation", "Failover", "Multi-value"}
HEALTH_STATUSES = {"Healthy", "Unhealthy", "Unknown"}
HEALTH_PROTOCOLS = {"HTTP", "HTTPS", "TCP"}
RESOLVER_DIRECTIONS = {"Inbound", "Outbound"}
RESOLVER_STATUSES = {"Operational", "Creating", "Updating", "AutoResolving", "ActionNeeded"}
PROFILE_STATUSES = {"Active", "Inactive", "Pending"}


# ===========================================================================
# Traffic Policies
# ===========================================================================

@router.get("/traffic-policies")
def list_traffic_policies(
    search: str = Query("", max_length=255),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = _traffic_repo.list_page(db, current_user.id, search.strip().lower(), page, page_size)
    serialized = [TrafficPolicyOut.model_validate(i).model_dump(mode="json") for i in items]
    return list_response(serialized, page=page, page_size=page_size, total=total)


@router.post("/traffic-policies", status_code=201)
def create_traffic_policy(
    payload: TrafficPolicyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.routing_strategy not in ROUTING_STRATEGIES:
        raise HTTPException(status_code=422, detail={"code": "INVALID_ROUTING_STRATEGY", "message": f"Routing strategy must be one of: {', '.join(sorted(ROUTING_STRATEGIES))}"})
    item = _traffic_repo.create(db, TrafficPolicy(
        owner_id=current_user.id,
        name=payload.name.strip(),
        description=payload.description,
        routing_strategy=payload.routing_strategy,
        status=payload.status if payload.status in ("Active", "Inactive") else "Active",
    ))
    return data_response(TrafficPolicyOut.model_validate(item).model_dump(mode="json"))


@router.get("/traffic-policies/{item_id}")
def get_traffic_policy(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _traffic_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Traffic policy not found."})
    return data_response(TrafficPolicyOut.model_validate(item).model_dump(mode="json"))


@router.put("/traffic-policies/{item_id}")
def update_traffic_policy(
    item_id: int,
    payload: TrafficPolicyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _traffic_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Traffic policy not found."})
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.description is not None:
        item.description = payload.description
    if payload.routing_strategy is not None:
        if payload.routing_strategy not in ROUTING_STRATEGIES:
            raise HTTPException(status_code=422, detail={"code": "INVALID_ROUTING_STRATEGY", "message": f"Routing strategy must be one of: {', '.join(sorted(ROUTING_STRATEGIES))}"})
        item.routing_strategy = payload.routing_strategy
    if payload.status is not None:
        item.status = payload.status if payload.status in ("Active", "Inactive") else item.status
    item.updated_at = datetime.utcnow()
    return data_response(TrafficPolicyOut.model_validate(_traffic_repo.update(db, item)).model_dump(mode="json"))


@router.delete("/traffic-policies/{item_id}", status_code=204)
def delete_traffic_policy(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    item = _traffic_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Traffic policy not found."})
    _traffic_repo.delete(db, item)
    return Response(status_code=204)


# ===========================================================================
# Health Checks
# ===========================================================================

@router.get("/health-checks")
def list_health_checks(
    search: str = Query("", max_length=255),
    status: str = Query("", max_length=30),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = {}
    if status and status in HEALTH_STATUSES:
        filters["status"] = status
    items, total = _health_repo.list_page(db, current_user.id, search.strip().lower(), page, page_size, filters=filters)
    serialized = [HealthCheckOut.model_validate(i).model_dump(mode="json") for i in items]
    return list_response(serialized, page=page, page_size=page_size, total=total)


@router.post("/health-checks", status_code=201)
def create_health_check(
    payload: HealthCheckCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.protocol not in HEALTH_PROTOCOLS:
        raise HTTPException(status_code=422, detail={"code": "INVALID_PROTOCOL", "message": f"Protocol must be one of: {', '.join(sorted(HEALTH_PROTOCOLS))}"})
    item = _health_repo.create(db, HealthCheck(
        owner_id=current_user.id,
        name=payload.name.strip(),
        endpoint=payload.endpoint.strip(),
        protocol=payload.protocol,
        port=payload.port,
        path=payload.path,
        status=payload.status if payload.status in HEALTH_STATUSES else "Unknown",
        failure_threshold=payload.failure_threshold,
    ))
    return data_response(HealthCheckOut.model_validate(item).model_dump(mode="json"))


@router.get("/health-checks/{item_id}")
def get_health_check(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _health_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Health check not found."})
    return data_response(HealthCheckOut.model_validate(item).model_dump(mode="json"))


@router.put("/health-checks/{item_id}")
def update_health_check(
    item_id: int,
    payload: HealthCheckUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _health_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Health check not found."})
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.endpoint is not None:
        item.endpoint = payload.endpoint.strip()
    if payload.protocol is not None:
        if payload.protocol not in HEALTH_PROTOCOLS:
            raise HTTPException(status_code=422, detail={"code": "INVALID_PROTOCOL", "message": f"Protocol must be one of: {', '.join(sorted(HEALTH_PROTOCOLS))}"})
        item.protocol = payload.protocol
    if payload.port is not None:
        item.port = payload.port
    if payload.path is not None:
        item.path = payload.path
    if payload.status is not None:
        item.status = payload.status if payload.status in HEALTH_STATUSES else item.status
    if payload.failure_threshold is not None:
        item.failure_threshold = payload.failure_threshold
    item.updated_at = datetime.utcnow()
    return data_response(HealthCheckOut.model_validate(_health_repo.update(db, item)).model_dump(mode="json"))


@router.delete("/health-checks/{item_id}", status_code=204)
def delete_health_check(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    item = _health_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Health check not found."})
    _health_repo.delete(db, item)
    return Response(status_code=204)


# ===========================================================================
# Resolver Endpoints
# ===========================================================================

@router.get("/resolver-endpoints")
def list_resolver_endpoints(
    search: str = Query("", max_length=255),
    direction: str = Query("", max_length=20),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = {}
    if direction and direction in RESOLVER_DIRECTIONS:
        filters["direction"] = direction
    items, total = _resolver_repo.list_page(db, current_user.id, search.strip().lower(), page, page_size, filters=filters)
    serialized = []
    for i in items:
        out = ResolverEndpointOut.model_validate(i)
        try:
            out.ip_addresses = json.loads(i.ip_addresses) if isinstance(i.ip_addresses, str) else i.ip_addresses
        except (json.JSONDecodeError, TypeError):
            out.ip_addresses = []
        serialized.append(out.model_dump(mode="json"))
    return list_response(serialized, page=page, page_size=page_size, total=total)


@router.post("/resolver-endpoints", status_code=201)
def create_resolver_endpoint(
    payload: ResolverEndpointCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.direction not in RESOLVER_DIRECTIONS:
        raise HTTPException(status_code=422, detail={"code": "INVALID_DIRECTION", "message": "Direction must be 'Inbound' or 'Outbound'."})
    item = _resolver_repo.create(db, ResolverEndpoint(
        owner_id=current_user.id,
        name=payload.name.strip(),
        direction=payload.direction,
        status=payload.status if payload.status in RESOLVER_STATUSES else "Operational",
        ip_addresses=json.dumps(payload.ip_addresses),
        description=payload.description,
    ))
    out = ResolverEndpointOut.model_validate(item)
    out.ip_addresses = payload.ip_addresses
    return data_response(out.model_dump(mode="json"))


@router.get("/resolver-endpoints/{item_id}")
def get_resolver_endpoint(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _resolver_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Resolver endpoint not found."})
    out = ResolverEndpointOut.model_validate(item)
    try:
        out.ip_addresses = json.loads(item.ip_addresses) if isinstance(item.ip_addresses, str) else item.ip_addresses
    except (json.JSONDecodeError, TypeError):
        out.ip_addresses = []
    return data_response(out.model_dump(mode="json"))


@router.put("/resolver-endpoints/{item_id}")
def update_resolver_endpoint(
    item_id: int,
    payload: ResolverEndpointUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _resolver_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Resolver endpoint not found."})
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.direction is not None:
        if payload.direction not in RESOLVER_DIRECTIONS:
            raise HTTPException(status_code=422, detail={"code": "INVALID_DIRECTION", "message": "Direction must be 'Inbound' or 'Outbound'."})
        item.direction = payload.direction
    if payload.status is not None:
        item.status = payload.status if payload.status in RESOLVER_STATUSES else item.status
    if payload.ip_addresses is not None:
        item.ip_addresses = json.dumps(payload.ip_addresses)
    if payload.description is not None:
        item.description = payload.description
    item.updated_at = datetime.utcnow()
    out = ResolverEndpointOut.model_validate(_resolver_repo.update(db, item))
    if payload.ip_addresses is not None:
        out.ip_addresses = payload.ip_addresses
    return data_response(out.model_dump(mode="json"))


@router.delete("/resolver-endpoints/{item_id}", status_code=204)
def delete_resolver_endpoint(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    item = _resolver_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Resolver endpoint not found."})
    _resolver_repo.delete(db, item)
    return Response(status_code=204)


# ===========================================================================
# Profiles
# ===========================================================================

@router.get("/profiles")
def list_profiles(
    search: str = Query("", max_length=255),
    status: str = Query("", max_length=30),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = {}
    if status and status in PROFILE_STATUSES:
        filters["status"] = status
    items, total = _profile_repo.list_page(db, current_user.id, search.strip().lower(), page, page_size, filters=filters)
    serialized = []
    for i in items:
        out = ProfileOut.model_validate(i)
        try:
            out.associated_vpcs = json.loads(i.associated_vpcs) if isinstance(i.associated_vpcs, str) else i.associated_vpcs
        except (json.JSONDecodeError, TypeError):
            out.associated_vpcs = []
        serialized.append(out.model_dump(mode="json"))
    return list_response(serialized, page=page, page_size=page_size, total=total)


@router.post("/profiles", status_code=201)
def create_profile(
    payload: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _profile_repo.create(db, Profile(
        owner_id=current_user.id,
        name=payload.name.strip(),
        description=payload.description,
        status=payload.status if payload.status in PROFILE_STATUSES else "Active",
        associated_vpcs=json.dumps(payload.associated_vpcs),
    ))
    out = ProfileOut.model_validate(item)
    out.associated_vpcs = payload.associated_vpcs
    return data_response(out.model_dump(mode="json"))


@router.get("/profiles/{item_id}")
def get_profile(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _profile_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Profile not found."})
    out = ProfileOut.model_validate(item)
    try:
        out.associated_vpcs = json.loads(item.associated_vpcs) if isinstance(item.associated_vpcs, str) else item.associated_vpcs
    except (json.JSONDecodeError, TypeError):
        out.associated_vpcs = []
    return data_response(out.model_dump(mode="json"))


@router.put("/profiles/{item_id}")
def update_profile(
    item_id: int,
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _profile_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Profile not found."})
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.description is not None:
        item.description = payload.description
    if payload.status is not None:
        item.status = payload.status if payload.status in PROFILE_STATUSES else item.status
    if payload.associated_vpcs is not None:
        item.associated_vpcs = json.dumps(payload.associated_vpcs)
    item.updated_at = datetime.utcnow()
    out = ProfileOut.model_validate(_profile_repo.update(db, item))
    if payload.associated_vpcs is not None:
        out.associated_vpcs = payload.associated_vpcs
    return data_response(out.model_dump(mode="json"))


@router.delete("/profiles/{item_id}", status_code=204)
def delete_profile(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    item = _profile_repo.get(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Profile not found."})
    _profile_repo.delete(db, item)
    return Response(status_code=204)
