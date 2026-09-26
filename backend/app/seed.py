import json

from sqlalchemy.orm import Session
from .core.security import hash_password
from .models import User, HostedZone, DNSRecord, TrafficPolicy, HealthCheck, ResolverEndpoint, Profile

def seed(db: Session):
    demo_user = db.query(User).filter(User.email == 'demo@aws.local').first()
    if not demo_user:
        demo_user = User(name='Demo User', email='demo@aws.local', legacy_password='MIGRATED', password_hash=hash_password('demo123'))
        db.add(demo_user)
        db.flush()
    if not db.query(HostedZone).filter(HostedZone.owner_id == demo_user.id, HostedZone.name == 'example.com').first():
        z = HostedZone(name='example.com', zone_id='ZDEMO000000001', type='Public', description='Demo public hosted zone', owner_id=demo_user.id)
        db.add(z); db.flush()
        db.add_all([
            DNSRecord(hosted_zone_id=z.id, name='example.com', type='A', value=json.dumps({'addresses': ['192.0.2.10']}), ttl=300),
            DNSRecord(hosted_zone_id=z.id, name='www.example.com', type='CNAME', value=json.dumps({'target': 'example.com'}), ttl=300),
            DNSRecord(hosted_zone_id=z.id, name='example.com', type='MX', value=json.dumps({'priority': 10, 'exchange': 'mail.example.com'}), ttl=3600, priority=10),
        ])

    if not db.query(TrafficPolicy).filter(TrafficPolicy.owner_id == demo_user.id).first():
        db.add_all([
            TrafficPolicy(owner_id=demo_user.id, name='Geoproximity Routing Policy', description='Global traffic routing based on proximity to nearest AWS edge location', routing_strategy='Geoproximity', status='Active'),
            TrafficPolicy(owner_id=demo_user.id, name='Primary Failover Policy', description='Main application failover to backup disaster recovery region', routing_strategy='Failover', status='Active'),
        ])

    if not db.query(HealthCheck).filter(HealthCheck.owner_id == demo_user.id).first():
        db.add_all([
            HealthCheck(owner_id=demo_user.id, name='Web App Primary Endpoint', endpoint='app.example.com', protocol='HTTPS', port=443, path='/healthz', status='Healthy', failure_threshold=3),
            HealthCheck(owner_id=demo_user.id, name='API Gateway Endpoint', endpoint='api.example.com', protocol='HTTPS', port=443, path='/v1/status', status='Healthy', failure_threshold=3),
        ])

    if not db.query(ResolverEndpoint).filter(ResolverEndpoint.owner_id == demo_user.id).first():
        db.add_all([
            ResolverEndpoint(owner_id=demo_user.id, name='Inbound Resolver - VPC-Prod', direction='Inbound', status='Operational', ip_addresses=json.dumps(['10.0.1.15', '10.0.2.15']), description='Inbound DNS queries from corporate network to VPC'),
            ResolverEndpoint(owner_id=demo_user.id, name='Outbound Resolver - VPC-Prod', direction='Outbound', status='Operational', ip_addresses=json.dumps(['10.0.1.25', '10.0.2.25']), description='Forward DNS queries from VPC to corporate DNS servers'),
        ])

    if not db.query(Profile).filter(Profile.owner_id == demo_user.id).first():
        db.add_all([
            Profile(owner_id=demo_user.id, name='Production Enterprise Profile', description='Standard Route 53 profile applied to production VPCs', status='Active', associated_vpcs=json.dumps(['vpc-0a1b2c3d4e (us-east-1)', 'vpc-0f9e8d7c6b (us-west-2)'])),
        ])

    db.commit()

