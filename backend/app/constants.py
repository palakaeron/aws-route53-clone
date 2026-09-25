"""Application-wide constants used by the Route 53 clone."""

ALLOWED_RECORD_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}
ALLOWED_ZONE_TYPES = {"Public", "Private"}
