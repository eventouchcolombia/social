import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { storage } from "../firebase/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

const Photo = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // frontal por defecto
  const [loadingCamera, setLoadingCamera] = useState(false);
  const navigate = useNavigate();

  // Capturar foto
  const capturePhoto = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  // Repetir foto
  const retakePhoto = () => {
    setCapturedImage(null);
  };

  // Cambiar entre frontal y trasera
  const flipCamera = () => {
    setLoadingCamera(true); // mostrar pantalla negra
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Publicar foto (con marco)
  const publishPhoto = async () => {
    if (!capturedImage) return;
    setUploading(true);

    try {
      const baseImg = new window.Image();
      baseImg.src = capturedImage;
      await new Promise((resolve) => (baseImg.onload = resolve));

      const frameImg = new window.Image();
      frameImg.src = "/marco.png";
      await new Promise((resolve) => (frameImg.onload = resolve));

      const canvas = document.createElement("canvas");
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      const ctx = canvas.getContext("2d");

      // Dibujar foto (solo espejo si es frontal)
      ctx.save();
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Dibujar marco
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

      const finalImage = canvas.toDataURL("image/png");

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
    <div
      className="fixed inset-0 flex items-center justify-center bg-black"
      style={{ zIndex: 1000 }}
    >
      {/* Botón de regresar */}
      <div className="absolute top-2 left-4 flex flex-col items-center z-20">
        <button
          onClick={() => navigate("/choose")}
          className="w-12 h-12 flex items-center justify-center"
        >
          <img src="/back.png" alt="Regresar" className="w-7 h-7" />
        </button>
        <span className="text-black font-bold mt-[-7px]">volver</span>
      </div>

      {/* Cámara o foto */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        {!capturedImage ? (
          !loadingCamera ? (
            <Webcam
              key={facingMode} // fuerza a recargar la cámara
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/png"
              className="w-full h-full object-cover"
              videoConstraints={{ facingMode }}
              onUserMedia={() => setLoadingCamera(false)}
              onUserMediaError={(err) => {
                console.error("Error cámara:", err);
                setLoadingCamera(false);
              }}
              style={{
                width: "100vw",
                height: "100vh",
                objectFit: "cover",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
                background: "black",
              }}
            />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <span className="text-white text-lg animate-pulse">
                Cambiando cámara...
              </span>
            </div>
          )
        ) : (
          <img
            src={capturedImage}
            alt="Foto capturada"
            className="w-full h-full object-cover"
            style={{
              width: "100vw",
              height: "100vh",
              objectFit: "cover",
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
              background: "black",
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
      <div className="absolute bottom-2 left-0 w-full flex justify-center items-center z-20">
        {!capturedImage ? (
          <div className="flex flex-col items-center relative">
            {/* Botón flip a la izquierda */}
            <button
              onClick={flipCamera}
              className="absolute -left-20 top-1/2 transform -translate-y-1/2 flex flex-col items-center cursor-pointer"
            >
              <img
                src="/flip.png"
                alt="Cambiar cámara"
                className="w-12 h-12 hover:opacity-80 transition"
              />
              <span className="text-black mt-1 text-sm font-semibold">
                Cambiar
              </span>
            </button>

            {/* Botón de capturar */}
            <div
              onClick={capturePhoto}
              className="w-24 h-24 rounded-full border-6 border-yellow-500 flex items-center justify-center cursor-pointer hover:opacity-80 transition"
            >
              <img src="/shutter.png" alt="Tomar foto" className="w-20 h-20" />
            </div>
            <span className="text-black mt-2 text-xl font-bold">
              Haz tu foto
            </span>
          </div>
        ) : (
          <div className="flex gap-24 mb-2">
            {/* Botón repetir */}
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={retakePhoto}
            >
              <img
                src="/repetir.png"
                alt="Repetir"
                className="w-20 h-18 hover:opacity-80 transition"
              />
              <span className="text-black mt-0 text-xl font-semibold">
                Repetir
              </span>
            </div>

            {/* Botón publicar */}
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={publishPhoto}
            >
              <img
                src="/publicar.png"
                alt="Publicar"
                className={`w-20 h-18 hover:opacity-80 transition ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <span className="text-black mt-0 text-xl font-semibold">
                {uploading ? "Publicando..." : "Publicar"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Photo;
