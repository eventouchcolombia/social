import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Welcome from "./components/Welcome";
import Photo from "./components/Photo";
import Choose from "./components/Choose";
import Gallery from "./components/Gallery";
import Admin from "./components/Admin";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas con eventSlug */}
        <Route path="/:eventSlug" element={<Welcome />} />
        <Route path="/:eventSlug/photo" element={<Photo />} />
        <Route path="/:eventSlug/choose" element={<Choose />} />
        <Route path="/:eventSlug/gallery" element={<Gallery />} />
        <Route path="/:eventSlug/admin" element={<Admin />} />
        
        {/* Ruta por defecto - redirige al evento principal */}
        <Route path="/" element={<Welcome />} />
      </Routes>
    </Router>
  );
}

export default App;
