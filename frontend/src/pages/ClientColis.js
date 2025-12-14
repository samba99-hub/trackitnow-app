import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { FaEye, FaEdit, FaTrash, FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import ChatbotWidget from "../components/ChatbotWidget";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix icône Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function ClientColis() {
  const { utilisateur } = useContext(AuthContext);
  const [colis, setColis] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsServiceDisponible, setNotificationsServiceDisponible] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [selectedColis, setSelectedColis] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [livreurPos, setLivreurPos] = useState(null);

  const navigate = useNavigate();

  // ========================= FETCH COLIS + NOTIFICATIONS =========================
  useEffect(() => {
    if (!utilisateur?.id) return;
    const token = localStorage.getItem("token");

    const fetchColis = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/colis/client/${utilisateur.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setColis(res.data);
      } catch (err) {
        setMessage(err.response?.data?.message || "Erreur lors du chargement des colis");
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/notifications/${utilisateur.id}`
        );
        setNotifications(Array.isArray(res.data) ? res.data : []);
        setNotificationsServiceDisponible(true);
      } catch (err) {
        if (err.response?.status === 503) {
          console.warn("Service notifications indisponible");
          setNotificationsServiceDisponible(false);
        } else {
          console.error("Erreur notifications:", err.message);
        }
      }
    };

    fetchColis();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [utilisateur]);

  // ========================= MARK AS READ =========================
  const markAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/notifications/${id}/lu`);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, lu: true } : n))
      );
    } catch (err) {
      console.error(err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.map((n) =>
          !n.lu ? axios.patch(`http://localhost:5000/api/notifications/${n._id}/lu`) : null
        )
      );
      setNotifications(notifications.map((n) => ({ ...n, lu: true })));
    } catch (err) {
      console.error(err.message);
    }
  };

  // ========================= GESTION COLIS =========================
  const handleView = (c) => {
    setSelectedColis(c);
    setShowModal(true);
  };

  const handleDelete = async (c) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce colis ?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/colis/${c.codeSuivi}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setColis(colis.filter((x) => x.codeSuivi !== c.codeSuivi));
      setMessage("Colis supprimé avec succès");
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const handleEdit = (c) => {
    navigate("/client/creer-colis", { state: { colis: c } });
  };

  const filtered = colis.filter((c) =>
    [c.codeSuivi, c.statut, c.nomDestinataire, c.adresseDestinataire]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.lu).length;

  // ========================= FETCH POSITION LIVREUR =========================
  useEffect(() => {
    if (!selectedColis?.livreurId) return;
    let interval;

    const fetchLivreurPos = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:5001/locations/livreur/${selectedColis.livreurId}`
        );
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setLivreurPos(data[data.length - 1]);
        }
      } catch (err) {
        console.error("Erreur récupération position livreur :", err.message);
      }
    };

    fetchLivreurPos();
    interval = setInterval(fetchLivreurPos, 5000);
    return () => clearInterval(interval);
  }, [selectedColis]);

  // ========================= RENDER =========================
  return (
    <div className="page-container" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      {/* ========================= MES COLIS EN CARDS ========================= */}
      <section style={{ flex: 2 }}>
        <h2 className="text-glow" style={{ marginBottom: "20px" }}>📦 Mes Colis</h2>
        <div className="mescolis-search" style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Rechercher un colis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-neon"
          />
          <ChatbotWidget />
        </div>

        {message && <p className="message">{message}</p>}

        <div className="featured-grid">
          {filtered.length === 0 ? (
            <p className="no-results">Aucun colis trouvé.</p>
          ) : (
            filtered.map((c) => (
              <div key={c._id} className="neon-card">
                <h3 className="text-glow">{c.codeSuivi}</h3>
                <p><strong>Destinataire:</strong> {c.nomDestinataire}</p>
                <p><strong>Adresse:</strong> {c.adresseDestinataire}</p>
                <p><strong>Statut:</strong> {c.statut}</p>
                <p><strong>Date:</strong> {new Date(c.createdAt).toLocaleDateString()}</p>

                <div className="card-buttons" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button className="btn-neon" onClick={() => handleView(c)}><FaEye /> Voir</button>
                  <button className="btn-neon" onClick={() => handleEdit(c)}><FaEdit /> Modifier</button>
                  <button className="btn-neon" onClick={() => handleDelete(c)}><FaTrash /> Supprimer</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ========================= MINI NOTIFICATIONS ========================= */}
      <section style={{ flex: 1 }}>
        <h2 className="text-glow">🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}</h2>
        {!notificationsServiceDisponible ? (
          <p style={{ color: "orange" }}>Service de notifications indisponible</p>
        ) : notifications.length === 0 ? (
          <p>Aucune notification</p>
        ) : (
          <>
            <button className="btn-neon" style={{ marginBottom: "10px" }} onClick={markAllAsRead}>
              Tout marquer comme lu
            </button>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className="neon-card"
                  style={{ marginBottom: "10px", background: n.lu ? "rgba(17,24,39,0.6)" : "rgba(6,182,212,0.2)" }}
                >
                  <p><strong>{n.type}</strong>: {n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleString()}</small>
                  {!n.lu && <button className="btn-neon" onClick={() => markAsRead(n._id)}>Marquer comme lu</button>}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ========================= MODAL LIVREUR ========================= */}
      {showModal && selectedColis && (
        <div className="overlay active">
          <div className="colis-container neon-card" style={{ maxWidth: 500 }}>
            <h3 className="text-glow">Détails du colis</h3>
            <p><strong>Code :</strong> {selectedColis.codeSuivi}</p>
            <p><strong>Destinataire :</strong> {selectedColis.nomDestinataire}</p>
            <p><strong>Adresse :</strong> {selectedColis.adresseDestinataire}</p>
            <p><strong>Téléphone :</strong> {selectedColis.telephoneDestinataire}</p>
            <p><strong>Statut :</strong> {selectedColis.statut}</p>
            <p><strong>Date :</strong> {new Date(selectedColis.createdAt).toLocaleDateString()}</p>

            <h4>Position du livreur</h4>
            <div style={{ height: 300, marginTop: 10 }}>
              {livreurPos?.latitude && livreurPos?.longitude ? (
                <MapContainer
                  center={[livreurPos.latitude, livreurPos.longitude]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={[livreurPos.latitude, livreurPos.longitude]}>
                    <Popup>Livreur</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <p>Service géolocalisation indisponible</p>
              )}
            </div>

            <button className="btn-neon" onClick={() => setShowModal(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
