import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ClientColis() {
  const { utilisateur } = useContext(AuthContext);
  const [colis, setColis] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [selectedColis, setSelectedColis] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColis = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/colis/client/${utilisateur.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setColis(res.data);
      } catch (err) {
        setMessage(err.response?.data?.message || "Erreur lors du chargement");
      }
    };
    if (utilisateur) fetchColis();
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

  return (
    <div className="page-container">
      {/* =========================
            MES COLIS SECTION
      ========================= */}
      <section className="mescolis-section">
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
                      <button
                        className="btn btn-view"
                        onClick={() => handleView(c)}
                      >
                        <FaEye /> Voir
                      </button>
                      <button
                        className="btn btn-edit"
                        onClick={() => handleEdit(c)}
                      >
                        <FaEdit /> Modifier
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDelete(c)}
                      >
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

      {/* =========================
            CONTACT SECTION (inchangé)
      ========================= */}
      <section id="contact" className="contact-section">
        <div className="contact-card info-card animate-fadeIn">
          <h2>Contact Information</h2>
          <div className="contact-item">
            <i className="icon">📍</i>
            <div>
              <strong>Address</strong>
              <p>
                100 Tech Plaza, Innovation District
                <br />
                San Francisco, CA 94103
              </p>
            </div>
          </div>
          <div className="contact-item">
            <i className="icon">📧</i>
            <div>
              <strong>Email</strong>
              <p>
                <a href="mailto:info@futurenav.com">info@futurenav.com</a>
              </p>
            </div>
          </div>
          <div className="contact-item">
            <i className="icon">📞</i>
            <div>
              <strong>Phone</strong>
              <p>+1 (415) 555-2671</p>
            </div>
          </div>

          <div className="socials">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="#">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="contact-card form-card animate-fadeIn">
          <h2>Send us a message</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Message envoyé !");
            }}
          >
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input type="text" placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="john@example.com" required />
              </div>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input type="text" placeholder="How can we help you?" required />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea rows="5" placeholder="Write your message here..." required></textarea>
            </div>
            <button type="submit" className="contact-submit">
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* =========================
            MODAL DÉTAILS COLIS
      ========================= */}
      {showModal && selectedColis && (
        <div className="overlay active">
          <div className="colis-container" style={{ maxWidth: 500 }}>
            <h3>Détails du colis</h3>
            <p>
              <strong>Code :</strong> {selectedColis.codeSuivi}
            </p>
            <p>
              <strong>Destinataire :</strong> {selectedColis.nomDestinataire}
            </p>
            <p>
              <strong>Adresse :</strong> {selectedColis.adresseDestinataire}
            </p>
            <p>
              <strong>Téléphone :</strong> {selectedColis.telephoneDestinataire}
            </p>
            <p>
              <strong>Statut :</strong> {selectedColis.statut}
            </p>
            <p>
              <strong>Date :</strong>{" "}
              {new Date(selectedColis.createdAt).toLocaleDateString()}
            </p>
            <button className="btn btn-primary" onClick={() => setShowModal(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
