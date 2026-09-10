from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ReportBase(BaseModel):
    screening_id: str = Field(..., alias="screeningId", description="Associated screening identifier")
    patient_id: Optional[str] = Field(None, alias="patientId", description="Associated patient identifier")
    patient_info: Optional[Dict[str, Any]] = Field(None, alias="patientInfo", description="Patient demographic details")
    clinical_info: Optional[Dict[str, Any]] = Field(None, alias="clinicalInfo", description="Clinical history details")
    fundus_image_url: Optional[str] = Field(None, alias="fundusImageUrl", description="Uploaded fundus image URL")
    dr_result: Optional[str] = Field(None, alias="drResult", description="Diabetic Retinopathy result summary")
    additional_findings: Optional[Dict[str, Any]] = Field(None, alias="additionalFindings", description="Secondary clinical findings")
    gradcam_url: Optional[str] = Field(None, alias="gradcamUrl", description="Heatmap URL")
    screening_summary: Optional[str] = Field(None, alias="screeningSummary", description="Comprehensive screening summary")
    notes: Optional[str] = Field(None, description="Doctor notes or recommendations")
    status: str = Field("Draft", description="Report status (Draft, Finalized)")
    date: Optional[str] = Field(None, description="Report date")

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )


class ReportCreate(ReportBase):
    report_id: Optional[str] = Field(None, alias="reportId")


class ReportResponse(ReportBase):
    report_id: str = Field(..., alias="reportId")
    pdf_url: Optional[str] = Field(None, alias="pdfUrl", description="Generated PDF report download URL")
    created_at: str = Field(..., alias="createdAt")

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )
