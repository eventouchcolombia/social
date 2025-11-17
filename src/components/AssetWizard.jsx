import { useState, useEffect } from "react";
import { uploadAsset, loadEventTexts } from "../utils/uploadAsset";
import { useEvent } from "../hooks/useEvent";
import { motion } from "framer-motion";
import { Upload, X, Palette, ImageIcon, Type } from "lucide-react";

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

const TabButton = ({ id, label, icon }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`
      flex items-center gap-2  py-2 border-b-2 transition
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



  const fontOptions = [
  { name: "Montserrat", preview: "Este es solo un texto de prueba para la app" },
  { name: "Inter", preview: "Este es solo un texto de prueba para la app" },
  { name: "Roboto", preview: "Este es solo un texto de prueba para la app" },
  { name: "Poppins", preview: "Este es solo un texto de prueba para la app" },
  { name: "Lato", preview: "Este es solo un texto de prueba para la app" }
];


  // Cargar textos existentes al abrir el wizard
  useEffect(() => {
    const loadExistingTexts = async () => {
      const texts = await loadEventTexts(eventSlug);
      setEventTexts(texts);
      if (texts.font) {
        setSelectedFont(texts.font);
      }
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

        <div className="  border-b border-gray-200 mb-6 flex gap-6"> 
          {tabs.map((t) => (
            <TabButton key={t.id} id={t.id} label={t.label} icon={t.icon} />
          ))}
        </div>

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
                    onChange={(e) => setEventTexts(prev => ({ ...prev, primaryColor: e.target.value }))
                    }
                    className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Color seleccionado:</p>
                    <div 
                      className="w-full h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center  font-semibold"
                      
                    >
                      {eventTexts.primaryColor || "#753E89"}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-600 mb-3">Vista previa de botones:</p>
                <div className="space-y-3">
                  <button 
                    className="w-full px-6 py-3 text-white font-semibold rounded-full transition"
                    style={{ backgroundColor: eventTexts.primaryColor || "#753E89" }}
                  >
                    Botón Principal
                  </button>
                <button
                  className="w-full px-6 py-3 text-white font-semibold rounded-xl transition"
                  style={{
                    backgroundColor: eventTexts.primaryColor
                      ? eventTexts.primaryColor + "B3" // B3 = 70% opacidad en hex
                      : "rgba(117,62,137,0.7)"
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
          <div> 
          <div className="text-gray-700">
            
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
                style={{ fontFamily: selectedFont }}
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
                style={{ fontFamily: selectedFont }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>
          </div>
          <div className="mb-8 bg-gray-50 rounded-xl p-4 sm:p-6">
  <h3 className="text-lg font-semibold text-gray-700 mb-4">Tipografía Principal</h3>

  <div className="space-y-4">
    {fontOptions.map((font) => (
      <button
        key={font.name}
        onClick={() => {
          setSelectedFont(font.name);
          setEventTexts(prev => ({ ...prev, font: font.name }));
        }}
        className={`
          w-full text-left p-4 rounded-xl border transition
          ${selectedFont === font.name 
            ? "border-[#753E89] bg-white shadow-sm"
            : "border-gray-200 bg-gray-100"
          }
        `}
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

          </div>
          
        )}

        {activeTab === "imagenes" && (
        <>
        


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
        </>
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
