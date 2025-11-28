/* eslint-disable no-undef */
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ref, listAll, getDownloadURL } from "firebase/storage"; // Firebase Storage imports
import { storage } from "../firebaseConfig"; // Ensure this import exists and points to your Firebase setup
import AssetWizard from "./AssetWizard";
import ShareEvent from "./ShareEvent";
import Agenda from "./Agenda";
import Perfil from "./Perfil";
import PhotosAdmin from "./PhotosAdmin";
import {
  Camera,
  Users,
  Settings,
  Images,
  Share2,
  Eye,
  Calendar,
  Menu,
} from "lucide-react";

import useAuthenticationSupabase from "./AuthenticationSupabase";
import { useEvent } from "../hooks/useEvent";
import { supabase } from "../supabaseClient";

const Admin = () => {
  const { identificador, eventSlug } = useParams();
  const { session, isAdmin, loading, signOut } = useAuthenticationSupabase();
  const [currentEventSlug, setCurrentEventSlug] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const { getAssetUrl, getStoragePath } = useEvent();

  const [photosCount, setPhotosCount] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPhotosAdmin, setShowPhotosAdmin] = useState(false);

  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [usersList, setUsersList] = useState([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showAgenda, setShowAgenda] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (session && isAdmin) {
      console.log(
        `✅ [ADMIN DETECTADO] El usuario ${session.user?.email} tiene permisos de administrador para el evento "${eventSlug}"`
      );
    } else if (session && !isAdmin) {
      console.log(
        `⚠️ [NO ADMIN] El usuario ${session.user?.email} no tiene permisos de administrador.`
      );
    } else if (!session) {
      console.log("ℹ️ No hay sesión activa aún.");
    }
  }, [session, isAdmin, eventSlug]);

  useEffect(() => {
    if (isAdmin === true && session) {
      console.log("✅ [ADMIN CONFIRMADO]");
      console.log("Correo del admin:", session.user?.email);
      console.log("Event Slug actual:", eventSlug);
      console.log("Estado completo ->", { isAdmin, session });
    }
  }, [isAdmin, session, eventSlug]);

  useEffect(() => {
    if (eventSlug) {
      setCurrentEventSlug(eventSlug);
      console.log(
        `✅ Event slug from URL: ${eventSlug} para identificador: ${identificador}`
      );
    }
  }, [eventSlug, identificador]);
  // === cargar fotos solo si es admin ===
  // const fetchPhotos = async () => {
  //   // Updated: Use currentEventSlug
  //   if (!currentEventSlug) return;

  //   try {
  //     // Updated: Use currentEventSlug
  //     const listRef = ref(storage, `photos/${currentEventSlug}`);
  //     const result = await listAll(listRef);
  //     const urls = await Promise.all(
  //       result.items.map(async (item) => ({
  //         name: item.name,
  //         url: await getDownloadURL(item),
  //       }))
  //     );
  //     setPhotos(urls.reverse());
  //   } catch (error) {
  //     console.error("❌ Error cargando fotos:", error);
  //   }
  // };
  const fetchPhotos = async () => {
    if (!currentEventSlug) return;

    try {
      const listRef = ref(storage, `photos/${currentEventSlug}`); // Ensure `storage` is defined
      const result = await listAll(listRef);
      const urls = await Promise.all(
        result.items.map(async (item) => ({
          name: item.name,
          url: await getDownloadURL(item),
        }))
      );
      setPhotosCount(urls.length); // Update photos count
    } catch (error) {
      console.error("❌ Error cargando fotos:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentEventSlug || !isAdmin) return;

      try {
        // Cargar fotos
        const listRef = ref(storage, `photos/${currentEventSlug}`);
        const result = await listAll(listRef);
        const urls = await Promise.all(
          result.items.map(async (item) => ({
            name: item.name,
            url: await getDownloadURL(item),
          }))
        );
        setPhotosCount(urls.length); // Actualizar el número de fotos

        // Cargar usuarios activos
        const { data, error } = await supabase
          .from("event_users")
          .select("*", { count: "exact" })
          .eq("event_slug", currentEventSlug);

        if (error) throw error;

        setUsersList(data || []);
        setActiveUsers(data.length || 0); // Actualizar el número de usuarios activos
      } catch (error) {
        console.error("❌ Error cargando datos:", error);
      }
    };

    fetchData();
  }, [currentEventSlug, isAdmin]);

  useEffect(() => {
    // Updated: Use currentEventSlug
    if (isAdmin && currentEventSlug) fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, currentEventSlug]);

  useEffect(() => {
    const loadBackground = async () => {
      if (!currentEventSlug) return;
      const url = await getAssetUrl("adminbg.png", currentEventSlug);
      setBackgroundUrl(url);
    };
    loadBackground();
  }, [currentEventSlug, getAssetUrl]);

  // useEffect(() => {
  //   const fetchActiveUsers = async () => {
  //     try {
  //       const { data, error } = await supabase
  //         .from("event_users")
  //         .select("*", { count: "exact" })
  //         .eq("event_slug", currentEventSlug);

  //       if (error) throw error;

  //       setUsersList(data || []);
  //       setActiveUsers(data.length || 0);
  //     } catch (err) {
  //       console.error("❌ Error obteniendo usuarios activos:", err.message);
  //     }
  //   };

  //   fetchActiveUsers();
  // }, [currentEventSlug]);

  // Updated: Use currentEventSlug
  if (loading || !currentEventSlug) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[url('/Mobile.png')] bg-cover bg-center bg-no-repeat px-4">
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white mx-auto mb-4"></div>
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
        <div className="absolute inset-0 bg-[url('/Mobile.png')]"></div>
        <div className="absolute inset-0 bg-[url('/Mobile.png')] bg-cover bg-center"></div>

        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white mx-auto mb-4"></div>
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
          <p className="text-2xl font-bold">{photosCount}</p>
          <p className="text-sm">Fotos totales</p>
        </div>

        <div
          className="bg-[#753E89] rounded-xl p-4 flex flex-col justify-center items-center text-white shadow-md cursor-pointer hover:bg-[#8a4ea0] transition"
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
        onClick={() => setShowPhotosAdmin(true)}
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
        onClick={() => window.open(`/${currentEventSlug}`, "_blank")}
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
          eventSlug={currentEventSlug}
          onClose={() => setShowShareModal(false)}
        />
      )}
      {showPhotosAdmin && (
        <PhotosAdmin
          eventSlug={currentEventSlug}
          onClose={() => setShowPhotosAdmin(false)}
          onPhotosUpdate={(count) => setPhotosCount(count)}
        />
      )}
      {showAgenda && (
        <Agenda
          eventSlug={currentEventSlug}
          onClose={() => setShowAgenda(false)}
        />
      )}
      {showProfileModal && (
        <Perfil
          onClose={() => setShowProfileModal(false)}
          userEmail={user?.email}
        />
      )}

      {/* Modal de usuarios activos */}
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
    </div>
  );
};

export default Admin;