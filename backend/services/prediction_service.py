"""
Real PyTorch model integration for Retina AI.

Loads the trained RetinaAIV4 EfficientNet-B0 multitask model and runs
inference on fundus images to produce:
  - DR stage classification (0-4)
  - Secondary retinal findings (AMD/ARMD, BRVO, ODC, Glaucoma, etc.)
  - Real Grad-CAM heatmap visualization

IMPORTANT:
  - No confidence percentages or raw probabilities are exposed.
  - AMD from RFMiD and ODIR heads are combined into a single "AMD / ARMD" finding.
"""

import logging
import os
import uuid
from typing import Optional, Dict, Any, Tuple

import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

from core.config import settings

logger = logging.getLogger("retina_ai")


# =============================================================================
# MODEL ARCHITECTURE — Exact replica of the trained RetinaAIV4
# =============================================================================

class RetinaAIV4(nn.Module):
    """
    EfficientNet-B0 based multitask model for retinal disease classification.

    Three classification heads:
      - dr_head:    5 classes (DR stages 0-4)
      - rfmid_head: 3 classes (ARMD, BRVO, ODC)
      - odir_head:  8 classes (Normal, Diabetes, Glaucoma, Cataract, AMD,
                               Hypertension, Myopia, Other)
    """

    def __init__(self):
        super().__init__()

        backbone = models.efficientnet_b0(weights=None)
        self.features = backbone.features
        self.avgpool = nn.AdaptiveAvgPool2d(1)

        # DR classification head: 1280 → 256 → 5
        self.dr_head = nn.Sequential(
            nn.Dropout(0.30),
            nn.Linear(1280, 256),
            nn.ReLU(),
            nn.Dropout(0.20),
            nn.Linear(256, 5)
        )

        # RFMiD secondary findings head: 1280 → 128 → 3
        self.rfmid_head = nn.Sequential(
            nn.Dropout(0.25),
            nn.Linear(1280, 128),
            nn.ReLU(),
            nn.Dropout(0.15),
            nn.Linear(128, 3)
        )

        # ODIR multi-disease head: 1280 → 128 → 8
        self.odir_head = nn.Sequential(
            nn.Dropout(0.25),
            nn.Linear(1280, 128),
            nn.ReLU(),
            nn.Dropout(0.15),
            nn.Linear(128, 8)
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        features = self.features(x)
        pooled = self.avgpool(features)
        flat = pooled.flatten(1)

        dr_logits = self.dr_head(flat)
        rfmid_logits = self.rfmid_head(flat)
        odir_logits = self.odir_head(flat)

        return dr_logits, rfmid_logits, odir_logits


# =============================================================================
# LABEL MAPPINGS
# =============================================================================

DR_LABELS = {
    0: "No DR",
    1: "Mild DR",
    2: "Moderate DR",
    3: "Severe DR",
    4: "Proliferative DR",
}

# RFMiD: 3 classes — index 0=ARMD/AMD, 1=BRVO, 2=ODC
RFMID_LABELS = ["ARMD/AMD", "BRVO", "ODC"]

# ODIR: 8 classes — index 0=Normal, 1=Diabetes, 2=Glaucoma, 3=Cataract, 4=AMD, 5=Hypertension, 6=Myopia, 7=Other
ODIR_LABELS = ["Normal", "Diabetes", "Glaucoma", "Cataract", "AMD",
               "Hypertension", "Myopia", "Other"]

# Clinical status labels (no percentages)
STATUS_POSSIBLE = "Possible finding"
STATUS_CLEAR = "No significant finding detected"


# =============================================================================
# IMAGE PREPROCESSING
# =============================================================================

inference_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])


# =============================================================================
# PREDICTION SERVICE
# =============================================================================

class PredictionService:
    """
    Manages model loading, inference, and real Grad-CAM generation for the RetinaAIV4 multitask model.
    """

    def __init__(self):
        self._model: Optional[RetinaAIV4] = None
        self._device: str = "cuda" if torch.cuda.is_available() else "cpu"
        self._is_loaded: bool = False
        self._param_count: int = 0
        
        # State for Grad-CAM hooks
        self._activations = None
        self._gradients = None

    @property
    def is_model_loaded(self) -> bool:
        """Indicates if the trained weights are loaded and active."""
        return self._is_loaded

    def get_status(self) -> Dict[str, Any]:
        """Returns the current status of the model."""
        if not self._is_loaded:
            return {
                "loaded": False,
                "error": "Model could not be loaded or is not loaded yet."
            }
        
        return {
            "loaded": True,
            "device": self._device,
            "model": "RetinaAIV4",
            "checkpoint": os.path.basename(settings.MODEL_PATH),
            "parameters": self._param_count
        }

    def load_model(self, model_path: Optional[str] = None) -> None:
        """
        Loads the PyTorch EfficientNet-B0 weights into memory.
        """
        target_path = model_path or settings.MODEL_PATH

        if not os.path.exists(target_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            alt_path = os.path.join(base_dir, target_path)
            if os.path.exists(alt_path):
                target_path = alt_path
            elif os.path.exists(os.path.join(os.getcwd(), "backend", target_path)):
                target_path = os.path.join(os.getcwd(), "backend", target_path)

        if not os.path.exists(target_path):
            logger.error(f"Model file not found at '{target_path}'")
            self._is_loaded = False
            return

        try:
            logger.info(f"Loading RetinaAIV4 model from '{target_path}' on {self._device}...")

            # Initialize model architecture
            self._model = RetinaAIV4()

            # Load checkpoint
            checkpoint = torch.load(target_path, map_location=self._device, weights_only=False)

            # Extract state dict from checkpoint
            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                state_dict = checkpoint["model_state_dict"]
                epoch = checkpoint.get("epoch", "unknown")
                best_score = checkpoint.get("best_score", "unknown")
                logger.info(f"Checkpoint epoch: {epoch}, best_score: {best_score}")
            elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                state_dict = checkpoint["state_dict"]
            else:
                # Assume the checkpoint IS the state_dict directly
                state_dict = checkpoint

            load_result = self._model.load_state_dict(state_dict)
            self._model.to(self._device)
            self._model.eval()
            self._is_loaded = True
            self._param_count = sum(p.numel() for p in self._model.parameters())

            logger.info("RetinaAIV4 checkpoint loaded successfully.")
            diagnostic_msg = (
                f"\n=======================================================\n"
                f"--- [MODEL LOAD DIAGNOSTIC] ---\n"
                f"Model path: {target_path}\n"
                f"Checkpoint exists: {os.path.exists(target_path)}\n"
                f"Missing keys: {load_result.missing_keys}\n"
                f"Unexpected keys: {load_result.unexpected_keys}\n"
                f"Device: {self._device}\n"
                f"model.eval() status: training={self._model.training} (eval mode active={not self._model.training})\n"
                f"Total Parameters: {self._param_count}\n"
                f"======================================================="
            )
            logger.info(diagnostic_msg)
            print(diagnostic_msg, flush=True)

        except Exception as e:
            logger.error(f"Failed to load model: {e}", exc_info=True)
            self._model = None
            self._is_loaded = False

    def _preprocess_image(self, image_path: str) -> Tuple[torch.Tensor, Image.Image]:
        """
        Loads and preprocesses a fundus image for inference.
        Returns the tensor and the original PIL image (for Grad-CAM overlay).
        """
        img = Image.open(image_path).convert("RGB")
        tensor = inference_transform(img)
        # Add batch dimension: [C, H, W] → [1, C, H, W]
        return tensor.unsqueeze(0).to(self._device), img

    def _interpret_findings(
        self,
        rfmid_logits: torch.Tensor,
        odir_logits: torch.Tensor
    ) -> Tuple[list[str], list[str], Dict[str, str]]:
        """
        Maps RFMiD and ODIR logits to clinical findings using sigmoid activations.
        Sigmoid matches multi-label binary cross-entropy loss from training.

        Threshold Note:
        0.5 is used strictly as the standard documented default decision boundary
        (corresponding to logit >= 0) because the V4 checkpoint does not contain
        optimized per-class thresholds. 0.5 is NOT a training-validated threshold.

        ODIR "Normal" Note:
        ODIR index 0 ("Normal") is a special non-pathology status label, NOT an
        additional disease finding. Positive disease findings come exclusively from
        the 7 disease classes: Diabetes, Glaucoma, Cataract, AMD, Hypertension, Myopia, Other.
        """
        rfmid_preds = torch.sigmoid(rfmid_logits).squeeze(0)  # [3]
        odir_preds = torch.sigmoid(odir_logits).squeeze(0)    # [8] (multilabel sigmoid)

        # Documented default decision threshold (not training-validated)
        threshold = 0.5

        # --- RFMiD findings (3 selected classes: ARMD/AMD, BRVO, ODC) ---
        rfmid_findings: list[str] = []
        if rfmid_preds[0].item() >= threshold:
            rfmid_findings.append("AMD / ARMD")
        if rfmid_preds[1].item() >= threshold:
            rfmid_findings.append("BRVO")
        if rfmid_preds[2].item() >= threshold:
            rfmid_findings.append("ODC")

        # --- ODIR findings (indices 1 to 7: Diabetes, Glaucoma, Cataract, AMD, Hypertension, Myopia, Other) ---
        # Note: Index 0 ('Normal') is excluded from disease findings list.
        odir_findings: list[str] = []
        for idx in range(1, len(ODIR_LABELS)):
            if odir_preds[idx].item() >= threshold:
                label = ODIR_LABELS[idx]
                # Merge AMD and AMD / ARMD
                if label == "AMD":
                    odir_findings.append("AMD / ARMD")
                else:
                    odir_findings.append(label)

        # --- Backward-compatible findings map ---
        amd_combined = ("AMD / ARMD" in rfmid_findings) or ("AMD / ARMD" in odir_findings)
        findings = {
            "amd_armd": STATUS_POSSIBLE if amd_combined else STATUS_CLEAR,
            "brvo": STATUS_POSSIBLE if "BRVO" in rfmid_findings else STATUS_CLEAR,
            "odc": STATUS_POSSIBLE if "ODC" in rfmid_findings else STATUS_CLEAR,
            "glaucoma": STATUS_POSSIBLE if "Glaucoma" in odir_findings else STATUS_CLEAR,
            "cataract": STATUS_POSSIBLE if "Cataract" in odir_findings else STATUS_CLEAR,
            "myopia": STATUS_POSSIBLE if "Myopia" in odir_findings else STATUS_CLEAR,
            "other": STATUS_POSSIBLE if "Other" in odir_findings else STATUS_CLEAR,
            "diabetes": STATUS_POSSIBLE if "Diabetes" in odir_findings else STATUS_CLEAR,
            "hypertension": STATUS_POSSIBLE if "Hypertension" in odir_findings else STATUS_CLEAR,
            "normal": STATUS_POSSIBLE if "Normal" in odir_findings else STATUS_CLEAR,
        }

        return rfmid_findings, odir_findings, findings

    def _hook_activations(self, module, input, output):
        self._activations = output

    def _hook_gradients(self, module, grad_input, grad_output):
        self._gradients = grad_output[0]

    def _generate_gradcam(self, input_tensor: torch.Tensor, target_class: int, original_img: Image.Image, screening_id: str) -> Optional[str]:
        """
        Generates real Grad-CAM heatmap for the DR target class.
        Saves the heatmap overlay image and returns its URL.
        """
        try:
            # 1. model.eval() is already set, but we need gradients
            # Target the final convolutional layer of EfficientNet-B0
            target_layer = self._model.features[-1]
            
            # Register hooks
            forward_handle = target_layer.register_forward_hook(self._hook_activations)
            backward_handle = target_layer.register_full_backward_hook(self._hook_gradients)

            # Ensure input requires gradient for the backward pass to reach the features
            input_tensor.requires_grad_(True)
            
            # Forward pass
            self._model.zero_grad()
            dr_logits, _, _ = self._model(input_tensor)
            
            # Select predicted DR logit
            target = dr_logits[0, target_class]
            
            # Backward pass
            target.backward()

            # Generate CAM
            if self._gradients is None or self._activations is None:
                raise ValueError("Hooks failed to capture gradients/activations")

            # Global average pooling on the gradients
            pooled_gradients = torch.mean(self._gradients, dim=[0, 2, 3])
            
            # Weight the channels by corresponding gradients
            activations = self._activations[0].detach() # shape: [C, H, W]
            for i in range(activations.size(0)):
                activations[i, :, :] *= pooled_gradients[i]
                
            # Average the channels of the activations to create a heatmap
            heatmap = torch.mean(activations, dim=0).cpu().numpy()
            
            # ReLU on the heatmap
            heatmap = np.maximum(heatmap, 0)
            
            # Normalize the heatmap to [0, 1]
            max_val = np.max(heatmap)
            if max_val > 1e-8:
                heatmap = heatmap / max_val
            else:
                heatmap = np.zeros_like(heatmap)

            # Overlay CAM on original image
            original_np = np.array(original_img)
            # Resize heatmap to match original image size
            heatmap_resized = cv2.resize(heatmap, (original_np.shape[1], original_np.shape[0]))
            
            # Convert heatmap to RGB format using Jet colormap
            heatmap_rgb = np.uint8(255 * heatmap_resized)
            heatmap_colored = cv2.applyColorMap(heatmap_rgb, cv2.COLORMAP_JET)
            # Convert BGR to RGB
            heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
            
            # Superimpose the heatmap on original image
            superimposed_img = heatmap_colored * 0.4 + original_np * 0.6
            superimposed_img = np.clip(superimposed_img, 0, 255).astype(np.uint8)

            # Save resulting image
            gradcam_filename = f"gradcam_{screening_id}.jpg"
            gradcam_filepath = os.path.join(settings.GRADCAM_DIR, gradcam_filename)
            
            result_img = Image.fromarray(superimposed_img)
            result_img.save(gradcam_filepath, quality=90)

            # Clear hooks
            forward_handle.remove()
            backward_handle.remove()
            self._activations = None
            self._gradients = None

            return f"/gradcam/{gradcam_filename}"

        except Exception as e:
            logger.error(f"Grad-CAM generation failed: {e}", exc_info=True)
            # Ensure hooks are removed in case of error
            try:
                forward_handle.remove()
                backward_handle.remove()
            except:
                pass
            return None


    async def predict(self, image_path: str, patient_id: str = "") -> Dict[str, Any]:
        """
        Runs full inference on a fundus image and returns clinical results and real Grad-CAM.
        """
        if not self._is_loaded or self._model is None:
            return {
                "success": False,
                "error": "Model is not loaded. Cannot run inference.",
                "patient_id": patient_id,
            }

        try:
            # Preprocess image
            input_tensor, original_img = self._preprocess_image(image_path)
            
            # Generate a unique screening ID for this prediction to save Grad-CAM
            screening_id = f"SCR-{uuid.uuid4().hex[:8].upper()}"

            # --- NORMAL INFERENCE ---
            with torch.no_grad():
                dr_logits, rfmid_logits, odir_logits = self._model(input_tensor)

            # DR classification (mutually-exclusive argmax)
            dr_stage = torch.argmax(dr_logits, dim=1).item()
            dr_label = DR_LABELS.get(dr_stage, "Unknown")
            dr_probs = torch.softmax(dr_logits, dim=1).squeeze(0).tolist()
            dr_logits_list = dr_logits.squeeze(0).tolist()

            # Secondary findings (multilabel sigmoid with 0.5 threshold)
            rfmid_findings, odir_findings, findings = self._interpret_findings(rfmid_logits, odir_logits)

            # --- INTERNAL DIAGNOSTIC LOG (DEVELOPMENT-ONLY) ---
            rfmid_preds = torch.sigmoid(rfmid_logits).squeeze(0)
            odir_preds = torch.sigmoid(odir_logits).squeeze(0)
            diagnostic_msg = (
                f"\n=======================================================\n"
                f"--- [DIABETIC RETINOPATHY DIAGNOSTIC LOG] ---\n"
                f"Image: {os.path.basename(image_path)}\n"
                f"DR logits: {[round(x, 4) for x in dr_logits_list]}\n"
                f"DR probabilities:\n"
                f"  0 No DR: {dr_probs[0]:.4f}\n"
                f"  1 Mild DR: {dr_probs[1]:.4f}\n"
                f"  2 Moderate DR: {dr_probs[2]:.4f}\n"
                f"  3 Severe DR: {dr_probs[3]:.4f}\n"
                f"  4 Proliferative DR: {dr_probs[4]:.4f}\n"
                f"Selected DR class: {dr_stage}\n"
                f"Selected DR label: {dr_label}\n"
                f"\nRFMiD probabilities:\n"
                f"  ARMD/AMD = {rfmid_preds[0].item():.4f}\n"
                f"  BRVO = {rfmid_preds[1].item():.4f}\n"
                f"  ODC = {rfmid_preds[2].item():.4f}\n\n"
                f"ODIR probabilities:\n"
                f"  Normal = {odir_preds[0].item():.4f}\n"
                f"  Diabetes = {odir_preds[1].item():.4f}\n"
                f"  Glaucoma = {odir_preds[2].item():.4f}\n"
                f"  Cataract = {odir_preds[3].item():.4f}\n"
                f"  AMD = {odir_preds[4].item():.4f}\n"
                f"  Hypertension = {odir_preds[5].item():.4f}\n"
                f"  Myopia = {odir_preds[6].item():.4f}\n"
                f"  Other = {odir_preds[7].item():.4f}\n\n"
                f"Selected RFMiD findings: {rfmid_findings}\n"
                f"Selected ODIR findings: {odir_findings}\n"
                f"======================================================="
            )
            logger.info(diagnostic_msg)
            print(diagnostic_msg, flush=True)

            # Build image URL from saved path
            filename = os.path.basename(image_path)
            image_url = f"/uploads/{filename}"

            # --- GRAD-CAM GENERATION ---
            # Run a separate forward/backward pass specifically for Grad-CAM on predicted DR class
            gradcam_url = self._generate_gradcam(
                input_tensor=input_tensor.clone().detach(), 
                target_class=dr_stage, 
                original_img=original_img, 
                screening_id=screening_id
            )

            # Grad-CAM is supplementary — its failure must NOT prevent
            # returning a successful prediction result to the user.
            if gradcam_url is None:
                logger.warning("Grad-CAM generation failed; prediction result is still valid.")

            return {
                "success": True,
                "screening_id": screening_id,
                "patient_id": patient_id,
                "drStage": dr_stage,
                "drLabel": dr_label,
                "dr_stage": dr_stage,
                "dr_label": dr_label,
                "dr": {
                    "stage": dr_stage,
                    "label": dr_label,
                    "result": dr_label,
                },
                "rfmid_findings": rfmid_findings,
                "odir_findings": odir_findings,
                "findings": findings,
                "image_url": image_url,
                "gradcam_url": gradcam_url,
            }

        except Exception as e:
            logger.error(f"Inference failed: {e}", exc_info=True)
            return {
                "success": False,
                "error": f"Inference error: {str(e)}",
            }

    def diagnose_image(self, image_path: str) -> Dict[str, Any]:
        """
        Runs inference and returns raw DR logits, softmax probabilities,
        selected class, and clinical label for auditing and debugging.
        """
        if not self._is_loaded or self._model is None:
            return {
                "success": False,
                "error": "Model is not loaded."
            }

        input_tensor, _ = self._preprocess_image(image_path)

        with torch.no_grad():
            dr_logits, rfmid_logits, odir_logits = self._model(input_tensor)

        dr_probs = torch.softmax(dr_logits, dim=1).squeeze(0).tolist()
        dr_logits_list = dr_logits.squeeze(0).tolist()
        dr_stage = int(torch.argmax(dr_logits, dim=1).item())
        dr_label = DR_LABELS.get(dr_stage, "Unknown")

        return {
            "success": True,
            "image": os.path.basename(image_path),
            "dr_logits": [round(x, 4) for x in dr_logits_list],
            "dr_probabilities": {
                f"{c} {DR_LABELS[c]}": round(dr_probs[c], 4) for c in range(5)
            },
            "selected_dr_class": dr_stage,
            "selected_dr_label": dr_label,
            "model_path": settings.MODEL_PATH,
            "device": self._device,
            "model_eval": not self._model.training,
        }


# Module-level singleton
prediction_service = PredictionService()

