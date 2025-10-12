import { useState, useEffect } from "react";
import { uploadAsset, loadEventTexts } from "../utils/uploadAsset";
import { useEvent } from "../hooks/useEvent";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Upload, X } from "lucide-react";

const AssetWizard = ({ onClose }) => {
  const { eventSlug } = useEvent();
  const [files, setFiles] = useState({
    background: null,
    marco: null,
    bgchosee: null,
    bggallery: null,
    adminbg: null, // 🔹 Nuevo asset para el fondo admin
  });
  const [eventTexts, setEventTexts] = useState({

  });
  const [uploading, setUploading] = useState(false);

  // Cargar textos existentes al abrir el wizard
  useEffect(() => {
    const loadExistingTexts = async () => {
      const texts = await loadEventTexts(eventSlug);
      setEventTexts(texts);
    };
    loadExistingTexts();
  }, [eventSlug]);

  const handleFile = (type, f) => {
    setFiles((prev) => ({
      ...prev,
      [type]: {
        file: f,
        preview: URL.createObjectURL(f),
      },
    }));
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      
      // Subir archivos de imagen
      for (const [key, value] of Object.entries(files)) {
        if (value?.file) {
          await uploadAsset(value.file, `assets/${eventSlug}/${key}.png`);
        }
      }
      
      // Subir textos del evento como archivo JSON
      const textsBlob = new Blob([JSON.stringify(eventTexts)], { type: 'application/json' });
      const textsFile = new File([textsBlob], 'event-texts.json', { type: 'application/json' });
      await uploadAsset(textsFile, `assets/${eventSlug}/event-texts.json`);
      
      setUploading(false);
      alert("✅ Assets y configuración subidos correctamente");
      onClose();
    } catch (err) {
      console.error("Error subiendo assets", err);
      setUploading(false);
    }
  };

  const renderDropZone = (label, key) => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFile(key, e.dataTransfer.files[0]);
      }}
      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-4 sm:p-6 w-full max-w-[180px] h-[140px] sm:h-[160px] cursor-pointer hover:border-blue-500 transition"
      onClick={() => document.getElementById(key).click()}
    >
      {files[key]?.preview ? (
        <img
          src={files[key].preview}
          alt={label}
          className="w-full h-full object-contain rounded-xl"
        />
      ) : (
        <div className="flex flex-col items-center text-gray-500">
          <Upload className="w-6 h-6 mb-2" />
          <span className="text-sm text-center">{label}</span>
        </div>
      )}
      <input
        id={key}
        type="file"
        hidden
        onChange={(e) => handleFile(key, e.target.files[0])}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-5xl relative overflow-y-auto max-h-[95vh]"
      >
        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 text-center sm:text-left">
          Configurar Evento
        </h2>

        {/* Configuración de textos */}
        <div className="mb-8 bg-gray-50 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Textos del Evento</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Título del Evento
              </label>
              <input
                type="text"
                value={eventTexts.title}
                onChange={(e) => setEventTexts(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Boda María & Juan"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Leyenda/Subtítulo (opcional)
              </label>
              <input
                type="text"
                value={eventTexts.subtitle}
                onChange={(e) => setEventTexts(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Ej: Celebremos juntos este momento especial"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Configuración de Realidad Aumentada */}
        <div className="mb-8 bg-gray-50 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Realidad Aumentada</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Seleccionar Asset de AR
              </label>
              <select
                value={eventTexts.arAsset}
                onChange={(e) => setEventTexts(prev => ({ ...prev, arAsset: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="none">Ninguno</option>
                <option value="glasses">Gafas</option>
                <option value="hat">Sombrero</option>
                <option value="mustashe">Bigote</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de zonas */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Imágenes del Evento</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
            {renderDropZone("Background", "background")}
            {renderDropZone("Marco", "marco")}
            {renderDropZone("Background Choose", "bgchosee")}
            {renderDropZone("Background Galería", "bggallery")}
            {renderDropZone("Admin Background", "adminbg")} {/* 🔹 Nuevo */}
          </div>
        </div>

        {/* Botones */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition w-full sm:w-auto"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-6 py-2 rounded-xl bg-[#753E89] text-white hover:bg-[#753E89] transition disabled:opacity-50 w-full sm:w-auto"
          >
            {uploading ? "Subiendo..." : "Guardar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AssetWizard;
