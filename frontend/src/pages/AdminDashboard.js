import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    utilisateurs: { total: 0, admins: 0, clients: 0, livreurs: 0, derniers: [] },
    colis: { total: 0, parStatut: [], derniers: [] }
  });
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [colis, setColis] = useState([]);
  const [statsColisParJour, setStatsColisParJour] = useState([]);
  const [erreur, setErreur] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [searchColis, setSearchColis] = useState("");

  const navigate = useNavigate();

  const headers = useMemo(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  }, [navigate]);

  useEffect(() => {
    if (!headers.Authorization) return;

    axios.get("http://localhost:5000/api/admin/dashboard", { headers })
      .then(res => setStats(res.data))
      .catch(err => setErreur(err.response?.data?.message || "Erreur API"));

    axios.get("http://localhost:5000/api/admin/utilisateurs", { headers })
      .then(res => setUtilisateurs(res.data || []))
      .catch(err => console.error(err));

    axios.get("http://localhost:5000/api/admin/colis", { headers })
      .then(res => setColis(res.data || []))
      .catch(err => console.error(err));

    axios.get("http://localhost:5000/api/admin/stats/colis-par-jour", { headers })
      .then(res => setStatsColisParJour(res.data || []))
      .catch(err => console.error(err));
  }, [headers]);

  const toggleBloquer = async (id) => {
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/admin/utilisateurs/${id}/bloquer`,
        {},
        { headers }
      );
      alert(res.data.message);
      setUtilisateurs(prev =>
        prev.map(u => u._id === id ? { ...u, bloque: !u.bloque } : u)
      );
    } catch {
      alert("Erreur lors du blocage");
    }
  };

  const resetPassword = async (id) => {
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/admin/utilisateurs/${id}/reset-password`,
        {},
        { headers }
      );
      alert(`Mot de passe temporaire : ${res.data.motDePasseTemporaire}`);
    } catch {
      alert("Erreur lors de la réinitialisation");
    }
  };

  const chartData = Array.isArray(statsColisParJour) && statsColisParJour.length > 0
    ? statsColisParJour
    : [{ _id: "2025-12-13", total: 0 }, { _id: "2025-12-14", total: 0 }];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="min-h-screen p-8 bg-gray-900 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-white text-center">Dashboard Administrateur</h1>
      {erreur && <p className="text-red-500 mb-4 text-center">{erreur}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Colonne gauche : Stats et graphiques */}
        <div className="flex flex-col gap-6">

          <div className="grid grid-cols-2 gap-6">
            {["total", "admins", "clients", "livreurs"].map((type, idx) => (
              <div key={idx} className="neon-card flex flex-col items-center p-6">
                <p className="text-gray-400 mb-2 text-center">
                  {type === "total" ? "Total utilisateurs" : type.charAt(0).toUpperCase() + type.slice(1)}
                </p>
                <p className="text-3xl font-bold text-glow text-center">{stats.utilisateurs[type] || 0}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="neon-card flex flex-col items-center p-6">
              <p className="text-gray-400 mb-2 text-center">Total colis</p>
              <p className="text-3xl font-bold text-glow text-center">{stats.colis.total || 0}</p>
            </div>
            {(stats.colis.parStatut || []).map((s, idx) => (
              <div key={idx} className="neon-card flex flex-col items-center p-6">
                <p className="text-gray-400 mb-2 text-center">{s._id || "Sans statut"}</p>
                <p className="text-3xl font-bold text-glow text-center">{s.count || 0}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">

            {/* Colis par jour */}
            <div className="neon-card p-6">
              <h2 className="text-xl font-semibold mb-4 text-white text-center">Colis par jour</h2>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} key={chartData.length}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Répartition des rôles */}
            <div className="neon-card p-6">
              <h2 className="text-xl font-semibold mb-4 text-white text-center">Répartition des rôles</h2>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Admins", value: stats.utilisateurs.admins },
                        { name: "Clients", value: stats.utilisateurs.clients },
                        { name: "Livreurs", value: stats.utilisateurs.livreurs }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {[stats.utilisateurs.admins, stats.utilisateurs.clients, stats.utilisateurs.livreurs].map(
                        (_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Colis par statut */}
            <div className="neon-card p-6">
              <h2 className="text-xl font-semibold mb-4 text-white text-center">Colis par statut</h2>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.colis.parStatut || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00ffff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

        {/* Colonne droite : Utilisateurs et Colis */}
        <div className="flex flex-col gap-6">

          {/* Utilisateurs */}
          <div className="neon-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-white text-center">Utilisateurs</h2>
            <input
              type="text"
              placeholder="Rechercher utilisateur..."
              className="input-neon mb-4"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
            {(utilisateurs || []).filter(u =>
              u.nom.toLowerCase().includes(searchUser.toLowerCase()) ||
              u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
              u.role.toLowerCase().includes(searchUser.toLowerCase())
            ).length === 0 ? (
              <p className="text-gray-400 text-center">Aucun utilisateur</p>
            ) : (
              <table className="table w-full text-white border-collapse border border-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="border border-gray-600 p-2">Nom</th>
                    <th className="border border-gray-600 p-2">Email</th>
                    <th className="border border-gray-600 p-2">Rôle</th>
                    <th className="border border-gray-600 p-2">Bloqué</th>
                    <th className="border border-gray-600 p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {utilisateurs.filter(u =>
                    u.nom.toLowerCase().includes(searchUser.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
                    u.role.toLowerCase().includes(searchUser.toLowerCase())
                  ).map(u => (
                    <tr key={u._id} className="hover:bg-gray-800">
                      <td className="border border-gray-600 p-2">{u.nom}</td>
                      <td className="border border-gray-600 p-2">{u.email}</td>
                      <td className="border border-gray-600 p-2">{u.role}</td>
                      <td className="border border-gray-600 p-2">{u.bloque ? "Oui" : "Non"}</td>
                      <td className="flex gap-2 border border-gray-600 p-2 flex-wrap">
                        <button onClick={() => toggleBloquer(u._id)} className="btn-neon">
                          {u.bloque ? "Débloquer" : "Bloquer"}
                        </button>
                        <button onClick={() => resetPassword(u._id)} className="btn-neon">
                          Réinitialiser MD
                        </button>
                        <button onClick={() => alert(`Profil de ${u.nom}\nEmail: ${u.email}\nRôle: ${u.role}`)}
                          className="btn-neon">
                          Voir profil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Colis */}
          <div className="neon-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-white text-center">Colis</h2>
            <input
              type="text"
              placeholder="Rechercher colis..."
              className="input-neon mb-4"
              value={searchColis}
              onChange={(e) => setSearchColis(e.target.value)}
            />
            {(colis || []).filter(c =>
              c.codeSuivi.toLowerCase().includes(searchColis.toLowerCase()) ||
              c.nomDestinataire.toLowerCase().includes(searchColis.toLowerCase()) ||
              c.statut.toLowerCase().includes(searchColis.toLowerCase())
            ).length === 0 ? (
              <p className="text-gray-400 text-center">Aucun colis</p>
            ) : (
              <table className="table w-full text-white border-collapse border border-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="border border-gray-600 p-2">Code</th>
                    <th className="border border-gray-600 p-2">Destinataire</th>
                    <th className="border border-gray-600 p-2">Statut</th>
                    <th className="border border-gray-600 p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {colis.filter(c =>
                    c.codeSuivi.toLowerCase().includes(searchColis.toLowerCase()) ||
                    c.nomDestinataire.toLowerCase().includes(searchColis.toLowerCase()) ||
                    c.statut.toLowerCase().includes(searchColis.toLowerCase())
                  ).map(c => (
                    <tr key={c._id} className="hover:bg-gray-800">
                      <td className="border border-gray-600 p-2">{c.codeSuivi}</td>
                      <td className="border border-gray-600 p-2">{c.nomDestinataire}</td>
                      <td className="border border-gray-600 p-2">{c.statut}</td>
                      <td className="border border-gray-600 p-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
