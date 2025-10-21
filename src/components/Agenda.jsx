import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Agenda({ eventSlug, onClose }) {
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  // 🔹 Obtener agenda actual
  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        const { data, error } = await supabase
          .from("event_agenda")
          .select("id,content, date")
          .eq("event_slug", eventSlug)
           .order("date", { ascending: true });

        if (error && error.code !== "PGRST116") {
          console.error("❌ Error al traer agenda:", error);
          alert("Error al cargar la agenda.");
        }

        if (data) {
          setContent(data.content || "");
          setDate(data.date || "");
        }
      } catch (err) {
        console.error("❌ Error inesperado:", err);
      }
    };

    fetchAgenda();
  }, [eventSlug]);

  // 🔹 Guardar/actualizar agenda
  const handleSave = async () => {
    if (!date) {
      alert("Por favor selecciona una fecha antes de guardar.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("event_agenda").insert([
        {
          event_slug: eventSlug,
          content,
          date, // debe existir como columna tipo 'date' o 'text'
        },
      ]);

      if (error) {
        console.error("❌ Error al guardar agenda:", error);
        alert("Error al guardar la agenda. Revisa la consola.");
      } else {
        alert("✅ Agenda guardada correctamente");
        onClose();
      }
    } catch (err) {
      console.error("⚠️ Error inesperado al guardar:", err);
      alert("Ocurrió un error inesperado.");
    } finally {
      setSaving(false); // 🔹 Siempre se ejecuta, incluso si hay error
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-60 px-4">
      <div className="bg-white border-2 border-[#753E89] rounded-2xl shadow-lg w-full max-w-md p-6 relative">
        {/* 🔘 Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black text-xl"
        >
          ✕
        </button>

        {/* 🗓️ Título */}
        <h2 className="font-bold text-lg mb-4 text-gray-800 text-center">
          Agenda del evento
        </h2>

        {/* 📆 Selector de fecha */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha del evento
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-[#753E89] rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#753E89]"
          />
        </div>

        {/* 📝 Textarea */}
        <textarea
          className="w-full border border-[#753E89] rounded-md p-3 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-[#753E89]"
          placeholder="Escribe aquí la agenda del evento..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* 💾 Botón guardar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 bg-[#753E89] text-white px-4 py-3 rounded-full hover:bg-[#5e3270] disabled:opacity-50 w-full text-center font-medium"
        >
          {saving ? "Guardando..." : "Guardar agenda"}
        </button>
      </div>
    </div>
  );
}
