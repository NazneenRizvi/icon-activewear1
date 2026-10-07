import os
from typing import List
from pydantic_settings import BaseSettings

class Settings:
    PROJECT_NAME: str = "FITNESS JUNKIES Activewear API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # JWT Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-fitness-junkies-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Defaults to local SQLite, or PostgreSQL URL if set in env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fitness_junkies.db")
    
    # CORS Origins (Next.js frontend, Vercel, localhost)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://*.vercel.app",
        "*"
    ]

settings = Settings()
