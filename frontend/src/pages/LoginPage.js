import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const { setUtilisateur } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    setEmail('');
    setMotDePasse('');
    setErreur('');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErreur('');
    try {
      const res = await axios.post('http://localhost:5000/api/utilisateurs/connexion', {
        email,
        motDePasse
      });
      localStorage.setItem('token', res.data.token);
      setUtilisateur(res.data.utilisateur);
      navigate(`/${res.data.utilisateur.role}/dashboard`);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de connexion');
    }
  };

  return (
    <div className="page-container">
      <div className="auth-container">
        <h2>Connexion</h2>
        <form onSubmit={handleLogin} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={e => setMotDePasse(e.target.value)}
            required
          />
          <button type="submit"><span>Se connecter</span></button>
          {erreur && <p className="erreur">{erreur}</p>}
        </form>
        <p>
          Pas encore inscrit ? <Link to="/inscription">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
