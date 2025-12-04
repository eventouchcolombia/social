import "./styles/App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import Welcome from "./features/events/components/Welcome";
import Photo from "./features/events/components/Photo";
import Choose from "./features/events/components/Choose";
import Gallery from "./features/events/components/Gallery";
import Admin from "./features/admin/components/Admin";
import SuperAdmin from "./features/superadmin/components/SuperAdmin";
import ProtectedRoute from "./features/events/components/ProtectedRoute";
import RedirectToEventLocal from "./features/events/components/RedirectEventLocal";
import Begin from "./features/events/components/Begin";
import PerfilUser from "./features/auth/components/PerfilUser";
import Register from "./features/auth/components/Register";

function App() {
 

  return (
    <Router>
      <Routes>
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

        <Route path="*" element={<RedirectToEventLocal />} />
      </Routes>
    </Router>
  );
}

export default App;
