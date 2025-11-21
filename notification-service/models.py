from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Notification(BaseModel):
    utilisateurId: str
    message: str
    type: Optional[str] = "statut"
    lu: Optional[bool] = False
    createdAt: Optional[datetime] = None
    colisId: Optional[str] = None