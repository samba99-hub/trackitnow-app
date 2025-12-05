from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Notification(BaseModel):
    utilisateurId: Optional[str] = None   # ID de l'utilisateur cible
    role: Optional[str] = None            # Rôle cible (ex: livreur, admin)
    colisId: Optional[str] = None         # ID du colis lié
    type: str = "statut"                  # Type de notification (statut, mission, systeme)
    message: str                          # Contenu du message
    lu: bool = False                      # Notification lue ou non
    createdAt: Optional[datetime] = None  # Date de création