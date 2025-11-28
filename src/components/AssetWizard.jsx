import { useState, useEffect } from "react";
import { uploadAsset, loadEventTexts } from "../utils/uploadAsset";
import { downloadFileFromFirebase } from "../utils/eventAssets"; // Importar la función para descargar archivos
import { useEvent } from "../hooks/useEvent";
import { motion } from "framer-motion";
import { Upload, X, Palette, ImageIcon, Type, Info } from "lucide-react"; // Importar icono para el enlace

// Definir el componente TabButton correctamente
const TabButton = ({ id, label, icon, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`
      flex items-center gap-2 py-2 border-b-2 transition
      ${activeTab === id ? "border-[#753E89] text-[#753E89]" : "border-transparent text-gray-500"}
      whitespace-nowrap
      max-w-[110px]
      overflow-hidden
      text-ellipsis
    `}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const AssetWizard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("imagenes");
  const { eventSlug } = useEvent();
  const [files, setFiles] = useState({
    background: null,
    marco: null,
    bgchosee: null,
    bggallery: null,
    adminbg: null,
  });
  const [eventTexts, setEventTexts] = useState({});
  const [uploading, setUploading] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Montserrat");
  const [showInstructions, setShowInstructions] = useState(false); // Estado para controlar el pop-up

  // Cargar imágenes previamente subidas al abrir el wizard
  useEffect(() => {
    const loadUploadedImages = async () => {
      const updatedFiles = {};
      for (const key of Object.keys(files)) {
        try {
          console.log(`🔄 Intentando cargar imagen para: ${key}`); // Log de depuración
          const url = await downloadFileFromFirebase(`assets/${eventSlug}/${key}.png`);
          console.log(`✅ URL cargada para ${key}: ${url}`); // Log de depuración
          updatedFiles[key] = { preview: url }; // Actualizar el estado con la URL de la imagen
        } catch (error) {
          console.warn(`⚠️ No se pudo cargar la imagen para ${key}:`, error);
        }
      }
      console.log("📂 Estado actualizado de archivos:", updatedFiles); // Log de depuración
      setFiles((prev) => ({ ...prev, ...updatedFiles }));
    };
    loadUploadedImages();
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
      const textsBlob = new Blob([JSON.stringify(eventTexts)], { type: "application/json" });
      const textsFile = new File([textsBlob], "event-texts.json", { type: "application/json" });
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
      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-4 sm:p-6 w-full max-w-[180px] h-[180px] sm:h-[200px] cursor-pointer hover:border-blue-500 transition"
      onClick={() => document.getElementById(key).click()}
    >
      {files[key]?.preview ? (
        <>
          <img
            src={files[key].preview}
            alt={label}
            className="w-full h-full object-contain rounded-xl"
          />
          <p className="mt-2 text-sm text-gray-600 text-center">{label}</p> {/* Mostrar el texto */}
        </>
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

  const tabs = [
    { id: "colores", label: "Colores", icon: <Palette size={16} /> },
    { id: "imagenes", label: "Imágenes", icon: <ImageIcon size={16} /> },
    { id: "tipografias", label: "Tipografías", icon: <Type size={16} /> },
  ];

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

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 ">
          Configurar Assets
        </h2>

        <div className="border-b border-gray-200 mb-6 flex gap-6">
          {tabs.map((t) => (
            <TabButton
              key={t.id}
              id={t.id}
              label={t.label}
              icon={t.icon}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          ))}
        </div>

        {/* Renderizar contenido según la pestaña activa */}
        {activeTab === "colores" && (
          <div className="mb-8 bg-gray-50 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Color Principal de Botones</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Selecciona el color para todos los botones del evento
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={eventTexts.primaryColor || "#753E89"}
                    onChange={(e) =>
                      setEventTexts((prev) => ({ ...prev, primaryColor: e.target.value }))
                    }
                    className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Color seleccionado:</p>
                    <div
                      className="w-full h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold"
                    >
                      {eventTexts.primaryColor || "#753E89"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-600 mb-3">Vista previa de botones:</p>
                <div className="flex flex-col space-y-3">
                  <button
                    className="w-full md:w-1/3 px-6 py-3 text-white font-semibold rounded-full transition"
                    style={{ backgroundColor: eventTexts.primaryColor || "#753E89" }}
                  >
                    Botón Principal
                  </button>
                  <button
                    className="w-full md:w-1/3 px-6 py-3 text-white font-semibold rounded-xl transition"
                    style={{
                      backgroundColor: eventTexts.primaryColor
                        ? eventTexts.primaryColor + "B3" // B3 = 70% opacidad en hex
                        : "rgba(117,62,137,0.7)",
                    }}
                  >
                    Botón Secundario
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tipografias" && (
          <div className="mb-8 bg-gray-50 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Tipografía Principal</h3>
            <div className="space-y-4">
              {[
                { name: "Montserrat", preview: "Texto de ejemplo con Montserrat" },
                { name: "Inter", preview: "Texto de ejemplo con Inter" },
                { name: "Roboto", preview: "Texto de ejemplo con Roboto" },
                { name: "Poppins", preview: "Texto de ejemplo con Poppins" },
                { name: "Lato", preview: "Texto de ejemplo con Lato" },
              ].map((font) => (
                <button
                  key={font.name}
                  onClick={() => {
                    setSelectedFont(font.name);
                    setEventTexts((prev) => ({ ...prev, font: font.name }));
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition ${
                    selectedFont === font.name
                      ? "border-[#753E89] bg-white shadow-sm"
                      : "border-gray-200 bg-gray-100"
                  }`}
                >
                  <p className="font-semibold text-gray-800" style={{ fontFamily: font.name }}>
                    {font.name}
                  </p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: font.name }}>
                    {font.preview}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "imagenes" && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Imágenes del Evento</h3>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  Sube las imágenes necesarias para personalizar tu evento.
                </p>
                <button
                  onClick={() => setShowInstructions(true)} // Mostrar el pop-up
                  className="flex items-center gap-2 text-sm text-blue-500 hover:underline"
                >
                  <Info size={16} />
                  Ver instrucciones
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
                {renderDropZone("Background", "background")}
                {renderDropZone("Marco", "marco")}
                {renderDropZone("Background Choose", "bgchosee")}
                {renderDropZone("Background Galería", "bggallery")}
                {renderDropZone("Admin Background", "adminbg")}
              </div>
            </div>
          </>
        )}

        {/* Pop-up de instrucciones */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Instrucciones para subir imágenes</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                <li>Los formatos permitidos son <strong>PNG</strong> y <strong>JPG</strong>.</li>
                <li>El tamaño máximo de cada archivo es de <strong>5 MB</strong>.</li>
                <li>Las dimensiones recomendadas son:
                  <ul className="list-disc list-inside ml-4">
                    <li><strong>Background:</strong> 1920x1080 px</li>
                    <li><strong>Marco:</strong> 1080x1920 px</li>
                    <li><strong>Galería:</strong> 800x600 px</li>
                  </ul>
                </li>
                <li>Asegúrate de que las imágenes no estén comprimidas para mantener la calidad.</li>
                <li>Se recomiendan imagenes verticales </li>
              </ul>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInstructions(false)} // Cerrar el pop-up
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

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
