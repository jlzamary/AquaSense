# main.py
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from PIL import Image
import io
import os
import cv2
import base64
from ultralytics import YOLO
from typing import List

from utils.inference import load_model, predict_species
from config import settings

# Set up logging for error handling and status 
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app setup
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for classifying marine species (W&M Case-a-Thon '25)",
    version=settings.VERSION
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # Allow all for website integration and use 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load classification model at startup
logger.info(f"Loading classification model from {settings.MODEL_PATH}")
model = load_model(settings.MODEL_PATH)
logger.info("Classification model loaded successfully")

# Load detection model at startup
logger.info("Loading detection model from models/multi_species.pt")
detection_model = YOLO('models/multi_species.pt')
logger.info("Detection model loaded successfully")

# Class ID to species name mapping for detection model
CLASS_MAPPING = {
    0: 'Crab',
    1: 'Eel',
    2: 'Flatfish',
    3: 'Roundfish',
    4: 'Scallop',
    5: 'Skate',
    6: 'Whelk'
}


@app.post("/predict")
async def predict_single(file: UploadFile = File(...)):
    """
    Predict marine species from a single uploaded image.
    Returns only the predicted species name.
    """
    logger.info(f"Received prediction request for file: {file.filename}")
    
    try:
        # Read and validate file
        contents = await file.read()
        file_size = len(contents)
        logger.info(f"File size: {file_size} bytes")
        
        if not file.content_type.startswith("image/"):
            logger.warning(f"Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail="File must be an image.")
        
        if file_size > settings.MAX_FILE_SIZE:
            logger.warning(f"File too large: {file_size} bytes")
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Max {settings.MAX_FILE_SIZE / (1024*1024):.0f}MB."
            )
        
        # Validate image
        try:
            Image.open(io.BytesIO(contents))
        except Exception as img_error:
            logger.error(f"Invalid image: {str(img_error)}")
            raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")
        
        # Make prediction
        logger.info("Running classification...")
        prediction, _ = predict_species(model, contents, file.filename)
        logger.info(f"Prediction: {prediction}")
        
        return JSONResponse(content={"predicted_species": prediction})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.on_event("startup")
async def startup_event():
    logger.info(f"Server starting on port {os.getenv('PORT', '8000')}")
    logger.info("Application ready to accept connections")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Server shutting down")


@app.post("/detect")
async def detect_multiple(file: UploadFile = File(...)):
    """
    Detect multiple marine species in an image with bounding boxes.
    Returns detections with bounding boxes, species info, and annotated image.
    """
    logger.info(f"Received detection request for file: {file.filename}")
    
    try:
        # Read and validate file
        contents = await file.read()
        file_size = len(contents)
        logger.info(f"File size: {file_size} bytes")
        
        if not file.content_type.startswith("image/"):
            logger.warning(f"Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail="File must be an image.")
        
        if file_size > settings.MAX_FILE_SIZE:
            logger.warning(f"File too large: {file_size} bytes")
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Max {settings.MAX_FILE_SIZE / (1024*1024):.0f}MB."
            )
        
        # Open image
        try:
            image = Image.open(io.BytesIO(contents))
        except Exception as img_error:
            logger.error(f"Invalid image: {str(img_error)}")
            raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")
        
        # Run detection
        logger.info("Running detection...")
        results = detection_model(image)
        
        # Get annotated image with bounding boxes
        annotated_image = results[0].plot()
        _, buffer = cv2.imencode('.jpg', annotated_image)
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Parse detections
        detections = []
        for result in results:
            boxes = result.boxes
            for i in range(len(boxes)):
                box = boxes.xyxy[i].cpu().numpy()
                conf = float(boxes.conf[i].cpu().numpy())
                cls = int(boxes.cls[i].cpu().numpy())
                
                # Map class ID to species name
                species_name = CLASS_MAPPING.get(cls, f"Unknown_{cls}")
                
                detection = {
                    "species": species_name,
                    "confidence": conf,
                    "bbox": {
                        "x1": float(box[0]),
                        "y1": float(box[1]),
                        "x2": float(box[2]),
                        "y2": float(box[3])
                    }
                }
                detections.append(detection)
        
        logger.info(f"Detection complete: found {len(detections)} species")
        
        response = {
            "num_detections": len(detections),
            "detections": detections,
            "annotated_image": f"data:image/jpeg;base64,{annotated_base64}",
            "metadata": {"filename": file.filename},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
    
# ===== Batch Uploads Below =====
# Allows for multiple image uploads

@app.post("/predict/batch")
async def predict_batch(files: List[UploadFile] = File(...)):
    """
    Predict species for multiple images.
    Returns list of predictions for each image.
    """
    logger.info(f"Received batch prediction request for {len(files)} files")
    
    # Validate batch size
    if len(files) > settings.MAX_BATCH_SIZE:
        logger.warning(f"Too many files: {len(files)} (max: {settings.MAX_BATCH_SIZE})")
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Max {settings.MAX_BATCH_SIZE} files per request."
        )
    
    results = []
    
    for idx, file in enumerate(files):
        logger.info(f"Processing file {idx + 1}/{len(files)}: {file.filename}")
        
        try:
            # Read and validate file
            contents = await file.read()
            file_size = len(contents)
            
            if not file.content_type.startswith("image/"):
                results.append({
                    "filename": file.filename,
                    "error": "File must be an image"
                })
                continue
            
            if file_size > settings.MAX_FILE_SIZE:
                results.append({
                    "filename": file.filename,
                    "error": f"File too large. Max {settings.MAX_FILE_SIZE / (1024*1024):.0f}MB"
                })
                continue
            
            # Validate image
            try:
                Image.open(io.BytesIO(contents))
            except Exception:
                results.append({
                    "filename": file.filename,
                    "error": "Invalid or corrupted image"
                })
                continue
            
            # Make prediction
            prediction, _ = predict_species(model, contents, file.filename)
            
            results.append({
                "filename": file.filename,
                "predicted_species": prediction,
                "status": "success"
            })
            
        except Exception as e:
            logger.error(f"Error processing {file.filename}: {str(e)}")
            results.append({
                "filename": file.filename,
                "error": str(e),
                "status": "failed"
            })
    
    logger.info(f"Batch prediction complete: {len(results)} files processed")
    
    return JSONResponse(content={
        "total_files": len(files),
        "successful": len([r for r in results if r.get("status") == "success"]),
        "failed": len([r for r in results if r.get("status") == "failed"]),
        "results": results
    })


@app.post("/detect/batch")
async def detect_batch(files: List[UploadFile] = File(...)):
    """
    Detect multiple species across multiple images.
    Returns detections for each image.
    """
    logger.info(f"Received batch detection request for {len(files)} files")
    
    # Validate batch size
    if len(files) > settings.MAX_BATCH_SIZE:
        logger.warning(f"Too many files: {len(files)} (max: {settings.MAX_BATCH_SIZE})")
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Max {settings.MAX_BATCH_SIZE} files per request."
        )
    
    results = []
    
    for idx, file in enumerate(files):
        logger.info(f"Processing file {idx + 1}/{len(files)}: {file.filename}")
        
        try:
            # Read and validate file
            contents = await file.read()
            file_size = len(contents)
            
            if not file.content_type.startswith("image/"):
                results.append({
                    "filename": file.filename,
                    "error": "File must be an image"
                })
                continue
            
            if file_size > settings.MAX_FILE_SIZE:
                results.append({
                    "filename": file.filename,
                    "error": f"File too large. Max {settings.MAX_FILE_SIZE / (1024*1024):.0f}MB"
                })
                continue
            
            # Open and validate image
            try:
                image = Image.open(io.BytesIO(contents))
            except Exception:
                results.append({
                    "filename": file.filename,
                    "error": "Invalid or corrupted image"
                })
                continue
            
            # Run detection
            detection_results = detection_model(image)
            
            # Get annotated image
            annotated_image = detection_results[0].plot()
            _, buffer = cv2.imencode('.jpg', annotated_image)
            annotated_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Parse detections
            detections = []
            for result in detection_results:
                boxes = result.boxes
                for i in range(len(boxes)):
                    box = boxes.xyxy[i].cpu().numpy()
                    conf = float(boxes.conf[i].cpu().numpy())
                    cls = int(boxes.cls[i].cpu().numpy())
                    
                    species_name = CLASS_MAPPING.get(cls, f"Unknown_{cls}")
                    
                    detections.append({
                        "species": species_name,
                        "confidence": conf,
                        "bbox": {
                            "x1": float(box[0]),
                            "y1": float(box[1]),
                            "x2": float(box[2]),
                            "y2": float(box[3])
                        }
                    })
            
            results.append({
                "filename": file.filename,
                "num_detections": len(detections),
                "detections": detections,
                "annotated_image": f"data:image/jpeg;base64,{annotated_base64}",
                "status": "success"
            })
            
        except Exception as e:
            logger.error(f"Error processing {file.filename}: {str(e)}")
            results.append({
                "filename": file.filename,
                "error": str(e),
                "status": "failed"
            })
    
    logger.info(f"Batch detection complete: {len(results)} files processed")
    
    return JSONResponse(content={
        "total_files": len(files),
        "successful": len([r for r in results if r.get("status") == "success"]),
        "failed": len([r for r in results if r.get("status") == "failed"]),
        "results": results
    })


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "classification_model_loaded": model is not None,
        "detection_model_loaded": detection_model is not None,
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION
    }

# Root
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "endpoints": {
            "predict": "/predict - Single species classification",
            "predict_batch": "/predict/batch - Batch species classification",
            "detect": "/detect - Multi-species detection with bounding boxes",
            "detect_batch": "/detect/batch - Batch multi-species detection",
            "health": "/health - Health check",
            "docs": "/docs - Interactive API documentation"
        }
    }