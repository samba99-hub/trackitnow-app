import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function CreerColis() {
  const { utilisateur } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Vérifie si on vient d'un clic "Modifier"
  const colisModif = location.state?.colis;

  const [form, setForm] = useState({
    nomDestinataire: "",
    adresseDestinataire: "",
    emailDestinataire: "",
    telephoneDestinataire: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (colisModif) {
      setForm({
        nomDestinataire: colisModif.nomDestinataire || "",
        adresseDestinataire: colisModif.adresseDestinataire || "",
        emailDestinataire: colisModif.emailDestinataire || "",
        telephoneDestinataire: colisModif.telephoneDestinataire || "",
      });
    }
  }, [colisModif]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifie que l'utilisateur est connecté
    if (!utilisateur) {
      setMessage("❌ Vous devez être connecté !");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (colisModif?._id) {
        // Modification d’un colis existant
        await axios.put(
          `http://localhost:5000/api/colis/${colisModif._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage("✏️ Colis modifié avec succès !");
      } else {
        // Création d’un nouveau colis
        await axios.post(
          "http://localhost:5000/api/colis",
          { ...form, nomExpediteur: utilisateur.nom },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage("✅ Colis créé avec succès !");
        setForm({
          nomDestinataire: "",
          adresseDestinataire: "",
          emailDestinataire: "",
          telephoneDestinataire: "",
        });
      }

      // Redirection après 1.5 secondes
      setTimeout(() => navigate("/client/mes-colis"), 1500);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "❌ Erreur lors de l'envoi du colis"
      );
    }
  };

  return (
    <div className="colis-container">
      <h2>{colisModif ? "✏️ Modifier le colis" : "➕ Créer un colis"}</h2>

      <form onSubmit={handleSubmit} className="colis-form">
        <input
          type="text"
          name="nomDestinataire"
          placeholder="Nom Destinataire"
          value={form.nomDestinataire}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="adresseDestinataire"
          placeholder="Adresse Destinataire"
          value={form.adresseDestinataire}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="emailDestinataire"
          placeholder="Email Destinataire"
          value={form.emailDestinataire}
          onChange={handleChange}
        />
        <input
          type="tel"
          name="telephoneDestinataire"
          placeholder="Téléphone Destinataire"
          value={form.telephoneDestinataire}
          onChange={handleChange}
        />
        <button type="submit">{colisModif ? "Modifier" : "Valider"}</button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
