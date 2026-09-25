"""DNS record parsing, validation, and JSON normalization."""

from __future__ import annotations

import ipaddress
import json
import re
from typing import Any

from fastapi import HTTPException


_DNS_LABEL = re.compile(r"^(?!-)[A-Za-z0-9_](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?$")
_CAA_TAG = re.compile(r"^[a-z0-9]+$")


def record_validation_error(message: str) -> HTTPException:
    return HTTPException(status_code=422, detail={"code": "INVALID_RECORD_DATA", "message": message})


def validate_dns_name(value: Any, *, allow_root: bool = False) -> str:
    if not isinstance(value, str):
        raise record_validation_error("DNS name must be a string.")
    name = value.strip().rstrip(".")
    if allow_root and value.strip() == ".":
        return "."
    if not name or len(name) > 253 or any(not _DNS_LABEL.fullmatch(label) for label in name.split(".")):
        raise record_validation_error("Enter a valid DNS name.")
    return name


def validate_record_name(value: str, zone_name: str | None = None) -> str:
    if not isinstance(value, str):
        raise record_validation_error("DNS name must be a string.")
    raw = value.strip()
    if not raw:
        raise record_validation_error("Enter a valid DNS name.")

    if zone_name:
        zone_clean = zone_name.strip().lower().rstrip(".")
        val_clean = raw.lower().rstrip(".")
        if raw == "@" or val_clean == "@" or val_clean == f"@.{zone_clean}" or val_clean == zone_clean:
            return zone_clean
        if val_clean.endswith("." + zone_clean):
            validate_dns_name(val_clean)
            return val_clean
        full = f"{val_clean}.{zone_clean}"
        validate_dns_name(full)
        return full

    if raw == "@":
        raise record_validation_error("Enter a valid DNS name.")
    return validate_dns_name(raw)


def normalize_record_data(record_type: str, value: str | dict[str, Any]) -> dict[str, Any]:
    raw = _coerce_data(record_type, value)
    if record_type == "A":
        addresses = _string_list(raw, "addresses", fallback="address")
        if not addresses:
            raise record_validation_error("An A record requires at least one IPv4 address.")
        for address in addresses:
            try:
                if ipaddress.ip_address(address).version != 4:
                    raise ValueError
            except ValueError:
                raise record_validation_error("A records require valid IPv4 addresses.")
        return {"addresses": addresses}
    if record_type == "AAAA":
        addresses = _string_list(raw, "addresses", fallback="address")
        if not addresses:
            raise record_validation_error("An AAAA record requires at least one IPv6 address.")
        for address in addresses:
            try:
                if ipaddress.ip_address(address).version != 6:
                    raise ValueError
            except ValueError:
                raise record_validation_error("AAAA records require valid IPv6 addresses.")
        return {"addresses": addresses}
    if record_type in {"CNAME", "PTR"}:
        return {"target": validate_dns_name(raw.get("target", raw.get("value")))}
    if record_type == "NS":
        nameservers = _string_list(raw, "nameservers", fallback="nameserver")
        if not nameservers:
            raise record_validation_error("An NS record requires at least one nameserver.")
        return {"nameservers": [validate_dns_name(item) for item in nameservers]}
    if record_type == "TXT":
        texts = _string_list(raw, "texts", fallback="text")
        if not texts or any(not item or len(item) > 255 for item in texts):
            raise record_validation_error("TXT records require non-empty values of 255 characters or fewer.")
        return {"texts": texts}
    if record_type == "MX":
        return {"priority": _uint(raw.get("priority"), "MX priority"), "exchange": validate_dns_name(raw.get("exchange"))}
    if record_type == "SRV":
        return {"priority": _uint(raw.get("priority"), "SRV priority"), "weight": _uint(raw.get("weight"), "SRV weight"), "port": _uint(raw.get("port"), "SRV port"), "target": validate_dns_name(raw.get("target"), allow_root=True)}
    if record_type == "CAA":
        flags = _uint(raw.get("flags"), "CAA flags", maximum=255)
        tag = raw.get("tag")
        value_text = raw.get("value")
        if not isinstance(tag, str) or not _CAA_TAG.fullmatch(tag):
            raise record_validation_error("CAA tag must contain lowercase letters and numbers only.")
        if not isinstance(value_text, str) or not value_text.strip() or len(value_text) > 255:
            raise record_validation_error("CAA value must be a non-empty value of 255 characters or fewer.")
        return {"flags": flags, "tag": tag, "value": value_text.strip()}
    raise record_validation_error("Unsupported record type.")


def format_record_value(record_type: str, data: dict[str, Any]) -> str:
    if record_type in {"A", "AAAA"}:
        return ", ".join(data.get("addresses", []))
    if record_type == "TXT":
        return " ".join(data.get("texts", []))
    if record_type == "NS":
        return ", ".join(data.get("nameservers", []))
    if record_type == "MX":
        return f"{data.get('priority')} {data.get('exchange')}"
    if record_type == "SRV":
        return "{priority} {weight} {port} {target}".format(**data)
    if record_type == "CAA":
        return "{flags} {tag} {value}".format(**data)
    return str(data.get("target", data.get("value", "")))


def decode_record_data(record_type: str, stored_value: str) -> dict[str, Any]:
    try:
        parsed = json.loads(stored_value)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    # Existing malformed legacy rows stay readable until explicitly corrected.
    return {"legacy_value": stored_value, "type": record_type}


def _coerce_data(record_type: str, value: str | dict[str, Any]) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if not isinstance(value, str):
        raise record_validation_error("Record data must be an object or a text value.")
    text = value.strip()
    if record_type in {"A", "AAAA"}:
        return {"addresses": [item.strip() for item in text.split(",") if item.strip()]}
    if record_type == "TXT":
        return {"texts": [text]}
    if record_type == "NS":
        return {"nameservers": [item.strip() for item in text.split(",") if item.strip()]}
    if record_type in {"CNAME", "PTR"}:
        return {"target": text}
    if record_type == "MX":
        parts = text.split(maxsplit=1)
        return {"priority": parts[0] if parts else None, "exchange": parts[1] if len(parts) > 1 else None}
    if record_type == "SRV":
        parts = text.split(maxsplit=3)
        return {"priority": parts[0] if len(parts) > 0 else None, "weight": parts[1] if len(parts) > 1 else None, "port": parts[2] if len(parts) > 2 else None, "target": parts[3] if len(parts) > 3 else None}
    if record_type == "CAA":
        parts = text.split(maxsplit=2)
        return {"flags": parts[0] if len(parts) > 0 else None, "tag": parts[1] if len(parts) > 1 else None, "value": parts[2] if len(parts) > 2 else None}
    return {"value": text}


def _string_list(data: dict[str, Any], field: str, *, fallback: str) -> list[str]:
    value = data.get(field, data.get(fallback))
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise record_validation_error(f"{field} must be a list of strings.")
    return [item.strip() for item in value if item.strip()]


def _uint(value: Any, label: str, *, maximum: int = 65535) -> int:
    if isinstance(value, bool):
        raise record_validation_error(f"{label} must be a whole number.")
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise record_validation_error(f"{label} must be a whole number.")
    if str(number) != str(value).strip() or number < 0 or number > maximum:
        raise record_validation_error(f"{label} must be between 0 and {maximum}.")
    return number
