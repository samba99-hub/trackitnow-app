import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <h3>TrackItNow</h3>
          <p>© 2025 Tous droits réservés</p>
        </div>
        <div>
          <Link to="/" className="footer-link">Accueil</Link> | 
          <Link to="/inscription" className="footer-link">Inscription</Link> | 
          <Link to="/login" className="footer-link">Connexion</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
