from pymongo import MongoClient

uri = "mongodb://localhost:27017"
client = MongoClient(uri)
db = client["notification_db"]

res = list(db.notifications.find({"utilisateurId": "690cff9fa1289a2edd304a53"}))
print(res)
