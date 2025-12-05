import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ClientColis() {
  const { utilisateur } = useContext(AuthContext);
  const [colis, setColis] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [selectedColis, setSelectedColis] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

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
          `http://localhost:8001/api/notifications/${utilisateur.id}`
        );
        console.log("Notifications reçues:", res.data);
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Erreur notifications:", err.message);
      }
    };

    fetchColis();
    fetchNotifications();

    // 🔄 Mettre à jour toutes les 5s
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [utilisateur]);

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

  // 🔹 Notifications
  const markAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:8001/api/notifications/${id}/lu`);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, lu: true } : n))
      );
    } catch (err) {
      console.error("Erreur lors du marquage comme lu:", err.message);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:8001/api/notifications/${id}`);
      setNotifications(notifications.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Erreur suppression notification:", err.message);
    }
  };

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

      {/* ========================= NOTIFICATIONS ========================= */}
      <section className="notifications-section" style={{ flex: 1 }}>
        <div className="notifications-container animate-fadeIn">
          <h2>🔔 Mes Notifications</h2>
          {notifications.length === 0 ? (
            <p>Aucune notification pour le moment.</p>
          ) : (
            <ul className="notifications-list">
              {notifications.map((n) => (
                <li
                  key={n._id}
                  className={n.lu ? "notification lu" : "notification"}
                  style={{ background: n.lu ? "#eee" : "#f9f9f9", margin: "5px", padding: "10px", borderRadius: "5px" }}
                >
                  <strong>{n.type}</strong>: {n.message}
                  <div style={{ marginTop: "5px" }}>
                    {!n.lu && (
                      <button onClick={() => markAsRead(n._id)}>Marquer comme lue</button>
                    )}
                    <button onClick={() => deleteNotification(n._id)} style={{ marginLeft: "5px", color: "red" }}>Supprimer</button>
                  </div>
                  <small>{new Date(n.createdAt).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ========================= MODAL DÉTAILS COLIS ========================= */}
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

            <button className="btn btn-primary" onClick={() => setShowModal(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
