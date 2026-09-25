"""Traffic Policies, Health Checks, Resolver, Profiles — mock CRUD routers."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from ..core.config import API_PREFIX
from ..core.dependencies import get_current_user
from ..core.responses import data_response, list_response
from ..database import get_db
from ..mock_schemas import (
    HealthCheckCreate, HealthCheckDataResponse, HealthCheckListResponse,
    HealthCheckOut, HealthCheckPatch,
    ProfileCreate, ProfileDataResponse, ProfileListResponse, ProfileOut, ProfilePatch,
    ResolverEndpointCreate, ResolverEndpointDataResponse, ResolverEndpointListResponse,
    ResolverEndpointOut, ResolverEndpointPatch,
    TrafficPolicyCreate, TrafficPolicyDataResponse, TrafficPolicyListResponse,
    TrafficPolicyOut, TrafficPolicyPatch,
)
from ..models import HealthCheck, Profile, ResolverEndpoint, TrafficPolicy, User
from ..repositories.mock_repository import MockRepository

# Shared repo instances
_tp_repo = MockRepository(TrafficPolicy)
_hc_repo = MockRepository(HealthCheck)
_re_repo = MockRepository(ResolverEndpoint)
_pr_repo = MockRepository(Profile)

router = APIRouter(tags=["Mock Features"])


def _not_found(label: str):
    raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": f"{label} not found."})


# ===========================================================================
# Traffic Policies
# ===========================================================================

tp_router = APIRouter(prefix=f"{API_PREFIX}/traffic-policies")


@tp_router.get("", response_model=TrafficPolicyListResponse)
def list_traffic_policies(
    search: str = Query("", max_length=255),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = _tp_repo.list_page(db, current_user.id, search.strip(), page, page_size)
    return list_response([TrafficPolicyOut.model_validate(i).model_dump(mode="json") for i in items], page=page, page_size=page_size, total=total)


@tp_router.post("", status_code=201, response_model=TrafficPolicyDataResponse)
def create_traffic_policy(
    payload: TrafficPolicyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _tp_repo.create(db, TrafficPolicy(owner_id=current_user.id, **payload.model_dump()))
    return data_response(TrafficPolicyOut.model_validate(item).model_dump(mode="json"))


@tp_router.get("/{item_id}", response_model=TrafficPolicyDataResponse)
def get_traffic_policy(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = _tp_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Traffic policy")
    return data_response(TrafficPolicyOut.model_validate(item).model_dump(mode="json"))


@tp_router.patch("/{item_id}", response_model=TrafficPolicyDataResponse)
def patch_traffic_policy(
    item_id: int, payload: TrafficPolicyPatch,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    item = _tp_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Traffic policy")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    _tp_repo.update(db, item)
    return data_response(TrafficPolicyOut.model_validate(item).model_dump(mode="json"))


@tp_router.delete("/{item_id}", status_code=204)
def delete_traffic_policy(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    item = _tp_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Traffic policy")
    _tp_repo.delete(db, item)
    return Response(status_code=204)


# ===========================================================================
# Health Checks
# ===========================================================================

hc_router = APIRouter(prefix=f"{API_PREFIX}/health-checks")


@hc_router.get("", response_model=HealthCheckListResponse)
def list_health_checks(
    search: str = Query("", max_length=255),
    status: str = Query("", max_length=50),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = _hc_repo.list_page(db, current_user.id, search.strip(), page, page_size)
    if status:
        items = [i for i in items if i.status.lower() == status.lower()]
        total = len(items)
    return list_response([HealthCheckOut.model_validate(i).model_dump(mode="json") for i in items], page=page, page_size=page_size, total=total)


@hc_router.post("", status_code=201, response_model=HealthCheckDataResponse)
def create_health_check(
    payload: HealthCheckCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _hc_repo.create(db, HealthCheck(owner_id=current_user.id, **payload.model_dump()))
    return data_response(HealthCheckOut.model_validate(item).model_dump(mode="json"))


@hc_router.get("/{item_id}", response_model=HealthCheckDataResponse)
def get_health_check(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = _hc_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Health check")
    return data_response(HealthCheckOut.model_validate(item).model_dump(mode="json"))


@hc_router.patch("/{item_id}", response_model=HealthCheckDataResponse)
def patch_health_check(
    item_id: int, payload: HealthCheckPatch,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    item = _hc_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Health check")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    _hc_repo.update(db, item)
    return data_response(HealthCheckOut.model_validate(item).model_dump(mode="json"))


@hc_router.delete("/{item_id}", status_code=204)
def delete_health_check(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    item = _hc_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Health check")
    _hc_repo.delete(db, item)
    return Response(status_code=204)


# ===========================================================================
# Resolver Endpoints
# ===========================================================================

re_router = APIRouter(prefix=f"{API_PREFIX}/resolver")


@re_router.get("", response_model=ResolverEndpointListResponse)
def list_resolver_endpoints(
    search: str = Query("", max_length=255),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = _re_repo.list_page(db, current_user.id, search.strip(), page, page_size)
    return list_response([ResolverEndpointOut.model_validate(i).model_dump(mode="json") for i in items], page=page, page_size=page_size, total=total)


@re_router.post("", status_code=201, response_model=ResolverEndpointDataResponse)
def create_resolver_endpoint(
    payload: ResolverEndpointCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _re_repo.create(db, ResolverEndpoint(owner_id=current_user.id, **payload.model_dump()))
    return data_response(ResolverEndpointOut.model_validate(item).model_dump(mode="json"))


@re_router.get("/{item_id}", response_model=ResolverEndpointDataResponse)
def get_resolver_endpoint(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = _re_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Resolver endpoint")
    return data_response(ResolverEndpointOut.model_validate(item).model_dump(mode="json"))


@re_router.patch("/{item_id}", response_model=ResolverEndpointDataResponse)
def patch_resolver_endpoint(
    item_id: int, payload: ResolverEndpointPatch,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    item = _re_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Resolver endpoint")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    _re_repo.update(db, item)
    return data_response(ResolverEndpointOut.model_validate(item).model_dump(mode="json"))


@re_router.delete("/{item_id}", status_code=204)
def delete_resolver_endpoint(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    item = _re_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Resolver endpoint")
    _re_repo.delete(db, item)
    return Response(status_code=204)


# ===========================================================================
# Profiles
# ===========================================================================

pr_router = APIRouter(prefix=f"{API_PREFIX}/profiles")


@pr_router.get("", response_model=ProfileListResponse)
def list_profiles(
    search: str = Query("", max_length=255),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = _pr_repo.list_page(db, current_user.id, search.strip(), page, page_size)
    return list_response([ProfileOut.model_validate(i).model_dump(mode="json") for i in items], page=page, page_size=page_size, total=total)


@pr_router.post("", status_code=201, response_model=ProfileDataResponse)
def create_profile(
    payload: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = _pr_repo.create(db, Profile(owner_id=current_user.id, **payload.model_dump()))
    return data_response(ProfileOut.model_validate(item).model_dump(mode="json"))


@pr_router.get("/{item_id}", response_model=ProfileDataResponse)
def get_profile(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = _pr_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Profile")
    return data_response(ProfileOut.model_validate(item).model_dump(mode="json"))


@pr_router.patch("/{item_id}", response_model=ProfileDataResponse)
def patch_profile(
    item_id: int, payload: ProfilePatch,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    item = _pr_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Profile")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    _pr_repo.update(db, item)
    return data_response(ProfileOut.model_validate(item).model_dump(mode="json"))


@pr_router.delete("/{item_id}", status_code=204)
def delete_profile(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    item = _pr_repo.get(db, item_id, current_user.id)
    if not item:
        _not_found("Profile")
    _pr_repo.delete(db, item)
    return Response(status_code=204)
