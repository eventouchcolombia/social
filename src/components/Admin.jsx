import { useState, useEffect } from "react";
import { storage } from "../firebase/firebase";
import AssetWizard from "./AssetWizard";
import ShareEvent from "./ShareEvent";
import Agenda from "./Agenda";
import Perfil from "./Perfil";
import { Camera, Users, Settings, Images, Share2, Eye, Calendar, Menu } from "lucide-react";
import {
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
  getBlob,
} from "firebase/storage";

import useAuthenticationSupabase from "./AuthenticationSupabase";
import { useEvent } from "../hooks/useEvent";
import { supabase } from "../supabaseClient";

const Admin = () => {
  const { session, isAdmin, loading, signInWithGoogle, signOut } =
    useAuthenticationSupabase();
  const { eventSlug, getAssetUrl, getStoragePath } = useEvent();

  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [selectAll, setSelectAll] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [usersList, setUsersList] = useState([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showAgenda, setShowAgenda] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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
      const url = await getAssetUrl("adminbg.png");
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

  // const handleDownloadSelected = async () => {
  //   for (const name of selectedPhotos) {
  //     await handleDownload(name);
  //   }
  // };

  // === contar usuarios activos ===

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("event_users")
          .select("*", { count: "exact" })
          .eq("event_slug", eventSlug);

        if (error) throw error;

        // Si quieres mostrar la cantidad:
        setUsersList(data || []);
        setActiveUsers(data.length || 0);
      } catch (err) {
        console.error("❌ Error obteniendo usuarios activos:", err.message);
      }
    };

    fetchActiveUsers();
  }, [eventSlug]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-linear-to-br from-gray-900 to-blue-900 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-white text-2xl font-semibold mb-2">
            Cargando Panel Admin
          </h1>
          <p className="text-gray-300 text-sm">
            Verificando autenticación para {eventSlug}...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="flex flex-col justify-center items-center min-h-screen bg-cover bg-center relative"
        style={{
          backgroundImage: backgroundUrl ? `url('${backgroundUrl}')` : "none",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl font-bold text-center text-white mb-4">
            Panel Admin - {eventSlug}
          </h1>
          <p className="text-white/80 mb-8 text-sm sm:text-base">
            Inicia sesión para acceder al panel de administración
          </p>

          <button
            onClick={signInWithGoogle}
            className="px-6 py-3 bg-white/90 text-black font-bold rounded-lg flex items-center gap-2 shadow-lg hover:bg-white transition mx-auto"
          >
            <img src="/google.png" alt="Google" className="w-6 h-6" />
            Iniciar sesión con Google
          </button>
        </div>
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

  const user = session?.user;
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Usuario";

  return (
    <div className="px-4 py-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-18">
        <div className="flex items-center gap-3">
          <Menu 
            className="w-6 h-6 text-gray-900 cursor-pointer hover:text-[#753E89] transition"
            onClick={() => setShowProfileModal(true)}
            title="Menú de perfil"
          />
          <h1 className="text-md font-bold text-gray-900">{userName}</h1>
        </div>
        <img
          src="/Log_Out.png"
          alt="Cerrar sesión"
          className="w-8 h-8 cursor-pointer hover:opacity-80 transition"
          onClick={signOut}
          title="Cerrar sesión"
        />
      </div>

      {/* Tarjetas estadísticas */}
      <div className="grid grid-cols-2 gap-4 mb-6 h-32">
        <div className="bg-[#753E89] rounded-xl p-4 flex flex-col justify-center items-center text-white shadow-md">
          <Camera className="w-6 h-6 mb-2" />
          <p className="text-2xl font-bold">{photos.length}</p>
          <p className="text-sm">Fotos totales</p>
        </div>

        <div
          className="bg-[#753E89] rounded-xl p-4 flex flex-col justify-center items-center text-white shadow-md"
          onClick={() => setShowUsersModal(true)}
        >
          <Users className="w-6 h-6 mb-2" />
          <p className="text-2xl font-bold">{activeUsers}</p>
          <p className="text-sm">Usuarios activos</p>
        </div>
      </div>

      {/* Secciones */}
      <h2 className="text-gray-900 font-bold mb-4">Gestionar contenidos</h2>

      {/* Configurar assets */}
      <div
        className="bg-white rounded-xl shadow-xl p-4 flex items-center gap-2  mb-3 cursor-pointer hover:bg-gray-100"
        onClick={() => setShowWizard(true)}
      >
        <Settings className="w-5 h-5 text-[#753E89] mr-2 " />
        <div>
          <p className="font-semibold text-sm">Configurar assets</p>
          <p className="text-xs text-gray-500">
            Personaliza colores, imágenes, logos y marcos
          </p>
        </div>
      </div>

      {/* Administrar fotos */}
      <div
        className="bg-white rounded-xl shadow-xl p-4 flex items-center  gap-2 mb-3 cursor-pointer hover:bg-gray-100"
        onClick={() => setSelectedPhoto("gallery")}
      >
        <Images className="w-5 h-5 text-[#753E89] mr-2 " />
        <div>
          <p className="font-semibold text-sm">Administrar fotos</p>
          <p className="text-xs text-gray-500">
            Gestiona y elimina las fotos del evento
          </p>
        </div>
      </div>

      {/* Compartir evento */}
      <div
        className="bg-white rounded-xl shadow-xl p-4 flex items-center  gap-2 mb-3 cursor-pointer hover:bg-gray-100"
        onClick={() => setShowShareModal(true)}
      >
        <Share2 className="w-5 h-5 text-[#753E89] mr-2 " />
        <div>
          <p className="font-semibold text-sm">Compartir evento</p>
          <p className="text-xs text-gray-500">
            Comparte tu evento con tus invitados
          </p>
        </div>
      </div>

      {/* Vista previa */}
      <div
        className="bg-white rounded-xl shadow-xl p-4 flex items-center gap-2 mb-3 cursor-pointer hover:bg-gray-100"
        onClick={() => window.open(`/${eventSlug}`, "_blank")}
      >
        <Eye className="w-5 h-5 text-[#753E89] mr-2 " />
        <div>
          <p className="font-semibold text-sm">Vista previa</p>
          <p className="text-xs text-gray-500">Observa tus cambios</p>
        </div>
      </div>

      {/* Vista agenda*/}
      <div
        className="bg-white rounded-xl shadow-xl p-4 flex items-center gap-2 mb-3 cursor-pointer hover:bg-gray-100"
        onClick={() => setShowAgenda(true)}
      >
        <Calendar className="w-5 h-5 text-[#753E89] mr-2 " />
        <div>
          <p className="font-semibold text-sm">Agenda</p>
          <p className="text-xs text-gray-500">haz la agenda de tu evento</p>
        </div>
      </div>

      {/* Modales */}
      {showWizard && <AssetWizard onClose={() => setShowWizard(false)} />}
      {showShareModal && (
        <ShareEvent
          eventSlug={eventSlug}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Modal foto ampliada */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
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
      {/* 🧍 Modal de usuarios activos */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/70  bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white border-2 border-[#753E89] rounded-2xl p-6 w-80 md:w-[400px] max-h-[80vh] overflow-y-auto shadow-lg">
            <h2 className="text-xl font-bold text-center mb-4 text-[#753E89]">
              Usuarios activos
            </h2>

            {usersList.length > 0 ? (
              <ul className="space-y-3">
                {usersList.map((user) => (
                  <li
                    key={user.id}
                    className="border-b border-gray-200 pb-2 text-gray-800"
                  >
                    <p className="font-semibold">
                      {user.full_name || "Sin nombre"}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">
                No hay usuarios registrados aún.
              </p>
            )}

            <button
              className="mt-6 w-full bg-[#753E89] text-white py-2 rounded-full font-semibold hover:bg-[#8a4ea0] transition"
              onClick={() => setShowUsersModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {/* mostrar el modal Agenda */}
      {showAgenda && (
        <Agenda eventSlug={eventSlug} onClose={() => setShowAgenda(false)} />
      )}

      {/* Modal perfil */}
      {showProfileModal && (
        <Perfil onClose={() => setShowProfileModal(false)} userEmail={user?.email} />
      )}

      {/* Modal galería completa */}
      {selectedPhoto === "gallery" && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Administrar fotos
              </h2>
              <button
                className="text-gray-600 hover:text-black text-xl"
                onClick={() => setSelectedPhoto(null)}
              >
                ✕
              </button>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      className="absolute top-2 right-2 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(photo);
                      }}
                    >
                      <img
                        src="/borrar.png"
                        alt="Eliminar"
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay fotos aún.</p>
            )
            }
          </div>
        </div>
      )}

      {/* Modal confirmación borrar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60">
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
