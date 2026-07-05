from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="active", nullable=False)

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    storage_cid = Column(String, nullable=False, index=True)
    livepeer_playback_id = Column(String, nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
