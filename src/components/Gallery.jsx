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
     style={{ backgroundImage: "url('/anillos.jpg')" }}
    >
      {/* Botón Volver */}
      <div
        onClick={() => navigate("/choose")}
        className="absolute top-2 left-4 flex flex-col items-center cursor-pointer"
      >
        <img
          src="/back.png"
          alt="Volver"
          className="w-10 h-10 rounded-lg"
        />
        <span className="text-sm text-black font-semibold">volver</span>
      </div>

      <h1 className="text-3xl text-white font-bold  mb-8  mt-14 text-center">
        Galería
      </h1>

      {photos.length === 0 ? (
        <p className="text-center text-gray-600">No hay fotos aún.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, index) => (
            <div
              key={index}
              className="w-full overflow-hidden rounded-md cursor-pointer bg-black flex items-center justify-center"
              style={{ aspectRatio: "1/1" }}
              onClick={() => setSelectedPhoto(url)}
            >
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="object-cover"
                style={{
                  width: "100vw",
                  height: "100vw",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  transform: "scaleX(-1)",
                  background: "black"
                }}
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
          <div className="relative flex items-center justify-center" style={{ width: "90vw", height: "90vh" }}>
            <img
              src={selectedPhoto}
              alt="Foto ampliada"
              className="rounded-lg shadow-lg object-cover"
              style={{
                width: "100%",
                height: "100%",
                transform: "scaleX(-1)",
                background: "black",
                position: "absolute",
                top: 0,
                left: 0
              }}
            />
            {/* Marco superpuesto */}
            <img
              src="/marco.png"
              alt="Marco decorativo"
              className="pointer-events-none select-none"
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 10
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
