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
        <Route path="/" element={<Welcome />} />
        <Route path="/photo" element={<Photo />} />
        <Route path="/choose" element={<Choose />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/admn" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
