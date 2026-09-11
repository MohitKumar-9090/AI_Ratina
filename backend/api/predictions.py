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
from services.patient_service import patient_service
from utils.image_utils import validate_and_save_image
from utils.memory_utils import log_memory
from core.exceptions import InvalidImageException, ValidationException
from core.database import sanitize_credentials

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
    log_memory("PREDICT START MEMORY")
    print("PREDICT START", flush=True)
    target_pid = (patient_id or patientId or "").strip()
    if not target_pid:
        logger.error("Prediction stage [VALIDATION] failed: patient_id is required")
        raise ValidationException("patient_id is required and cannot be blank")

    upload_file = image or file
    if not upload_file:
        logger.error("Prediction stage [VALIDATION] failed: Image file is required")
        raise InvalidImageException("Image file is required (field 'image' or 'file')")

    try:
        saved_path, image_url = await validate_and_save_image(upload_file, patient_id=target_pid)
        log_memory("AFTER IMAGE SAVE MEMORY")
        print("IMAGE SAVED", flush=True)
    except Exception as e:
        safe_err = sanitize_credentials(str(e))
        logger.error(f"Prediction stage [IMAGE SAVED] failed: {type(e).__name__}: {safe_err}")
        raise

    # Run real model inference (predict_fast: ultra-fast, returns without waiting for Grad-CAM)
    try:
        result = await prediction_service.predict_fast(image_path=saved_path, patient_id=target_pid)
    except Exception as e:
        safe_err = sanitize_credentials(str(e))
        logger.error(f"Prediction stage [MODEL INFERENCE] failed: {type(e).__name__}: {safe_err}")
        raise

    now_iso = datetime.now(timezone.utc).isoformat()

    if not result.get("success", False):
        err_msg = result.get("error", "AI analysis could not be completed.")
        logger.error(f"Prediction stage [MODEL INFERENCE] unsuccessful: {sanitize_credentials(err_msg)}")
        return PredictionResponse(
            success=False,
            patient_id=target_pid,
            image_url=image_url,
            created_at=now_iso,
            error=err_msg,
        )

    screening_id = result.get("screening_id")
    dr_data = result["dr"]
    rfmid_findings = result.get("rfmid_findings", [])
    odir_findings = result.get("odir_findings", [])
    findings = result.get("findings", {})
    gradcam_url = None
    gradcam_status = "processing"
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # -------------------------------------------------------------------------
    # Best-effort screening persistence into MongoDB.
    # Persists complete finding structure: DR stage/label, RFMiD findings, ODIR findings.
    # -------------------------------------------------------------------------
    print("MONGODB SAVE START", flush=True)
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
            gradcam_status=gradcam_status,
            screening_date=today_str
        )
        try:
            await patient_service.get_by_id(target_pid)
        except Exception:
            try:
                from schemas.patient import PatientCreate
                await patient_service.create(PatientCreate(
                    patient_id=target_pid,
                    full_name=f"Patient {target_pid}",
                    gender="Other"
                ))
            except Exception:
                pass
        await screening_service.create(screening_data)
        log_memory("AFTER MONGODB SAVE MEMORY")
        print("MONGODB SAVE COMPLETE", flush=True)
    except Exception as e:
        safe_err = sanitize_credentials(str(e))
        logger.warning(f"Prediction stage [MONGODB SAVE] failed (prediction still returned): {type(e).__name__}: {safe_err}")
        db_warning = "Prediction succeeded but record could not be saved to database."

    log_memory("RESPONSE READY MEMORY")
    print("RESPONSE READY", flush=True)
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
        imageUrl=image_url,
        gradcam_url=None,
        gradcamUrl=None,
        gradcam_status="processing",
        gradcamStatus="processing",
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

