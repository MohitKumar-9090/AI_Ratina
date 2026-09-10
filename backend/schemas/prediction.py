from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field


class DRResult(BaseModel):
    """
    Diabetic Retinopathy stage and clinical description.
    Strictly clinical: NO percentages or raw probabilities exposed.
    """
    stage: int = Field(..., ge=0, le=4, description="DR stage from 0 to 4")
    label: str = Field(..., description="Clinical label: e.g. 'Moderate'")
    result: Optional[str] = Field(None, description="Clinical label alias for backward compatibility")


class SecondaryFindings(BaseModel):
    """
    Multi-label findings for secondary retinal pathologies.
    Clinical statuses: 'Possible finding', 'No significant finding detected', 'Needs review'.
    """
    amd_armd: str = Field("No significant finding detected", description="Age-related Macular Degeneration")
    brvo: str = Field("No significant finding detected", description="Branch Retinal Vein Occlusion")
    odc: str = Field("No significant finding detected", description="Optic Disc Cupping / abnormalities")
    glaucoma: str = Field("No significant finding detected", description="Glaucoma suspicion")
    cataract: str = Field("No significant finding detected", description="Cataract / Media haze")
    myopia: str = Field("No significant finding detected", description="Pathological Myopia signs")
    other: str = Field("No significant finding detected", description="Other retinal abnormalities")


class PredictionResponse(BaseModel):
    """
    Final API contract for when the PyTorch model is integrated.
    Strictly excludes confidence percentages or raw probability scores.
    """
    success: bool = True
    screening_id: Optional[str] = None
    patient_id: str = ""
    drStage: Optional[int] = Field(None, alias="drStage")
    drLabel: Optional[str] = Field(None, alias="drLabel")
    dr_stage: Optional[int] = None
    dr_label: Optional[str] = None
    dr: Optional[DRResult] = None
    rfmid_findings: list[str] = Field(default_factory=list, alias="rfmidFindings")
    odir_findings: list[str] = Field(default_factory=list, alias="odirFindings")
    findings: Optional[Any] = None
    image_url: str = ""
    gradcam_url: Optional[str] = None
    created_at: str = ""
    error: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )


class PredictionFoundationResponse(BaseModel):
    """
    Interim response contract returned before the real PyTorch model is integrated.
    Confirms image receipt and validation without generating any fake AI results.
    """
    success: bool = True
    message: str = "Image received successfully. AI prediction engine is ready for model integration."
    patient_id: str
    image_url: str

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )
