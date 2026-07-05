from typing import List
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import engine, Base, get_db
from app.config import settings
from app import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Decentralized Stream App API",
    description="Backend API for managing users and video metadata",
    version="0.1.0"
)

# Pydantic Schemas
class VideoCreate(BaseModel):
    title: str
    storage_cid: str
    livepeer_playback_id: str | None = None

class VideoResponse(BaseModel):
    id: int
    title: str
    storage_cid: str
    livepeer_playback_id: str | None
    is_active: bool

    class Config:
        from_attributes = True

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database_url": settings.DATABASE_URL
    }

@app.post("/api/media/register", response_model=VideoResponse)
async def register_video(video: VideoCreate, db: Session = Depends(get_db)):
    db_video = models.Video(
        title=video.title,
        storage_cid=video.storage_cid,
        livepeer_playback_id=video.livepeer_playback_id,
        is_active=True
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video

@app.get("/api/media/catalog", response_model=List[VideoResponse])
async def get_catalog(db: Session = Depends(get_db)):
    videos = db.query(models.Video).filter(models.Video.is_active).all()
    return videos
