// LivreurColis.js
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function LivreurColis() {
  const { utilisateur } = useContext(AuthContext);
  const [colisDispo, setColisDispo] = useState([]);
  const [mesColis, setMesColis] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");

  // 🔄 Fetch des colis
  const fetchColis = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/colis/livreur", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dispo = res.data.filter(c => !c.livreurId);
      const acceptes = res.data.filter(c => c.livreurId === utilisateur.id);
      setColisDispo(dispo);
      setMesColis(acceptes);
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors du chargement des colis");
    }
  };

  // 🔄 Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/notifications/${utilisateur.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.log("Erreur notifications:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (!utilisateur) return;
    fetchColis();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchColis();
      fetchNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, [utilisateur]);

  // 🔹 Accepter un colis
  const handleAccepter = async (c) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/colis/accepter/${c.codeSuivi}`,
        { accepter: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Colis ${c.codeSuivi} accepté !`);

      // ✅ Mise à jour instantanée de l'UI
      setColisDispo(prev => prev.filter(x => x._id !== c._id));
      setMesColis(prev => [...prev, { ...c, livreurId: utilisateur.id }]);
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors de l'acceptation");
    }
  };

  // 🔹 Refuser un colis
  const handleRefuser = async (c) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/colis/accepter/${c.codeSuivi}`,
        { accepter: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Colis ${c.codeSuivi} refusé`);

      // ✅ Mise à jour instantanée de l'UI
      setColisDispo(prev => prev.filter(x => x._id !== c._id));
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors du refus");
    }
  };

  // 🔹 Marquer notification comme lue
  const handleMarkRead = async (notifId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:5000/api/notifications/mark-read/${notifId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.log("Erreur mark read:", err.message);
    }
  };

  // ============================================================
  // 📍 AJOUT GPS — ENVOI AUTOMATIQUE AU MICROSERVICE
  // ============================================================
  useEffect(() => {
    if (!utilisateur) return;

    const sendGPS = () => {
      if (!navigator.geolocation) {
        console.error("GPS non supporté");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            await axios.post(
              `http://localhost:5001/locations/livreur/${utilisateur.id}`,
              { latitude, longitude }
            );
            console.log("📍 Position envoyée :", latitude, longitude);
          } catch (error) {
            console.error("Erreur envoi position:", error.message);
          }
        },
        (error) => {
          console.error("Erreur GPS:", error);
        }
      );
    };

    sendGPS();
    const interval = setInterval(sendGPS, 5000);

    return () => clearInterval(interval);
  }, [utilisateur]);
  // ============================================================

  return (
    <div className="page-container" style={{ padding: "20px" }}>
      {/* ================= NOTIFICATIONS ================= */}
      <div className="notifications-widget" style={{ marginBottom: "20px" }}>
        <h2>🔔 Notifications <span>{notifications.filter(n => !n.read).length}</span></h2>
        {notifications.length === 0 ? (
          <p>Aucune notification</p>
        ) : (
          <div className="notifications-list">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`notification-card ${n.read ? "read" : "unread"}`}
              >
                <div>{n.message}</div>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
                {!n.read && (
                  <button onClick={() => handleMarkRead(n._id)}>
                    Marquer comme lu
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= COLIS DISPONIBLES ================= */}
      <h2>📦 Colis disponibles</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {colisDispo.length === 0 ? (
        <p>Aucun colis disponible pour le moment.</p>
      ) : (
        <table className="mescolis-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Destinataire</th>
              <th>Adresse</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {colisDispo.map((c) => (
              <tr key={c._id}>
                <td>{c.codeSuivi}</td>
                <td>{c.nomDestinataire}</td>
                <td>{c.adresseDestinataire}</td>
                <td>
                  <button className="btn btn-view" onClick={() => handleAccepter(c)}>Accepter</button>
                  <button className="btn btn-delete" onClick={() => handleRefuser(c)}>Refuser</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= MES COLIS ================= */}
      <h2>📦 Mes colis acceptés</h2>
      {mesColis.length === 0 ? (
        <p>Vous n'avez accepté aucun colis pour le moment.</p>
      ) : (
        <table className="mescolis-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Destinataire</th>
              <th>Adresse</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {mesColis.map((c) => (
              <tr key={c._id}>
                <td>{c.codeSuivi}</td>
                <td>{c.nomDestinataire}</td>
                <td>{c.adresseDestinataire}</td>
                <td>✅ Accepté</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
