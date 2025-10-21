/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Agenda({ eventSlug, onClose }) {
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 🔹 Obtener todas las agendas del evento
  const fetchAgendas = async () => {
    try {
      const { data, error } = await supabase
        .from("event_agenda")
        .select("id, content, date, created_at")
        .eq("event_slug", eventSlug)
        .order("date", { ascending: true });

      if (error) throw error;
      setAgendas(data || []);
    } catch (err) {
      console.error("❌ Error al cargar agendas:", err);
      alert("Error al cargar las agendas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendas();
  }, [eventSlug]);

  // 🔹 Guardar nueva agenda
  const handleSave = async () => {
    if (!date || !content.trim()) {
      setShowSaveModal(true);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("event_agenda").insert([
        {
          event_slug: eventSlug,
          content,
          date,
        },
      ]);

      if (error) throw error;
      setShowSuccessModal(true);
      setContent("");
      setDate("");
      fetchAgendas();
    } catch (err) {
      console.error("⚠️ Error guardando agenda:", err);
      alert("Error al guardar la agenda.");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Eliminar agenda
  const handleDelete = async (id) => {
    try {
      if (!id) throw new Error("id inválido");

      const { data, error, status, statusText } = await supabase
        .from("event_agenda")
        .delete()
        .eq("id", id); // no convertir a Number si el id es UUID

      console.log("Supabase delete response:", {
        data,
        error,
        status,
        statusText,
        id,
      });

      if (error) throw error;

      // actualizar estado local (los ids son strings UUID)
      setAgendas((prev) => prev.filter((a) => a.id !== id));
      setConfirmDelete(null);
      await fetchAgendas();
    } catch (err) {
      console.error("⚠️ Error al eliminar agenda:", err);
      alert(
        "Error al eliminar la agenda. Revisa la consola para más detalles."
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-60 px-4 overflow-y-auto">
      <div className="bg-white border-2 border-[#753E89] rounded-2xl shadow-lg w-full max-w-md p-6 relative my-8">
        {/* 🔘 Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black text-xl"
        >
          ✕
        </button>

        <h2 className="font-bold text-lg mb-4 text-gray-800 text-center">
          Agenda del evento
        </h2>

        {/* 📆 Crear nueva agenda */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha del evento
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-[#753E89] rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#753E89]"
          />

          <textarea
            className="w-full border border-[#753E89] rounded-md p-3 mt-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#753E89]"
            placeholder="Escribe aquí la agenda del evento..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button
            type="button" // <- evitar submit accidental
            onClick={() => {
              console.log("handleSave triggered", { date, content });
              handleSave();
            }}
            disabled={saving}
            className="mt-4 bg-[#753E89] text-white px-4 py-3 rounded-full hover:bg-[#5e3270] disabled:opacity-50 w-full font-medium"
          >
            {saving ? "Guardando..." : "Guardar agenda"}
          </button>
        </div>

        {/* 📋 Lista de agendas */}
        <h3 className="font-semibold text-gray-800 text-md mb-2">
          Agendas creadas
        </h3>

        {loading ? (
          <p className="text-gray-500 text-sm">Cargando agendas...</p>
        ) : agendas.length > 0 ? (
          <ul className="space-y-3 max-h-[250px] overflow-y-auto">
            {agendas.map((agenda) => (
              <li
                key={agenda.id}
                className="border border-gray-200 rounded-md p-3 relative"
              >
                <p className="text-sm text-gray-800">{agenda.content}</p>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {new Date(agenda.date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                <button
                  type="button"
                  onClick={() => setConfirmDelete(agenda)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-red-50"
                  aria-label="Eliminar agenda"
                >
                  <img src="/Trash.png" alt="Eliminar" className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No hay agendas creadas aún.</p>
        )}
      </div>

      {/* Modal de validación (falta fecha/contenido) */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center w-80 border-2 border-[#753E89]">
            <h2 className="text-md font-semibold text-[#753E89] mb-3">
              Falta información
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Por favor completa la fecha y el contenido antes de guardar.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-[#753E89] text-white rounded"
                onClick={() => setShowSaveModal(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center w-80 border-2 border-[#753E89]">
            <h2 className="text-md font-semibold text-[#753E89] mb-3">
              {" "}
              Agenda guardada
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              La agenda se guardó correctamente.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-[#753E89] text-white rounded"
                onClick={() => setShowSuccessModal(false)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ Confirmación eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center w-80">
            <h2 className="text-md font-semibold text-gray-800 mb-3">
              ¿Eliminar esta agenda?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              "{confirmDelete.content.slice(0, 60)}..."
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={() => handleDelete(confirmDelete.id)}
              >
                Eliminar
              </button>
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
