import { useEffect, useState } from "react";
import { storage } from "../firebase/firebase";
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";

// 🎨 Configuración de estilos por evento
const themes = {
  fabian: {
    title: "text-[#8C6A2F]",
    backButton: "text-[#8C6A2F]",
  },
  // 🎉 Agrega aquí más estilos personalizados por evento
};

// 🎨 Tema por defecto
const defaultTheme = {
  title: "text-white",
  backButton: "text-black",
};

// 🦴 Skeleton loader
const SkeletonGrid = () => (
  <div className="grid grid-cols-3 gap-2">
    {Array.from({ length: 9 }).map((_, index) => (
      <div
        key={index}
        className="w-full aspect-square bg-gray-300 rounded-md animate-pulse"
      />
    ))}
  </div>
);

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [frameUrl, setFrameUrl] = useState(null);
  const [loading, setLoading] = useState(true); // ⏳ nuevo estado de carga

  const navigate = useNavigate();
  const { eventSlug, getAssetUrl, getStoragePath } = useEvent();

  // Selecciona el tema según el evento
  const theme = themes[eventSlug] || defaultTheme;

  // 🔥 Solo se ejecuta cuando cambia el eventSlug
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true); // inicia carga
        console.log(`📂 Cargando fotos desde Firebase para evento: ${eventSlug}...`);
        const listRef = ref(storage, getStoragePath());
        const result = await listAll(listRef);

        const urls = await Promise.all(
          result.items.map(async (item) => {
            const url = await getDownloadURL(item);
            const metadata = await getMetadata(item);
            return {
              name: item.name,
              url,
              createdAt: metadata.timeCreated,
            };
          })
        );

        // 📌 Ordenar más recientes primero
        urls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setPhotos(urls);
      } catch (error) {
        console.error("❌ Error cargando fotos:", error);
      } finally {
        setLoading(false); // termina carga
      }
    };

    fetchPhotos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug]); // ✅ quitamos getStoragePath para evitar loop

  // Cargar assets de fondo y marco
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
      className="min-h-screen px-4 py-6 bg-cover bg-center"
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
      </div>

      {/* Título dinámico */}
      <h1
        className={`text-3xl font-bold mb-8 mt-14 text-center ${theme.title}`}
      >
        Galería
      </h1>

      {/* Mostrar skeleton, mensaje o galería */}
      {loading ? (
        <SkeletonGrid />
      ) : photos.length === 0 ? (
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
              className="object-cover"
              style={{
                transform: "scaleX(1)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
