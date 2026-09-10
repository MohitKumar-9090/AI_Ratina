from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, status

from schemas.screening import ScreeningCreate, ScreeningResponse
from services.screening_service import screening_service

router = APIRouter(prefix="/screenings", tags=["Screenings"])


@router.get("", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_screenings(patient_id: Optional[str] = Query(None)):
    """
    Retrieve all screening sessions, optionally filtered by patient_id.
    """
    return await screening_service.get_all(patient_id=patient_id)


@router.get("/{screening_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_screening_by_id(screening_id: str):
    """
    Retrieve single screening session details.
    """
    return await screening_service.get_by_id(screening_id)


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_screening(payload: ScreeningCreate):
    """
    Create a new screening record for a patient.
    Screening records are only accepted for completed, real model results.
    """
    return await screening_service.create(payload)
