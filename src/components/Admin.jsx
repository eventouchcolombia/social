
import { useState, useEffect } from "react";
import { storage } from "../firebase/firebase";
import AssetWizard from "./AssetWizard";
import {
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
  getBlob,
} from "firebase/storage";

import useAuthenticationSupabase from "./AuthenticationSupabase";
import { useEvent } from "../hooks/useEvent";

const Admin = () => {
  const { session, isAdmin, loading, signInWithGoogle, signOut } =
    useAuthenticationSupabase();
  const { eventSlug, getAssetUrl, getStoragePath } = useEvent();

  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showWizard, setShowWizard] = useState(false);


    const [backgroundUrl, setBackgroundUrl] = useState(null);
  // === cargar fotos solo si es admin ===
  const fetchPhotos = async () => {
    try {
      const listRef = ref(storage, getStoragePath());
      const result = await listAll(listRef);
      const urls = await Promise.all(
        result.items.map(async (item) => ({
          name: item.name,
          url: await getDownloadURL(item),
        }))
      );
      setPhotos(urls.reverse());
    } catch (error) {
      console.error("❌ Error cargando fotos:", error);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchPhotos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, eventSlug]);

useEffect(() => {
  const loadBackground = async () => {
    const url = await getAssetUrl("adminbg.png"); // 🔹 usa el mismo nombre del wizard
    setBackgroundUrl(url);
  };
  loadBackground();
}, [eventSlug, getAssetUrl]);

  // === eliminar foto ===
  const handleDelete = async (name) => {
    try {
      const photoRef = ref(storage, getStoragePath(name));
      await deleteObject(photoRef);
      setPhotos((prev) => prev.filter((photo) => photo.name !== name));
      setSelectedPhoto(null);
      setConfirmDelete(null);
      setSelectedPhotos((prev) => prev.filter((n) => n !== name));
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
    }
  };

  // === descargar foto ===
  const handleDownload = async (fileName) => {
    try {
      const fileRef = ref(storage, getStoragePath(fileName));
      const blob = await getBlob(fileRef);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("❌ Error descargando la foto:", error);
    }
  };

  const handleDownloadSelected = async () => {
    for (const name of selectedPhotos) {
      await handleDownload(name);
    }
  };

  // === UI ===
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h1 className="text-white text-2xl">Cargando...</h1>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="flex flex-col justify-center items-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none" }}

      >
        <h1 className="text-3xl font-bold text-center text-white mb-8 mt-[-200px]">
          Login Admin - {eventSlug}
        </h1>

        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 mt-12 bg-white/75 text-black font-bold rounded-lg flex items-center gap-2 shadow-md hover:bg-[#357ae8] transition"
        >
          <img src="/google.png" alt="Google" className="w-6 h-6" />
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

if (session && !isAdmin) {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen gap-4">
      <h1 className="text-black text-2xl">Acceso denegado.</h1>
      <p className="text-sm text-gray-300">
        Usuario: {session.user?.email ?? "sin email"}
      </p>
      <button
        onClick={signOut}
        className="px-4 py-2 bg-gray-700 text-white rounded"
      >
        Cerrar sesión
      </button>
    </div>
  );
}


  return (
    <div
      className=" px-4 py-6 min-h-screen bg-cover bg-center "
      style={{ backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none" }}
    >
      <img
        src="/cerrarsesion.png"
        alt="Cerrar sesión"
        className="w-12 h-12 cursor-pointer absolute top-2 right-4 z-50 rounded-full p-2 shadow-lg hover:bg-gray-200 transition"
        onClick={signOut}
        title="Cerrar sesión"
      />

      <h1 className="text-3xl font-bold text-white mb-6 mt-8 text-center">
        Dashboard Admin - {eventSlug}
      </h1>

      <div className="text-center mb-6">
        <button
          onClick={() => setShowWizard(true)}
          className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Configurar Assets
        </button>

      </div>

      {showWizard && <AssetWizard onClose={() => setShowWizard(false)} />}

      <h2 className="font-semibold text-white text-center mb-6 flex justify-center items-center gap-6">
        Total fotos: {photos.length}
        {photos.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={(e) => {
                const checked = e.target.checked;
                setSelectAll(checked);
                setSelectedPhotos(checked ? photos.map((p) => p.name) : []);
              }}
            />
            Seleccionar todo
          </label>
        )}
      </h2>

      {selectedPhotos.length > 0 && (
        <div className="text-center mb-6 flex justify-center gap-4">
          <button
            onClick={() => setConfirmDelete(selectedPhotos)}
            className="px-4 py-2 bg-red-400 text-white rounded"
          >
            Eliminar ({selectedPhotos.length})
          </button>
          <button
            onClick={handleDownloadSelected}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Descargar ({selectedPhotos.length})
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-center text-gray-300">No hay fotos aún.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group w-full aspect-square overflow-hidden rounded-md shadow-md"
            >
              <img
                src={photo.url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
                onClick={() => setSelectedPhoto(photo)}
              />
              <input
                type="checkbox"
                className="absolute bottom-20 left-0 w-5 h-5"
                checked={selectedPhotos.includes(photo.name)}
                onChange={(e) => {
                  if (e.target.checked)
                    setSelectedPhotos((prev) => [...prev, photo.name]);
                  else {
                    setSelectedPhotos((prev) =>
                      prev.filter((n) => n !== photo.name)
                    );
                    setSelectAll(false);
                  }
                }}
              />
              <div className="absolute top-2 right-2 flex gap-8 mt-14">
                <img
                  src="/descargar.png"
                  alt="Descargar"
                  className="w-8 h-8 cursor-pointer rounded-full p-1"
                  onClick={() => handleDownload(photo.name)}
                />
                <img
                  src="/borrar.png"
                  alt="Eliminar"
                  className="w-8 h-8 cursor-pointer rounded-full p-1"
                  onClick={() => setConfirmDelete(photo)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal foto ampliada */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative">
            <img
              src={selectedPhoto.url}
              alt="Foto ampliada"
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
            />
            <div className="absolute top-4 right-4 flex gap-4">
              <img
                src="/descargar.png"
                alt="Descargar"
                className="w-10 h-10 cursor-pointer rounded-full p-2"
                onClick={() => handleDownload(selectedPhoto.name)}
              />
              <img
                src="/borrar.png"
                alt="Eliminar"
                className="w-10 h-10 cursor-pointer rounded-full p-2"
                onClick={() => setConfirmDelete(selectedPhoto)}
              />
            </div>
            <button
              className="absolute top-4 left-4 text-white text-xl bg-black/50 px-3 py-1 rounded-full"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modal confirmación borrar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-sm w-full text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {Array.isArray(confirmDelete)
                ? `Estás a punto de eliminar ${confirmDelete.length} fotos`
                : "Estás a punto de eliminar esta foto"}
            </h2>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={async () => {
                  if (Array.isArray(confirmDelete)) {
                    for (const name of confirmDelete) await handleDelete(name);
                    setSelectedPhotos([]);
                    setSelectAll(false);
                  } else await handleDelete(confirmDelete.name);
                  setConfirmDelete(null);
                }}
              >
                Confirmar
              </button>
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setConfirmDelete(null)}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
