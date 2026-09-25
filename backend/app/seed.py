import json

from sqlalchemy.orm import Session
from .core.security import hash_password, verify_password
from .models import User, HostedZone, DNSRecord

def seed(db: Session):
    demo_user = db.query(User).filter(User.email == 'demo@aws.local').first()
    if not demo_user:
        demo_user = User(
            name='Demo User',
            email='demo@aws.local',
            legacy_password='MIGRATED',
            password_hash=hash_password('demo123')
        )
        db.add(demo_user)
        db.flush()
    elif not verify_password('demo123', demo_user.password_hash):
        demo_user.password_hash = hash_password('demo123')
        db.flush()

    zone = db.query(HostedZone).filter(
        (HostedZone.zone_id == 'ZDEMO000000001') |
        ((HostedZone.name == 'example.com') & (HostedZone.owner_id == demo_user.id))
    ).first()

    if not zone:
        zone = HostedZone(
            name='example.com',
            zone_id='ZDEMO000000001',
            type='Public',
            description='Demo public hosted zone',
            owner_id=demo_user.id
        )
        db.add(zone)
        db.flush()
    else:
        if zone.owner_id != demo_user.id:
            zone.owner_id = demo_user.id
        if zone.zone_id != 'ZDEMO000000001':
            zone.zone_id = 'ZDEMO000000001'
        db.flush()

    existing_records = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).all()
    existing_keys = {(r.name.lower().rstrip('.'), r.type) for r in existing_records}

    if ('example.com', 'A') not in existing_keys:
        db.add(DNSRecord(
            hosted_zone_id=zone.id,
            name='example.com',
            type='A',
            value=json.dumps({'addresses': ['192.0.2.10']}, separators=(',', ':'), sort_keys=True),
            ttl=300,
            priority=None
        ))

    if ('www.example.com', 'CNAME') not in existing_keys:
        db.add(DNSRecord(
            hosted_zone_id=zone.id,
            name='www.example.com',
            type='CNAME',
            value=json.dumps({'target': 'example.com'}, separators=(',', ':'), sort_keys=True),
            ttl=300,
            priority=None
        ))

    if ('example.com', 'MX') not in existing_keys:
        db.add(DNSRecord(
            hosted_zone_id=zone.id,
            name='example.com',
            type='MX',
            value=json.dumps({'priority': 10, 'exchange': 'mail.example.com'}, separators=(',', ':'), sort_keys=True),
            ttl=3600,
            priority=10
        ))

    db.commit()

