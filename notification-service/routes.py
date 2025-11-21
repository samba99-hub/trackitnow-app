from fastapi import APIRouter
from models import Notification
from database import db
from datetime import datetime
from bson import ObjectId

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

# ✅ Marquer une notification comme lue
@router.patch("/notifications/{id}/lu")
async def mark_as_read(id: str):
    await db.notifications.update_one({"_id": ObjectId(id)}, {"$set": {"lu": True}})
    return {"message": "Notification marquée comme lue"}

# ✅ Envoyer une notification à tous les livreurs
@router.post("/notifications/role")
async def notify_role(role: str, message: str, type: Optional[str] = "statut", colisId: Optional[str] = None):
    utilisateurs = await db.utilisateurs.find({"role": role}).to_list(100)
    notif_list = [{
        "utilisateurId": str(u["_id"]),
        "message": message,
        "type": type,
        "lu": False,
        "createdAt": datetime.utcnow(),
        "colisId": colisId
    } for u in utilisateurs]
    await db.notifications.insert_many(notif_list)
    return {"message": f"Notifications envoyées à tous les {role}s"}

# ✅ Envoyer une notification à un utilisateur
@router.post("/notifications/utilisateur")
async def notify_user(utilisateurId: str, message: str, type: Optional[str] = "statut", colisId: Optional[str] = None):
    notif = {
        "utilisateurId": utilisateurId,
        "message": message,
        "type": type,
        "lu": False,
        "createdAt": datetime.utcnow(),
        "colisId": colisId
    }
    result = await db.notifications.insert_one(notif)
    return {"message": "Notification envoyée", "id": str(result.inserted_id)}

# ✅ Supprimer les notifications liées à un colis
@router.delete("/notifications/colis/{colisId}")
async def delete_notifications_for_colis(colisId: str):
    result = await db.notifications.delete_many({"colisId": colisId})
    return {"message": f"{result.deleted_count} notifications supprimées"}