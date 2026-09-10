"""
Prediction API endpoint for Retina AI.

Accepts a fundus image via multipart/form-data, validates it,
runs real inference through the RetinaAIV4 model, saves the 
result to the database, and returns DR stage + secondary findings.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Form, File, UploadFile, status

from schemas.prediction import PredictionResponse
from schemas.screening import ScreeningCreate
from services.prediction_service import prediction_service
from services.screening_service import screening_service
from utils.image_utils import validate_and_save_image
from core.exceptions import InvalidImageException, ValidationException

logger = logging.getLogger("retina_ai")

router = APIRouter(prefix="/predict", tags=["Predictions"])


@router.post("", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict_fundus(
    patient_id: Optional[str] = Form(None, description="Patient identifier (snake_case)"),
    patientId: Optional[str] = Form(None, description="Patient identifier (camelCase)"),
    image: Optional[UploadFile] = File(None, description="Fundus image file (JPG, JPEG, PNG)"),
    file: Optional[UploadFile] = File(None, description="Alternative field name for image file compatibility"),
):
    """
    Accepts an uploaded fundus image and runs real AI inference.

    Steps:
    1. Validates patient_id presence
    2. Validates image (extension, size, Pillow integrity, RGB)
    3. Saves image to uploads/
    4. Runs RetinaAIV4 inference (DR + secondary findings + Grad-CAM)
    5. Best-effort save screening to database (MongoDB)
    6. Returns clinical results (NO confidence percentages)
    """
    target_pid = (patient_id or patientId or "").strip()
    if not target_pid:
        raise ValidationException("patient_id is required and cannot be blank")

    upload_file = image or file
    if not upload_file:
        raise InvalidImageException("Image file is required (field 'image' or 'file')")

    saved_path, image_url = await validate_and_save_image(upload_file, patient_id=target_pid)

    # Run real model inference and Grad-CAM generation
    result = await prediction_service.predict(image_path=saved_path, patient_id=target_pid)

    now_iso = datetime.now(timezone.utc).isoformat()

    if not result.get("success", False):
        return PredictionResponse(
            success=False,
            patient_id=target_pid,
            image_url=image_url,
            created_at=now_iso,
            error=result.get("error", "AI analysis could not be completed."),
        )

    screening_id = result.get("screening_id")
    dr_data = result["dr"]
    rfmid_findings = result.get("rfmid_findings", [])
    odir_findings = result.get("odir_findings", [])
    findings = result.get("findings", {})
    gradcam_url = result.get("gradcam_url")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # -------------------------------------------------------------------------
    # Best-effort screening persistence into MongoDB.
    # Persists complete finding structure: DR stage/label, RFMiD findings, ODIR findings.
    # -------------------------------------------------------------------------
    db_warning = None
    try:
        screening_data = ScreeningCreate(
            screening_id=screening_id,
            patient_id=target_pid,
            image_url=image_url,
            dr_stage=dr_data["stage"],
            dr_label=dr_data.get("label", dr_data.get("result")),
            dr_result=dr_data.get("result", dr_data.get("label")),
            rfmid_findings=rfmid_findings,
            odir_findings=odir_findings,
            findings=findings,
            gradcam_url=gradcam_url,
            screening_date=today_str
        )
        await screening_service.create(screening_data)
    except Exception as e:
        logger.warning(f"Screening save failed (prediction still returned): {e}")
        db_warning = f"Prediction succeeded but could not be saved: {e}"

    return PredictionResponse(
        success=True,
        screening_id=screening_id,
        patient_id=target_pid,
        drStage=dr_data["stage"],
        drLabel=dr_data.get("label", dr_data.get("result")),
        dr_stage=dr_data["stage"],
        dr_label=dr_data.get("label", dr_data.get("result")),
        dr=dr_data,
        rfmid_findings=rfmid_findings,
        odir_findings=odir_findings,
        findings=findings,
        image_url=image_url,
        gradcam_url=gradcam_url,
        created_at=now_iso,
        error=db_warning,
    )


@router.post("/debug", status_code=status.HTTP_200_OK)
async def predict_debug(
    image: Optional[UploadFile] = File(None, description="Fundus image file"),
    file: Optional[UploadFile] = File(None, description="Alternative field name for image file"),
):
    """
    Temporary debug endpoint: Accepts fundus image and returns full DR class diagnostics
    including raw logits, softmax probabilities, selected class, and clinical label.
    """
    upload_file = image or file
    if not upload_file:
        raise InvalidImageException("Image file is required (field 'image' or 'file')")

    saved_path, image_url = await validate_and_save_image(upload_file, patient_id="debug")
    diagnostic = prediction_service.diagnose_image(saved_path)
    diagnostic["image_url"] = image_url
    return diagnostic

