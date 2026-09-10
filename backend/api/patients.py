from typing import List, Dict, Any
from fastapi import APIRouter, status

from schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from services.patient_service import patient_service

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_patients():
    """
    Retrieve list of all registered patients.
    """
    return await patient_service.get_all()


@router.get("/{patient_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_patient_by_id(patient_id: str):
    """
    Retrieve single patient details by patient_id.
    """
    return await patient_service.get_by_id(patient_id)


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_patient(payload: PatientCreate):
    """
    Register a new patient. Auto-calculates age from date_of_birth where available.
    """
    return await patient_service.create(payload)


@router.put("/{patient_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def update_patient(patient_id: str, payload: PatientUpdate):
    """
    Update existing patient demographics and clinical history.
    """
    return await patient_service.update(patient_id, payload)


@router.delete("/{patient_id}", status_code=status.HTTP_200_OK)
async def delete_patient(patient_id: str):
    """
    Delete patient record by patient_id.
    """
    await patient_service.delete(patient_id)
    return {"success": True, "message": f"Patient '{patient_id}' deleted successfully"}
