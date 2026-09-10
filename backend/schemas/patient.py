from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


def calculate_age_from_dob(dob_str: Optional[str]) -> Optional[int]:
    """
    Calculates age from a date of birth string (e.g., YYYY-MM-DD).
    Returns None if parsing fails.
    """
    if not dob_str:
        return None
    try:
        # Support YYYY-MM-DD or ISO formats
        clean_str = dob_str.split("T")[0].strip()
        dob = datetime.strptime(clean_str, "%Y-%m-%d").date()
        today = date.today()
        calculated_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return max(0, calculated_age)
    except Exception:
        return None


class PatientBase(BaseModel):
    full_name: str = Field(..., alias="fullName", description="Patient full legal name")
    date_of_birth: Optional[str] = Field(None, alias="dob", description="Date of birth in YYYY-MM-DD format")
    age: Optional[int] = Field(None, description="Age in years, auto-calculated from date_of_birth if provided")
    gender: str = Field("Other", description="Gender (Male, Female, Other)")
    phone: Optional[str] = Field(None, description="Contact phone number")
    email: Optional[str] = Field(None, description="Contact email address")
    address: Optional[str] = Field(None, description="Residential address")

    diabetes_status: Optional[str] = Field("No", alias="diabetesStatus", description="Diabetes status (Yes, No, Borderline)")
    diabetes_duration: Optional[str] = Field("None", alias="diabetesDuration", description="Duration of diabetes (e.g., '5 years')")
    hypertension: Optional[str] = Field("No", description="Hypertension status (Yes, No)")
    previous_eye_disease: Optional[str] = Field("None", alias="previousEyeDisease", description="Previous ocular diseases")
    previous_eye_surgery: Optional[str] = Field("None", alias="previousEyeSurgery", description="Previous ocular surgeries")
    current_medication: Optional[str] = Field("", alias="currentMedication", description="Current medications")
    family_history: Optional[str] = Field("None", alias="familyHistory", description="Family history of eye disease / diabetes")
    notes: Optional[str] = Field("", description="Clinical intake notes")

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_and_compute_age(self) -> "PatientBase":
        """
        Age is calculated from date_of_birth where appropriate
        rather than blindly trusting manually entered age.
        """
        if self.date_of_birth:
            computed = calculate_age_from_dob(self.date_of_birth)
            if computed is not None:
                self.age = computed
        return self


class PatientCreate(PatientBase):
    patient_id: Optional[str] = Field(None, alias="patientId", description="Optional explicit patient identifier")


class PatientUpdate(BaseModel):
    full_name: Optional[str] = Field(None, alias="fullName")
    date_of_birth: Optional[str] = Field(None, alias="dob")
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

    diabetes_status: Optional[str] = Field(None, alias="diabetesStatus")
    diabetes_duration: Optional[str] = Field(None, alias="diabetesDuration")
    hypertension: Optional[str] = None
    previous_eye_disease: Optional[str] = Field(None, alias="previousEyeDisease")
    previous_eye_surgery: Optional[str] = Field(None, alias="previousEyeSurgery")
    current_medication: Optional[str] = Field(None, alias="currentMedication")
    family_history: Optional[str] = Field(None, alias="familyHistory")
    notes: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_and_compute_age(self) -> "PatientUpdate":
        if self.date_of_birth:
            computed = calculate_age_from_dob(self.date_of_birth)
            if computed is not None:
                self.age = computed
        return self


class PatientResponse(PatientBase):
    patient_id: str = Field(..., alias="patientId")
    created_at: str = Field(..., alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )
