import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import useAuthenticationSupabase from "./AuthenticationSupabase";

// eslint-disable-next-line no-unused-vars
const Begin = ({ onCreate }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [eventSlug, setEventSlug] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [authStarted, setAuthStarted] = useState(false);

  const { session, isAdmin, loading, signInWithGoogle } =
    useAuthenticationSupabase();

  // 👇 Función: busca en la tabla 'admins' por email y devuelve la fila
  const fetchEventForEmail = async (email) => {
    if (!email) {
      console.log("fetchEventForEmail: no se proporcionó email");
      return null;
    }

    try {
      console.log(`🔎 [fetchEventForEmail] Buscando admin por email: ${email}`);
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .eq("email", email)
        .limit(1);

      if (error) {
        console.error(
          "❌ [fetchEventForEmail] Error al consultar admins:",
          error
        );
        return null;
      }

      console.log("✅ [fetchEventForEmail] Resultado raw:", data);

      if (!data || data.length === 0) {
        console.log(
          "ℹ️ [fetchEventForEmail] No se encontró fila en 'admins' para ese email"
        );
        return null;
      }

      const row = data[0];
      console.log("📌 [fetchEventForEmail] Fila encontrada:", {
        id: row.id,
        uuid: row.uuid,
        email: row.email,
        event_slug: row.event_slug,
        is_active: row.is_active,
        created_at: row.created_at,
      });

      return row;
    } catch (err) {
      console.error("⚠️ [fetchEventForEmail] Excepción:", err);
      return null;
    }
  };

  useEffect(() => {
  console.log("🌀 [useEffect Begin] Detectando sesión/isAdmin:", {
    session,
    isAdmin,
  });

  if (!session) {
    console.log("⏳ [useEffect Begin] No hay sesión todavía...");
    return;
  }

  (async () => {
    const email = session.user?.email;
    console.log("🧾 [useEffect Begin] Email de sesión:", email);

    const adminRow = await fetchEventForEmail(email);

    // ✅ Caso 1: Usuario admin con evento válido
    if (isAdmin === true) {
      if (adminRow && adminRow.event_slug) {
        if (adminRow.is_active === false) {
          console.warn(
            "⚠️ [useEffect Begin] Evento encontrado pero marcado como inactivo:",
            adminRow.event_slug
          );
          return; // No redirige si el evento está inactivo
        }
        console.log(
          "🚀 [useEffect Begin] Usuario admin confirmado. Redirigiendo al evento:",
          adminRow.event_slug
        );
        navigate(`/${adminRow.event_slug}/admin`);
      } else {
        console.warn(
          "⚠️ [useEffect Begin] Usuario admin sin evento válido. No se redirige."
        );
      }
    }
    // ✅ Caso 2: Usuario regular (no admin)
    else if (isAdmin === false) {
      console.log("👤 [useEffect Begin] Usuario regular detectado. Redirigiendo a /profile");
      navigate("/profile");
    }
    // ⏳ Caso 3: Estado intermedio (isAdmin aún no definido)
    else {
      console.log("ℹ️ [useEffect Begin] isAdmin aún indefinido:", isAdmin);
    }
  })();
}, [session, isAdmin, navigate]);


  // 🟣 Maneja el click del botón Google
  const handleGoogleLogin = async () => {
    setAuthStarted(true);
    console.log("🚀 Iniciando login con Google...");
    await signInWithGoogle();
  };

  // ✅ Lógica para crear o asistir a evento
  const handleCreateConfirm = async () => {
    const slug = eventSlug.trim().toLowerCase();
    if (!slug) {
      setShowCreateModal(false);
      setShowNotFoundModal(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .eq("event_slug", slug);

      if (error) {
        console.error("Error buscando evento (create):", error);
        alert("Hubo un error al buscar el evento.");
        return;
      }

      if (!data || data.length === 0) {
        setShowCreateModal(false);
        setShowNotFoundModal(true);
      } else {
        navigate(`/${data[0].event_slug}/admin`);
        setShowCreateModal(false);
        setEventSlug("");
      }
    } catch (err) {
      console.error("Exception en handleCreateConfirm:", err);
      alert("Error inesperado. Revisa la consola.");
    }
  };

  const handleAttendClick = () => {
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!eventSlug.trim()) {
      alert("Por favor ingresa el nombre del evento");
      return;
    }

    const slug = eventSlug.trim().toLowerCase();
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("event_slug", slug);

    if (error) {
      alert("Hubo un error al buscar el evento");
      return;
    }

    if (!data || data.length === 0) {
      alert("El evento no existe");
    } else {
      navigate(`/${data[0].event_slug}`);
    }

    setShowModal(false);
    setEventSlug("");
  };

  // ⏳ Mostrar "Cargando..." solo si se presionó Iniciar sesión
  if (authStarted && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#753E89]/20">
        <h1 className="text-2xl font-semibold text-[#753E89] animate-pulse">
          Verificando autenticación...
        </h1>
      </div>
    );
  }

  // ===================== UI PRINCIPAL =====================
  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center px-4 py-8">
      <img
        src="/Mobile.png"
        alt="Fondo"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute inset-0 bg-black/25" />

      <header className="relative z-10 w-full flex items-center justify-center">
        <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          EvenTouch App
        </h1>
      </header>

      <div className="flex-1" />

      <div className="absolute z-10 bottom-0 left-0 right-0 flex justify-center">
        <div className="w-[110%] h-54 bg-white/40 rounded-t-4xl p-8 shadow-lg flex flex-col items-center">
          <div className="w-full flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={handleGoogleLogin}
              className="w-full sm:w-1/2 flex justify-center items-center gap-2 py-3 rounded-full text-black text-xl bg-white hover:bg-gray-100 shadow-md transition"
            >
              <img src="/google.png" alt="Google" className="w-6 h-6" />
              Inicia sesión con Google
            </button>
            
            <span
              onClick={() => navigate("/register")}
              className=" mt-[-10px] text-[#753E89]  cursor-pointer hover:text-[#5e3270] transition"
            >
              ¿No tienes cuenta? Regístrate
            </span>

            <button
              type="button"
              onClick={handleAttendClick}
              className="w-full sm:w-1/2 py-3 rounded-full text-white 
                         bg-[#753E89] hover:bg-[#f7eef9] transition-colors shadow-sm text-xl"
            >
              Asiste a tu evento
            </button>
          </div>
        </div>
      </div>

      {/* Modal ingreso a evento */}
      {showModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-lg flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4 text-[#753E89]">
              Ingresa el nombre del evento
            </h2>
            <input
              type="text"
              placeholder="Nombre del evento"
              value={eventSlug}
              onChange={(e) => setEventSlug(e.target.value)}
              className="border border-gray-400 rounded-lg p-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-[#753E89]"
            />
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-[#753E89] text-white py-2 rounded-lg hover:bg-[#5e3270]"
              >
                Ingresar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear evento */}
      {showCreateModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-lg flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4 text-[#753E89]">
              Crea tu evento con el nombre asignado
            </h2>
            <input
              type="text"
              placeholder="Nombre del evento"
              value={eventSlug}
              onChange={(e) => setEventSlug(e.target.value)}
              className="border border-gray-400 rounded-lg p-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-[#753E89]"
            />
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEventSlug("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateConfirm}
                className="flex-1 bg-[#753E89] text-white py-2 rounded-lg hover:bg-[#5e3270]"
              >
                Verificar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal evento no encontrado */}
      {showNotFoundModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-lg text-center">
            <h2 className="text-lg font-semibold mb-3 text-[#753E89]">
              Evento no encontrado
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Si deseas crear un evento comunícate con{" "}
              <a
                href="https://eventouch.tech"
                target="_blank"
                rel="noreferrer"
                className="text-[#753E89] underline"
              >
                eventouch.tech
              </a>
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowNotFoundModal(false)}
                className="px-4 py-2 bg-[#753E89] text-white rounded-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Begin;
