import { useState, useEffect, useRef } from "react";
import { storage } from "../../../config/firebase";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Images,
  BrushCleaning
} from "lucide-react";
import {
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
  getBlob,
  getMetadata,
} from "firebase/storage";

const PhotosAdmin = ({ eventSlug, onClose, onPhotosUpdate }) => {
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Cambiado a true por defecto
  const [displayedPhotos, setDisplayedPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const PHOTOS_PER_PAGE = 20;
  const observerRef = useRef(null);

  // Cargar fotos
  const fetchPhotos = async () => {
    if (!eventSlug) return;

    setIsLoading(true);
    try {
      const listRef = ref(storage, `photos/${eventSlug}`);
      const result = await listAll(listRef);
      const photosData = await Promise.all(
        result.items.map(async (item) => {
          try {
            const metadata = await getMetadata(item);
            
            return {
              name: item.name,
              url: await getDownloadURL(item),
              email: metadata.customMetadata?.email || "Desconocido",
              userName: metadata.customMetadata?.name || "Sin nombre",
              avatar: metadata.customMetadata?.avatar || null,
              uid: metadata.customMetadata?.uid || null,
              timestamp: metadata.timeCreated,
              date: new Date(metadata.timeCreated).toLocaleDateString("es-ES"),
              isLoaded: false,
            };
          } catch (error) {
            console.error(`Error obteniendo metadata de ${item.name}:`, error);
            return {
              name: item.name,
              url: await getDownloadURL(item),
              email: "Desconocido",
              userName: "Sin nombre",
              avatar: null,
              uid: null,
              timestamp: new Date().toISOString(),
              date: new Date().toLocaleDateString("es-ES"),
              isLoaded: false,
            };
          }
        })
      );
      const sortedPhotos = photosData.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setPhotos(sortedPhotos);
      setFilteredPhotos(sortedPhotos);
      
      // Notificar al componente padre sobre el cambio
      if (onPhotosUpdate) {
        onPhotosUpdate(sortedPhotos.length);
      }
    } catch (error) {
      console.error("❌ Error cargando fotos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [eventSlug]);

  // Paginación: cargar más fotos cuando se hace scroll
  useEffect(() => {
    setDisplayedPhotos(filteredPhotos.slice(0, page * PHOTOS_PER_PAGE));
  }, [filteredPhotos, page]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedPhotos.length < filteredPhotos.length) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [displayedPhotos.length, filteredPhotos.length]);

  // Filtrar fotos por búsqueda y fecha
  useEffect(() => {
    let result = [...photos];

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(
        (photo) =>
          photo.email.toLowerCase().includes(keyword) ||
          photo.userName.toLowerCase().includes(keyword)
      );
    }

    if (filterDate) {
      result = result.filter(
        (photo) => photo.date === new Date(filterDate).toLocaleDateString("es-ES")
      );
    }

    setFilteredPhotos(result);
    setPage(1); // Reset pagination cuando cambian filtros
  }, [searchKeyword, filterDate, photos]);

  // Eliminar foto
  const handleDelete = async (name) => {
    if (!eventSlug) return;

    try {
      const photoRef = ref(storage, `photos/${eventSlug}/${name}`);
      await deleteObject(photoRef);
      setPhotos((prev) => prev.filter((photo) => photo.name !== name));
      setFilteredPhotos((prev) => prev.filter((photo) => photo.name !== name));
      setSelectedPhoto(null);
      setConfirmDelete(null);
      setSelectedPhotos((prev) => prev.filter((n) => n !== name));
      
      // Notificar al componente padre
      if (onPhotosUpdate) {
        onPhotosUpdate(photos.length - 1);
      }
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
    }
  };

  // Descargar foto
  const handleDownload = async (fileName) => {
    if (!eventSlug) return;

    try {
      const fileRef = ref(storage, `photos/${eventSlug}/${fileName}`);
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

  const handleDeleteSelected = () => {
    if (selectedPhotos.length > 0) {
      setConfirmDelete(selectedPhotos);
    }
  };

  const handleSelectPhoto = (photoName) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoName)
        ? prev.filter((n) => n !== photoName)
        : [...prev, photoName]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(filteredPhotos.map((photo) => photo.name));
    }
    setSelectAll(!selectAll);
  };

  const handleCloseGallery = () => {
    setSelectedPhotos([]);
    setSelectAll(false);
    setSearchKeyword("");
    setFilterDate("");
    onClose();
  };

  // Vista de galería (lista)
  if (!selectedPhoto) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col z-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <div
              className="flex text-gray-800 font-extrabold hover:text-black text-xl"
              onClick={handleCloseGallery}
            >
              <img src="/back.png" alt="Volver" className="w-6 h-6 rounded-lg" />
            </div>
            <div className="text-gray-800 font-extrabold">
              Administrar fotos
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            {/* Search by keyword */}
            <div className="relative basis-2/3">
              <input
                type="text"
                placeholder="Buscar por palabra clave"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-5 pr-10 py-2 bg-[#f9f3fb] text-[#753E89] rounded-full placeholder-[#753E89]/60 focus:outline-none focus:ring-2 focus:ring-[#753E89]"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Search className="text-[#753E89] w-5 h-5" />
              </button>
            </div>

            {/* Filter by date */}
            <div className="relative basis-1/3">
              <button
                onClick={() => document.getElementById("dateInput").showPicker()}
                className="w-full flex items-center justify-center gap-2 bg-[#753E89] text-base text-white font-medium rounded-full py-2 hover:bg-[#8a4ea0] transition"
              >
                {filterDate
                  ? new Date(filterDate).toLocaleDateString("es-ES")
                  : "Fecha"}
                <Filter className="w-5 h-5 text-white" />
              </button>
              <input
                id="dateInput"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="absolute opacity-0 pointer-events-none"
              />

              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="absolute right-0 top-5 transform -translate-y-1/2 bg-white text-[#753E89] border border-[#753E89] rounded-full p-2 text-sm hover:bg-[#f3e5f5] transition"
                >
                  <BrushCleaning className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stats and Actions */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              {filteredPhotos.length} fotos encontradas
            </p>
            <p className="text-sm text-gray-600">
              {selectedPhotos.length} seleccionadas
            </p>

            {selectedPhotos.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadSelected}
                  className="p-2 bg-[#753E89] text-white rounded-lg hover:bg-[#8a4ea0] transition"
                  title="Descargar seleccionadas"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  title="Eliminar seleccionadas"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            // Skeleton loading - Mostrar mientras está cargando
            <div className="space-y-4 bg-gray-100 rounded-lg p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg animate-pulse">
                  <div className="w-5 h-5 bg-gray-300 rounded"></div>
                  <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedPhotos.length > 0 ? (
            <div className="space-y-4 bg-gray-100 rounded-lg p-4">
              {/* Select All */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-2 border-[#753E89] text-white bg-white checked:bg-[#753E89]/70 checked:border-[#753E89] focus:ring-1 focus:ring-offset-0 cursor-pointer appearance-none"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Seleccionar todas
                </span>
              </div>

              {/* Photo List */}
              {displayedPhotos.map((photo, index) => (
                <LazyPhoto 
                  key={photo.name} 
                  photo={photo} 
                  index={index}
                  selectedPhotos={selectedPhotos}
                  handleSelectPhoto={handleSelectPhoto}
                  setSelectedPhoto={setSelectedPhoto}
                  setConfirmDelete={setConfirmDelete}
                  handleDownload={handleDownload}
                />
              ))}

              {/* Infinite scroll trigger */}
              {displayedPhotos.length < filteredPhotos.length && (
                <div ref={observerRef} className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#753E89]"></div>
                </div>
              )}
            </div>
          ) : photos.length === 0 ? (
            // Solo mostrar "No hay fotos" cuando terminó de cargar Y realmente no hay fotos
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Images className="w-16 h-16 mb-4" />
              <p className="text-lg">No se encontraron fotos</p>
              <p className="text-sm">
                {searchKeyword || filterDate
                  ? "Intenta con otros filtros"
                  : "No hay fotos aún"}
              </p>
            </div>
          ) : null}
        </div>

        {/* Modal confirmación borrar */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-sm w-full mx-4 text-center">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                {Array.isArray(confirmDelete)
                  ? `¿Eliminar ${confirmDelete.length} foto${
                      confirmDelete.length > 1 ? "s" : ""
                    }?`
                  : "¿Eliminar esta foto?"}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Esta acción no se puede deshacer
              </p>
              <div className="flex justify-center gap-3">
                <button
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                  onClick={async () => {
                    if (Array.isArray(confirmDelete)) {
                      for (const name of confirmDelete) await handleDelete(name);
                      setSelectedPhotos([]);
                      setSelectAll(false);
                    } else {
                      await handleDelete(confirmDelete.name);
                    }
                    setConfirmDelete(null);
                  }}
                >
                  Eliminar
                </button>
                <button
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista de foto ampliada
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="relative max-w-4xl w-full mx-4">
        <img
          src={selectedPhoto.url}
          alt="Foto ampliada"
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
        />

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg">
          <p className="font-semibold">{selectedPhoto.userName}</p>
          <p className="text-sm text-gray-300">{selectedPhoto.email}</p>
          <p className="text-xs text-gray-400">{selectedPhoto.date}</p>
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-3">
          <button
            onClick={() => handleDownload(selectedPhoto.name)}
            className="bg-white/90 hover:bg-white p-3 rounded-full transition shadow-lg"
            title="Descargar"
          >
            <Download className="w-6 h-6 text-[#753E89]" />
          </button>
          <button
            onClick={() => setConfirmDelete(selectedPhoto)}
            className="bg-white/90 hover:bg-white p-3 rounded-full transition shadow-lg"
            title="Eliminar"
          >
            <Trash2 className="w-6 h-6 text-red-500" />
          </button>
        </div>

        {/* Close button */}
        <button
          className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-full font-semibold transition shadow-lg"
          onClick={() => setSelectedPhoto(null)}
        >
          ← Volver
        </button>
      </div>

      {/* Modal confirmación borrar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-sm w-full mx-4 text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              ¿Eliminar esta foto?
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Esta acción no se puede deshacer
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                onClick={async () => {
                  await handleDelete(confirmDelete.name);
                  setConfirmDelete(null);
                }}
              >
                Eliminar
              </button>
              <button
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para lazy loading de imágenes
const LazyPhoto = ({ photo, index, selectedPhotos, handleSelectPhoto, setSelectedPhoto, setConfirmDelete, handleDownload }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex items-center gap-3 p-2 mb-5 hover:bg-gray-50 bg-white rounded-lg shadow-sm hover:shadow-md transition">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selectedPhotos.includes(photo.name)}
        onChange={() => handleSelectPhoto(photo.name)}
        className="w-5 h-5 rounded border-2 border-[#753E89] text-white bg-white checked:bg-[#753E89]/70 checked:border-[#753E89] focus:ring-1 focus:ring-offset-0 cursor-pointer appearance-none"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Thumbnail */}
      <div
        ref={imgRef}
        className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 bg-gray-200"
        onClick={() => setSelectedPhoto(photo)}
      >
        {isLoaded ? (
          <img
            src={photo.url}
            alt={`Foto ${index + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 animate-pulse"></div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 truncate">
          {photo.userName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {photo.email}
        </p>
        <p className="text-xs text-gray-400">{photo.date}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(photo);
          }}
          className="p-2 hover:bg-gray-200 rounded-full transition"
          title="Eliminar"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(photo.name);
          }}
          className="p-2 hover:bg-gray-200 rounded-full transition"
          title="Descargar"
        >
          <Download className="w-5 h-5 " />
        </button>
      </div>
    </div>
  );
};

export default PhotosAdmin;
