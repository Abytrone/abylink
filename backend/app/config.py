import os
from pydantic import BaseModel, Field

class Settings(BaseModel):
    DATABASE_URL: str = Field(
        default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./stream_app.db")
    )

settings = Settings()
