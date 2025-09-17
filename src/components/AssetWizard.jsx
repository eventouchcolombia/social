import { useState } from "react";
import { uploadAsset } from "../utils/uploadAsset";
import { useEvent } from "../hooks/useEvent";
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
  const [uploading, setUploading] = useState(false);

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
      for (const [key, value] of Object.entries(files)) {
        if (value?.file) {
          await uploadAsset(value.file, `assets/${eventSlug}/${key}.png`);
        }
      }
      setUploading(false);
      alert("✅ Assets subidos correctamente");
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
          Subir Assets
        </h2>

        {/* Grid de zonas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
          {renderDropZone("Background", "background")}
          {renderDropZone("Marco", "marco")}
          {renderDropZone("Background Choose", "bgchosee")}
          {renderDropZone("Background Galería", "bggallery")}
          {renderDropZone("Admin Background", "adminbg")} {/* 🔹 Nuevo */}
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
            className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 w-full sm:w-auto"
          >
            {uploading ? "Subiendo..." : "Guardar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AssetWizard;
