"""
Standalone Diagnostic Tool for Retina AI Diabetic Retinopathy V4 Model.

Usage:
    python backend/debug_predict.py [path_to_image]

Outputs:
    - Model load diagnostic (checkpoint path, keys, eval mode)
    - Image format & dimensions
    - Preprocessing confirmation
    - Raw DR logits for classes 0 to 4
    - Softmax probabilities for classes 0 to 4
    - Selected DR class (argmax)
    - Selected DR label
"""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

from services.prediction_service import RetinaAIV4, DR_LABELS, inference_transform, prediction_service
from core.config import settings


def run_diagnostic(image_path: str):
    print("=" * 65)
    print("      RETINA AI V4 MODEL — DIABETIC RETINOPATHY DIAGNOSTIC")
    print("=" * 65)

    # 1. Model Loading
    checkpoint_path = settings.MODEL_PATH
    print("\n[1] Checkpoint Verification:")
    print(f"  Model Path:         {checkpoint_path}")
    print(f"  Checkpoint Exists:  {os.path.exists(checkpoint_path)}")

    if not os.path.exists(checkpoint_path):
        print("  ERROR: Checkpoint file not found!")
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"  Inference Device:   {device}")

    model = RetinaAIV4()
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
        print(f"  Checkpoint Epoch:   {checkpoint.get('epoch')}")
        print(f"  Best Val Score:     {checkpoint.get('best_score')}")
    elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    else:
        state_dict = checkpoint

    load_result = model.load_state_dict(state_dict)
    print(f"  Missing Keys:       {load_result.missing_keys}")
    print(f"  Unexpected Keys:    {load_result.unexpected_keys}")

    model.to(device)
    model.eval()
    print(f"  Model Training:     {model.training} (eval mode active={not model.training})")
    print(f"  Parameter Count:    {sum(p.numel() for p in model.parameters()):,}")

    # 2. Image Verification & Preprocessing
    print(f"\n[2] Input Image Audit:")
    print(f"  Image Path:         {image_path}")
    if not os.path.exists(image_path):
        print(f"  ERROR: Image path does not exist: {image_path}")
        sys.exit(1)

    pil_img = Image.open(image_path)
    print(f"  Original Format:    {pil_img.format}")
    print(f"  Original Mode:      {pil_img.mode}")
    print(f"  Original Size:      {pil_img.size} (W x H)")

    rgb_img = pil_img.convert("RGB")
    tensor = inference_transform(rgb_img)
    input_tensor = tensor.unsqueeze(0).to(device)

    print(f"  Preprocessed Shape: {list(input_tensor.shape)}")
    print(f"  Normalization:      ImageNet mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]")
    print(f"  Tensor Min/Max:     {input_tensor.min().item():.3f} / {input_tensor.max().item():.3f}")

    # 3. Model Forward Pass
    print("\n[3] V4 Multitask Inference:")
    with torch.no_grad():
        dr_logits, rfmid_logits, odir_logits = model(input_tensor)

    dr_logits_list = dr_logits.squeeze(0).tolist()
    dr_probs = torch.softmax(dr_logits, dim=1).squeeze(0).tolist()
    dr_stage = torch.argmax(dr_logits, dim=1).item()
    dr_label = DR_LABELS.get(dr_stage, "Unknown")

    print("\nDR logits:")
    print(f"  {[round(x, 4) for x in dr_logits_list]}")

    print("\nDR probabilities:")
    for c in range(5):
        marker = " <== [SELECTED CLASS via argmax]" if c == dr_stage else ""
        print(f"  {c} {DR_LABELS[c]}: {dr_probs[c]:.4f}{marker}")

    print(f"\nSelected DR class: {dr_stage}")
    print(f"Selected DR label: {dr_label}")

    print("\n" + "=" * 65)
    return {
        "image": os.path.basename(image_path),
        "dr_logits": dr_logits_list,
        "dr_probs": dr_probs,
        "dr_stage": dr_stage,
        "dr_label": dr_label
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
    else:
        # Default test image from uploads
        uploads_dir = os.path.join(str(backend_dir), "uploads")
        candidates = [os.path.join(uploads_dir, f) for f in os.listdir(uploads_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if not candidates:
            print("No images found in uploads. Provide path as argument.")
            sys.exit(1)
        img_path = candidates[0]

    run_diagnostic(img_path)
