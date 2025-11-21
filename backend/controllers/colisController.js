const Colis = require('../models/Colis');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

// ✅ Créer un colis
exports.creerColis = async (req, res) => {
  try {
    const codeSuivi = uuidv4();
    const colis = new Colis({
      ...req.body,
      codeSuivi,
      clientId: req.utilisateur.id // 🔐 associer au client connecté
    });
    await colis.save();
    res.status(201).json({ message: 'Colis créé', codeSuivi });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
};

// ✅ Suivre un colis
exports.suivreColis = async (req, res) => {
  try {
    const { codeSuivi } = req.params;
    const colis = await Colis.findOne({ codeSuivi });
    if (!colis) return res.status(404).json({ message: 'Colis introuvable' });
    res.json({
      statut: colis.statut,
      historique: colis.historique,
      positionGPS: colis.positionGPS
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
};

// ✅ Mettre à jour le statut
exports.mettreAJourStatut = async (req, res) => {
  try {
    const { codeSuivi } = req.params;
    const { nouveauStatut, positionGPS } = req.body;
    const colis = await Colis.findOne({ codeSuivi });
    if (!colis) return res.status(404).json({ message: 'Colis introuvable' });

    colis.statut = nouveauStatut;
    colis.historique.push({ statut: nouveauStatut });
    if (positionGPS) colis.positionGPS = positionGPS;

    await colis.save();
    res.json({ message: 'Statut mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
};

// ✅ Supprimer un colis
exports.supprimerColis = async (req, res) => {
  try {
    const { codeSuivi } = req.params;
    const colis = await Colis.findOneAndDelete({ codeSuivi });
    if (!colis) return res.status(404).json({ message: 'Colis introuvable' });

    res.json({ message: 'Colis supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
};

// ✅ Rechercher des colis
exports.rechercherColis = async (req, res) => {
  try {
    const { nomDestinataire, statut, dateDebut, dateFin } = req.query;
    const filtre = {};

    if (nomDestinataire) filtre.nomDestinataire = { $regex: nomDestinataire, $options: 'i' };
    if (statut) filtre.statut = statut;
    if (dateDebut || dateFin) {
      filtre.createdAt = {};
      if (dateDebut) filtre.createdAt.$gte = new Date(dateDebut);
      if (dateFin) filtre.createdAt.$lte = new Date(dateFin);
    }

    const resultats = await Colis.find(filtre).sort({ createdAt: -1 });
    res.json(resultats);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
};

// ✅ Dashboard colis (admin)
exports.dashboardColis = async (req, res) => {
  try {
    const total = await Colis.countDocuments();
    const parStatut = await Colis.aggregate([
      { $group: { _id: "$statut", count: { $sum: 1 } } }
    ]);
    const derniers = await Colis.find().sort({ createdAt: -1 }).limit(5);

    res.json({ total, parStatut, derniers });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
};

// ✅ Générer un QR code pour le suivi
exports.qrCodeColis = async (req, res) => {
  try {
    const { codeSuivi } = req.params;
    const url = `http://localhost:5000/api/colis/suivi/${codeSuivi}`;
    const qr = await QRCode.toDataURL(url);
    res.json({ qrCode: qr });
  } catch (err) {
    res.status(500).json({ message: 'Erreur QR code', erreur: err.message });
  }
};

// ✅ Récupérer les colis d’un client
exports.getColisClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const colis = await Colis.find({ clientId }).sort({ createdAt: -1 });
    res.json(colis);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
};
// ✅ Modifier un colis (informations complètes)
exports.modifierColis = async (req, res) => {
  try {
    const { id } = req.params; 
    const updates = req.body;

    const colis = await Colis.findById(id);
    if (!colis) return res.status(404).json({ message: "Colis non trouvé" });

    // Appliquer seulement les champs envoyés
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) colis[key] = updates[key];
    });

    // Champs obligatoires
    if (!colis.nomExpediteur) colis.nomExpediteur = req.utilisateur.nom || "Expéditeur inconnu";
    if (!colis.clientId) colis.clientId = req.utilisateur.id;

    await colis.save();
    res.json({ message: "Colis modifié avec succès", colis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", erreur: err.message });
  }
};
