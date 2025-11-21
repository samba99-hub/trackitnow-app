const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Utilisateur = require('../models/Utilisateur');

mongoose.connect('mongodb://localhost:27017/trackitnow', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function creerAdmin() {
  const email = 'admin@example.com';
  const motDePasse = 'admin123';
  const nom = 'Admin Principal';

  const existant = await Utilisateur.findOne({ email });
  if (existant) {
    console.log('❌ Admin déjà existant');
    return mongoose.disconnect();
  }

  const hash = await bcrypt.hash(motDePasse, 10);
  const admin = new Utilisateur({
    nom,
    email,
    motDePasse: hash,
    role: 'admin'
  });

  await admin.save();
  console.log('✅ Admin créé avec succès');
  mongoose.disconnect();
}

creerAdmin();