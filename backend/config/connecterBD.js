const mongoose = require('mongoose');

const connecterBD = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');
  } catch (err) {
    console.error('❌ Échec de la connexion MongoDB :', err.message);
    process.exit(1);
  }
};

module.exports = connecterBD;