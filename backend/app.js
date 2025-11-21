require('dotenv').config();
const express = require('express');
const connecterBD = require('./config/connecterBD');
const utilisateurRoutes = require('./routes/utilisateurRoutes');
const colisRoutes = require('./routes/colisRoutes');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// 🔐 Sécurité & logs
app.use(helmet()); // sécurise les headers HTTP
app.use(cors());   // autorise les requêtes cross-origin
app.use(morgan('dev')); // logs des requêtes

// 📦 Middleware JSON
app.use(express.json());

// 🔌 Connexion à MongoDB
connecterBD();

// 🛣️ Routes
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/colis', colisRoutes);

// 🧪 Route de test
app.get('/', (req, res) => {
  res.send('✅ API TrackItNow opérationnelle');
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});