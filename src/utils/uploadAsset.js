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
