import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";
import { useEffect, useState } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import useAuthenticationSupabase from "../../auth/components/AuthenticationSupabase";
import { supabase } from "../../../config/supabaseClient";
import { useTotem } from "../../../totem/TotemContext";

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
  const { signOut, session } = useAuthenticationSupabase();
  const navigate = useNavigate();
  const { eventSlug, getAssetUrl } = useEvent();
  const { isTotemMode } = useTotem();

  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [primaryColor, setPrimaryColor] = useState("#753E89");
  const [isLoading, setIsLoading] = useState(true); // 🔹 Estado de carga

  // Selecciona el tema según la ruta, o usa el default
  // eslint-disable-next-line no-unused-vars
  const theme = themes[eventSlug] || defaultTheme;

  useEffect(() => {
    const loadBackground = async () => {
      const url = await getAssetUrl("bgchosee.png");
      setBackgroundUrl(url || "/Mobile.png");

      const { loadEventTexts } = await import("../../../utils/uploadAsset");
      const texts = await loadEventTexts(eventSlug);
      setPrimaryColor(texts.primaryColor || "#753E89");
      setIsLoading(false); // 🔹 Marcar como cargado
    };
    loadBackground();
  }, [eventSlug, getAssetUrl]);

  // 📦 Cargar TODAS las agendas desde Supabase
  useEffect(() => {
    const loadAgendas = async () => {
      try {
        const { data, error } = await supabase
          .from("event_agenda")
          .select("content, date")
          .eq("event_slug", eventSlug)
          .order("date", { ascending: true }); // 🔹 Mostrar en orden cronológico

        if (error) throw error;
        console.log("📦 Agendas cargadas desde Supabase:", data);
        setAgenda(data || []);
      } catch (err) {
        console.error("❌ Error cargando agendas:", err.message);
      }
    };

    loadAgendas();
  }, [eventSlug]);

  // 👤 Usuario actual
  const user = session?.user;

  return (
    <div
      className="relative flex flex-col items-center md:justify-end min-h-screen bg-cover bg-center px-4 "
      style={{
        backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none",
        minHeight: "100dvh",
      }}
    >
      {/* Header con usuario + logout */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        {/* 👤 Usuario logueado (Este ya tiene la condición user &&) */}
        {user && !isTotemMode && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg ">
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

        {/* 🔴 Botón cerrar sesión (AHORA CONDICIONAL) */}
        {user && !isTotemMode && ( // 👈 NUEVA CONDICIÓN: Solo renderiza si hay usuario y NO está en modo Totem
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
              className="w-8 h-8
         rounded-lg"
            />
          </button>
        )}
      </div>
      {/* 🧾 Texto de la agenda (flotante) */}
      {agenda.length > 0 && (
        <div className="absolute top-20 left-4 right-4 max-h-60 overflow-y-auto space-y-2">
          {agenda.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-3 border border-gray-200"
            >
              <p className="text-sm text-gray-800">{item.content}</p>
              {item.date && (
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {new Date(item.date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Caja inferior */}
      <div className="w-full h-full bg-white/70 rounded-t-3xl shadow-lg p-4 flex flex-col mt-138">
        <h1 className="text-lg text-left font-bold mb-6 text-black">
          ¿Qué quieres hacer?
        </h1>

        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={() => navigate(`/${eventSlug}/photo`)}
            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl font-semibold shadow-md hover:opacity-90 transition text-white ${isLoading ? 'invisible' : 'visible'}`}
            style={{ backgroundColor: primaryColor }}
          >
            <Camera size={28} />
            <span>Tomar foto</span>
          </button>

          <button
            onClick={() => navigate(`/${eventSlug}/gallery`)}
            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl font-semibold shadow-md hover:opacity-90 transition ${isLoading ? 'invisible' : 'visible'}`}
            style={{
              backgroundColor: `${primaryColor}20`,
              color: primaryColor,
            }}
          >
            <ImageIcon size={28} />
            <span>Ver galería</span>
          </button>
        </div>
      </div>

      {/* Indicador de modo Totem */}
      {isTotemMode && (
        <div className="fixed top-4 right-4 bg-orange-500 text-white px-3 py-2 rounded-full text-sm font-semibold shadow-lg z-50">
          🔒 MODO TOTEM
        </div>
      )}
    </div>
  );
};

export default Choose;
