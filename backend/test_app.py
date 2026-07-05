import os
import sys
from fastapi.testclient import TestClient

# Ensure backend folder is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal, engine, Base
from app.models import Video

def test_app_and_database():
    # Force table creation in SQLite
    Base.metadata.create_all(bind=engine)

    client = TestClient(app)

    print("Testing /health endpoint...")
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    print("Testing /api/media/register endpoint...")
    video_payload = {
        "title": "Decentralized Streaming Intro",
        "storage_cid": "QmXoypizjW3WknFixt7x5j2vW9k1P5769234857209847",
        "livepeer_playback_id": "lp_playback_12345"
    }
    response = client.post("/api/media/register", json=video_payload)
    assert response.status_code == 200
    registered_video = response.json()
    assert registered_video["id"] is not None
    assert registered_video["title"] == "Decentralized Streaming Intro"
    assert registered_video["storage_cid"] == "QmXoypizjW3WknFixt7x5j2vW9k1P5769234857209847"
    assert registered_video["livepeer_playback_id"] == "lp_playback_12345"
    assert registered_video["is_active"] is True

    print("Testing /api/media/catalog endpoint...")
    # Add an inactive video directly to database to verify filtering
    db = SessionLocal()
    try:
        inactive_video = Video(
            title="Inactive Video",
            storage_cid="QmInactiveCID",
            livepeer_playback_id="lp_inactive",
            is_active=False
        )
        db.add(inactive_video)
        db.commit()
    finally:
        db.close()

    response = client.get("/api/media/catalog")
    assert response.status_code == 200
    catalog = response.json()
    
    # Assert catalog only contains active videos
    assert len(catalog) == 1
    assert catalog[0]["title"] == "Decentralized Streaming Intro"
    assert catalog[0]["storage_cid"] == "QmXoypizjW3WknFixt7x5j2vW9k1P5769234857209847"

    print("All endpoints and database tests passed successfully!")

    # Clean up
    print("Cleaning up database...")
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("stream_app.db"):
        os.remove("stream_app.db")
    print("Database cleanup completed.")

if __name__ == "__main__":
    test_app_and_database()
