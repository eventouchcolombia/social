import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../config/supabaseClient";
import useAuthenticationSupabase from "../../auth/components/AuthenticationSupabase";
import { useTotem } from "../../../totem/TotemContext";
import { Monitor } from "lucide-react";

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
  const { isTotemMode, enableTotemMode, disableTotemMode } = useTotem();

  // Función: busca en la tabla 'admins' por email y devuelve la fila
  const fetchEventForEmail = async (userEmail) => {
    try {
      // PASO 1: Buscar admin en tabla admins
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("id, email, identificador, is_active")
        .eq("email", userEmail.toLowerCase().trim())
        .neq("identificador", null); // Solo admins reales

      if (adminError || !adminData || adminData.length === 0) {
        return null;
      }

      const admin = adminData[0];
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, event_slug, admin_id, admin_email, is_active")
        .eq("admin_email", userEmail.toLowerCase().trim())
        .eq("is_active", true);

      if (eventsError || !eventsData || eventsData.length === 0) {
        console.log("❌ No se encontraron eventos activos para este admin");
        return null;
      }

      // PASO 3: Retornar admin con su primer evento
      const firstEvent = eventsData[0];

      const result = {
        id: admin.id,
        email: admin.email,
        identificador: admin.identificador,
        is_active: admin.is_active,
        event_slug: firstEvent.event_slug, // Desde tabla events
        eventCount: eventsData.length,
      };

      return result;
    } catch (error) {
      console.error(" Error en fetchEventForEmail:", error);
      return null;
    }
  };

  useEffect(() => {
    //  Esperar a que session e isAdmin estén definidos
    if (!session || isAdmin === undefined) {
      return;
    }

    (async () => {
      const email = session.user?.email;

      // Check for pending event slug first
      const pendingEventSlug = localStorage.getItem("pendingEventSlug");
      if (pendingEventSlug) {
        localStorage.removeItem("pendingEventSlug");
        console.log(" Redirigiendo a evento pendiente:", pendingEventSlug);
        navigate(`/${pendingEventSlug}`);
        return;
      }

      const adminRow = await fetchEventForEmail(email);

      if (isAdmin === true) {
        // Admin detectado
        if (adminRow && adminRow.identificador && adminRow.event_slug) {
          if (adminRow.is_active === false) {
            console.warn(
              " Evento inactivo, no se redirige:",
              adminRow.event_slug
            );
            return;
          }

          const targetPath = `/admin/${adminRow.identificador}/${adminRow.event_slug}`;
          if (window.location.pathname !== targetPath) {
            navigate(targetPath);
          }
        } else {
          console.warn(" Admin sin identificador válido. No se redirige.");
        }
      } else if (isAdmin === false) {
        //  Usuario regular
        if (window.location.pathname !== "/") {
          navigate("/");
        }
      }
    })();
  }, [session, isAdmin, navigate]);

  // 🟣 Maneja el click del botón Google
  const handleGoogleLogin = async () => {
    setAuthStarted(true);

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
      // ✅ Buscar en tabla events con JOIN
      const { data, error } = await supabase
        .from("events")
        .select(`
        id,
        event_slug,
        admin_id,
        admin_email,
        is_active,
        admins!inner(identificador)
      `)
        .eq("event_slug", slug)
        .eq("is_active", true);

      if (error) {
        console.error("Error buscando evento (create):", error);
        alert("Hubo un error al buscar el evento.");
        return;
      }
      // ✅ Lógica DESPUÉS de la consulta
      if (!data || data.length === 0) {
        setShowCreateModal(false);
        setShowNotFoundModal(true);
      } else {
        // ✅ Navegar directamente al evento encontrado
        navigate(`/${data[0].event_slug}`); // Para asistir al evento
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
      .from("events")
      .select("*")
      .eq("event_slug", slug)
      .eq("is_active", true);

    if (error) {
      alert("Hubo un error al buscar el evento");
      return;
    }

    if (!data || data.length === 0) {
      alert("El evento no existe o fue desactivado");
    } else {
      // Store the event slug for after authentication
      localStorage.setItem("pendingEventSlug", data[0].event_slug);
      setShowModal(false);
      setEventSlug("");
      // Redirect to Google login
      await signInWithGoogle();
    }
  };

  // ⏳ Mostrar "Cargando..." solo si se presionó Iniciar sesión
  if (authStarted && loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[url('/Mobile.png')] bg-cover bg-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white mb-4"></div>
      </div>
    );
  }

  // ===================== UI PRINCIPAL =====================
  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center px-4 py-8 ">
      {/* <img
        src="/Mobile.png"
        alt="Fondo"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      /> */}
      <div className="relative inset-0 bg-white" />

      <header className="relative z-20 w-full flex flex-col items-center justify-center justify-start mt-20 md:mt-0  ">
        <img
          src="/logoEventouch2.png"
          alt="Eventouch Logo"
          className="w-48 sm:w-56 md:w-64 lg:w-62 h-auto pointer-events-none p-[-20px]"
        />
      </header>

      <div className="flex-1" />

      <div className="absolute z-10 bottom-0  left-0 right-0 flex justify-center">
        <div className="w-full  bg-white/40 rounded-t-4xl p-8 shadow-lg flex flex-col  items-center py-50">
          <div className="w-full md:w-1/2 flex flex-col  gap-4 items-center justify-center">
            <button
              onClick={handleGoogleLogin}
              className="w-full sm:w-1/2 cursor-pointer flex justify-center items-center gap-2 py-3 rounded-full text-black text-xl bg-white hover:bg-gray-100 shadow-md transition"
            >
              <img src="/google.png" alt="Google" className="w-6 h-6" />
              Inicia sesión con Google
            </button>



            <button
              type="button"
              onClick={handleAttendClick}
              className="w-full cursor-pointer sm:w-1/2 py-3 text-sm rounded-full text-white 
                         bg-[#753E89] hover:bg-[#f7eef9] hover:text-[#753E89] transition-colors shadow-sm text-xl"
            >
              Asiste a tu evento
            </button>
                        <span
              onClick={() => navigate("/register")}
              className="  text-[#753E89] text-sm cursor-pointer hover:text-[#5e3270] transition"
            >
              ¿No tienes cuenta? Regístrate
            </span>
          </div>
        </div>
      </div>

      {/* Modal ingreso a evento - ACTUALIZADO con Switch */}
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

            {/* Switch de modo Totem */}
            <div className="w-full mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Modo Totem
                  </span>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={isTotemMode ? disableTotemMode : enableTotemMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isTotemMode ? "bg-orange-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isTotemMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Descripción del switch */}
              <p className="text-xs text-gray-500 mt-1">
                {isTotemMode
                  ? "Los usuarios no podrán cerrar sesión"
                  : "Ideal para dispositivos públicos"}
              </p>
            </div>

            {/* Botones principales */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setShowModal(false);
                  // Only disable totem mode when clicking Cancel
                  if (isTotemMode) {
                    disableTotemMode();
                  }
                }}
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

      {/* Indicador si ya está en modo Totem */}
      {/* {isTotemMode && (
        <div className="fixed top-4 right-4 bg-orange-500 text-white px-3 py-2 rounded-full text-sm font-semibold shadow-lg z-50">
          🔒 MODO TOTEM ACTIVO
        </div>
      )} */}
    </div>
  );
};

export default Begin;
