"""
Retina AI - API Module
Routers for Patients, Screenings, Predictions, and Reports.
"""

from .patients import router as patients_router
from .screenings import router as screenings_router
from .predictions import router as predictions_router
from .reports import router as reports_router

__all__ = [
    "patients_router",
    "screenings_router",
    "predictions_router",
    "reports_router",
]
