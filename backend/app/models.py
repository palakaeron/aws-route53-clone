from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    # `password` remains only as a scrubbed migration-era compatibility column.
    # Application code exclusively uses password_hash.
    legacy_password = Column('password', String(255), nullable=False, default='MIGRATED')
    password_hash = Column(String(512), nullable=True)
    sessions = relationship('UserSession', back_populates='user', cascade='all, delete-orphan')
    hosted_zones = relationship('HostedZone', back_populates='owner')


class UserSession(Base):
    __tablename__ = 'sessions'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    token = Column(String(255), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user = relationship('User', back_populates='sessions')

class HostedZone(Base):
    __tablename__ = 'hosted_zones'
    id = Column(Integer, primary_key=True)
    zone_id = Column(String(32), nullable=True, unique=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    type = Column(String(30), nullable=False, default='Public')
    description = Column(Text, default='')
    owner_id = Column(Integer, ForeignKey('users.id', ondelete='RESTRICT'), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner = relationship('User', back_populates='hosted_zones')
    records = relationship('DNSRecord', back_populates='zone', cascade='all, delete-orphan')

class DNSRecord(Base):
    __tablename__ = 'dns_records'
    __table_args__ = (Index('ix_dns_records_zone_name_type', 'hosted_zone_id', 'name', 'type'),)
    id = Column(Integer, primary_key=True)
    hosted_zone_id = Column(Integer, ForeignKey('hosted_zones.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)
    value = Column(Text, nullable=False)
    ttl = Column(Integer, default=300)
    priority = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    zone = relationship('HostedZone', back_populates='records')


# ---------------------------------------------------------------------------
# Mock features (Traffic Policies, Health Checks, Resolver, Profiles)
# ---------------------------------------------------------------------------

class TrafficPolicy(Base):
    __tablename__ = 'traffic_policies'
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default='')
    routing_strategy = Column(String(50), nullable=False, default='Simple')
    status = Column(String(30), nullable=False, default='Active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class HealthCheck(Base):
    __tablename__ = 'health_checks'
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    endpoint = Column(String(512), nullable=False, default='')
    protocol = Column(String(20), nullable=False, default='HTTPS')
    port = Column(Integer, nullable=False, default=443)
    path = Column(String(512), nullable=False, default='/')
    status = Column(String(20), nullable=False, default='Unknown')
    failure_threshold = Column(Integer, nullable=False, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ResolverEndpoint(Base):
    __tablename__ = 'resolver_endpoints'
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    direction = Column(String(20), nullable=False, default='Inbound')
    status = Column(String(30), nullable=False, default='Operational')
    ip_addresses = Column(Text, nullable=False, default='')
    description = Column(Text, default='')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Profile(Base):
    __tablename__ = 'profiles'
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default='')
    status = Column(String(30), nullable=False, default='Active')
    associated_vpcs = Column(Text, nullable=False, default='')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
