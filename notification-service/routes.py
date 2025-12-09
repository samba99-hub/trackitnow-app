from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel

from database import db

router = APIRouter()


# ==========================================
# 🔹 Pydantic Models
# ==========================================

class Notification(BaseModel):
    utilisateurId: Optional[str] = None
    message: str
    type: Optional[str] = "statut"
    colisId: Optional[str] = None
    lu: bool = False
    createdAt: Optional[datetime] = None


class RoleNotificationRequest(BaseModel):
    role: str
    message: str
    type: Optional[str] = "statut"
    colisId: Optional[str] = None


class UserNotificationRequest(BaseModel):
    utilisateurId: str
    message: str
    type: Optional[str] = "statut"
    colisId: Optional[str] = None


class SystemNotificationRequest(BaseModel):
    message: str
    type: Optional[str] = "systeme"


class ColisNotificationRequest(BaseModel):
    colisId: str
    message: str
    type: Optional[str] = "colis_statut"


# ==========================================
# 🔹 Utils
# ==========================================

def serialize_doc(doc):
    """Convertit ObjectId en str dans un document Mongo."""
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return doc


# ==========================================
# 🚀 1. CRÉER UNE NOTIFICATION GÉNÉRIQUE
# ==========================================

@router.post("/notifications")
async def create_notification(notif: Notification):
    notif.createdAt = datetime.utcnow()
    result = await db.notifications.insert_one(notif.model_dump())
    return {"message": "Notification créée", "id": str(result.inserted_id)}


# ==========================================
# 🚀 2. GET – RÉCUPÉRER NOTIFICATIONS PAR UTILISATEUR
# ==========================================

@router.get("/notifications/{utilisateurId}")
async def get_notifications(utilisateurId: str):
    notifs = await (
        db.notifications
        .find({"utilisateurId": utilisateurId})
        .sort("createdAt", -1)
        .to_list(200)
    )

    return [serialize_doc(n) for n in notifs]


# ==========================================
# 🚀 3. GET – RÉCUPÉRER UNE NOTIFICATION PAR ID
# ==========================================

@router.get("/notifications/id/{id}")
async def get_notification_by_id(id: str):
    notif = await db.notifications.find_one({"_id": ObjectId(id)})
    if not notif:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    return serialize_doc(notif)


# ==========================================
# 🚀 4. PATCH – MARQUER UNE NOTIFICATION COMME LUE
# ==========================================

@router.patch("/notifications/{id}/lu")
async def mark_as_read(id: str):
    result = await db.notifications.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"lu": True}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification introuvable")

    return {"message": "Notification marquée comme lue"}


# ==========================================
# 🚀 5. POST – NOTIFIER TOUS LES UTILISATEURS D’UN RÔLE
# ==========================================

@router.post("/notifications/role")
async def notify_role(payload: RoleNotificationRequest):
    utilisateurs = await db.utilisateurs.find({"role": payload.role}).to_list(500)

    if not utilisateurs:
        raise HTTPException(
            status_code=404,
            detail=f"Aucun utilisateur trouvé pour le rôle {payload.role}"
        )

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


# ==========================================
# 🚀 6. POST – NOTIFIER UN UTILISATEUR
# ==========================================

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


# ==========================================
# 🚀 7. DELETE – SUPPRIMER TOUTES LES NOTIFS D’UN COLIS
# ==========================================

@router.delete("/notifications/colis/{colisId}")
async def delete_notifications_for_colis(colisId: str):
    result = await db.notifications.delete_many({"colisId": colisId})
    return {"message": f"{result.deleted_count} notifications supprimées"}


# ==========================================
# 🚀 8. POST – NOTIFICATION SYSTÈME GLOBALE
# ==========================================

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


# ==========================================
# 🚀 9. POST – NOTIFICATION LIÉE À UN COLIS
# ==========================================

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
