const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/Utilisateur');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé, token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 Récupérer l'utilisateur depuis la DB
    const utilisateur = await Utilisateur.findById(decoded.id);

    if (!utilisateur) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    // 🔒 BLOQUER L’ACCÈS SI UTILISATEUR BLOQUÉ
    if (utilisateur.bloque) {
      return res.status(403).json({
        message: 'Votre compte est bloqué par un administrateur'
      });
    }

    // ✅ Tout est OK
    req.utilisateur = {
      id: utilisateur._id,
      email: utilisateur.email,
      role: utilisateur.role
    };

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
};
