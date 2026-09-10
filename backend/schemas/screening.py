from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ScreeningBase(BaseModel):
    patient_id: str = Field(..., alias="patientId", description="Associated patient identifier")
    image_url: Optional[str] = Field(None, alias="imageUrl", description="Uploaded fundus image URL")
    dr_stage: Optional[int] = Field(None, alias="drStage", description="Diabetic Retinopathy stage (0-4)")
    dr_label: Optional[str] = Field(None, alias="drLabel", description="Diagnostic classification label")
    dr_result: Optional[str] = Field(None, alias="drResult", description="Diagnostic classification label")
    rfmid_findings: list[str] = Field(default_factory=list, alias="rfmidFindings", description="RFMiD multi-label findings")
    odir_findings: list[str] = Field(default_factory=list, alias="odirFindings", description="ODIR multi-label findings")
    findings: Optional[Dict[str, Any]] = Field(None, description="Multi-label secondary condition findings")
    gradcam_url: Optional[str] = Field(None, alias="gradcamUrl", description="Grad-CAM visualization URL, null until model is connected")
    screening_date: Optional[str] = Field(None, alias="screeningDate", description="Date of screening examination (YYYY-MM-DD)")

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )


class ScreeningCreate(ScreeningBase):
    screening_id: Optional[str] = Field(None, alias="screeningId")


class ScreeningResponse(ScreeningBase):
    screening_id: str = Field(..., alias="screeningId")
    created_at: str = Field(..., alias="createdAt")

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )
