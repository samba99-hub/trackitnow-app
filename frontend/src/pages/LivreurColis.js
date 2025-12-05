// LivreurColis.js
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function LivreurColis() {
  const { utilisateur } = useContext(AuthContext);
  const [colisDispo, setColisDispo] = useState([]);
  const [mesColis, setMesColis] = useState([]);
  const [message, setMessage] = useState("");

  // 🔄 Fetch des colis pour le livreur
  const fetchColis = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/colis/livreur", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Séparer les colis disponibles et ceux déjà acceptés par le livreur
      const dispo = res.data.filter(c => !c.livreurId);
      const acceptes = res.data.filter(c => c.livreurId === utilisateur.id);

      setColisDispo(dispo);
      setMesColis(acceptes);
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors du chargement des colis");
    }
  };

  useEffect(() => {
    if (!utilisateur) return;
    fetchColis();
    const interval = setInterval(fetchColis, 5000); // refresh toutes les 5 sec
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
      fetchColis(); // rafraîchir la liste
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
      fetchColis();
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors du refus");
    }
  };

  return (
    <div className="page-container" style={{ padding: "20px" }}>
      <h2>📦 Colis à livrer</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}

      {/* Colis disponibles */}
      <h3>Colis disponibles</h3>
      {colisDispo.length === 0 ? (
        <p>Aucun colis disponible pour le moment.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
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
              <tr key={c._id} style={{ borderBottom: "1px solid #ccc" }}>
                <td>{c.codeSuivi}</td>
                <td>{c.nomDestinataire}</td>
                <td>{c.adresseDestinataire}</td>
                <td>
                  <button onClick={() => handleAccepter(c)} style={{ marginRight: "5px" }}>
                    Accepter
                  </button>
                  <button onClick={() => handleRefuser(c)}>Refuser</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Mes colis acceptés */}
      <h3>Mes colis acceptés</h3>
      {mesColis.length === 0 ? (
        <p>Vous n'avez accepté aucun colis pour le moment.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
              <tr key={c._id} style={{ borderBottom: "1px solid #ccc" }}>
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
