import os
from typing import List, Any
from pydantic_settings import BaseSettings, SettingsConfigDict


from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """
    Application configuration settings loaded from environment variables and .env file.
    """
    APP_NAME: str = "Retina AI API"
    ENVIRONMENT: str = "development"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # MongoDB Atlas configuration
    MONGODB_URI: str = ""
    MONGODB_DATABASE: str = "retina_ai"

    # Real AI model path anchored to backend root
    MODEL_PATH: str = str(_BACKEND_DIR / "models" / "retina_project_v4_best.pth")

    # Uploads and temporary directories anchored to backend root
    UPLOAD_DIR: str = str(_BACKEND_DIR / "uploads")
    GRADCAM_DIR: str = str(_BACKEND_DIR / "gradcam")
    REPORTS_DIR: str = str(_BACKEND_DIR / "reports")

    # Image upload constraints
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png"]

    model_config = SettingsConfigDict(
        env_file=[str(_ENV_FILE), ".env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        """
        Parses comma-separated or single FRONTEND_ORIGIN into a list of allowed origins.
        """
        origins = [origin.strip() for origin in self.FRONTEND_ORIGIN.split(",") if origin.strip()]
        # Always ensure localhost Vite origins are included for local development
        common_dev_origins = [
            "http://localhost:5173", "http://127.0.0.1:5173",
            "http://localhost:5174", "http://127.0.0.1:5174",
            "http://localhost:5175", "http://127.0.0.1:5175",
            "http://localhost:5176", "http://127.0.0.1:5176",
            "http://localhost:3000", "http://127.0.0.1:3000",
        ]
        for default_origin in common_dev_origins:
            if default_origin not in origins:
                origins.append(default_origin)
        return origins

    def model_post_init(self, __context: Any) -> None:
        for attr in ["MODEL_PATH", "UPLOAD_DIR", "GRADCAM_DIR", "REPORTS_DIR"]:
            val = getattr(self, attr, None)
            if val and not os.path.isabs(val):
                setattr(self, attr, str(_BACKEND_DIR / val))

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()

# Ensure required directories exist
for folder in [settings.UPLOAD_DIR, settings.GRADCAM_DIR, settings.REPORTS_DIR]:
    os.makedirs(folder, exist_ok=True)
