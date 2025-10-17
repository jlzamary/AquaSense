# 🌐 AquaSense AI

Welcome to the Team Pharos GitHub repository for the 2025 AI Club Case-a-Thon.

AquaSense leverages deep learning to automate the identification and detection of benthic marine species from underwater imagery, transforming hours of manual analysis into seconds of automated processing.

For more information about our project, methods, and team members, please refer to the information below.

---

## 📖 Table of Contents 

- [About](#-about)
- [Methods](#-methods)
- [Application Demo](#-application-demo)
- [Meet the Team](#-meet-the-team)
---
## 🔬 About
<div>
  <p>This is the about section</p>
</div>

---

## 🚀 Methods
### Machine Learning & Model Development
[Dataset, training process, model architecture]

---

### Backend Infrastructure
[The API methods text I provided]

---

### API Development

The AquaSense API was built using **FastAPI** (Python 3.13), a modern web framework chosen for its performance and automatic documentation generation. The API is deployed on Render.com with CORS enabled for cross-origin access.

#### Architecture

**Single Species Classification (`/predict`)**
- ResNet50 CNN (46MB) trained on 10,500+ labeled images
- Preprocessing pipeline: resize (256px) → center crop (224px) → normalization
- Returns species name with <3 second inference time

**Multi-Species Detection (`/detect`)**
- YOLOv8 object detection model (17MB) via Ultralytics
- Real-time detection with bounding box localization
- Returns annotated images with boxes, labels, and confidence scores
- Custom mapping layer translates model outputs to 7 species classes

#### Implementation Details

**Request Handling:**
- Images uploaded via multipart/form-data
- Validation: file type (JPEG/PNG), size (<10MB), integrity checks
- Error handling with descriptive HTTP status codes

**Response Processing:**
- PyTorch model inference with CPU optimization
- Base64 encoding for annotated detection images
- JSON responses with species names, confidence scores, and bounding boxes

**Monitoring & Documentation:**
- Comprehensive logging for debugging and performance tracking
- Interactive Swagger UI at `/docs` endpoint
- Health check endpoint for deployment verification

The API enables rapid analysis of benthic survey imagery, processing individual requests in under 3 seconds and supporting real-world marine research workflows.

---

### Frontend Interface
[UI design, integration, user experience]

---

## 💻 Application Demo
<div>
  <p>This is the application demo section</p>
</div>

---

## 🙋 Meet the Team
<div align="center">
<table>
  <tr>
    <td align="center">
      <img src="readme_photos/george_headshot.jpg" width="150px"><br>
      <sub><b>George Beck</b></sub><br>
      <sub>Finance, William & Mary</sub>
    </td>
    <td align="center">
      <img src="readme_photos/ricky_headshot.jpg" width="150px"><br>
      <sub><b>Ricky Speidell</b></sub><br>
      <sub>Physics, William & Mary</sub>
    </td>
    <td align="center">
      <img src="readme_photos/jack_headshot.jpg" width="150px"><br>
      <sub><b>Jack Zamary</b></sub><br>
      <sub>Data Science, William & Mary</sub>
    </td>
  </tr>
</table>
</div>

---
