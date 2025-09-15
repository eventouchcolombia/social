import { storage } from "../firebase/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import { useParams } from "react-router-dom";

/**
 * Hook para manejar configuración de eventos
 * - Carga assets (desde Firebase Storage)
 * - Devuelve rutas de storage (para fotos)
 */
export const useEvent = () => {
  const { eventSlug } = useParams();
  const currentEventSlug = eventSlug || "boda-principal";

  // 🔹 Devuelve URL de un asset del evento (async)
  const getAssetUrl = async (assetName) => {
    try {
      const fileRef = ref(storage, `assets/${currentEventSlug}/${assetName}`);
      return await getDownloadURL(fileRef);
    } catch (err) {
      console.error(`❌ Error cargando asset ${assetName}:`, err);
      return null;
    }
  };

  // 🔹 Devuelve la ruta en Firebase para fotos del evento
  const getStoragePath = (subPath = "") => {
    return `photos/${currentEventSlug}/${subPath}`;
  };

  return {
    eventSlug: currentEventSlug,
    getAssetUrl, // ahora es async
    getStoragePath,
  };
};
