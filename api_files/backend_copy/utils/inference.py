# utils/inference.py

import torch
from torchvision import transforms
from PIL import Image
import io

def load_model(checkpoint_path):
    from torchvision.models import resnet50
    model = resnet50(weights=None)
    model.fc = torch.nn.Linear(model.fc.in_features, 7)
    checkpoint = torch.load(checkpoint_path, map_location='cpu')
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    return model

species_classes = ['Scallop', 'Roundfish', 'Crab', 'Whelk', 'Skate', 'Flatfish', 'Eel']

transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

def predict_species(model, image_bytes, filename):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_t = transform(image).unsqueeze(0)
    with torch.no_grad():
        outputs = model(image_t)
        _, predicted = torch.max(outputs, 1)
    species = species_classes[predicted.item()]
    metadata = {"filename": filename}
    return species, metadata
