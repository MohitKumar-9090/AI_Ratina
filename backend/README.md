# Retina AI — Backend API Foundation

Production-ready FastAPI backend foundation for **Retina AI**, architected for ophthalmology clinical workflows, Diabetic Retinopathy screening, and future integration with the trained PyTorch EfficientNet-B0 multi-task model (`retina_project_v4_best.pth`) and MongoDB Atlas.

---

## 1. Directory Structure

```
backend/
│
├── main.py                     # Application entrypoint & route registration
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── README.md                   # Backend documentation
│
├── api/                        # HTTP API route controllers
│   ├── __init__.py
│   ├── patients.py             # CRUD: /api/patients
│   ├── screenings.py           # /api/screenings
│   ├── predictions.py          # /api/predict (intake & Pillow validation)
│   └── reports.py              # /api/reports
│
├── schemas/                    # Pydantic data contracts
│   ├── __init__.py
│   ├── patient.py              # Patient schemas & DOB-to-age calculation
│   ├── screening.py            # Screening schemas (nullable prediction fields)
│   ├── prediction.py           # Multi-task DR & findings schema contracts
│   └── report.py               # Clinical PDF report schema
│
├── services/                   # Modular service & repository layer
│   ├── __init__.py
│   ├── patient_service.py      # Patient data interface & seed repository
│   ├── screening_service.py    # Screening session management
│   ├── prediction_service.py   # Placeholder for retina_project_v4_best.pth
│   ├── gradcam_service.py      # Placeholder for EfficientNet-B0 Grad-CAM
│   └── report_service.py       # Clinical report & PDF generator hook
│
├── models/                     # Model weight directory
│   ├── __init__.py
│   └── README.md               # Model checkpoint instructions
│
├── core/                       # Core configuration & error handling
│   ├── __init__.py
│   ├── config.py               # Pydantic-settings configuration
│   └── exceptions.py           # Unified JSON error handlers (400, 404, 413, 422, 500)
│
├── utils/                      # Utilities
│   ├── __init__.py
│   ├── image_utils.py          # Pillow RGB validation, extensions & size checks
│   └── response_utils.py       # Consistent API response envelopes
│
├── uploads/                    # Temporary fundus image uploads (mounted at /uploads)
│   └── .gitkeep
├── gradcam/                    # Generated Grad-CAM heatmaps (mounted at /gradcam)
│   └── .gitkeep
└── reports/                    # Generated PDF reports (mounted at /reports)
    └── .gitkeep
```

---

## 2. Setup & Installation

### Step 1: Create and activate virtual environment (optional but recommended)
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate

# macOS / Linux:
source venv/bin/activate
```

### Step 2: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

---

## 3. Starting the Server

Run using Uvicorn with auto-reload:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Or directly with Python:
```bash
python main.py
```

The API will be available at:
- **Root**: `http://127.0.0.1:8000/`
- **Health Check**: `http://127.0.0.1:8000/health`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 4. API Endpoints

### System Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root endpoint confirming API is running |
| `GET` | `/health` | Health-check status response |

### Patient Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/patients` | List all registered patients |
| `POST` | `/api/patients` | Register a new patient (auto-computes age from `date_of_birth`) |
| `GET` | `/api/patients/{patient_id}` | Retrieve patient details by ID |
| `PUT` | `/api/patients/{patient_id}` | Update patient demographics / history |
| `DELETE` | `/api/patients/{patient_id}` | Remove patient record |

### Screening Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/screenings` | List all screenings (optional `?patient_id=...` filter) |
| `POST` | `/api/screenings` | Create screening session record |
| `GET` | `/api/screenings/{screening_id}` | Retrieve screening session details |

### Prediction Endpoint (Foundation Stage)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/predict` | Validates image (Pillow RGB, format, size) and confirms intake without fake predictions |

### Report Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/reports` | List all clinical reports |
| `POST` | `/api/reports/{screening_id}` | Create or update report for a screening session |
| `GET` | `/api/reports/{report_id}` | Retrieve single report |

---

## 5. Next Step: Model & MongoDB Atlas Integration

In the subsequent integration phase:
1. Place `retina_project_v4_best.pth` inside `backend/models/`.
2. Connect `PredictionService` (`services/prediction_service.py`) and `GradCAMService` (`services/gradcam_service.py`).
3. Set `MONGODB_URI` in `.env` and activate database persistence in `services/patient_service.py`, `services/screening_service.py`, and `services/report_service.py`.
