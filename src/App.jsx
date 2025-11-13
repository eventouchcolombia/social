import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./supabaseClient";
import Welcome from "./components/Welcome";
import Photo from "./components/Photo";
import Choose from "./components/Choose";
import Gallery from "./components/Gallery";
import Admin from "./components/Admin";
import SuperAdmin from "./components/SuperAdmin";
import ProtectedRoute from "./components/ProtectedRoute";
import RedirectToEventLocal from "./components/RedirectEventLocal";
import Begin from "./components/Begin";
import PerfilUser from "./components/PerfilUser";
import Register from "./components/Register";

function App() {
  // 👇 Escucha los eventos de sesión
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth event:", event);
          console.log("Session actual:", session);

        if (event === "TOKEN_REFRESHED") {
          console.log("🔁 Token renovado automáticamente");
        }

        if (event === "SIGNED_OUT") {
          console.log("🚪 Usuario cerró sesión");
        }
      }
    );

    // Limpieza del listener al desmontar
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* ahora Begin es la pantalla de inicio; Welcome se monta en /:eventSlug */}
        <Route path="/" element={<Begin />} />
        <Route path="/:eventSlug" element={<Welcome />} />
        <Route path="/admin/:identificador/:eventSlug" element={<Admin />} />
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<PerfilUser />} />

        {/* Rutas protegidas agrupadas */}
        <Route
          element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/:eventSlug/photo" element={<Photo />} />
          <Route path="/:eventSlug/choose" element={<Choose />} />
          <Route path="/:eventSlug/gallery" element={<Gallery />} />
        </Route>

        {/* ruta fallback: cualquier ruta no existente redirige al último slug guardado */}
        <Route path="*" element={<RedirectToEventLocal />} />
      </Routes>
    </Router>
  );
}

export default App;
