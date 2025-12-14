from fastapi import FastAPI
from pydantic import BaseModel
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import re
from fastapi.middleware.cors import CORSMiddleware

# -----------------------
# Charger variables d'environnement
# -----------------------
load_dotenv()

# -----------------------
# Création de l'application FastAPI
# -----------------------
app = FastAPI(title="Chatbot TrackItNow Avancé", version="1.1")

# -----------------------
# CORS pour React frontend
# -----------------------
origins = [
    "http://localhost:3000",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Modèle pour les messages
# -----------------------
class Message(BaseModel):
    message: str
    session_id: str = None  

# -----------------------
# Connexion MongoDB
# -----------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/trackitnow")
client = MongoClient(MONGO_URI)
db = client.get_database()
users_col = db['utilisateurs']
colis_col = db['colis']

print("✅ Connecté à MongoDB")

# -----------------------
# Stockage simple du contexte par session_id
# -----------------------
sessions = {}

def get_context(session_id):
    return sessions.get(session_id, {})

def set_context(session_id, context):
    sessions[session_id] = context

# -----------------------
# Détection d'intention
# -----------------------
def detect_intent(question: str, context: dict):
    q = question.lower()
    intent = {"action": None, "details": {}}

    # Utilisateurs
    if re.search(r"(utilisateurs|inscrits|nombre|combien)", q):
        intent["action"] = "count_users"
    elif re.search(r"(inscrire|inscription|créer un compte|s'inscrire)", q):
        intent["action"] = "registration"
    elif re.search(r"(connexion|login|mot de passe|connecter)", q):
        intent["action"] = "login"

    # Colis
    if re.search(r"(colis|suivi|statut|livreur|dashboard|modifier|supprimer|accepter|refuser)", q):
        if re.search(r"(combien|nombre)", q):
            intent["action"] = "count_colis"
        elif re.search(r"(statut|suivi)", q):
            intent["action"] = "status_colis"
            match_code = re.search(r"([A-Z0-9]{6,})", question)
            if match_code:
                intent["details"]["codeSuivi"] = match_code.group(1)
            elif "codeSuivi" in context:
                intent["details"]["codeSuivi"] = context["codeSuivi"]
        elif re.search(r"(dashboard|dernier|statut)", q):
            intent["action"] = "dashboard_colis"
        elif re.search(r"(modifier|mettre à jour)", q):
            intent["action"] = "modifier_colis"
        elif re.search(r"(supprimer|delete)", q):
            intent["action"] = "supprimer_colis"
        elif re.search(r"(accepter|refuser)", q):
            intent["action"] = "accepter_refuser_colis"

    return intent

# -----------------------
# Route principale chatbot
# -----------------------
@app.post("/chat")
def chat(data: Message):
    question = data.message.strip()
    session_id = data.session_id or "default"
    context = get_context(session_id)

    if not question:
        return {"response": "Posez une question sur les fonctionnalités de l'application."}

    intent = detect_intent(question, context)

    try:
        # --- Utilisateurs ---
        if intent.get("action") == "count_users":
            count = users_col.count_documents({})
            return {"response": f"Il y a actuellement {count} utilisateur(s) inscrit(s)."}

        if intent.get("action") == "registration":
            return {"response": "Pour vous inscrire, remplissez le formulaire d'inscription avec nom, email et mot de passe."}

        if intent.get("action") == "login":
            return {"response": "Pour vous connecter, utilisez votre email et mot de passe via l'application ou l'API."}

        # --- Colis ---
        if intent.get("action") == "count_colis":
            count = colis_col.count_documents({})
            return {"response": f"Il y a actuellement {count} colis enregistrés."}

        if intent.get("action") == "status_colis":
            code = intent["details"].get("codeSuivi")
            if not code:
                context["awaiting_code"] = True
                set_context(session_id, context)
                return {"response": "Quel est le code de suivi du colis ?"}
            else:
                context.pop("awaiting_code", None)
                set_context(session_id, context)
                colis = colis_col.find_one({"codeSuivi": code})
                if colis:
                    statut = colis.get("statut", "Inconnu")
                    historique = colis.get("historique", [])
                    position = colis.get("positionGPS", {})
                    pos_text = f" à la position {position}" if position else ""
                    return {"response": f"Le colis {code} est actuellement au statut : {statut}{pos_text}. Historique : {historique}"}
                else:
                    return {"response": f"Aucun colis trouvé avec le code {code}"}

        if intent.get("action") == "dashboard_colis":
            total = colis_col.count_documents({})
            par_statut = list(colis_col.aggregate([{"$group": {"_id": "$statut", "count": {"$sum": 1}}}]))
            derniers = list(colis_col.find().sort("createdAt", -1).limit(5))
            return {"response": f"Dashboard : total {total} colis, par statut {par_statut}, derniers colis : {derniers}"}

        if intent.get("action") in ["modifier_colis", "supprimer_colis", "accepter_refuser_colis"]:
            return {"response": "Pour modifier, supprimer ou accepter/refuser un colis, cliquez sur le bouton correspondant puis suivez les instructions."}

        # --- Gestion contexte pour code de suivi ---
        if context.get("awaiting_code"):
            code = question.strip().upper()
            context.pop("awaiting_code")
            set_context(session_id, context)
            colis = colis_col.find_one({"codeSuivi": code})
            if colis:
                statut = colis.get("statut", "Inconnu")
                historique = colis.get("historique", [])
                position = colis.get("positionGPS", {})
                pos_text = f" à la position {position}" if position else ""
                return {"response": f"Le colis {code} est actuellement au statut : {statut}{pos_text}. Historique : {historique}"}
            else:
                return {"response": f"Aucun colis trouvé avec le code {code}"}

        # --- Si aucune intention ---
        return {"response": "Désolé, je ne sais pas répondre à cette question. Posez une question sur l'application TrackItNow."}

    except Exception as e:
        return {"response": f"Erreur interne : {str(e)}"}
