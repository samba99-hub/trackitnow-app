# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from pymongo import MongoClient
import re
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Chatbot Service - TrackItNow",
    description="Microservice chatbot pour répondre aux questions sur l'application TrackItNow.",
    version="1.0.0"
)

# -----------------------------
# Modèle de requête
# -----------------------------
class Message(BaseModel):
    message: str

# -----------------------------
# Connexion MongoDB
# -----------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/trackitnow")
client = MongoClient(MONGO_URI)
db = client.get_database()  # prend la base de l'URI
users_col = db['utilisateurs']
colis_col = db['colis']

print("✅ Connecté à MongoDB")

# -----------------------------
# Détection d'intention
# -----------------------------
def detect_entities(question: str):
    question_lower = question.lower()
    entities = {}

    # Compter utilisateurs
    if re.search(r"(utilisateurs|inscrits|combien d'utilisateurs)", question_lower):
        entities['collection'] = 'utilisateurs'
        entities['action'] = 'count'

    # Compter colis
    if re.search(r"(colis|suivi|combien de colis)", question_lower):
        entities['collection'] = 'colis'
        entities['action'] = 'count'

        # Vérifier statut d'un colis spécifique
        match_code = re.search(r"([A-Z0-9]{6,})", question)
        if match_code:
            entities['action'] = 'status'
            entities['codeSuivi'] = match_code.group(1)

    # Inscription
    if re.search(r"(s'inscrire|inscription|m'inscrire|créer un compte|je veux m'inscrire)", question_lower):
        entities['action'] = 'registration'

    return entities

# -----------------------------
# Endpoint racine
# -----------------------------
@app.get("/")
def root():
    return {"message": "Chatbot TrackItNow en ligne"}

# -----------------------------
# Endpoint chat
# -----------------------------
@app.post("/chat")
def chat(data: Message):
    question = data.message.strip()
    if not question:
        return {"response": "Posez une question sur les fonctionnalités de l'application."}

    entities = detect_entities(question)

    try:
        # Compter utilisateurs
        if entities.get('collection') == 'utilisateurs' and entities.get('action') == 'count':
            count = users_col.count_documents({})
            return {"response": f"Il y a actuellement {count} utilisateur(s) inscrit(s)."}

        # Compter colis
        if entities.get('collection') == 'colis' and entities.get('action') == 'count':
            count = colis_col.count_documents({})
            return {"response": f"Il y a actuellement {count} colis enregistrés."}

        # Statut d'un colis spécifique
        if entities.get('collection') == 'colis' and entities.get('action') == 'status':
            code = entities.get('codeSuivi')
            colis = colis_col.find_one({"codeSuivi": code})
            if colis:
                return {"response": f"Le colis {code} est actuellement au statut : {colis.get('statut', 'Inconnu')}"}
            else:
                return {"response": f"Aucun colis trouvé avec le code {code}"}

        # Inscription
        if entities.get('action') == 'registration':
            return {"response": "Pour vous inscrire, remplissez le formulaire d'inscription sur l'application avec votre nom, email et mot de passe."}

        # Si aucune intention détectée
        return {"response": "Désolé, je ne sais pas répondre à cette question. Posez une question sur les fonctionnalités de l'application."}

    except Exception as e:
        return {"response": f"Erreur interne : {str(e)}"}
