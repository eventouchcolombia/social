import { useState } from "react";
import { uploadAsset } from "../utils/uploadAsset";
import { useEvent } from "../hooks/useEvent";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

const AssetWizard = ({ onClose }) => {
  const { eventSlug } = useEvent();

  const [step, setStep] = useState(1);
  const [assetType, setAssetType] = useState("background.jpg");
  const [currentUrl, setCurrentUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleNext = async () => {
    if (step === 1) {
      try {
        const url = await getDownloadURL(
          ref(storage, `assets/${eventSlug}/${assetType}`)
        );
        setCurrentUrl(url);
      } catch {
        setCurrentUrl(null);
      }
      setStep(2);
    } else if (step === 2) {
      if (!file) return alert("Selecciona un archivo");
      setStep(3);
    } else if (step === 3) {
      try {
        setUploading(true);
        const newUrl = await uploadAsset(
          file,
          `assets/${eventSlug}/${assetType}` // 👈 ruta correcta de assets
        );
        setCurrentUrl(newUrl);
        setUploading(false);
        alert("✅ Asset actualizado");
        onClose();
      } catch (err) {
        console.error("Error subiendo asset", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[500px] text-center">
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold mb-4">Seleccionar asset</h2>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="border rounded p-2 w-full"
            >
              <option value="background.jpg">Background</option>
              <option value="marco.png">Marco</option>
              <option value="bgchosee.png">Background Choose</option>
              <option value="bggallery.png">Background Galería</option>
            </select>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold mb-4">Previsualización</h2>
            {currentUrl ? (
              <img
                src={currentUrl}
                alt="asset"
                className="w-full h-48 object-contain mb-4"
              />
            ) : (
              <p>No hay asset actual</p>
            )}
            <input
              type="file"
              onChange={(e) => {
                const f = e.target.files[0];
                setFile(f);
                setPreview(URL.createObjectURL(f));
              }}
              className="mt-4"
            />
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="w-full h-40 object-contain mt-4"
              />
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold mb-4">Confirmar</h2>
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="w-full h-48 object-contain mb-4"
              />
            )}
            {uploading && <p className="text-blue-500">Subiendo...</p>}
          </>
        )}

        <div className="mt-6 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Atrás
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {step === 3 ? "Subir" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetWizard;
