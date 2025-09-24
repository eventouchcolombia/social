import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";
import { useEffect, useState } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import useAuthenticationSupabase from "./AuthenticationSupabase";

// 🎨 Configuración de estilos por evento
const themes = {
  fabian: {
    title: "text-[#8C6A2F]",
    button: "bg-yellow-100 text-[#8C6A2F] hover:bg-yellow-300",
  },
  // 🎉 Agrega aquí más estilos personalizados por evento
};

// 🎨 Tema por defecto (para rutas que no tengan personalización)
const defaultTheme = {
  title: "text-black",
  button: "text-white bg-[#753E89]",
};

const Choose = () => {
  const { signOut, session } = useAuthenticationSupabase(); // 👈 traemos la sesión completa
  const navigate = useNavigate();
  const { eventSlug, getAssetUrl } = useEvent();

  const [backgroundUrl, setBackgroundUrl] = useState(null);

  // Selecciona el tema según la ruta, o usa el default
  const theme = themes[eventSlug] || defaultTheme;

  useEffect(() => {
    const loadBackground = async () => {
      const url = await getAssetUrl("bgchosee.png");
      setBackgroundUrl(url || "/Mobile.png"); // fallback local desde public
    };
    loadBackground();
  }, [eventSlug, getAssetUrl]);

  // 👤 Usuario actual
  const user = session?.user;

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center px-4"
      style={{
        backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none",
        minHeight: "100dvh",
      }}
    >
      {/* Header con usuario + logout */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        {/* 👤 Usuario logueado */}
        {user && (
          <div className="flex items-center gap-2  px-3 py-1 rounded-lg ">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="w-8 h-8 rounded-full border"
              />
            )}
            <span className="text-sm font-semibold text-black">
              {user.user_metadata?.name ||
                user.user_metadata?.full_name ||
                user.email}
            </span>
          </div>
        )}

        {/* 🔴 Botón cerrar sesión */}
        <button
          onClick={async () => {
            await signOut(); // cerrar sesión en Supabase
           navigate(`/${eventSlug}`); // redirigir al inicio
          }}
          className="cursor-pointer"
        >
          <img
            src="/Log_Out.png"
            alt="Cerrar sesión"
            className="w-10 h-10 rounded-lg"
          />
        </button>
      </div>

      {/* Caja inferior */}
      <div className="w-[109%] bg-white rounded-t-3xl shadow-lg p-4 flex flex-col mt-138">
        <h1 className="text-lg text-left font-bold mb-6 text-black">
          ¿Qué quieres hacer?
        </h1>

        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={() => navigate(`/${eventSlug}/photo`)}
            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl font-semibold shadow-md hover:bg-purple-800 transition ${theme.button}`}
          >
            <Camera size={28} />
            <span>Tomar foto</span>
          </button>

          <button
            onClick={() => navigate(`/${eventSlug}/gallery`)}
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl bg-purple-100 text-[#753E89] font-semibold shadow-md hover:bg-purple-200 transition"
          >
            <ImageIcon size={28} />
            <span>Ver galería</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Choose;
