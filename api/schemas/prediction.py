# schemas/prediction.py
from pydantic import BaseModel
from typing import Optional, Dict

# Output can be changed depending on the 'about' section for display information 
class SpeciesInfo(BaseModel):
    description: str
    habitat: str
    diet: str
    size: str
    diagram_url: str

class PredictionResponse(BaseModel):
    predicted_species: str
    metadata: Dict[str, str]
    timestamp: str
    species_info: Optional[SpeciesInfo] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "predicted_species": "Crab",
                "metadata": {"filename": "crab_image.jpg"},
                "timestamp": "2025-10-16T10:30:00",
                "species_info": {
                    "description": "Crabs are decapod crustaceans...",
                    "habitat": "Lagoon and estuarine floors",
                    "diet": "Omnivorous",
                    "size": "Ranges from a few centimetres up to 30 cm wide",
                    "diagram_url": "https://example.com/crab.png"
                }
            }
        }