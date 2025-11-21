const express = require('express');
const router = express.Router();
const controleur = require('../controllers/colisController');
const auth = require('../middlewares/auth');

// Création d’un colis (client connecté)
router.post('/', auth, controleur.creerColis);

// Suivi public d’un colis par code
router.get('/suivi/:codeSuivi', controleur.suivreColis);

// Mise à jour du statut (livreur ou admin)
router.put('/statut/:codeSuivi', auth, controleur.mettreAJourStatut);

// ✅ Modification d’un colis complet (client)
router.put('/:id', auth, controleur.modifierColis);

// Suppression d’un colis
router.delete('/:codeSuivi', auth, controleur.supprimerColis);

// Recherche avancée (admin)
router.get('/recherche', auth, controleur.rechercherColis);

// Statistiques dashboard (admin)
router.get('/dashboard', auth, controleur.dashboardColis);

// Génération de QR code
router.get('/qrcode/:codeSuivi', auth, controleur.qrCodeColis);

// ✅ Liste des colis d’un client connecté
router.get('/client/:id', auth, controleur.getColisClient);

module.exports = router;
