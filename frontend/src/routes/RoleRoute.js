import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RoleRoute = ({ role, children }) => {
  const { utilisateur } = useContext(AuthContext);
  return utilisateur?.role === role ? children : <Navigate to="/unauthorized" />;
};

export default RoleRoute;