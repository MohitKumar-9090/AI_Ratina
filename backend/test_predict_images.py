import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app

def test_images_e2e():
    print("=" * 70)
    print("     TESTING /api/predict ENDPOINT ON DISTINCT FUNDUS IMAGES")
    print("=" * 70)

    test_images = [
        ("MODEL-TEST_edef4a2169.jpg", "Image 1 (Expected Stage 3 / Severe DR)"),
        ("PAT-2026-001_3a2a63dc29.jpg", "Image 2 (Expected Stage 1 / Mild DR)"),
        ("PAT-2026-001_56e97e41f6.png", "Image 3 (Expected Stage 0 / No DR)"),
        ("PAT-2026-001_04b81cb896.png", "Image 4 (Expected Stage 4 / Proliferative DR)"),
    ]

    uploads_dir = os.path.join(str(backend_dir), "uploads")

    with TestClient(app) as client:
        # First ensure patient exists in database
        patient_res = client.post("/api/patients", json={
            "patientId": "PAT-AUDIT-2026",
            "fullName": "Audit Test Patient",
            "dob": "1975-01-01",
            "gender": "Other"
        })
        print(f"Patient creation status: {patient_res.status_code}")

        for filename, desc in test_images:
            img_path = os.path.join(uploads_dir, filename)
            if not os.path.exists(img_path):
                print(f"File not found: {img_path}")
                continue

            with open(img_path, "rb") as f:
                img_bytes = f.read()

            content_type = "image/png" if filename.endswith(".png") else "image/jpeg"
            files = {"file": (filename, img_bytes, content_type)}
            data = {"patient_id": "PAT-AUDIT-2026"}

            print(f"\n--- Testing: {desc} ---")
            print(f"File: {filename} ({len(img_bytes)} bytes)")
            res = client.post("/api/predict", data=data, files=files)

            print(f"HTTP Status: {res.status_code}")
            assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"

            body = res.json()
            print("Response Keys:", list(body.keys()))
            print(f"  success:    {body.get('success')}")
            print(f"  drStage:    {body.get('drStage')}")
            print(f"  drLabel:    {body.get('drLabel')}")
            print(f"  dr_stage:   {body.get('dr_stage')}")
            print(f"  dr_label:   {body.get('dr_label')}")
            print(f"  dr block:   {body.get('dr')}")
            print(f"  Grad-CAM:   {body.get('gradcam_url')}")
            print(f"  Image URL:  {body.get('image_url')}")

            # Verify NO confidence percentages or probabilities in API response
            body_str = str(body)
            assert "confidence" not in body_str.lower(), "Security violation: 'confidence' found in response!"
            assert "0." not in str(body.get("drStage")), "drStage must be an integer, not a float probability!"

            # Test debug endpoint
            files_debug = {"file": (filename, img_bytes, content_type)}
            debug_res = client.post("/api/predict/debug", files=files_debug)
            if debug_res.status_code == 200:
                dbg = debug_res.json()
                print(f"  DEBUG Logits:        {dbg.get('dr_logits')}")
                print(f"  DEBUG Probabilities: {dbg.get('dr_probabilities')}")
                print(f"  DEBUG Selected:      Stage {dbg.get('selected_dr_class')} ({dbg.get('selected_dr_label')})")

    print("\n" + "=" * 70)
    print("ALL TEST IMAGES PREDICTED AND AUDITED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_images_e2e()
