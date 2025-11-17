import { useEffect, useState } from "react";
import { storage } from "../firebase/firebase";
import {
  ref,
  listAll,
  getDownloadURL,
  getMetadata,
  deleteObject,
} from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";
import AuthenticationSupabase from "../components/AuthenticationSupabase";

// Tema simplificado
const themes = {
  fabian: { title: "text-[#8C6A2F]" },
};
const defaultTheme = { title: "text-black" };

const SkeletonGrid = () => (
  <div className="grid grid-cols-3 gap-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="w-full aspect-square bg-gray-300 rounded-md animate-pulse"
      />
    ))}
  </div>
);

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#753E89");
  const [isColorLoaded, setIsColorLoaded] = useState(false); // 🔹 Estado específico para color

  const navigate = useNavigate();
  const { eventSlug, getAssetUrl, getStoragePath } = useEvent();
  const theme = themes[eventSlug] || defaultTheme;
  const { session } = AuthenticationSupabase();

  const user = session?.user;

  // Cargar fotos: solo cuando cambia eventSlug
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (mounted && photos.length === 0) setLoading(true);
        const storagePath = getStoragePath();
        const listRef = ref(storage, storagePath);
        const result = await listAll(listRef);

        const urls = await Promise.all(
          result.items.map(async (item) => {
            const url = await getDownloadURL(item);
            const metadata = await getMetadata(item);
            console.log("Foto metadata gallery:", metadata);
            return {
              name: item.name,
              url,
              createdAt: metadata?.timeCreated || new Date().toISOString(),
              email: metadata?.customMetadata?.email || null,
              uid: metadata?.customMetadata?.uid || null,
              nameCustom: metadata?.customMetadata?.name || null,
              avatar: metadata?.customMetadata?.avatar || null,
              fullPath: item.fullPath,
            };
          })
        );

        if (!mounted) return;
        urls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPhotos(urls);
      } catch (error) {
        console.error("❌ Error cargando fotos:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug]);

  // Cargar fondo
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const bg = await getAssetUrl("bggallery.png");
        if (mounted) {
          setBackgroundUrl(bg || "/bggallerylocal.png");
        }

        const { loadEventTexts } = await import("../utils/uploadAsset");
        const texts = await loadEventTexts(eventSlug);
        if (mounted) {
          setPrimaryColor(texts.primaryColor || "#753E89");
          setIsColorLoaded(true); // 🔹 Marcar color como cargado
        }
      } catch (err) {
        console.warn("No se pudo cargar assets", err);
        if (mounted) setIsColorLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug]);

  const myPhotos = photos.filter(
    (photo) => photo.email === user?.email || photo.uid === user?.id
  );
  const otherPhotos = photos.filter(
    (photo) => photo.email !== user?.email && photo.uid !== user?.id
  );

  // 🔹 Función para seleccionar/deseleccionar foto
  const toggleSelectPhoto = (fullPath) => {
    setSelectedPhotos((prev) =>
      prev.includes(fullPath)
        ? prev.filter((p) => p !== fullPath)
        : [...prev, fullPath]
    );
  };

  // 🔹 Eliminar fotos seleccionadas
  const handleDeleteSelected = async () => {
    if (selectedPhotos.length === 0) return;

    const confirmDelete = window.confirm(
      `¿Eliminar ${selectedPhotos.length} foto(s)?`
    );
    if (!confirmDelete) return;

    try {
      await Promise.all(
        selectedPhotos.map((fullPath) => {
          const photoRef = ref(storage, fullPath);
          return deleteObject(photoRef);
        })
      );

      console.log("✅ Fotos eliminadas correctamente");
      setPhotos((prev) =>
        prev.filter((photo) => !selectedPhotos.includes(photo.fullPath))
      );
      setSelectedPhotos([]);
    } catch (error) {
      console.error("❌ Error eliminando fotos:", error);
    }
  };

  // 🔹 Cancelar selección
  const handleCancelSelection = () => {
    setSelectedPhotos([]);
  };

  return (
    <div
      className="min-h-screen px-4 py-6 bg-cover bg-center relative pb-40"
      style={{
        backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none",
      }}
    >
      {/* Header con acciones */}
      {selectedPhotos.length > 0 ? (
        <div className="flex items-center justify-between mb-8 mt-0 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelSelection}
              className="text-gray-700 font-medium"
            >
              Cancelar
            </button>
            <span className="text-gray-700 font-semibold">
              {selectedPhotos.length} seleccionada(s)
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <img src="/Trash.png" alt="Eliminar" className="w-5 h-5 invert" />
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-30 mb-8 mt-0">
          <div
            onClick={() => {
              navigate(`/${eventSlug}/choose`);
              window.location.reload();
            }}
            className="flex items-center cursor-pointer z-30"
          >
            <img src="/back.png" alt="Volver" className="w-6 h-6  rounded-lg" />
          </div>
          <h1 className={`text-xl font-bold ${theme.title}`}>
            Galería de imágenes
          </h1>
        </div>
      )}

      {loading && photos.length === 0 ? (
        <SkeletonGrid />
      ) : photos.length === 0 ? (
        <p className="text-center text-gray-600">No hay fotos aún.</p>
      ) : (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold mb-3">Tus fotos</h2>
            <div className="grid grid-cols-3 gap-2">
              {myPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  className="relative rounded-sm overflow-hidden cursor-pointer flex items-center justify-center"
                  style={{ aspectRatio: "1/1" }}
                  onClick={() =>
                    selectedPhotos.length > 0
                      ? toggleSelectPhoto(photo.fullPath)
                      : setSelectedPhoto(photo)
                  }
                >
                  <img
                    src={photo.url}
                    alt={`Foto ${idx + 1}`}
                    className="object-cover w-full h-full"
                  />
                  {/* Checkbox de selección */}
                  <div
                    className="absolute top-2 right-2 w-6 h-6 border-2 border-white rounded-md bg-white/30 backdrop-blur-sm flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectPhoto(photo.fullPath);
                    }}
                  >
                    {selectedPhotos.includes(photo.fullPath) && (
                      <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Otros participantes</h2>
            {otherPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {otherPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-sm cursor-pointer bg-black flex items-center justify-center"
                    style={{ aspectRatio: "1/1" }}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={`Foto ${idx + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Aún no hay fotos de otros participantes.
              </p>
            )}
          </div>
        </div>
      )}

      {loading && photos.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-black/40 rounded-full p-4">
            <div className="w-8 h-8 rounded-full bg-white animate-pulse" />
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-white/90 flex flex-col items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative flex flex-col items-start justify-center w-[90vw] h-[90vh]">
            {selectedPhoto.nameCustom && (
              <div className="flex items-center justify-between w-full mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedPhoto.avatar || "/avatar.png"}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border border-gray-300"
                  />
                  <p className="text-lg font-semibold text-gray-800">
                    {selectedPhoto.nameCustom}
                  </p>
                </div>
              </div>
            )}

            <img
              src={selectedPhoto.url}
              alt="Foto ampliada"
              className="object-contain rounded-2xl max-w-full max-h-full"
            />
          </div>
        </div>
      )}

      {/* Botones inferiores */}
      {!selectedPhoto && selectedPhotos.length === 0 && (
        <div className="fixed bottom-0 left-0 w-full py-6 flex flex-col items-center gap-3 z-50">
          <button
            onClick={() => navigate(`/${eventSlug}/photo`)}
            className={`w-3/4 px-6 py-3 text-white font-semibold rounded-full shadow hover:opacity-90 transition ${!isColorLoaded ? 'invisible' : 'visible'}`}
            style={{ backgroundColor: primaryColor }}
          >
            Tomar foto
          </button>

          <button
            onClick={() => {
              navigate(`/${eventSlug}/choose`);
              window.location.reload();
            }}
            className={`w-3/4 px-6 py-3 font-semibold rounded-full shadow hover:opacity-90 transition ${!isColorLoaded ? 'invisible' : 'visible'}`}
            style={{
              backgroundColor: `${primaryColor}20`,
              color: primaryColor,
            }}
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
};

export default Gallery;