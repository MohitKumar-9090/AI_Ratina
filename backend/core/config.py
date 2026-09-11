import os
from typing import List, Any, Optional
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
    FRONTEND_ORIGIN: str = "https://ai-ratina-kn7w.vercel.app"

    # MongoDB Atlas configuration
    MONGODB_URI: str = ""
    MONGODB_FALLBACK_URI: Optional[str] = None
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
        Parses comma-separated or single FRONTEND_ORIGIN from environment into allowed origins list.
        Always includes production Vercel frontend and local development origins.
        """
        origins: List[str] = []

        # 1. Parse origins from FRONTEND_ORIGIN setting or environment variable
        raw_env_origin = os.getenv("FRONTEND_ORIGIN") or self.FRONTEND_ORIGIN
        if raw_env_origin:
            for item in raw_env_origin.split(","):
                cleaned = item.strip().rstrip("/")
                if cleaned and cleaned not in origins:
                    origins.append(cleaned)

        # 2. Ensure production Vercel frontend is explicitly allowed
        prod_origins = [
            "https://ai-ratina-kn7w.vercel.app",
        ]
        for prod in prod_origins:
            cleaned = prod.strip().rstrip("/")
            if cleaned not in origins:
                origins.append(cleaned)

        # 3. Ensure localhost development origins are always supported
        dev_origins = [
            "http://localhost:5173", "http://127.0.0.1:5173",
            "http://localhost:5174", "http://127.0.0.1:5174",
            "http://localhost:5175", "http://127.0.0.1:5175",
            "http://localhost:5176", "http://127.0.0.1:5176",
            "http://localhost:3000", "http://127.0.0.1:3000",
            "http://localhost:8080", "http://127.0.0.1:8080",
        ]
        for dev in dev_origins:
            cleaned = dev.strip().rstrip("/")
            if cleaned not in origins:
                origins.append(cleaned)

        return origins

    @property
    def cors_origin_regex(self) -> str:
        """
        Regex allowing any localhost/127.0.0.1 port and Vercel preview/production domains.
        """
        return r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*ai-ratina.*\.vercel\.app$"

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
