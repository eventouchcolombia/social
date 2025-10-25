import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // asegúrate de tener esto configurado

const Begin = ({ onCreate }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [eventSlug, setEventSlug] = useState("");

  const handleCreate = () => {
    if (typeof onCreate === "function") return onCreate();
    navigate("/admin");
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
    </div>
  );
};

export default Begin;
