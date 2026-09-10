import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import connect_to_mongo, close_mongo_connection, is_mongo_connected
from core.exceptions import setup_exception_handlers
from services.prediction_service import prediction_service
from api.patients import router as patients_router
from api.screenings import router as screenings_router
from api.predictions import router as predictions_router
from api.reports import router as reports_router
from api.model import router as model_router

# =============================================================================
# APPLICATION LIFECYCLE (STARTUP / SHUTDOWN)
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application lifecycle:
    - On startup: initializes MongoDB connection and logs safe status.
    - On shutdown: cleanly closes MongoDB connection pool.
    """
    # Startup
    connect_to_mongo()
    prediction_service.load_model()
    yield
    # Shutdown
    close_mongo_connection()


# =============================================================================
# APPLICATION INITIALIZATION
# =============================================================================

app = FastAPI(
    title=settings.APP_NAME,
    description="Clinical Backend API for Diabetic Retinopathy screening and multi-task ophthalmology inference.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# =============================================================================
# CORS CONFIGURATION
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# GLOBAL EXCEPTION HANDLERS
# =============================================================================

setup_exception_handlers(app)

# =============================================================================
# STATIC FILE MOUNTS
# =============================================================================

for directory in [settings.UPLOAD_DIR, settings.GRADCAM_DIR, settings.REPORTS_DIR]:
    os.makedirs(directory, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/gradcam", StaticFiles(directory=settings.GRADCAM_DIR), name="gradcam")
app.mount("/reports", StaticFiles(directory=settings.REPORTS_DIR), name="reports")

# =============================================================================
# CORE SYSTEM ENDPOINTS
# =============================================================================

@app.get("/", tags=["System"])
def root():
    """
    Root endpoint confirming service availability.
    """
    return {"message": "Retina AI API is running"}


@app.get("/health", tags=["System"])
def health_check():
    """
    Lightweight health check endpoint for monitoring and uptime checks.
    Does NOT expose database credentials.
    """
    model_status = prediction_service.get_status()
    return {
        "status": "ok",
        "database": "connected" if is_mongo_connected() else "disconnected",
        "model": "loaded" if model_status.get("loaded") else "not_loaded",
    }


# Also provide /api/health for consistency
@app.get("/api/health", tags=["System"], include_in_schema=False)
def api_health_check():
    return health_check()


# =============================================================================
# API ROUTER REGISTRATION
# =============================================================================

# Primary standard endpoints under /api/*
app.include_router(patients_router, prefix="/api")
app.include_router(screenings_router, prefix="/api")
app.include_router(predictions_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(model_router, prefix="/api")

# Fallback root endpoints without /api prefix for full backward compatibility
app.include_router(patients_router, include_in_schema=False)
app.include_router(screenings_router, include_in_schema=False)
app.include_router(predictions_router, include_in_schema=False)
app.include_router(reports_router, include_in_schema=False)


# =============================================================================
# LOCAL DEVELOPMENT ENTRYPOINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
