import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";
import { useEffect, useState } from "react";
import useAuthenticationSupabase from "./AuthenticationSupabase";
import { loadEventTexts } from "../utils/uploadAsset";

// 🎨 Configuración de estilos por evento
const themes = {
  fabian: {
    title: "text-[#BFA065]",
    button: "bg-yellow-100 text-[#BFA065] hover:bg-yellow-300",
  }
  // 🎉 Agregas aquí más estilos personalizados
};

// 🎨 Tema por defecto (para rutas que no tengan personalización)
const defaultTheme = {
  title: "text-black",
  button: "bg-black/40 text-white hover:bg-black/60",
};

const Welcome = () => {
  const navigate = useNavigate();
  const { eventSlug, getAssetUrl } = useEvent();
  const { isAdmin } = useAuthenticationSupabase();
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [eventTexts, setEventTexts] = useState({
    title: "EventPhotos",
    subtitle: ""
  });

  // Selecciona el tema según la ruta, o usa el default
  const theme = themes[eventSlug] || defaultTheme;

  useEffect(() => {
    const loadAssets = async () => {
      // Cargar background
      const url = await getAssetUrl("background.png");
      setBackgroundUrl(url);
      
      // Cargar textos personalizados
      const texts = await loadEventTexts(eventSlug);
      setEventTexts(texts);
    };
    loadAssets();
  }, [eventSlug, getAssetUrl]);

   

  return (
    <div
      className="flex flex-col items-center justify-between min-h-screen bg-cover bg-center px-4 relative"
      style={{ backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none" }}
    >
      {/* Botón Admin flotante - solo visible para administradores */}
      {isAdmin && (
        <button
          onClick={() => navigate(`/${eventSlug}/admin`)}
          className="fixed top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition z-50 flex items-center gap-2 text-sm font-medium"
          title="Ir al Panel de Administración"
        >
          🔧 Panel Admin
        </button>
      )}

      <div className="text-center mt-8">
        <h1
          className={`text-4xl font-bold ${theme.title}`}
        >
          {eventTexts.title}
        </h1>
        {eventTexts.subtitle && (
          <p className={`text-lg mt-4 ${theme.title} opacity-80`}>
            {eventTexts.subtitle}
          </p>
        )}
      </div>

      <div className="mb-16">
        <button
          className={`px-4 py-2 w-56 h-14 font-bold rounded-3xl text-2xl shadow-xl transition ${theme.button}`}
          onClick={() => navigate(`/${eventSlug}/choose`)}
        >
          Comenzar!
        </button>
      </div>
    </div>
  );
};

export default Welcome;
