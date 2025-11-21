import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // ✅ export nommé correct

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token); // 🔹 fonction importée correctement
        setUtilisateur(decoded);
      } catch (err) {
        console.error('Token invalide ou expiré');
        localStorage.removeItem('token');
        setUtilisateur(null);
      }
    }

    const handleUnload = () => {
      localStorage.removeItem('token');
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <AuthContext.Provider value={{ utilisateur, setUtilisateur }}>
      {children}
    </AuthContext.Provider>
  );
};
