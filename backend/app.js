require('dotenv').config();
const express = require('express');
const connecterBD = require('./config/connecterBD');
const utilisateurRoutes = require('./routes/utilisateurRoutes');
const colisRoutes = require('./routes/colisRoutes');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { notifySystem, getUserNotifications, markNotificationRead } = require('./services/notificationService'); // 🔔 Import notifications
const adminRoutes = require('./routes/adminRoutes');


const app = express();

// 🔐 Sécurité & logs
app.use(helmet()); 
app.use(cors());   
app.use(morgan('dev')); 


// 📦 Middleware JSON
app.use(express.json());

// 🔌 Connexion à MongoDB
connecterBD();

// 🛣️ Routes principales
app.use('/api/admin', adminRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/colis', colisRoutes);

// 🧪 Route de test API
app.get('/', (req, res) => {
  res.send('✅ API TrackItNow opérationnelle');
});


// 📥 Récupérer les notifications d’un utilisateur
app.get('/api/notifications/:utilisateurId', async (req, res) => {
  try {
    const utilisateurId = req.params.utilisateurId;
    const notifications = await getUserNotifications(utilisateurId);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", erreur: err.message });
  }
});

// 📥 Marquer une notification comme lue
app.patch('/api/notifications/:id/lu', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await markNotificationRead(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", erreur: err.message });
  }
});

// 🔔 Envoyer une notification système (admin)
app.post('/api/notifications/systeme', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await notifySystem(message);
    res.json({ message: "Notification système envoyée", result });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", erreur: err.message });
  }
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});