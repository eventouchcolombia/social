import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";

// 🎨 Configuración de estilos por evento
const themes = {
  happybirth: {
    title: "text-[#BFA065]",
    button: "bg-yellow-100 text-[#BFA065] hover:bg-yellow-300",
  },
  // 🎉 Agrega aquí más estilos personalizados por evento
};

// 🎨 Tema por defecto (para rutas que no tengan personalización)
const defaultTheme = {
  title: "text-black",
  button: "bg-black/55 text-white hover:bg-purple-600",
};

const Choose = () => {
  const navigate = useNavigate();
  const { eventSlug, getAssetUrl } = useEvent();

  // Selecciona el tema según la ruta, o usa el default
  const theme = themes[eventSlug] || defaultTheme;

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center px-4"
      style={{ backgroundImage: `url('${getAssetUrl("bgchosee.png")}')` }}
    >
      {/* Botón Ir al inicio */}
      <div
        onClick={() => navigate(`/${eventSlug}`)}
        className="absolute top-4 left-4 flex flex-col items-center cursor-pointer"
      >
        <img src="/back.png" alt="Volver" className="w-10 h-10 rounded-lg" />
        <span className="text-sm text-black font-semibold">Inicio</span>
      </div>

      {/* Título */}
      <h1
        className={`text-4xl sm:text-3xl font-bold mb-20 text-center ${theme.title}`}
      >
        ¿Qué quieres hacer primero?
      </h1>

      {/* Opciones */}
      <div className="w-full max-w-xs flex flex-col gap-4">
        <button
          onClick={() => navigate(`/${eventSlug}/photo`)}
          className={`w-full py-3 rounded-xl text-lg font-semibold shadow-md transition ${theme.button}`}
        >
          Tomate una foto
        </button>

        <button
          onClick={() => navigate(`/${eventSlug}/gallery`)}
          className={`w-full py-3 rounded-xl text-lg font-semibold shadow-md transition ${theme.button}`}
        >
          Ir a la galería
        </button>
      </div>
    </div>
  );
};

export default Choose;
