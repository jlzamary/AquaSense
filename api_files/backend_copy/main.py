from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

import torch
from torchvision import transforms
from PIL import Image
import io

# ---- Model loading (PyTorch ResNet50, .pth weights) ----

def load_model(checkpoint_path):
    from torchvision.models import resnet50
    model = resnet50(weights=None)
    model.fc = torch.nn.Linear(model.fc.in_features, 7)
    checkpoint = torch.load(checkpoint_path, map_location='cpu')
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    return model

transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

species_classes = ['crab', 'Eel', 'flatfish', 'roundfish', 'Scallop', 'skate', 'whelk']

def predict_species(model, image_bytes, filename):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_t = transform(image).unsqueeze(0)
    with torch.no_grad():
        outputs = model(image_t)
        _, predicted = torch.max(outputs, 1)
    species = species_classes[predicted.item()]
    metadata = {"filename": filename}
    return species, metadata

# ---- FastAPI app setup ----
app = FastAPI()

# CORS for local development and web frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set specific origins for production security!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model at startup (adjust path as needed)
model = load_model('models/best_model.pth')

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

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if not file.content_type.startswith("image/"):
            return JSONResponse(status_code=400, content={"error": "File must be an image."})
        prediction, metadata = predict_species(model, contents, file.filename)
        species_details = species_info.get(prediction, {})
        response = {
            "predicted_species": prediction,
            "metadata": metadata,
            "timestamp": datetime.utcnow().isoformat(),
            "species_info": species_details
        }
        return JSONResponse(content=response)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
