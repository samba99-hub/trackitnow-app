const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const controleur = require('../controllers/utilisateurController');
const auth = require('../middlewares/auth');
const autoriserRole = require('../middlewares/autoriserRole');

// ✅ Inscription avec rôle
router.post('/inscription', [
  body('nom').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('motDePasse').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
  body('role').optional().isIn(['admin', 'client', 'livreur']).withMessage('Rôle invalide')
], controleur.inscription);

// ✅ Connexion
router.post('/connexion', [
  body('email').isEmail().withMessage('Email invalide'),
  body('motDePasse').notEmpty().withMessage('Mot de passe requis')
], controleur.connexion);

// ✅ Route protégée simple
router.get('/profil', auth, (req, res) => {
  res.json({ message: 'Accès autorisé', utilisateur: req.utilisateur });
});

// ✅ Route protégée par rôle (admin uniquement)
router.get('/admin/dashboard', auth, autoriserRole('admin'), (req, res) => {
  res.json({ message: 'Bienvenue admin', utilisateur: req.utilisateur });
});

// ✅ Route protégée pour livreur
router.get('/livreur/colis', auth, autoriserRole('livreur'), (req, res) => {
  res.json({ message: 'Colis à livrer', utilisateur: req.utilisateur });
});

// ✅ Route protégée pour client
router.get('/client/mes-colis', auth, autoriserRole('client'), (req, res) => {
  res.json({ message: 'Vos colis', utilisateur: req.utilisateur });
});

module.exports = router;