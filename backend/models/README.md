# Retina AI Model Directory

This directory is designated for the trained PyTorch model:

`retina_project_v4_best.pth`

### Model Specifications
- **Architecture**: EfficientNet-B0 (Multitask Head)
- **Primary Task**: Diabetic Retinopathy Classification (Stages 0 - 4)
- **Secondary Tasks**: Multi-label screening (AMD/ARMD, BRVO, ODC, Glaucoma, Cataract, Myopia, Other)
- **Explainability**: Integrated Grad-CAM attention heatmap generation

### Instructions
1. Place the trained weights file `retina_project_v4_best.pth` directly in this folder (`backend/models/retina_project_v4_best.pth`).
2. The `PredictionService` (`backend/services/prediction_service.py`) will automatically load these weights once the model integration step is activated.
