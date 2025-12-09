from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

# Simule une base de données en mémoire
colis_positions = {}  # {colis_id: {"latitude": x, "longitude": y, "updatedAt": datetime}}
livreurs_positions = {}  # {livreur_id: [{"latitude": x, "longitude": y, "timestamp": datetime}, ...]}

# =========================================
# 🔹 Modèles Pydantic
# =========================================
class Position(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime = None

# =========================================
# 🚀 POST – Mettre à jour position d’un colis
# =========================================
@router.post("/colis/{colis_id}")
def update_colis_position(colis_id: str, pos: Position):
    pos.timestamp = pos.timestamp or datetime.utcnow()
    colis_positions[colis_id] = pos.dict()
    return {"message": f"Position du colis {colis_id} mise à jour"}

# =========================================
# 🚀 GET – Récupérer position d’un colis
# =========================================
@router.get("/colis/{colis_id}")
def get_colis_position(colis_id: str):
    if colis_id not in colis_positions:
        raise HTTPException(status_code=404, detail="Colis introuvable")
    return colis_positions[colis_id]

# =========================================
# 🚀 POST – Mettre à jour position d’un livreur
# =========================================
@router.post("/livreur/{livreur_id}")
def update_livreur_position(livreur_id: str, pos: Position):
    pos.timestamp = pos.timestamp or datetime.utcnow()
    if livreur_id not in livreurs_positions:
        livreurs_positions[livreur_id] = []
    livreurs_positions[livreur_id].append(pos.dict())
    return {"message": f"Position du livreur {livreur_id} ajoutée"}

# =========================================
# 🚀 GET – Récupérer positions d’un livreur
# =========================================
@router.get("/livreur/{livreur_id}")
def get_livreur_positions(livreur_id: str):
    if livreur_id not in livreurs_positions:
        raise HTTPException(status_code=404, detail="Livreur introuvable")
    return livreurs_positions[livreur_id]
