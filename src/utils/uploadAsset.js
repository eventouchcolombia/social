import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

/**
 * Sube un archivo a Firebase Storage y devuelve la URL pública
 * @param {File} file - archivo seleccionado
 * @param {string} fullPath - ruta completa en Storage (ej: assets/boda-principal/background.jpg)
 * @returns {Promise<string>} - URL pública del archivo
 */
export const uploadAsset = async (file, fullPath) => {
  if (!file) throw new Error("No file provided");
  if (!fullPath) throw new Error("No path provided");

  const storageRef = ref(storage, fullPath);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

/**
 * Carga los textos del evento desde Firebase Storage
 * @param {string} eventSlug - slug del evento
 * @returns {Promise<object>} - objeto con title y subtitle
 */
export const loadEventTexts = async (eventSlug) => {
  try {
    const textRef = ref(storage, `assets/${eventSlug}/event-texts.json`);
    const url = await getDownloadURL(textRef);
    const response = await fetch(url);
    const texts = await response.json();
    return texts;
  } catch (error) {
    // Solo mostrar log amigable si el archivo no existe
    if (error.code === "storage/object-not-found") {
      console.warn(
        `⚠️ No se encontraron textos personalizados para ${eventSlug}, usando valores por defecto`
      );
    } else {
      console.error("❌ Error cargando textos del evento:", error);
    }

    // Valores por defecto
    return {
      title: "EventPhotos",
      subtitle: ""
    };
  }
};
