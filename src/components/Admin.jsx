import { useEffect, useState } from "react";
import { storage } from "../firebase/firebase";
import { ref, listAll, getDownloadURL, deleteObject,getBlob } from "firebase/storage";
//import { useNavigate } from "react-router-dom";

const Admin = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // 🔹 Foto pendiente de eliminar
//   const navigate = useNavigate();

  // 🔹 Cargar fotos
  const fetchPhotos = async () => {
    try {
      console.log("📂 Cargando fotos desde Firebase...");
      const listRef = ref(storage, "photos/");
      const result = await listAll(listRef);

      const urls = await Promise.all(
        result.items.map(async (item) => ({
          name: item.name,
          url: await getDownloadURL(item),
        }))
      );

      console.log("✅ Fotos cargadas:", urls);
      setPhotos(urls.reverse()); // más recientes primero
    } catch (error) {
      console.error("❌ Error cargando fotos:", error);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // 🔹 Eliminar foto
  const handleDelete = async (name) => {
    try {
      const photoRef = ref(storage, `photos/${name}`);
      await deleteObject(photoRef);
      console.log("🗑️ Foto eliminada:", name);
      setPhotos((prev) => prev.filter((photo) => photo.name !== name));
      setSelectedPhoto(null); // cerrar modal si la elimino
      setConfirmDelete(null); // cerrar confirmación
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
    }
  };

  // 🔹 Descargar foto
// 🔹 Función corregida
const handleDownload = async (fileName) => {
  try {
    const fileRef = ref(storage, `photos/${fileName}`);
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


  return (
    <div className="min-h-screen px-4 py-6"
     style={{ backgroundImage: "url('/anillos.jpg')" }}
    >
      {/* Botón Volver */}
      {/* <button
        onClick={() => navigate("/choose")}
        className="mb-4 px-4 py-2 bg-purple-400/70 text-white rounded-lg shadow-md hover:bg-purple-600 transition"
      >
        Regresar
      </button> */}

      <h1 className="text-3xl font-bold text-white mb-6 mt-8 text-center">
        Dashboard Admin
      </h1>

      {photos.length === 0 ? (
        <p className="text-center text-gray-600">No hay fotos aún.</p>
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
                style={{ transform: "scaleX(-1)" }}
                onClick={() => setSelectedPhoto(photo)} // 🔹 Guardar objeto completo
              />

              {/* Acciones */}
              <div className="absolute top-2 right-2 flex gap-8 mt-14 ">
                <img
                  src="/descargar.png"
                  alt="Descargar"
                  className="w-8 h-8 cursor-pointer rounded-full p-1 shadow bg-white"
                  onClick={() => handleDownload(photo.name)}
                />
                <img
                  src="/borrar.png"
                  alt="Eliminar"
                  className="w-8 h-8 cursor-pointer rounded-full p-1 shadow bg-white"
                  onClick={() => setConfirmDelete(photo)} // 🔹 Mostrar modal confirmación
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para ampliar la foto */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative">
            <img
              src={selectedPhoto.url}
              alt="Foto ampliada"
              className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Acciones en el modal */}
            <div className="absolute top-4 right-4 flex gap-4">
              <img
                src="/descargar.png"
                alt="Descargar"
                className="w-10 h-10 cursor-pointer rounded-full p-2 bg-white shadow"
                onClick={() => handleDownload(selectedPhoto.name)}
              />
              <img
                src="/borrar.png"
                alt="Eliminar"
                className="w-10 h-10 cursor-pointer rounded-full p-2 bg-white shadow"
                onClick={() => setConfirmDelete(selectedPhoto)} // 🔹 Confirmación antes de borrar
              />
            </div>

            {/* Botón cerrar */}
            <button
              className="absolute top-4 left-4 text-white text-xl bg-black/50 px-3 py-1 rounded"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-sm w-full text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Estás a punto de eliminar esta foto
            </h2>

            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 transition"
                onClick={() => handleDelete(confirmDelete.name)}
              >
                Confirmar
              </button>
              <button
                className="px-4 py-2 bg-gray-300 rounded shadow hover:bg-gray-400 transition"
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
