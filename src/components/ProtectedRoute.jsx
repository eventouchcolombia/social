import { Navigate } from "react-router-dom";
import AuthenticationSupabase from "./AuthenticationSupabase";

const ProtectedRoute = ({ children }) => {
  const { session } = AuthenticationSupabase();

  // 🚫 Si no hay sesión, redirige al inicio del evento
  if (!session) {
    return <Navigate to="/" replace />;
  }

  // ✅ Si está autenticado, renderiza el contenido
  return children;
};

export default ProtectedRoute;
