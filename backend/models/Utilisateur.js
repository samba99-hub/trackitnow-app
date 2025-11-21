const mongoose = require('mongoose');

const schemaUtilisateur = new mongoose.Schema({
  nom: { type: String, required: true },
  //prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'client', 'livreur'],
    default: 'client'
  }
});

module.exports = mongoose.model('Utilisateur', schemaUtilisateur);