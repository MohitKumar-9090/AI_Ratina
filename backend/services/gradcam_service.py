"""Grad-CAM is implemented by PredictionService so it uses the loaded V4 model instance.

This compatibility module deliberately provides no placeholder or static heatmap path.
"""

from services.prediction_service import prediction_service


class GradCAMService:
    """Compatibility façade; prediction requests use PredictionService directly."""
    @property
    def available(self) -> bool:
        return prediction_service.is_model_loaded


def model_gradcam_available() -> bool:
    """True only when the actual loaded RetinaAIV4 model can generate Grad-CAM."""
    return prediction_service.is_model_loaded


gradcam_service = GradCAMService()
