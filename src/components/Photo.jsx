import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { storage } from "../firebase/firebase";
// eslint-disable-next-line no-unused-vars
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";
import AuthenticationSupabase from "../components/AuthenticationSupabase";
import ARScene from "./ARScene";

const Photo = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { eventSlug, getAssetUrl, getStoragePath } = useEvent();
  const [frameUrl, setFrameUrl] = useState(null);
  const { session } = AuthenticationSupabase();
  const [arSystem, setArSystem] = useState(null);

  const user = session?.user;

  useEffect(() => {
    const loadFrame = async () => {
      const url = await getAssetUrl("marco.png");
      setFrameUrl(url || "/marco_local.png");
    };
    loadFrame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug]);

  const handleARReady = (system) => {
    setArSystem(system);
  };

  // Solo captura la foto (NO sube todavía)
  const capturePhoto = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    // Detener AR para que las gafas se congelen
    if (arSystem) {
      arSystem.stop();
    }
  };

  // Repetir foto
  const retakePhoto = () => {
    setCapturedImage(null);
    // Reiniciar AR
    if (arSystem) {
      arSystem.start();
    }
  };

  const loadImage = async (src) => {
    if (!src) {
      return Promise.reject(new Error("Fuente de imagen no válida"));
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  };

  // Combina la foto capturada con el marco usando canvas y la sube
  const publishPhoto = async () => {
    if (!capturedImage || uploading) return;

    setUploading(true);
    try {
      // 1) Capturar la escena AR directamente desde el canvas de A-Frame
      const arCanvas = ARScene.getCanvas();
      if (!arCanvas) {
        console.error("AR canvas not available");
        setUploading(false);
        return;
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const arDataUrl = arCanvas.toDataURL("image/png");

      // 2) Intentar cargar el marco desde Firebase o usar el local
      let frameSrc = await getAssetUrl("marco.png");
      if (!frameSrc) {
        frameSrc = "/marco_local.png";
      }
      let frameImg;
      try {
        frameImg = await loadImage(frameSrc);
      } catch (error) {
        console.warn("Fallo al cargar marco remoto, usando local", error);
        frameSrc = "/marco_local.png";
        frameImg = await loadImage(frameSrc);
      }

      // 3) Preparar canvas intermedio con la vista exacta (webcam + AR)
      //    usando la resolución original de la foto capturada
      const viewCanvas = document.createElement("canvas");
      const viewCtx = viewCanvas.getContext("2d");

      // 4) Cargar la foto capturada
      const baseImg = new Image();
      baseImg.src = capturedImage; // dataURL desde react-webcam
      await new Promise((res) => (baseImg.onload = res));
      viewCanvas.width = baseImg.width;
      viewCanvas.height = baseImg.height;

      // 5) Cargar la imagen AR
      const arImg = new Image();
      arImg.crossOrigin = "anonymous";
      arImg.src = arDataUrl;
      await new Promise((res) => (arImg.onload = res));

      // 6) Componer la vista tal cual se muestra en pantalla
      // Foto (mirrored) + capa AR en la misma resolución
      viewCtx.save();
      viewCtx.translate(viewCanvas.width, 0);
      viewCtx.scale(-1, 1);
      viewCtx.drawImage(baseImg, 0, 0, viewCanvas.width, viewCanvas.height);
      viewCtx.restore();

      // MindAR ya pinta la capa alineada en el canvas original, solo la escalamos si difiere
      viewCtx.drawImage(arImg, 0, 0, viewCanvas.width, viewCanvas.height);

      // 7) Crear el canvas final con el tamaño del marco
      const canvas = document.createElement("canvas");
      canvas.width = frameImg.width || 1080;
      canvas.height = frameImg.height || 1920;
      const ctx = canvas.getContext("2d");

      const drawCover = (image) => {
        const imgAspect = image.width / image.height;
        const canvasAspect = canvas.width / canvas.height;
        let drawWidth;
        let drawHeight;
        let drawX;
        let drawY;

        if (imgAspect > canvasAspect) {
          drawHeight = canvas.height;
          drawWidth = imgAspect * canvas.height;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        }

        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      };

      // 8) Dibujar la composición y luego el marco
      drawCover(viewCanvas);
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

      // 9) Exportar y subir a Firebase
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
      await uploadString(photoRef, finalDataUrl, "data_url", metadata);

      console.log("📸 Foto subida:", {
        path: photoRef.fullPath,
        uid: user?.id,
        email: user?.email,
      });

      // Ir a la galería
      navigate(`/${eventSlug}/gallery`);
    } catch (error) {
      console.error("❌ Error al subir la foto:", error);
      setUploading(false);
      return;
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

      {/* AR Scene component */}
      <ARScene
        eventSlug={eventSlug}
        isActive={!capturedImage}
        onSceneReady={handleARReady}
      />

      {/* Botones principales */}
      <div className="absolute bottom-6 left-0  w-full flex justify-center items-center z-20">
  {!capturedImage ? (
    <div className="flex flex-col items-center ">
      <div
        onClick={capturePhoto}
        className="w-22 h-22 rounded-full border-6 mb-8 flex items-center justify-center cursor-pointer hover:opacity-80 transition"
      >
        <img src="/shutter.png" alt="Tomar foto" className="w-20 h-20" />
      </div>
    </div>
  ) : (
    <div className="flex gap-24 mb-[-20px] ">
      
      {/* Repetir */}
      <div
        className="flex flex-col items-center cursor-pointer"
        onClick={retakePhoto}
      >
        <img
          src="/repetir.png"
          alt="Repetir"
          className="w-20 h-20 hover:opacity-80 transition"
        />
      </div>

      {/* Publicar */}
      <div
        className="flex flex-col items-center cursor-pointer"
        onClick={publishPhoto}
      >
        <img
          src="/publicar.png"
          alt="Publicar"
          className={`w-20 h-20 hover:opacity-80 transition ${
            uploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      </div>

    </div>
  )}
</div>

    </div>
  );
};

export default Photo;
