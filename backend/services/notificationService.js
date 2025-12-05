const axios = require("axios");

// ⚠️ IMPORTANT : mets dans ton .env
// NOTIFICATION_SERVICE_URL=http://localhost:8001/api
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL;

// 🔔 Envoyer une notification à un utilisateur
async function notifyUser(utilisateurId, message, colisId) {
  try {
    const response = await axios.post(
      `${notificationServiceUrl}/notifications/utilisateur`,
      {
        utilisateurId,
        message,
        type: "colis_statut",
        colisId
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Erreur notification utilisateur:", error.message);
    return null;
  }
}

// 🔔 Envoyer une notification à un rôle
async function notifyRole(role, message, colisId) {
  try {
    const response = await axios.post(
      `${notificationServiceUrl}/notifications/role`,
      {
        role,
        message,
        type: "mission",
        colisId
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Erreur notification rôle:", error.message);
    return null;
  }
}

// 🔔 Envoyer une notification système (globale)
async function notifySystem(message) {
  try {
    const response = await axios.post(
      `${notificationServiceUrl}/notifications/systeme`,
      {
        message,
        type: "systeme"
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Erreur notification système:", error.message);
    return null;
  }
}

// 🔔 Envoyer une notification liée à un colis
async function notifyColis(colisId, message) {
  try {
    const response = await axios.post(
      `${notificationServiceUrl}/notifications/colis`,
      {
        colisId,
        message,
        type: "colis_statut"
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Erreur notification colis:", error.message);
    return null;
  }
}

// 📥 Récupérer les notifications d’un utilisateur
async function getUserNotifications(utilisateurId) {
  try {
    const response = await axios.get(
      `${notificationServiceUrl}/notifications/${utilisateurId}`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Erreur récupération notifications:", error.message);
    return [];
  }
}

// 📥 Marquer une notification comme lue
async function markNotificationRead(notificationId) {
  try {
    const response = await axios.patch(
      `${notificationServiceUrl}/notifications/${notificationId}/lu`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Erreur lors du marquage de la notification:", error.message);
    return null;
  }
}

module.exports = {
  notifyUser,
  notifyRole,
  notifySystem,
  notifyColis,
  getUserNotifications,
  markNotificationRead
};