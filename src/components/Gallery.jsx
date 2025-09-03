import { useEffect, useState } from "react";
import { storage } from "../firebase/firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        console.log("📂 Cargando fotos desde Firebase...");
        const listRef = ref(storage, "photos/");
        const result = await listAll(listRef);

        const urls = await Promise.all(
          result.items.map((item) => getDownloadURL(item))
        );

        console.log("✅ Fotos cargadas:", urls);
        setPhotos(urls.reverse()); // más recientes primero
      } catch (error) {
        console.error("❌ Error cargando fotos:", error);
      }
    };

    fetchPhotos();
  }, []);

  return (
    <div className="min-h-screen bg-white px-4 py-6 bg-cover bg-center"
     style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Botón Volver */}
      <button
        onClick={() => navigate("/choose")}
        className="mb-4 px-4 py-2 bg-purple-400/70 text-white  rounded-lg shadow-md hover:bg-purple-600 transition"
      >
        regresar
      </button>

      <h1 className="text-3xl text-white font-bold  mb-6 text-center">
        Galería
      </h1>

      {photos.length === 0 ? (
        <p className="text-center text-gray-600">No hay fotos aún.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, index) => (
            <div
              key={index}
              className="w-full aspect-square overflow-hidden rounded-md cursor-pointer"
              onClick={() => setSelectedPhoto(url)}
            >
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
                 style={{ transform: "scaleX(-1)" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal para ampliar la foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Foto ampliada"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      )}
    </div>
  );
};

export default Gallery;
