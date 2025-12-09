import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { FaEye, FaEdit, FaTrash, FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
          setLivreurPos(data[data.length - 1]); // prendre la dernière position
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
    <div className="page-container" style={{ display: "flex", gap: "20px" }}>
      {/* ========================= MES COLIS ========================= */}
      <section className="mescolis-section" style={{ flex: 2 }}>
        <div className="mescolis-container animate-fadeIn">
          <h2>📦 Mes Colis</h2>
          <div className="mescolis-search">
            <input
              type="text"
              placeholder="Rechercher un colis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {message && <p className="message">{message}</p>}
          {filtered.length === 0 ? (
            <p className="no-results">Aucun colis trouvé.</p>
          ) : (
            <table className="mescolis-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Destinataire</th>
                  <th>Adresse</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id}>
                    <td>{c.codeSuivi}</td>
                    <td>{c.nomDestinataire}</td>
                    <td>{c.adresseDestinataire}</td>
                    <td>{c.statut}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-view" onClick={() => handleView(c)}>
                        <FaEye /> Voir
                      </button>
                      <button className="btn btn-edit" onClick={() => handleEdit(c)}>
                        <FaEdit /> Modifier
                      </button>
                      <button className="btn btn-delete" onClick={() => handleDelete(c)}>
                        <FaTrash /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ========================= MINI NOTIFICATIONS ========================= */}
      <section className="notifications-widget" style={{ flex: 1 }}>
        <div className="notifications-container animate-fadeIn">
          <h2>
            <FaBell /> Notifications{" "}
            {notificationsServiceDisponible && unreadCount > 0 && (
              <span style={{ color: "red" }}>({unreadCount})</span>
            )}
          </h2>

          {!notificationsServiceDisponible ? (
            <p style={{ color: "orange" }}>Service de notifications indisponible</p>
          ) : notifications.length === 0 ? (
            <p>Service de notifications indisponible</p>
          ) : (
            <>
              <button onClick={markAllAsRead} style={{ marginBottom: "10px" }}>
                Tout marquer comme lu
              </button>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <ul>
                  {notifications.map((n) => (
                    <li
                      key={n._id}
                      style={{
                        background: n.lu ? "#eee" : "#f9f9f9",
                        margin: "5px 0",
                        padding: "10px",
                        borderRadius: "5px",
                      }}
                    >
                      <strong>{n.type}</strong>: {n.message} <br />
                      <small>{new Date(n.createdAt).toLocaleString()}</small> <br />
                      {!n.lu && (
                        <button onClick={() => markAsRead(n._id)}>Marquer comme lu</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ========================= MODAL LIVREUR ========================= */}
      {showModal && selectedColis && (
        <div className="overlay active">
          <div className="colis-container" style={{ maxWidth: 500 }}>
            <h3>Détails du colis</h3>
            <p><strong>Code :</strong> {selectedColis.codeSuivi}</p>
            <p><strong>Destinataire :</strong> {selectedColis.nomDestinataire}</p>
            <p><strong>Adresse :</strong> {selectedColis.adresseDestinataire}</p>
            <p><strong>Téléphone :</strong> {selectedColis.telephoneDestinataire}</p>
            <p><strong>Statut :</strong> {selectedColis.statut}</p>
            <p><strong>Date :</strong> {new Date(selectedColis.createdAt).toLocaleDateString()}</p>

            <h4>Position du livreur</h4>
            <div style={{ height: 300, marginTop: 10 }}>
              {livreurPos && livreurPos.latitude && livreurPos.longitude ? (
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
                <p>Chargement de la position du livreur...</p>
              )}
            </div>

            <button className="btn btn-primary" onClick={() => setShowModal(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
