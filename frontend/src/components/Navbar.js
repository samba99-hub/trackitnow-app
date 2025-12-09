import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaSearch } from 'react-icons/fa';

const Navbar = () => {
  const { utilisateur, setUtilisateur } = useContext(AuthContext);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUtilisateur(null);
    navigate('/login', { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Recherche:", search);
  };

  return (
    <nav className="navbar" id="navbar">
      {/* Logo */}
      <div className="logo">
        <Link to="/">
          <span>TrackItNow</span>
        </Link>
      </div>

      {/* Barre de recherche (désactivée pour l'instant) */}
      {/* 
      {utilisateur?.role === 'client' && (
        <div className="navbar-center">
          <form className="navbar-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="navbar-search"
              placeholder="Rechercher un colis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="search-btn">
              <FaSearch />
            </button>
          </form>
        </div>
      )}
      */}

      {/* Liens de navigation */}
      <ul className="nav-links">
        {!utilisateur && (
          <>
            <li><Link to="/login" className="nav-link">Connexion</Link></li>
            <li><Link to="/inscription" className="nav-link">Inscription</Link></li>
          </>
        )}

        {utilisateur?.role === 'admin' && (
          <li><Link to="/admin/dashboard" className="nav-link">Dashboard Admin</Link></li>
        )}

        {utilisateur?.role === 'client' && (
          <>
            <li><a href="#home" className="nav-link">Home</a></li>
            <li><a href="#contact" className="nav-link">Contact</a></li>
            <li><Link to="/client/mes-colis" className="nav-link">Mes Colis</Link></li>
            <li><Link to="/client/creer-colis" className="nav-link">Créer un colis</Link></li>

            {/* ✅ Lien ajouté SANS rien modifier d’autre */}
            <li><Link to="/client/notifications" className="nav-link">Notifications</Link></li>
          </>
        )}

        {utilisateur?.role === 'livreur' && (
          <li><Link to="/livreur/colis-a-livrer" className="nav-link">Colis à Livrer</Link></li>
        )}

        {utilisateur && (
          <li>
            <button onClick={handleLogout} className="btn btn-outline">Déconnexion</button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
