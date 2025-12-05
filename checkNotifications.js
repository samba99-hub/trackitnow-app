const { MongoClient } = require('mongodb');

// 🔧 Paramètres MongoDB
const uri = "mongodb://localhost:27017"; // ton URI MongoDB
const dbName = "notification_db";        // nom de la base
const collectionName = "notifications";  // collection notifications

const utilisateurId = "690cff9fa1289a2edd304a53";

async function checkNotifications() {
  // ⚠️ Ici on enlève useUnifiedTopology
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connecté à MongoDB");

    const db = client.db(dbName);
    const notifications = await db.collection(collectionName)
      .find({ utilisateurId })
      .sort({ createdAt: -1 })
      .toArray();

    if (notifications.length === 0) {
      console.log(`❌ Aucune notification trouvée pour l'utilisateur ${utilisateurId}`);
    } else {
      console.log(`📌 Notifications pour l'utilisateur ${utilisateurId}:`);
      notifications.forEach((n, index) => {
        console.log(`${index + 1}. [${n.lu ? "LU" : "NON LU"}] ${n.message} (${n.type}) - ${n.createdAt}`);
      });
    }
  } catch (err) {
    console.error("Erreur MongoDB:", err.message);
  } finally {
    await client.close();
  }
}

checkNotifications();
