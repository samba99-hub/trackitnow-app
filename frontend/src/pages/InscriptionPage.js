import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const InscriptionPage = () => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [role, setRole] = useState('client');
  const [erreur, setErreur] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setNom('');
    setEmail('');
    setMotDePasse('');
    setRole('client');
    setErreur('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    if (!nom || !email || !motDePasse) {
      setErreur('Tous les champs sont obligatoires');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/utilisateurs/inscription', {
        nom,
        email,
        motDePasse,
        role,
      });
      navigate('/login');
    } catch (err) {
      setErreur(
        err.response?.data?.message ||
        err.response?.data?.erreur ||
        'Erreur serveur'
      );
    }
  };

  return (
    <div className="page-container">
      <div className="auth-container">
        <h2>Créer un compte</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="client">Client</option>
            <option value="livreur">Livreur</option>
          </select>
          <button type="submit"><span>S’inscrire</span></button>
        </form>
        {erreur && <p className="erreur">{erreur}</p>}
        <p>
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default InscriptionPage;
