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

  // ================= FETCH COLIS =================
  const fetchColis = async () => {
    if (!utilisateur) return;
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

  const fetchNotifications = async () => {
    if (!utilisateur) return;
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
    fetchColis();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchColis();
      fetchNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, [utilisateur]);

  // ================= ACTIONS =================
  const handleAccepter = async (c) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/colis/accepter/${c.codeSuivi}`,
        { accepter: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Colis ${c.codeSuivi} accepté !`);
      setColisDispo(prev => prev.filter(x => x._id !== c._id));
      setMesColis(prev => [...prev, { ...c, livreurId: utilisateur.id, statut: "Accepté par livreur" }]);
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors de l'acceptation");
    }
  };

  const handleRefuser = async (c) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/colis/accepter/${c.codeSuivi}`,
        { accepter: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Colis ${c.codeSuivi} refusé`);
      setColisDispo(prev => prev.filter(x => x._id !== c._id));
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors du refus");
    }
  };

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

  const markAllAsRead = () => {
    notifications.forEach(n => {
      if(!n.read) handleMarkRead(n._id);
    });
  };

  const handleLivrer = async (c) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/colis/statut/${c.codeSuivi}`,
        { nouveauStatut: "Livré" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMesColis(prev =>
        prev.map(col => col._id === c._id ? { ...col, statut: "Livré" } : col)
      );
      setMessage(`Colis ${c.codeSuivi} livré !`);
    } catch (err) {
      console.error("Erreur livraison:", err.response?.data?.message || err.message);
      setMessage(err.response?.data?.message || "Erreur lors de la livraison");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ================= RENDER =================
  return (
    <div className="page-container" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      
      {/* ========================= MINI NOTIFICATIONS ========================= */}
      <section style={{ flex: 1, minWidth: 300 }}>
        <h2 className="text-glow">🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}</h2>
        {notifications.length === 0 ? (
          <p>Aucune notification</p>
        ) : (
          <>
            <button className="btn-neon" style={{ marginBottom: "10px" }} onClick={markAllAsRead}>
              Tout marquer comme lu
            </button>
            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className="neon-card"
                  style={{ 
                    background: n.read ? "rgba(17,24,39,0.6)" : "rgba(6,182,212,0.2)" 
                  }}
                >
                  <p><strong>{n.type}</strong>: {n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleString()}</small>
                  {!n.read && (
                    <button className="btn-neon" onClick={() => handleMarkRead(n._id)} style={{ marginTop: "5px" }}>
                      Marquer comme lu
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ================= COLIS DISPONIBLES ================= */}
      <section style={{ flex: 2 }}>
        <h2 className="text-glow">📦 Colis disponibles</h2>
        {message && <p className="message">{message}</p>}
        {colisDispo.length === 0 ? (
          <p>Aucun colis disponible pour le moment.</p>
        ) : (
          <div className="featured-grid">
            {colisDispo.map(c => (
              <div key={c._id} className="neon-card">
                <p><strong>Code:</strong> {c.codeSuivi}</p>
                <p><strong>Destinataire:</strong> {c.nomDestinataire}</p>
                <p><strong>Adresse:</strong> {c.adresseDestinataire}</p>
                <div className="card-buttons">
                  <button className="btn-neon" onClick={() => handleAccepter(c)}>Accepter</button>
                  <button className="btn-neon" onClick={() => handleRefuser(c)}>Refuser</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= MES COLIS ================= */}
      <section style={{ flex: 2 }}>
        <h2 className="text-glow">📦 Mes colis acceptés</h2>
        {mesColis.length === 0 ? (
          <p>Vous n'avez accepté aucun colis pour le moment.</p>
        ) : (
          <div className="featured-grid">
            {mesColis.map(c => (
              <div key={c._id} className="neon-card">
                <p><strong>Code:</strong> {c.codeSuivi}</p>
                <p><strong>Destinataire:</strong> {c.nomDestinataire}</p>
                <p><strong>Adresse:</strong> {c.adresseDestinataire}</p>
                <p><strong>Statut:</strong> {c.statut}</p>
                {c.statut !== "Livré" && (
                  <div className="card-buttons">
                    <button className="btn-neon" onClick={() => handleLivrer(c)}>Livrer</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
