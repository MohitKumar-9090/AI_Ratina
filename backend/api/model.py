from typing import Dict, Any
from fastapi import APIRouter

from services.prediction_service import prediction_service

router = APIRouter(prefix="/model", tags=["Model Status"])

@router.get("/status")
async def get_model_status() -> Dict[str, Any]:
    """
    Verifies that the PyTorch model is actually loaded in memory.
    """
    return prediction_service.get_status()
