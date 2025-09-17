import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";
import { useEffect, useState } from "react";

// 🎨 Configuración de estilos por evento
const themes = {
  happybirth: {
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
  const [backgroundUrl, setBackgroundUrl] = useState(null);

  // Selecciona el tema según la ruta, o usa el default
  const theme = themes[eventSlug] || defaultTheme;

  useEffect(() => {
    const loadBackground = async () => {
      const url = await getAssetUrl("background.png");
      setBackgroundUrl(url);
    };
    loadBackground();
  }, [eventSlug, getAssetUrl]);

   

  return (
    <div
      className="flex flex-col items-center justify-between min-h-screen bg-cover bg-center px-4"
      style={{ backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none" }}
    >
      <h1
        className={`text-4xl font-bold text-center mt-8 ${theme.title}`}
      >
        EventPhotos
      </h1>

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
