import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { storage } from "../firebase/firebase";
// eslint-disable-next-line no-unused-vars
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";
import AuthenticationSupabase from "../components/AuthenticationSupabase";

const Photo = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { eventSlug, getAssetUrl, getStoragePath } = useEvent();
  const [frameUrl, setFrameUrl] = useState(null);
  const { session } = AuthenticationSupabase();

  const user = session?.user;

  useEffect(() => {
    const loadFrame = async () => {
      const url = await getAssetUrl("marco.png");
      setFrameUrl(url || "/marco_local.png");
    };
    loadFrame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug]);

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
  // 👇 Reemplaza SOLO tu publishPhoto con esta versión
  const publishPhoto = async () => {
    if (!capturedImage) return;

    setUploading(true);
    try {
      // 1) Intentar cargar el marco desde Firebase o usar el local
      let frameUrl = await getAssetUrl("marco.png");
      if (!frameUrl) {
        frameUrl = "/marco_local.png"; // fallback local si no existe en Firebase
      }

      const frameImg = new Image();
      frameImg.crossOrigin = "anonymous";
      frameImg.src = frameUrl;
      await new Promise((res) => (frameImg.onload = res));

      // 2) Crear canvas con el tamaño del marco
      const canvas = document.createElement("canvas");
      canvas.width = frameImg.width;
      canvas.height = frameImg.height;
      const ctx = canvas.getContext("2d");

      // 3) Cargar la foto capturada
      const baseImg = new Image();
      baseImg.src = capturedImage; // dataURL desde react-webcam
      await new Promise((res) => (baseImg.onload = res));

      // 4) Calcular cover (centrado + recorte)
      const imgAspect = baseImg.width / baseImg.height;
      const canvasAspect = canvas.width / canvas.height;
      let renderWidth, renderHeight, xOffset, yOffset;

      if (imgAspect > canvasAspect) {
        renderHeight = canvas.height;
        renderWidth = baseImg.width * (canvas.height / baseImg.height);
        xOffset = (canvas.width - renderWidth) / 2;
        yOffset = 0;
      } else {
        renderWidth = canvas.width;
        renderHeight = baseImg.height * (canvas.width / baseImg.width);
        xOffset = 0;
        yOffset = (canvas.height - renderHeight) / 2;
      }

      // 5) Dibujar la foto espejada
      const xDest = canvas.width - xOffset - renderWidth;
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(baseImg, xDest, yOffset, renderWidth, renderHeight);
      ctx.restore();

      // 6) Dibujar el marco encima
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

      // 7) Exportar y subir a Firebase
      const finalDataUrl = canvas.toDataURL("image/png");
      const photoRef = ref(storage, getStoragePath(`${Date.now()}.png`));
       console.log("Usuario actual:", user);
      const metadata = {
      customMetadata: {
        email: user?.email || "",
        uid: user?.id || "",
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || "",
        avatar: user?.user_metadata?.avatar_url || ""
      },
    };

    console.log("Metadata a subir:", metadata);
      await uploadString(photoRef, finalDataUrl, "data_url",metadata);

      console.log("📸 Foto subida:", {
        path: photoRef.fullPath,
        uid: user?.id,
        email: user?.email,
      });

      // Ir a la galería
      navigate(`/${eventSlug}/gallery`);
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
      <div className="absolute top-0 left-2 flex flex-col items-center z-20">
        <button
          onClick={() => navigate(`/${eventSlug}/choose`)}
          className="w-12 h-12   flex items-center justify-center"
        >
          <img src="/back.png" alt="Regresar" className="w-9 h-8" />
        </button>
      </div>

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
              background: "black",
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
              background: "black",
            }}
          />
        )}
        {/* Marco superpuesto */}
        {frameUrl && (
          <img
            src={frameUrl}
            alt="Marco decorativo"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}
      </div>

      {/* Botones principales */}
      <div className="absolute bottom-2 left-0 w-full flex justify-center items-center z-20">
        {!capturedImage ? (
          <div className="flex flex-col items-center">
            <div
              onClick={capturePhoto}
              className="w-22 h-22 rounded-full border-6 mb-8 flex items-center justify-center cursor-pointer hover:opacity-80 transition"
            >
              <img src="/shutter.png" alt="Tomar foto" className="w-20 h-20" />
            </div>
          </div>
        ) : (
          <div className="flex gap-24 mb-8">
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={retakePhoto}
            >
              <img
                src="/repetir.png"
                alt="Repetir"
                className="w-20 h-18 mt-[-10px] hover:opacity-80 transition"
              />
              {/* <span className="text-black mt-0 text-xl font-semibold">
                Repetir
              </span> */}
            </div>

            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={publishPhoto}
            >
              <img
                src="/publicar.png"
                alt="Publicar"
                className={`w-15 h-13 hover:opacity-80 transition ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              {/* <span className="text-black mt-0 text-xl font-semibold">
                {uploading ? "Publicando..." : "Publicar"}
              </span> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Photo;
