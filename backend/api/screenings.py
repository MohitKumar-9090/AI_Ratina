from typing import List, Optional, Dict, Any
import os
import logging
from fastapi import APIRouter, Query, status

from core.config import settings
from core.exceptions import ResourceNotFoundException
from schemas.screening import ScreeningCreate, ScreeningResponse
from services.screening_service import screening_service
from services.prediction_service import prediction_service
from utils.memory_utils import log_memory

logger = logging.getLogger("retina_ai")

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


@router.get("/{screening_id}/gradcam", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
@router.post("/{screening_id}/gradcam", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def generate_gradcam_for_screening_endpoint(screening_id: str):
    """
    On-demand asynchronous Grad-CAM generation for an existing screening.
    Decoupled from /api/predict to keep initial prediction fast and memory bounded.
    """
    screening = await screening_service.get_by_id(screening_id)
    if not screening:
        raise ResourceNotFoundException(f"Screening with ID '{screening_id}' was not found.")

    # If already generated and file exists on disk, return immediately
    existing_url = screening.get("gradcam_url") or screening.get("gradcamUrl")
    if existing_url:
        fn = os.path.basename(existing_url)
        fp = os.path.join(settings.GRADCAM_DIR, fn)
        if os.path.exists(fp):
            return {
                "success": True,
                "screening_id": screening_id,
                "gradcam_url": existing_url,
                "gradcam_status": "completed"
            }

    print("GRADCAM START", flush=True)
    log_memory("GRADCAM START MEMORY")

    # Resolve local image file from imageUrl
    image_url = screening.get("image_url") or screening.get("imageUrl") or ""
    filename = os.path.basename(image_url)
    image_path = os.path.join(settings.UPLOAD_DIR, filename)

    if not os.path.exists(image_path):
        logger.error(f"Image file '{image_path}' not found for screening '{screening_id}'")
        await screening_service.update_gradcam(screening_id, gradcam_url=None, gradcam_status="failed")
        return {
            "success": False,
            "screening_id": screening_id,
            "gradcam_url": None,
            "gradcam_status": "failed",
            "error": "Original fundus image file not found on server."
        }

    dr_stage = screening.get("dr_stage") if screening.get("dr_stage") is not None else (screening.get("drStage") or 0)

    try:
        gradcam_url = await prediction_service.generate_gradcam_for_screening(
            image_path=image_path,
            target_class=dr_stage,
            screening_id=screening_id
        )
    except Exception as e:
        logger.error(f"Grad-CAM generation failed for screening {screening_id}: {e}", exc_info=True)
        gradcam_url = None

    if gradcam_url:
        print("GRADCAM COMPLETE", flush=True)
        log_memory("GRADCAM COMPLETE MEMORY")
        await screening_service.update_gradcam(screening_id, gradcam_url=gradcam_url, gradcam_status="completed")
        return {
            "success": True,
            "screening_id": screening_id,
            "gradcam_url": gradcam_url,
            "gradcam_status": "completed"
        }
    else:
        logger.warning(f"Grad-CAM could not be generated for screening {screening_id}")
        await screening_service.update_gradcam(screening_id, gradcam_url=None, gradcam_status="failed")
        return {
            "success": False,
            "screening_id": screening_id,
            "gradcam_url": None,
            "gradcam_status": "failed",
            "error": "AI attention map unavailable"
        }
