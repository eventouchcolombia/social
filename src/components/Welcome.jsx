import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";
import { useEffect, useState } from "react";
import useAuthenticationSupabase from "./AuthenticationSupabase";
import { loadEventTexts } from "../utils/uploadAsset";
import Modals from "../components/Modals";
import { supabase } from "../supabaseClient";

// 🎨 Configuración de estilos por evento
const themes = {
  fabian: {
    title: "text-[#BFA065]",
    button: "bg-yellow-100 text-[#BFA065] hover:bg-yellow-300",
  },
};

const defaultTheme = {
  title: "text-black",
  button: "bg-[#753E89] text-white hover:bg-purple-800",
};

const Welcome = () => {
  const navigate = useNavigate();
  const { eventSlug, getAssetUrl } = useEvent();
  const { isAdmin, signInWithGoogle, session } = useAuthenticationSupabase();
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [eventTexts, setEventTexts] = useState({
    title: "EventPhotos",
    subtitle: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = themes[eventSlug] || defaultTheme;

  // 🔹 Cargar assets y textos del evento
  useEffect(() => {
    const loadAssets = async () => {
      const url = await getAssetUrl("background.png");
      setBackgroundUrl(url || "/Mobile.png");

      const texts = await loadEventTexts(eventSlug);
      setEventTexts(texts);
    };
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 Revisar si hay usuario logueado
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("❌ Error obteniendo usuario:", error.message);
      } else if (data?.user) {
        console.log("✅ Usuario logueado:", data.user);
      }
    };
    checkUser();
  }, [session]);

  // 🔹 Manejo del botón comenzar
  const handleStart = async () => {
    const { data,  } = await supabase.auth.getUser();

    if (data?.user) {
      // Ya logueado → navega directo
      navigate(`/${eventSlug}/choose`);
    } else {
      // No logueado → inicia login Google
      await signInWithGoogle();
      // El navigate ocurrirá automáticamente cuando vuelva con sesión
    }
  };

  // 🔹 Redirección automática si ya hay sesión activa
  useEffect(() => {
    if (session?.user) {
      navigate(`/${eventSlug}/choose`);
    }
  }, [session, navigate, eventSlug]);

  return (
    <div
      className="flex flex-col items-center justify-between min-h-screen bg-cover bg-center px-4 relative"
      style={{
        backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none",
      }}
    >
      {isAdmin && (
        <button
          onClick={() => navigate(`/${eventSlug}/admin`)}
          className="fixed top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition z-50 flex items-center gap-2 text-sm font-medium"
        >
          🔧 Panel Admin
        </button>
      )}

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

      <div className="bg-white/60 rounded-2xl p-4 text-center max-w-md mx-auto mt-12 mb-6">
        <h1 className="text-sm font-semibold text-gray-800">
          ¡Bienvenido a nuestro photobooth digital!
        </h1>
        <p className="text-gray-600 mt-2">
          Captura momentos increíbles y llévatelos contigo.
        </p>

        <button
          className={`mt-6 px-6 py-3 w-full font-bold rounded-full text-lg transition ${theme.button}`}
          onClick={handleStart}
        >
          Comenzar
        </button>

        <button
          className="mt-4 text-sm font-semibold text-gray-800 underline"
          onClick={() => setIsModalOpen(true)}
        >
          ¿Cómo funciona?
        </button>
      </div>

      <Modals isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Welcome;
