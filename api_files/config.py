# config.py
# Adjust API settings 

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "Marine Species Classification API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Model Settings
    MODEL_PATH: str = "models/best_model.pth"
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB in bytes
    ALLOWED_EXTENSIONS: List[str] = ["image/jpeg", "image/png", "image/jpg"]
    
    # Batch Settings
    MAX_BATCH_SIZE: int = 10  # Maximum number of files per request
    
    # CORS Settings
    CORS_ORIGINS: List[str] = ["*"]  # Change to specific origins in production
    
    # Logging Settings
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()