import { useEffect, useState } from "react";
import { storage } from "../firebase/firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [frameUrl, setFrameUrl] = useState(null);

  const navigate = useNavigate();
  const { eventSlug, getAssetUrl, getStoragePath } = useEvent();

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        console.log(
          `📂 Cargando fotos desde Firebase para evento: ${eventSlug}...`
        );
        const listRef = ref(storage, getStoragePath());
        const result = await listAll(listRef);

        const urls = await Promise.all(
  result.items.map(async (item) => ({
    name: item.name,
    url: await getDownloadURL(item),
  }))
);

setPhotos(urls.reverse());


        console.log("✅ Fotos cargadas:", urls);
        setPhotos(urls.reverse()); // más recientes primero
      } catch (error) {
        console.error("❌ Error cargando fotos:", error);
      }
    };

    fetchPhotos();
  }, [eventSlug, getStoragePath]);

  useEffect(() => {
    const loadAssets = async () => {
      const bg = await getAssetUrl("bggallery.png");
      const frame = await getAssetUrl("marco.png");
      setBackgroundUrl(bg);
      setFrameUrl(frame);
    };
    loadAssets();
  }, [eventSlug, getAssetUrl]);

  return (
    <div
      className="min-h-screen bg-white px-4 py-6 bg-cover bg-center"
      style={{
        backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none",
      }}
    >
      {/* Botón Volver */}
      <div
        onClick={() => navigate(`/${eventSlug}/choose`)}
        className="absolute top-2 left-4 flex flex-col items-center cursor-pointer"
      >
        <img src="/back.png" alt="Volver" className="w-10 h-10 rounded-lg" />
        <span className="text-sm text-black font-semibold">volver</span>
      </div>

      <h1 className="text-3xl text-black font-bold  mb-8  mt-14 text-center">
        Galería
      </h1>

      {photos.length === 0 ? (
        <p className="text-center text-gray-600">No hay fotos aún.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
         {photos.map((photo, index) => (
  <div
    key={index}
    className="w-full overflow-hidden rounded-md cursor-pointer bg-black flex items-center justify-center"
    style={{ aspectRatio: "1/1" }}
    onClick={() => setSelectedPhoto(photo)}
  >
    <img
      src={photo.url}
      alt={`Foto ${index + 1}`}
      className="object-cover"
      style={{
        width: "100vw",
        height: "100vw",
        maxWidth: "100%",
        maxHeight: "100%",
        transform: "scaleX(1)",
        background: "black",
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
          
          <div
            className="relative flex items-center justify-center"
            style={{ width: "90vw", height: "90vh" }}
          >
            <img
              src={selectedPhoto.url}
              alt="Foto ampliada"
               className="max-w-[90vw] h-[80%] rounded-lg shadow-lg"
              // style={{
              //   width: "100%",
              //   height: "100%",
              //   transform: "scaleX(1)",
              //   background: "black",
              //   position: "absolute",
              //   top: 0,
              //   left: 0,
              // }}
            />
            {/* Marco superpuesto */}
            {/* {frameUrl && (
              <img
                src={frameUrl}
                alt="Marco decorativo"
                className="pointer-events-none select-none"
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 10,
                }}
              />
            )} */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
