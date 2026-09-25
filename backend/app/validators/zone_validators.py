"""Hosted-zone name normalization and validation."""

import re

from fastapi import HTTPException


_LABEL = re.compile(r"^(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


def normalize_zone_name(value: str) -> str:
    normalized = value.strip().lower().rstrip(".")
    if not normalized or len(normalized) > 253 or any(not _LABEL.fullmatch(label) for label in normalized.split(".")):
        raise HTTPException(status_code=422, detail={"code": "INVALID_HOSTED_ZONE_NAME", "message": "Enter a valid hosted zone domain name."})
    return normalized
