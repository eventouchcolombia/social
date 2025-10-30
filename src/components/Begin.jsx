import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // asegúrate de tener esto configurado

// eslint-disable-next-line no-unused-vars
const Begin = ({ onCreate }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [eventSlug, setEventSlug] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);

  const handleCreate = () => {
    // abrir modal para solicitar el nombre del evento (creador/admin)
    setShowCreateModal(true);
  };

  const handleCreateConfirm = async () => {
    const slug = eventSlug.trim().toLowerCase();
    if (!slug) {
      // si no ingresó nada mostrar modal de no encontrado / contacto
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
        alert("Hubo un error al buscar el evento. Revisa la consola.");
        return;
      }

      if (!data || data.length === 0) {
        // no existe -> mostrar modal de no encontrado con instrucción de contacto
        setShowCreateModal(false);
        setShowNotFoundModal(true);
      } else {
        // existe -> navegar a /:slug/admin
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
    // abre el modal
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!eventSlug.trim()) {
      alert("Por favor ingresa el nombre del evento");
      return;
    }

    const slug = eventSlug.trim().toLowerCase();
    console.log("🔍 Buscando evento exacto con slug:", slug);

    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("event_slug", slug);

    if (error) {
      console.error("❌ Error en la consulta:", error);
      alert("Hubo un error al buscar el evento");
      return;
    }

    console.log("📦 Resultado de la consulta:", data);

    if (!data || data.length === 0) {
      console.warn("⚠️ El evento no existe en la tabla 'admins'");
      alert("El evento no existe");
    } else {
      console.log("✅ Evento encontrado:", data[0].event_slug);
      navigate(`/${data[0].event_slug}`);
    }

    setShowModal(false);
    setEventSlug("");
  };

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
          PixEvent
        </h1>
      </header>

      <div className="flex-1" />

      <div className="absolute z-10 bottom-0 left-0 right-0 flex justify-center">
        <div className="w-[110%] max-w-xl bg-white/40 rounded-t-4xl p-8 shadow-lg flex flex-col items-center">
          <div className="w-full flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              type="button"
              onClick={handleCreate}
              className="w-full sm:w-1/2 py-3 rounded-full text-white text-xl
                         bg-[#753E89] hover:bg-[#5e3270] shadow-md"
            >
              Crea tu evento
            </button>

            <button
              type="button"
              onClick={handleAttendClick}
              className="w-full sm:w-1/2 py-3 rounded-full text-[#753E89] 
                         bg-white hover:bg-[#f7eef9] transition-colors shadow-sm text-xl"
            >
              Asiste a tu evento
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
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

      {/* Modal Crear evento: solicitar nombre para acceder a /:slug/admin */}
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

      {/* Modal evento no encontrado / contacto */}
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
