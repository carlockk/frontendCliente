import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const { isLogged } = useAuth();

  return isLogged ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
