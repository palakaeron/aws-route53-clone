"""FastAPI application entry point for the Route 53 clone."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from .core.config import API_PREFIX, FRONTEND_ORIGINS
from .database import get_db, engine
from .database_migrations import apply_migrations
from .routers import auth, records, zones
from .seed import seed

# Apply explicit, non-destructive schema setup before seed data is checked.
apply_migrations(engine)
with next(get_db()) as db:
    seed(db)

app = FastAPI(title="Route 53 Clone API", version="1.1.0")

# The frontend is a separate Next.js application during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(zones.router)
app.include_router(records.router)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "REQUEST_FAILED", "message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"error": detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": "Request validation failed.", "details": exc.errors()}},
    )


@app.get(f"{API_PREFIX}/health", tags=["System"])
def health():
    """Simple health check used by local/deployed environments."""
    return {"data": {"status": "ok"}}
