from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, status

from schemas.report import ReportCreate, ReportResponse
from services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_reports(patient_id: Optional[str] = Query(None, alias="patientId")):
    """
    Retrieve clinical reports list, optionally filtered by patient_id.
    """
    return await report_service.get_all(patient_id=patient_id)


@router.get("/{report_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_report_by_id(report_id: str):
    """
    Retrieve single clinical report by report_id.
    """
    return await report_service.get_by_id(report_id)


@router.post("/{screening_id}", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_report_for_screening(screening_id: str, payload: ReportCreate):
    """
    Create or update a clinical report associated with screening_id.
    """
    return await report_service.create(screening_id=screening_id, data=payload)


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_report(payload: ReportCreate):
    """
    Create or update a clinical report using the screening_id in payload.
    """
    return await report_service.create(screening_id=payload.screening_id, data=payload)
