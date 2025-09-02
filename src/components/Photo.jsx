import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { storage } from "../firebase/firebase"; 
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

const Photo = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Solo captura la foto (NO sube todavía)
  const capturePhoto = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  // Repetir foto
  const retakePhoto = () => {
    setCapturedImage(null);
  };

  // Publicar = subir y luego ir a galería
  const publishPhoto = async () => {
    if (!capturedImage) return;

    try {
      setUploading(true);
      console.log("📸 Subiendo foto a Firebase Storage...");

      const photoRef = ref(storage, `photos/${Date.now()}.png`);
      await uploadString(photoRef, capturedImage, "data_url");

      console.log("✅ Foto subida, generando URL pública...");
      await getDownloadURL(photoRef);

      navigate("/gallery");
    } catch (error) {
      console.error("❌ Error al subir la foto:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 relative">
      {/* Botón de regresar */}
      <button
        onClick={() => navigate("/choose")}
        className="absolute top-2 left-2 px-4 py-2 bg-gray-200/90 text-gray-800 rounded-lg shadow hover:bg-gray-300 transition"
      >
        ← Regresar
      </button>

      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        ¡Sonríe!
      </h1>
      <p className="text-lg text-gray-600 text-center mb-6">
        Aquí podrás tomarte una foto y compartirla con todos los asistentes al evento.
      </p>

      {/* Cámara o foto */}
      <div className="w-72 h-110 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 mb-6 overflow-hidden">
        {!capturedImage ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/png"
            className="w-full h-full object-cover rounded-xl"
            videoConstraints={{
              facingMode: "user",
            }}
            style={{
              transform: "scaleX(-1)",
            }}
          />
        ) : (
          <img
            src={capturedImage}
            alt="Foto capturada"
            className="w-full h-full object-cover rounded-xl"
            style={{ transform: "scaleX(-1)" }}
          />
        )}
      </div>

      {/* Botones */}
      {!capturedImage ? (
        <button
          onClick={capturePhoto}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg text-lg shadow-md hover:bg-purple-600 transition"
        >
          Tomar foto
        </button>
      ) : (
        <div className="flex gap-4">
          <button
            onClick={retakePhoto}
            className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg text-lg shadow-md hover:bg-gray-400 transition"
          >
            Repetir 
          </button>
          <button
            onClick={publishPhoto}
            disabled={uploading}
            className={`px-6 py-3 rounded-lg text-lg shadow-md transition ${
              uploading
                ? "bg-purple-300 text-white cursor-not-allowed"
                : "bg-purple-500 text-white hover:bg-purple-600"
            }`}
          >
            {uploading ? "Publicando..." : "Publicar"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Photo;
