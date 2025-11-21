import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import RoleRoute from './routes/RoleRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import InscriptionPage from './pages/InscriptionPage';
import AdminDashboard from './pages/AdminDashboard';
import ClientColis from './pages/ClientColis';
import CreerColis from './pages/CreerColis';
import LivreurColis from './pages/LivreurColis';
import './App.css';

/* Routes protégées */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/inscription" element={<InscriptionPage />} />

      <Route
        path="/admin/dashboard"
        element={
          <RoleRoute role="admin">
            <AdminDashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/client/mes-colis"
        element={
          <RoleRoute role="client">
            <ClientColis />
          </RoleRoute>
        }
      />

      <Route path="/client/creer-colis" element={<CreerColis />} />

      <Route
        path="/livreur/colis-a-livrer"
        element={
          <RoleRoute role="livreur">
            <LivreurColis />
          </RoleRoute>
        }
      />
    </Routes>
  );
}

/* SECTION HOME AVEC BOUTON CONDITIONNEL */
function HomeSection() {
  const { utilisateur } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <section className="home" id="home">
      <div className="home-content">
        <h1>
          Bienvenue sur <span>TrackItNow</span>
        </h1>
        <p>
          Suivez vos colis en temps réel avec précision et rapidité 🚀
        </p>

        {!utilisateur && (
          <button className="home-btn" onClick={() => navigate('/login')}>
            Commencer
          </button>
        )}
      </div>
    </section>
  );
}

function App() {
  const location = useLocation(); // Hook pour récupérer le chemin actuel

  // Vérifie si on est sur Login ou Inscription
  const showHome = location.pathname !== '/login' && location.pathname !== '/inscription';

  return (
    <AuthProvider>
      {/* FOND FUTURISTE */}
      <div className="bg-grid"></div>
      <div className="bg-glow top-right"></div>
      <div className="bg-glow bottom-left"></div>

      {/* NAVBAR */}
      <Navbar />

      {/* HOME : affiché uniquement si showHome est true */}
      {showHome && <HomeSection />}

      {/* PAGES */}
      <AppRoutes />

      {/* FOOTER */}
      <Footer />
    </AuthProvider>
  );
}

/* Comme useLocation ne peut pas être utilisé directement dans App avec BrowserRouter autour, on encapsule App */
export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
