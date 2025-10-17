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

### The Challenge

Marine biologists and environmental researchers spend countless hours manually analyzing underwater imagery to identify and catalog benthic species, the organisms living on or near the ocean floor. Our full-stack application reduces bottlenecks and increases marine research efficiency. 

### Our Solution

**AquaSense AI** is a comprehensive web application that harnesses the power of artificial intelligence and a comprehensive machine learning pipeline to revolutionize benthic species analysis. Built for researchers, marine biologists, environmental organizations, and students, AquaSense automates what once took hours into a process that takes mere seconds.

### Key Features

**Dual-Mode Analysis**
- **Single Species Classification**: Upload an image and instantly identify one of 7 benthic species with over 86% accuracy
- **Multi-Species Detection**: Detect and localize multiple organisms in a single image with 89.1% mAP, complete with bounding boxes and confidence scores

**Project Management Dashboard**
- Organize your marine surveys into collaborative projects
- Track analysis history and metrics over time
- Share findings with team members in real-time

**Advanced Analytics**
- View comprehensive statistics on species distribution
- Export data for further research and reporting
- Visualize trends across multiple surveys

**Secure & Collaborative**
- Firebase authentication with email verification
- Role-based access control for team collaboration
- Cloud storage for seamless data persistence

### Technology Stack

**Frontend**: React + TypeScript + Material-UI + Vite  
**Backend**: FastAPI (Python 3.13) deployed on Render  
**ML Models**: PyTorch (ResNet50) + Ultralytics YOLOv8  
**Database**: Firebase Firestore  
**Authentication**: Firebase Auth  
**Hosting**: Vercel (frontend) + Render (API)

### Real-World Impact

AquaSense accelerates marine research by:
- Reducing analysis time from hours to seconds
- Enabling larger-scale ecological surveys
- Standardizing species identification across research teams
- Making advanced AI tools accessible to researchers worldwide

Whether you're conducting benthic surveys, monitoring ecosystem health, or studying marine biodiversity, AquaSense provides the tools you need to analyze underwater imagery with unprecedented speed and accuracy.

---

## 🚀 Methods
### Machine Learning & Model Development
## Task 1: Species Classification

For the **species classification** task, several model architectures and training strategies were explored.

- Initially, a **custom CNN**(found in archive) was implemented and trained from scratch. However, the model converged very slowly, and each epoch required significant computation time.  
- Next, a **Vision Transformer (ViT)**(found in archive) was developed and trained manually. Although the ViT showed promising early results, it began to overfit after multiple epochs, suggesting it was memorizing the training data.  
- To address these issues, a **transfer learning** approach was adopted using a **pretrained ResNet-50** model as the backbone. A dense linear layer was appended to produce the desired output dimension.  

Training Strategy:
- The pretrained layers were **frozen for the first 5 epochs**, allowing the classifier head to stabilize.  
- The **entire model** was then fine-tuned for several additional epochs.  

**Result:**
<p align="center">
  <img src="readme_photos/output.png" alt="Confusion Matrix" width="45%">
</p>

Final accuracy: **86.9%**  
This approach significantly improved convergence speed and overall classification performance.

---

## Task 2: Object Detection

For the **object detection** task, the **YOLOv8n** model from the Ultralytics YOLOv8 framework was used to detect and localize benthic organisms in underwater imagery.

- The model performed well during initial training.  
- To further enhance detection accuracy, **data augmentation** techniques were introduced and the **input image size** was increased to improve feature resolution.  

**Result:**  
<p align="center">
  <img src="readme_photos/BoxPR_curve.png" alt="PR Curve" width="45%">
</p>

- **Precision:** 83.8%  
- **Recall:** 84.9%  
- **mAP@0.50:** 89.1%  
- **mAP@[0.50:0.95]:** 61.9%

These results demonstrate that the model effectively identifies and localizes multiple benthic organism classes with strong detection reliability and spatial accuracy.

---

### Notes
- Task 1 used **PyTorch** for model training and fine-tuning.  
- Task 2 was implemented using **Ultralytics YOLOv8**.  
- Both tasks were trained on local hardware.

---

### Frontend Interface & Backend Infrastructure
[The API methods text I provided]
[UI design, integration, user experience]

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
<p align="center">
  <a href="GEORGE_LINKEDIN_URL" target="_blank">
    <img src="https://img.shields.io/badge/George's_LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="George's LinkedIn">
  </a>
  <a href="RICKY_LINKEDIN_URL" target="_blank">
    <img src="https://img.shields.io/badge/Ricky's_LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="Ricky's LinkedIn">
  </a>
  <a href="JACK_LINKEDIN_URL" target="_blank">
    <img src="https://img.shields.io/badge/Jack's_LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="Jack's LinkedIn">
  </a>
</p>
</div>

---

## 🛠️ Built With

<div align="center">

### Languages & Frameworks
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

### Backend & API
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)

### Frontend Tools
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Material-UI](https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=material-ui&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

### Cloud & Database
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

### Development Tools
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white)
