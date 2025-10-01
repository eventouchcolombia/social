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
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [loading, setLoading] = useState(true);

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
        // Si no hay fotos aún, mostramos skeleton; si ya hay fotos, dejamos visibles y mostramos overlay
        if (mounted && photos.length === 0) setLoading(true);
        const storagePath = getStoragePath(); // llamamos aquí, no en deps
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
              email: metadata?.customMetadata?.email || null, // <-- leer email
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
  }, [eventSlug]); // NO includes getStoragePath to avoid loops si la función no es estable

  // Cargar fondo (una sola vez por eventSlug)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const bg = await getAssetUrl("bggallery.png");
        if (mounted) {
          setBackgroundUrl(bg || "/bggallerylocal.png"); // fallback local
        }
      } catch (err) {
        console.warn("No se pudo cargar bggallery.png", err);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug]);

  // Separación simple: primera foto = usuario, resto = otros
  const myPhotos = photos.filter(
    (photo) => photo.email === user?.email || photo.uid === user?.id
  );
  const otherPhotos = photos.filter(
    (photo) => photo.email !== user?.email && photo.uid !== user?.id
  );

  const handleDeletePhoto = async (photo) => {
  try {
    if (!photo.fullPath) {
      throw new Error("La foto no tiene fullPath en Firebase");
    }

    const photoRef = ref(storage, photo.fullPath); // ✅ referencia al archivo
    await deleteObject(photoRef);

    console.log("✅ Foto eliminada correctamente");
    // Opcional: refrescar galería
    setPhotos((prev) => prev.filter((p) => p.fullPath !== photo.fullPath));
    setSelectedPhoto(null);
  } catch (error) {
    console.error("❌ Error eliminando foto:", error);
  }
};

  return (
    <div
      className="min-h-screen px-4 py-6 bg-cover bg-center relative pb-40"
      style={{
        backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none",
      }}
    >
      {/* Botón volver */}
      <div className="flex items-center gap-30 mb-8 mt-0">
        {/* Botón volver */}
        <div
          onClick={() => {
            navigate(`/${eventSlug}/choose`);
            window.location.reload();
          }}
          className="flex items-center cursor-pointer z-30"
        >
          <img src="/back.png" alt="Volver" className="w-6 h-6 rounded-lg" />
        </div>

        {/* Título */}
        <h1 className={`text-xl font-semibold ${theme.title}`}>
          Galería de imágenes
        </h1>
      </div>

      {/* Si estamos cargando y no hay fotos -> skeleton */}
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
                  className=" rounded-sm overflow-hidden  cursor-pointer  flex items-center justify-center"
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
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 ">Otros participantes</h2>
            {otherPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {otherPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className=" overflow-hidden rounded-sm cursor-pointer bg-black flex items-center justify-center"
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

      {/* Overlay de carga si hay fotos pero se está actualizando */}
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
      {/* 👤 Avatar + Nombre + Botón eliminar */}
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

          {/* Botón eliminar - solo dueño */}
          {user && selectedPhoto.uid === user.id && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // evita cerrar modal al hacer click
                handleDeletePhoto(selectedPhoto);
              }}
              className="bg-white/80 rounded-full p-2 hover:bg-red-100"
            >
              <img src="/Trash.png" alt="Eliminar foto" className="w-6 h-6" />
            </button>
          )}
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
      {!selectedPhoto && (
        <div className="fixed bottom-0 left-0 w-full  py-6 flex flex-col items-center gap-3 z-50">
          <button
            onClick={() => navigate(`/${eventSlug}/photo`)} // 🔹 Ruta a tomar foto
            className="w-3/4 px-6 py-3 bg-[#753E89] text-white font-semibold rounded-full shadow hover:bg-blue-700 transition"
          >
            Tomar foto
          </button>

          <button
            onClick={() => {
              navigate(`/${eventSlug}/choose`);
              window.location.reload();
            }} // 🔹 Ruta de inicio
            className="w-3/4 px-6 py-3 bg-gray-200 text-[#753E89] font-semibold rounded-full shadow hover:bg-gray-300 transition"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
};

export default Gallery;
