const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const autoriserRole = require('../middlewares/autoriserRole');
const bcrypt = require('bcrypt');

const Utilisateur = require('../models/Utilisateur');
const Colis = require('../models/Colis');

/* =====================================================
   🔐 MIDDLEWARE GLOBAL ADMIN
===================================================== */
router.use(auth, autoriserRole('admin'));

/* =====================================================
   📊 DASHBOARD ADMIN
===================================================== */
router.get('/dashboard', async (req, res) => {
  try {
    const derniersUtilisateurs = await Utilisateur.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-motDePasse');

    const totalUtilisateurs = await Utilisateur.countDocuments();
    const admins = await Utilisateur.countDocuments({ role: 'admin' });
    const clients = await Utilisateur.countDocuments({ role: 'client' });
    const livreurs = await Utilisateur.countDocuments({ role: 'livreur' });

    const totalColis = await Colis.countDocuments();
    const parStatut = await Colis.aggregate([
      { $group: { _id: '$statut', count: { $sum: 1 } } }
    ]);
    const derniersColis = await Colis.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      utilisateurs: {
        total: totalUtilisateurs,
        admins,
        clients,
        livreurs,
        derniers: derniersUtilisateurs
      },
      colis: {
        total: totalColis,
        parStatut,
        derniers: derniersColis
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
});

/* =====================================================
   👥 GESTION DES UTILISATEURS
===================================================== */

// 📋 Tous les utilisateurs
router.get('/utilisateurs', async (req, res) => {
  const users = await Utilisateur.find().select('-motDePasse');
  res.json(users);
});

// 👤 Profil utilisateur
router.get('/utilisateurs/:id', async (req, res) => {
  const user = await Utilisateur.findById(req.params.id).select('-motDePasse');
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  res.json(user);
});

// 🔒 Bloquer / débloquer utilisateur
router.patch('/utilisateurs/:id/bloquer', async (req, res) => {
  const user = await Utilisateur.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

  user.bloque = !user.bloque;
  await user.save();

  res.json({
    message: user.bloque ? 'Utilisateur bloqué' : 'Utilisateur débloqué',
    bloque: user.bloque
  });
});

// 🎭 Modifier rôle
router.patch('/utilisateurs/:id/role', async (req, res) => {
  const { role } = req.body;

  if (!['admin', 'client', 'livreur'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }

  const user = await Utilisateur.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('-motDePasse');

  res.json({ message: 'Rôle mis à jour', utilisateur: user });
});

// 🔄 Reset mot de passe
router.patch('/utilisateurs/:id/reset-password', async (req, res) => {
  const motDePasseTemp = Math.random().toString(36).slice(-8);
  const hash = await bcrypt.hash(motDePasseTemp, 10);

  await Utilisateur.findByIdAndUpdate(req.params.id, {
    motDePasse: hash
  });

  res.json({
    message: 'Mot de passe réinitialisé',
    motDePasseTemporaire: motDePasseTemp
  });
});

// 📦 Voir colis d’un utilisateur
router.get('/utilisateurs/:id/colis', async (req, res) => {
  const colis = await Colis.find({ clientId: req.params.id })
    .sort({ createdAt: -1 });
  res.json(colis);
});

/* =====================================================
   📦 GESTION DES COLIS (ADMIN)
===================================================== */

// 📋 Tous les colis
router.get('/colis', async (req, res) => {
  const colis = await Colis.find().sort({ createdAt: -1 });
  res.json(colis);
});

// ❌ Supprimer colis
router.delete('/colis/:id', async (req, res) => {
  await Colis.findByIdAndDelete(req.params.id);
  res.json({ message: 'Colis supprimé' });
});

/* =====================================================
   🔍 RECHERCHE & FILTRES
===================================================== */
router.get('/recherche/utilisateurs', async (req, res) => {
  const { nom, email, role, bloque } = req.query;
  const filtre = {};

  if (nom) filtre.nom = { $regex: nom, $options: 'i' };
  if (email) filtre.email = { $regex: email, $options: 'i' };
  if (role) filtre.role = role;
  if (bloque !== undefined) filtre.bloque = bloque === 'true';

  const users = await Utilisateur.find(filtre).select('-motDePasse');
  res.json(users);
});

/* =====================================================
   📊 STATS AVANCÉES
===================================================== */
router.get('/stats/colis-par-jour', async (req, res) => {
  const stats = await Colis.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        total: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(stats);
});

module.exports = router;
