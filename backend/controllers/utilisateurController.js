const Utilisateur = require('../models/Utilisateur');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// ✅ Inscription
exports.inscription = async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    return res.status(400).json({ erreurs: erreurs.array() });
  }

  const { nom, email, motDePasse, role } = req.body;

  // 🔐 Ajout 1 : Interdire le rôle admin
  if (role === 'admin') {
    return res.status(403).json({ message: 'L’inscription en tant qu’admin est interdite' });
  }

  // 🔐 Ajout 2 : Vérifier la longueur du mot de passe
  if (motDePasse.length < 6) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    const utilisateurExistant = await Utilisateur.findOne({ email });
    if (utilisateurExistant) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const hash = await bcrypt.hash(motDePasse, 10);
    const nouvelUtilisateur = new Utilisateur({
      nom,
      email,
      motDePasse: hash,
      role: role || 'client' // rôle par défaut
    });

    await nouvelUtilisateur.save();

    res.status(201).json({ message: 'Inscription réussie' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
};

// ✅ Connexion
exports.connexion = async (req, res) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    return res.status(400).json({ erreurs: erreurs.array() });
  }

  const { email, motDePasse } = req.body;

  try {
    const utilisateur = await Utilisateur.findOne({ email });
    if (!utilisateur) {
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!valide) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      {
        id: utilisateur._id,
        email: utilisateur.email,
        role: utilisateur.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      utilisateur: {
        id: utilisateur._id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message });
  }
};