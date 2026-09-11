import io
from fastapi.testclient import TestClient
from PIL import Image

from main import app

client = TestClient(app)

def test_system_endpoints():
    print("\n--- 1. Testing System Endpoints ---")
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.json() == {"message": "Retina AI API is running"}
    print("PASS: GET / ->", res.json())

    res = client.get("/health")
    assert res.status_code == 200
    health = res.json()
    assert health.get("status") == "ok"
    assert health.get("database") == "connected"
    assert health.get("model") == "loaded"
    print("PASS: GET /health ->", health)

    res = client.get("/docs")
    assert res.status_code == 200
    print("PASS: GET /docs -> Status 200 (Swagger UI available)")


def test_patient_endpoints():
    print("\n--- 2. Testing Patient Endpoints ---")
    # GET /api/patients
    res = client.get("/api/patients")
    assert res.status_code == 200
    patients = res.json()
    assert len(patients) >= 1
    print(f"PASS: GET /api/patients -> Found {len(patients)} patients")

    # POST /api/patients with explicit patient_id
    test_pid = "PAT-2026-TEST-99"
    new_patient = {
        "patientId": test_pid,
        "fullName": "Aarav Sharma",
        "dob": "1980-05-20",
        "gender": "Male",
        "phone": "+91 99887 76655",
        "email": "aarav.sharma@example.com",
        "address": "Connaught Place, New Delhi",
        "diabetesStatus": "Yes",
        "diabetesDuration": "3 years",
        "hypertension": "No",
        "notes": "Annual screening routine"
    }
    # Clean up if already exists from prior test run
    client.delete(f"/api/patients/{test_pid}")

    res = client.post("/api/patients", json=new_patient)
    assert res.status_code == 201, f"Create patient failed: {res.text}"
    created = res.json()
    assert created.get("patient_id") == test_pid or created.get("patientId") == test_pid
    # Verify no raw MongoDB _id exposed
    assert "_id" not in created
    print(f"PASS: POST /api/patients -> Created {test_pid} (No raw _id exposed)")

    # Test HTTP 409 Conflict on duplicate patient_id
    dup_res = client.post("/api/patients", json=new_patient)
    assert dup_res.status_code == 409, f"Expected 409 Conflict, got {dup_res.status_code}: {dup_res.text}"
    dup_body = dup_res.json()
    assert "already exists" in (dup_body.get("detail") or dup_body.get("error", {}).get("message", ""))
    print(f"PASS: POST /api/patients -> Duplicate patient_id correctly returned 409 Conflict: {dup_body.get('detail')}")

    # GET /api/patients/{patient_id}
    res = client.get(f"/api/patients/{test_pid}")
    assert res.status_code == 200
    assert "_id" not in res.json()
    print(f"PASS: GET /api/patients/{test_pid} -> Retrievable")

    # PUT /api/patients/{patient_id}
    res = client.put(f"/api/patients/{test_pid}", json={"notes": "Updated clinical notes after checkup"})
    assert res.status_code == 200
    assert res.json().get("notes") == "Updated clinical notes after checkup"
    print(f"PASS: PUT /api/patients/{test_pid} -> Updated successfully")

    # DELETE /api/patients/{patient_id}
    res = client.delete(f"/api/patients/{test_pid}")
    assert res.status_code == 200
    print(f"PASS: DELETE /api/patients/{test_pid} -> Deleted successfully")


def test_screening_endpoints():
    print("\n--- 3. Testing Screening Endpoints ---")
    # First test: patient DOES NOT exist -> Must return 404
    invalid_screening = {
        "patientId": "NON-EXISTENT-PATIENT-9999",
        "imageUrl": "/uploads/test.jpg"
    }
    res_404 = client.post("/api/screenings", json=invalid_screening)
    assert res_404.status_code == 404, f"Expected 404 for unlinked patient, got {res_404.status_code}: {res_404.text}"
    print(f"PASS: POST /api/screenings with non-existent patient correctly returned 404: {res_404.json().get('detail')}")

    # Valid screening for seed patient
    screening_payload = {
        "patientId": "PAT-2026-001",
        "imageUrl": "/uploads/sample_fundus.jpg",
        "screeningDate": "2026-09-09"
    }
    res = client.post("/api/screenings", json=screening_payload)
    assert res.status_code == 201, f"Create screening failed: {res.text}"
    screening = res.json()
    screening_id = screening.get("screening_id") or screening.get("screeningId")
    assert screening_id is not None
    assert "_id" not in screening
    # Verify AI prediction fields are null until model is connected
    assert screening.get("dr_stage") is None
    assert screening.get("dr_result") is None
    print(f"PASS: POST /api/screenings -> Created {screening_id} linked to PAT-2026-001")

    # GET /api/screenings
    res = client.get("/api/screenings")
    assert res.status_code == 200
    print(f"PASS: GET /api/screenings -> {len(res.json())} screenings listed")

    # GET /api/screenings/{id}
    res = client.get(f"/api/screenings/{screening_id}")
    assert res.status_code == 200
    print(f"PASS: GET /api/screenings/{screening_id} -> Retrievable")


def test_prediction_endpoint():
    print("\n--- 4. Testing Real V4 Prediction Endpoint (/api/predict) ---")
    img = Image.new("RGB", (224, 224), color=(180, 50, 40))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    image_bytes = buffer.getvalue()

    files = {"image": ("test_fundus.jpg", image_bytes, "image/jpeg")}
    data = {"patient_id": "PAT-2026-001"}
    res = client.post("/api/predict", data=data, files=files)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    body = res.json()
    assert body.get("success") is True
    assert "dr" in body and "stage" in body["dr"]
    assert "rfmidFindings" in body or "rfmid_findings" in body
    assert "odirFindings" in body or "odir_findings" in body
    assert body.get("patient_id") == "PAT-2026-001"
    assert "/uploads/" in body.get("image_url")
    assert body.get("gradcam_status") == "processing"
    screening_id = body.get("screening_id")
    assert screening_id is not None
    print(f"PASS: POST /api/predict (FAST) -> Real DR Stage: {body['dr']['stage']} ({body['dr']['label']}), gradcam_status={body.get('gradcam_status')}")

    # Test the decoupled on-demand Grad-CAM endpoint
    gradcam_res = client.post(f"/api/screenings/{screening_id}/gradcam")
    assert gradcam_res.status_code == 200, f"Grad-CAM endpoint failed: {gradcam_res.text}"
    g_body = gradcam_res.json()
    assert g_body.get("success") is True
    assert g_body.get("gradcam_status") == "completed"
    assert "/gradcam/" in g_body.get("gradcam_url")
    print(f"PASS: POST /api/screenings/{screening_id}/gradcam -> Status: {g_body.get('gradcam_status')}, URL: {g_body.get('gradcam_url')}")


def test_report_endpoints():
    print("\n--- 5. Testing Report Endpoints ---")
    report_payload = {
        "screeningId": "SCR-2026-101",
        "patientId": "PAT-2026-001",
        "notes": "Patient advised for routine review.",
        "status": "Draft"
    }
    res = client.post("/api/reports/SCR-2026-101", json=report_payload)
    assert res.status_code == 201
    created = res.json()
    report_id = created.get("report_id") or created.get("reportId")
    assert "_id" not in created
    print(f"PASS: POST /api/reports/SCR-2026-101 -> Created {report_id}")

    res = client.get("/api/reports")
    assert res.status_code == 200
    print(f"PASS: GET /api/reports -> {len(res.json())} reports listed")

    res = client.get(f"/api/reports/{report_id}")
    assert res.status_code == 200
    print(f"PASS: GET /api/reports/{report_id} -> Retrievable")


if __name__ == "__main__":
    with client:
        test_system_endpoints()
        test_patient_endpoints()
        test_screening_endpoints()
        test_prediction_endpoint()
        test_report_endpoints()
    print("\n==================================================")
    print("ALL MONGODB INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")
