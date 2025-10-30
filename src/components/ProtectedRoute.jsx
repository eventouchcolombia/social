import { Navigate, useLocation } from "react-router-dom";
import AuthenticationSupabase from "./AuthenticationSupabase";

const ProtectedRoute = ({ children }) => {
  const { session, loading } = AuthenticationSupabase();
  const location = useLocation();

  // Mostrar loader mientras se verifica la sesión
  if (loading) {
    return (
     <div className="fixed inset-0 flex items-center justify-center bg-white/90 z-50">
        <div className="  bg-white/80 p-4 rounded-lg  border-[#753E89] shadow flex items-center justify-center">
          <img src="/carga.gif" alt="Cargando..." className="w-15 h-15" />
        </div>
      </div>
    );
  }

  // Si no hay sesión, redirige al slug presente en la URL (si existe) o a "/"
  if (!session) {
    const parts = location.pathname.split("/").filter(Boolean);
    const slug = parts.length > 0 ? parts[0] : null;
    return slug ? <Navigate to={`/${slug}`} replace /> : <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;