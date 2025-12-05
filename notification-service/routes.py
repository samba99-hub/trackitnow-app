from fastapi import APIRouter, HTTPException
from models import Notification
from database import db
from datetime import datetime
from bson import ObjectId
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

# ✅ Créer une notification simple
@router.post("/notifications")
async def create_notification(notif: Notification):
    notif.createdAt = datetime.utcnow()
    result = await db.notifications.insert_one(notif.dict())
    return {"message": "Notification créée", "id": str(result.inserted_id)}

# ✅ Récupérer les notifications d’un utilisateur
@router.get("/notifications/{utilisateurId}")
async def get_notifications(utilisateurId: str):
    notifs = await db.notifications.find({"utilisateurId": utilisateurId}).sort("createdAt", -1).to_list(100)
    for n in notifs:
        n["_id"] = str(n["_id"])
    return notifs

# ✅ Récupérer une notification par son ID
@router.get("/notifications/id/{id}")
async def get_notification_by_id(id: str):
    notif = await db.notifications.find_one({"_id": ObjectId(id)})
    if not notif:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    notif["_id"] = str(notif["_id"])
    return notif

# ✅ Marquer une notification comme lue
@router.patch("/notifications/{id}/lu")
async def mark_as_read(id: str):
    result = await db.notifications.update_one({"_id": ObjectId(id)}, {"$set": {"lu": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    return {"message": "Notification marquée comme lue"}

# ✅ Modèle pour notification par rôle
class RoleNotificationRequest(BaseModel):
    role: str
    message: str
    type: Optional[str] = "statut"
    colisId: Optional[str] = None

# ✅ Envoyer une notification à tous les utilisateurs d’un rôle
@router.post("/notifications/role")
async def notify_role(payload: RoleNotificationRequest):
    utilisateurs = await db.utilisateurs.find({"role": payload.role}).to_list(100)
    if not utilisateurs:
        raise HTTPException(status_code=404, detail=f"Aucun utilisateur trouvé pour le rôle {payload.role}")
    notif_list = [{
        "utilisateurId": str(u["_id"]),
        "message": payload.message,
        "type": payload.type,
        "lu": False,
        "createdAt": datetime.utcnow(),
        "colisId": payload.colisId
    } for u in utilisateurs]
    await db.notifications.insert_many(notif_list)
    return {"message": f"Notifications envoyées à tous les {payload.role}s"}

# ✅ Modèle pour notification utilisateur
class UserNotificationRequest(BaseModel):
    utilisateurId: str
    message: str
    type: Optional[str] = "statut"
    colisId: Optional[str] = None

# ✅ Envoyer une notification à un utilisateur
@router.post("/notifications/utilisateur")
async def notify_user(payload: UserNotificationRequest):
    notif = {
        "utilisateurId": payload.utilisateurId,
        "message": payload.message,
        "type": payload.type,
        "lu": False,
        "createdAt": datetime.utcnow(),
        "colisId": payload.colisId
    }
    result = await db.notifications.insert_one(notif)
    return {"message": "Notification envoyée", "id": str(result.inserted_id)}

# ✅ Supprimer les notifications liées à un colis
@router.delete("/notifications/colis/{colisId}")
async def delete_notifications_for_colis(colisId: str):
    result = await db.notifications.delete_many({"colisId": colisId})
    return {"message": f"{result.deleted_count} notifications supprimées"}

# ✅ Envoyer une notification système (globale)
class SystemNotificationRequest(BaseModel):
    message: str
    type: Optional[str] = "systeme"

@router.post("/notifications/systeme")
async def notify_system(payload: SystemNotificationRequest):
    notif = {
        "message": payload.message,
        "type": payload.type,
        "lu": False,
        "createdAt": datetime.utcnow()
    }
    result = await db.notifications.insert_one(notif)
    return {"message": "Notification système envoyée", "id": str(result.inserted_id)}

# ✅ Envoyer une notification liée à un colis
class ColisNotificationRequest(BaseModel):
    colisId: str
    message: str
    type: Optional[str] = "colis_statut"

@router.post("/notifications/colis")
async def notify_colis(payload: ColisNotificationRequest):
    notif = {
        "colisId": payload.colisId,
        "message": payload.message,
        "type": payload.type,
        "lu": False,
        "createdAt": datetime.utcnow()
    }
    result = await db.notifications.insert_one(notif)
    return {"message": "Notification colis envoyée", "id": str(result.inserted_id)}