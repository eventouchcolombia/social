import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";
import { useEffect, useState } from "react";
import useAuthenticationSupabase from "./AuthenticationSupabase";
import { loadEventTexts } from "../utils/uploadAsset";
import Modals from "../components/Modals";

// 🎨 Configuración de estilos por evento
const themes = {
  fabian: {
    title: "text-[#BFA065]",
    button: "bg-yellow-100 text-[#BFA065] hover:bg-yellow-300",
  },
  // 🎉 Agregas aquí más estilos personalizados
};

// 🎨 Tema por defecto (para rutas que no tengan personalización)
const defaultTheme = {
  title: "text-black",
  button: "bg-[#753E89] text-white hover:bg-purple-800",
};

const Welcome = () => {
  const navigate = useNavigate();
  const { eventSlug, getAssetUrl } = useEvent();
  const { isAdmin } = useAuthenticationSupabase();
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [eventTexts, setEventTexts] = useState({
    title: "EventPhotos",
    subtitle: "",
  });

  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Selecciona el tema según la ruta, o usa el default
  const theme = themes[eventSlug] || defaultTheme;

  useEffect(() => {
    const loadAssets = async () => {
      // Cargar background con fallback si no hay bg en firebase
      const url = await getAssetUrl("background.png");
      if (url) {
        setBackgroundUrl(url);
      } else {
        setBackgroundUrl("/Mobile.png"); // fallback local desde public
      }

      // Cargar textos personalizados
      const texts = await loadEventTexts(eventSlug);
      setEventTexts(texts);
    };
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-between min-h-screen bg-cover bg-center px-4 relative"
      style={{
        backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none",
      }}
    >
      {/* Botón Admin flotante - solo visible para administradores */}
      {isAdmin && (
        <button
          onClick={() => navigate(`/${eventSlug}/admin`)}
          className="fixed top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition z-50 flex items-center gap-2 text-sm font-medium"
          title="Ir al Panel de Administración"
        >
          🔧 Panel Admin
        </button>
      )}

      {/* Título del evento */}
      <div className="text-center mt-8">
        <h1 className={`text-4xl font-bold text-white ${theme.title}`}>
          {eventTexts.title}
        </h1>
        {eventTexts.subtitle && (
          <p className={`text-lg mt-4 ${theme.title} opacity-80`}>
            {eventTexts.subtitle}
          </p>
        )}
      </div>

      {/* 📦 Card de bienvenida */}
      <div className="bg-white/60 rounded-2xl p-4 text-center max-w-md mx-auto mt-12 mb-6">
        <h1 className="text-sm font-semibold text-gray-800">
          ¡Bienvenido a nuestro photobooth digital!
        </h1>
        <p className="text-gray-600 mt-2">
          Captura momentos increíbles y llévatelos contigo.
        </p>

        {/* Botón principal */}
        <button
          className={`mt-6 px-6 py-3 w-full font-bold rounded-full text-lg transition bg-[#753E89]  hover:bg-purple-800 ${theme.button}`}
          onClick={() => navigate(`/${eventSlug}/choose`)}
        >
          Comenzar
        </button>

        {/* Enlace secundario */}
        <button
          className="mt-4 text-sm font-semibold text-gray-800 underline"
          onClick={() => setIsModalOpen(true)}
        >
          ¿Cómo funciona?
        </button>
      </div>

      {/* Modal */}
      <Modals isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
    </div>
  );
};

export default Welcome;
