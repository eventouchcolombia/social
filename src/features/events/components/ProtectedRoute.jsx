import { Navigate, useLocation } from "react-router-dom";
import AuthenticationSupabase from "../../auth/components/AuthenticationSupabase";
import { useTotem } from "../../../totem/TotemContext";

const ProtectedRoute = ({ children }) => {
  const { session, loading } = AuthenticationSupabase();
  const location = useLocation();
  const { isTotemMode } = useTotem();

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

  return (
    <>
      {/* Indicador global de modo Totem en rutas protegidas */}
      {isTotemMode && (
        <div className="fixed top-4 right-4 bg-orange-500 text-white px-3 py-2 rounded-full text-sm font-semibold shadow-lg z-50">
          🔒 MODO TOTEM
        </div>
      )}
      
      {children}
    </>
  );
};

export default ProtectedRoute;