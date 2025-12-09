import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function NotificationsPage() {
  const { utilisateur } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); // all ou unread
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // 📥 Récupérer les notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8001/api/notifications/${utilisateur.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur notifications :", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!utilisateur?.id) return;
    fetchNotifications();
  }, [utilisateur]);

  // 🔹 Filtrer notifications
  const filtered = notifications.filter(n => filter === "all" || !n.lu);

  // 🔹 Marquer une notification comme lue
  const markAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:8001/api/notifications/${id}/lu`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, lu: true } : n));
    } catch (err) {
      console.error(err.message);
    }
  };

  // 🔹 Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      await Promise.all(notifications.map(n => !n.lu ? axios.patch(`http://localhost:8001/api/notifications/${n._id}/lu`) : null));
      setNotifications(notifications.map(n => ({ ...n, lu: true })));
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="page-container">
      <h2>🔔 Centre de Notifications</h2>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setFilter("all")} style={{ marginRight: "5px" }}>Toutes</button>
        <button onClick={() => setFilter("unread")} style={{ marginRight: "15px" }}>Non lues</button>
        <button onClick={markAllAsRead}>Tout marquer comme lu</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : filtered.length === 0 ? (
        <p>Aucune notification.</p>
      ) : (
        <ul>
          {filtered.map(n => (
            <li key={n._id} style={{ marginBottom: "10px", background: n.lu ? "#eee" : "#f9f9f9", padding: "10px", borderRadius: "5px" }}>
              <strong>{n.type}</strong>: {n.message} <br />
              <small>{new Date(n.createdAt).toLocaleString()}</small> <br />
              {!n.lu && <button onClick={() => markAsRead(n._id)}>Marquer comme lu</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
