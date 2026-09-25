"""Small helpers that keep API response envelopes consistent."""

from typing import Any


def data_response(data: Any) -> dict[str, Any]:
    return {"data": data}


def list_response(data: Any, *, page: int, page_size: int, total: int) -> dict[str, Any]:
    total_pages = max(1, (total + page_size - 1) // page_size) if total else 0
    return {
        "data": data,
        "meta": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }
