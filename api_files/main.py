# main.py
import logging
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from PIL import Image
import io

from utils.inference import load_model, predict_species
from schemas.prediction import PredictionResponse
from config import settings

# Set up logging using config
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ---- FastAPI app setup ----
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for classifying marine species from images",
    version=settings.VERSION
)

# CORS middleware using config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model at startup using config path
logger.info(f"Loading model from {settings.MODEL_PATH}")
model = load_model(settings.MODEL_PATH)
logger.info("Model loaded successfully")

# Species information database
species_info = {
    "Scallop": {
        "description": "Scallops are bivalve mollusks with fan-shaped shells and many small eyes along their margins. They are filter feeders, swimming by clapping their shells.",
        "habitat": "Sandy or muddy lagoon floors.",
        "diet": "Filter feeders—plankton and organic particles.",
        "size": "Shell diameter typically 5–15 cm.",
        "diagram_url": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Scallop_shell_anatomy.svg"
    },
    "Roundfish": {
        "description": "Roundfish refers to cylindrical-bodied fish such as cod or pollock common in Arctic lagoons. They are mid-level predators and forage on smaller fish and invertebrates.",
        "habitat": "Open lagoon waters and adjacent marine environments.",
        "diet": "Carnivorous—smaller fish, zooplankton, crustaceans.",
        "size": "Varies by species, typically 20–50 cm.",
        "diagram_url": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Fish_anatomy_en.svg"
    },
    "Crab": {
        "description": "Crabs are decapod crustaceans with a hard exoskeleton and two prominent claws, found in lagoon and estuarine habitats.",
        "habitat": "Lagoon and estuarine floors, rocky and sandy shores.",
        "diet": "Omnivorous—algae, detritus, small invertebrates.",
        "size": "Ranges from a few centimetres up to 30 cm wide.",
        "diagram_url": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Crab_anatomy_1.png"
    },
    "Whelk": {
        "description": "Whelks are marine gastropod mollusks with coiled shells, known for being slow-moving scavengers and predators.",
        "habitat": "Sandy or muddy lagoon and coastal substrates.",
        "diet": "Predatory—other mollusks, worms, dead organic matter.",
        "size": "Shell length typically 5–15 cm.",
        "diagram_url": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Snail_anatomy_en.svg"
    },
    "Skate": {
        "description": "Skates are cartilaginous fish related to rays, with flattened bodies and wing-like pectoral fins, often found buried in lagoon or estuary sediment.",
        "habitat": "Sandy and muddy lagoon bottoms.",
        "diet": "Carnivorous—small fish, mollusks, crustaceans.",
        "size": "Disc width often 30–60 cm.",
        "diagram_url": "https://upload.wikimedia.org/wikipedia/commons/6/66/Skate_anatomy_diagram.png"
    },
    "Flatfish": {
        "description": "Flatfish are laterally flattened fish such as flounder or sole, lying on lagoon or estuarine bottoms with both eyes on one side.",
        "habitat": "Soft lagoon and coastal benthic zones.",
        "diet": "Carnivorous—worms, crustaceans, small invertebrates.",
        "size": "Body length usually 15–40 cm.",
        "diagram_url": "https://upload.wikimedia.org/wikipedia/commons/1/1c/Fish_anatomy_en.svg"
    },
    "Eel": {
        "description": "Eels are long, slender, snake-like fish; some species migrate between freshwater and lagoon/marine habitats as part of their life cycle.",
        "habitat": "Lagoon and estuarine waters, burrows in sediment.",
        "diet": "Carnivorous—small fish, crustaceans, worms.",
        "size": "Length varies from 30 cm up to over 1 m.",
        "diagram_url": "https://upload.wikimedia.org/wikipedia/commons/8/86/Eel_diagram.png"
    }
}

@app.post("/predict", response_model=PredictionResponse)
async def predict_single(file: UploadFile = File(...)):
    """
    Predict marine species from a single uploaded image.
    
    Returns prediction with species information and metadata.
    """
    logger.info(f"Received prediction request for file: {file.filename}")
    
    try:
        # Read file contents
        contents = await file.read()
        file_size = len(contents)
        logger.info(f"File size: {file_size} bytes")
        
        # Validate file type
        if not file.content_type.startswith("image/"):
            logger.warning(f"Invalid file type received: {file.content_type}")
            raise HTTPException(status_code=400, detail="File must be an image.")
        
        # Validate file size using config
        if file_size > settings.MAX_FILE_SIZE:
            logger.warning(f"File too large: {file_size} bytes (max: {settings.MAX_FILE_SIZE})")
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Max {settings.MAX_FILE_SIZE / (1024*1024):.0f}MB."
            )
        
        # Validate image can be opened
        try:
            Image.open(io.BytesIO(contents))
        except Exception as img_error:
            logger.error(f"Invalid image file: {str(img_error)}")
            raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")
        
        # Make prediction
        logger.info("Running model inference...")
        prediction, metadata = predict_species(model, contents, file.filename)
        logger.info(f"Prediction successful: {prediction}")
        
        # Get species details
        species_details = species_info.get(prediction, {})
        
        response = {
            "predicted_species": prediction,
            "metadata": metadata,
            "timestamp": datetime.utcnow().isoformat(),
            "species_info": species_details
        }
        
        logger.info(f"Response prepared for species: {prediction}")
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during prediction: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/batch", response_model=List[PredictionResponse])
async def predict_batch(files: List[UploadFile] = File(...)):
    """
    Predict marine species from multiple uploaded images.
    
    Returns predictions with species information and metadata for each image.
    """
    logger.info(f"Received batch prediction request for {len(files)} file(s)")
    
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
            # Read file contents
            contents = await file.read()
            file_size = len(contents)
            logger.info(f"File size: {file_size} bytes")
            
            # Validate file type
            if not file.content_type.startswith("image/"):
                logger.warning(f"Invalid file type received: {file.content_type}")
                results.append({
                    "predicted_species": "Error",
                    "metadata": {"filename": file.filename, "error": "File must be an image"},
                    "timestamp": datetime.utcnow().isoformat(),
                    "species_info": {}
                })
                continue
            
            # Validate file size
            if file_size > settings.MAX_FILE_SIZE:
                logger.warning(f"File too large: {file_size} bytes")
                results.append({
                    "predicted_species": "Error",
                    "metadata": {"filename": file.filename, "error": f"File too large. Max {settings.MAX_FILE_SIZE / (1024*1024):.0f}MB"},
                    "timestamp": datetime.utcnow().isoformat(),
                    "species_info": {}
                })
                continue
            
            # Validate image can be opened
            try:
                Image.open(io.BytesIO(contents))
            except Exception as img_error:
                logger.error(f"Invalid image file: {str(img_error)}")
                results.append({
                    "predicted_species": "Error",
                    "metadata": {"filename": file.filename, "error": "Invalid or corrupted image"},
                    "timestamp": datetime.utcnow().isoformat(),
                    "species_info": {}
                })
                continue
            
            # Make prediction
            logger.info("Running model inference...")
            prediction, metadata = predict_species(model, contents, file.filename)
            logger.info(f"Prediction successful: {prediction}")
            
            # Get species details
            species_details = species_info.get(prediction, {})
            
            results.append({
                "predicted_species": prediction,
                "metadata": metadata,
                "timestamp": datetime.utcnow().isoformat(),
                "species_info": species_details
            })
            
        except Exception as e:
            logger.error(f"Unexpected error processing {file.filename}: {str(e)}", exc_info=True)
            results.append({
                "predicted_species": "Error",
                "metadata": {"filename": file.filename, "error": str(e)},
                "timestamp": datetime.utcnow().isoformat(),
                "species_info": {}
            })
    
    logger.info(f"Completed processing {len(files)} file(s)")
    return JSONResponse(content=results)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs"
    }