import json

from sqlalchemy.orm import Session
from .core.security import hash_password
from .models import User, HostedZone, DNSRecord

def seed(db: Session):
    demo_user = db.query(User).filter(User.email == 'demo@aws.local').first()
    if not demo_user:
        demo_user = User(name='Demo User', email='demo@aws.local', legacy_password='MIGRATED', password_hash=hash_password('demo123'))
        db.add(demo_user)
        db.flush()
    if not db.query(HostedZone).first():
        z = HostedZone(name='example.com', zone_id='ZDEMO000000001', type='Public', description='Demo public hosted zone', owner_id=demo_user.id)
        db.add(z); db.flush()
        db.add_all([
            DNSRecord(hosted_zone_id=z.id, name='example.com', type='A', value=json.dumps({'addresses': ['192.0.2.10']}), ttl=300),
            DNSRecord(hosted_zone_id=z.id, name='www.example.com', type='CNAME', value=json.dumps({'target': 'example.com'}), ttl=300),
            DNSRecord(hosted_zone_id=z.id, name='example.com', type='MX', value=json.dumps({'priority': 10, 'exchange': 'mail.example.com'}), ttl=3600, priority=10),
        ])
    db.commit()
