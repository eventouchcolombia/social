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

  // Combina la foto capturada con el marco usando canvas y la sube
  const publishPhoto = async () => {
    if (!capturedImage) return;

    setUploading(true);
    try {
      // Cargar la imagen capturada
      const baseImg = new window.Image();
      baseImg.src = capturedImage;
      await new Promise((resolve) => { baseImg.onload = resolve; });

      // Cargar el marco
      const frameImg = new window.Image();
      frameImg.src = '/marco.png';
      await new Promise((resolve) => { frameImg.onload = resolve; });

      // Crear canvas y dibujar ambas imágenes
      const canvas = document.createElement('canvas');
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      const ctx = canvas.getContext('2d');
      // Dibuja la foto (espejada)
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      // Dibuja el marco
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

      // Obtiene la imagen final
      const finalImage = canvas.toDataURL('image/png');

      // Sube la imagen combinada
      const photoRef = ref(storage, `photos/${Date.now()}.png`);
      await uploadString(photoRef, finalImage, "data_url");

      await getDownloadURL(photoRef);
      navigate("/gallery");
    } catch (error) {
      console.error("❌ Error al subir la foto:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
  <div className="fixed inset-0 flex items-center justify-center bg-black" style={{ zIndex: 1000 }}>
      {/* Botón de regresar */}
      <button
        onClick={() => navigate("/choose")}
        className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white bg-opacity-80 shadow flex items-center justify-center z-20 hover:bg-gray-200"
        style={{ backdropFilter: "blur(4px)" }}
      >
        <img 
          src="/back.png" 
          alt="Regresar" 
          className="w-7 h-7" 
        />
      </button>

      {/* Cámara o foto ocupando toda la pantalla con marco superpuesto */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        {/* Foto o cámara */}
        {!capturedImage ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/png"
            className="w-full h-full object-cover"
            videoConstraints={{
              facingMode: "user",
            }}
            style={{
              width: "100vw",
              height: "100vh",
              objectFit: "cover",
              transform: "scaleX(-1)",
              background: "black"
            }}
          />
        ) : (
          <img
            src={capturedImage}
            alt="Foto capturada"
            className="w-full h-full object-cover"
            style={{
              width: "100vw",
              height: "100vh",
              objectFit: "cover",
              transform: "scaleX(-1)",
              background: "black"
            }}
          />
        )}
        {/* Marco superpuesto */}
        <img
          src="/marco.png"
          alt="Marco decorativo"
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          style={{ zIndex: 10 }}
        />
      </div>

      {/* Botones principales */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center items-center z-20">
        {!capturedImage ? (
          <button
            onClick={capturePhoto}
            className="bg-purple-600 text-white px-8 py-4 rounded-full text-xl shadow-lg hover:bg-purple-700 transition backdrop-blur-md bg-opacity-80"
            style={{ minWidth: "180px" }}
          >
            Tomar foto
          </button>
        ) : (
          <div className="flex gap-6">
            <button
              onClick={retakePhoto}
              className="bg-gray-300 text-gray-800 px-8 py-4 rounded-full text-xl shadow-lg hover:bg-gray-400 transition backdrop-blur-md bg-opacity-80"
              style={{ minWidth: "180px" }}
            >
              Repetir
            </button>
            <button
              onClick={publishPhoto}
              disabled={uploading}
              className={`px-8 py-4 rounded-full text-xl shadow-lg transition backdrop-blur-md bg-opacity-80 min-w-[180px] ${
                uploading
                  ? "bg-purple-300 text-white cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {uploading ? "Publicando..." : "Publicar"}
            </button>
          </div>
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
