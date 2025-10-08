import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Agenda({ eventSlug, onClose }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  // 🔹 Obtener agenda actual
  useEffect(() => {
    const fetchAgenda = async () => {
      const { data, error } = await supabase
        .from("event_agenda")
        .select("content")
        .eq("event_slug", eventSlug)
        .single();

      if (error && error.code !== "PGRST116")
        console.error("❌ Error al traer agenda:", error);
      if (data) setContent(data.content || "");
    };

    fetchAgenda();
  }, [eventSlug]);

  // 🔹 Guardar/actualizar agenda
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("event_agenda")
      .upsert({ event_slug: eventSlug, content });

    setSaving(false);
    if (error) console.error("❌ Error al guardar agenda:", error);
    else alert("✅ Agenda guardada correctamente");
    onClose();
  };

  return (
    <div className="fixed inset-0  bg-black/70 flex justify-center items-center z-[60]">
      <div className="bg-white border-2 border-[#753E89] rounded-2xl shadow-lg w-[90%] max-w-xl p-6 relative">
        {/* 🔘 Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black text-xl"
        >
          ✕
        </button>

        {/* 🗓️ Contenido */}
        <h2 className="font-bold text-lg mb-4 text-gray-800 text-center">
          Agenda del evento
        </h2>

        <textarea
          className="w-full border border-[#753E89] rounded-md p-3 min-h-[160px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Escribe aquí la agenda del evento..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 bg-[#753E89] text-white px-4 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50 w-full"
        >
          {saving ? "Guardando..." : "Guardar agenda"}
        </button>
      </div>
    </div>
  );
}
