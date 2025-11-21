const mongoose = require('mongoose');

const schemaColis = new mongoose.Schema({
  codeSuivi: { type: String, required: true, unique: true },

  // Informations expéditeur/destinataire
  nomExpediteur: { type: String, required: true },
  nomDestinataire: { type: String, required: true },
  adresseDestinataire: { type: String, required: true },
  emailDestinataire: String,
  telephoneDestinataire: String,

  // Statut et historique
  statut: { type: String, default: 'Créé' },
  historique: [{
    statut: String,
    date: { type: Date, default: Date.now }
  }],

  // Position GPS
  positionGPS: {
    latitude: Number,
    longitude: Number
  },

  // Association au client connecté
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Colis', schemaColis);