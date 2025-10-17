![aquasensecover](readme_photos/AquaBanner.png)

---
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
## 🧠 Task 1: Species Classification

For the **species classification** task, several model architectures and training strategies were explored.

- Initially, a **custom CNN**(found in archive) was implemented and trained from scratch. However, the model converged very slowly, and each epoch required significant computation time.  
- Next, a **Vision Transformer (ViT)**(found in archive) was developed and trained manually. Although the ViT showed promising early results, it began to overfit after multiple epochs, suggesting it was memorizing the training data.  
- To address these issues, a **transfer learning** approach was adopted using a **pretrained ResNet-50** model as the backbone. A dense linear layer was appended to produce the desired output dimension.  

Training Strategy:
- The pretrained layers were **frozen for the first 5 epochs**, allowing the classifier head to stabilize.  
- The **entire model** was then fine-tuned for several additional epochs.  

**Result:**  
Final accuracy: **~86%**  
This approach significantly improved convergence speed and overall classification performance.

---

## Task 2: Object Detection

For the **object detection** task, the **YOLOv8n** model from the Ultralytics YOLOv8 framework was used to detect and localize benthic organisms in underwater imagery.

- The model performed well during initial training.  
- To further enhance detection accuracy, **data augmentation** techniques were introduced and the **input image size** was increased to improve feature resolution.  

**Result:**  
- **Precision:** 84%  
- **Recall:** 85%  
- **mAP@0.50:** 89%  
- **mAP@[0.50:0.95]:** 62%

These results demonstrate that the model effectively identifies and localizes multiple benthic organism classes with strong detection reliability and spatial accuracy.

---

### Notes
- Task 1 used **PyTorch** for model training and fine-tuning.  
- Task 2 was implemented using **Ultralytics YOLOv8**.  
- Both tasks were trained on local hardware.

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
