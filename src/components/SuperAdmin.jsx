import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import useAuthenticationSupabase from "./AuthenticationSupabase";
import { 
  validateEventSlug, 
  getEventAssetInstructions, 
  getAdminConfigUrl
} from "../utils/eventAssets";

// Lista de emails autorizados para SuperAdmin (hardcodeada)
const SUPER_ADMIN_EMAILS = [
  "eventouchcolombia@gmail.com",
  // Agrega aquí más emails de super administradores
];

const SuperAdmin = () => {
  const { session, loading, signInWithGoogle, signOut } = useAuthenticationSupabase();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ email: "", eventSlug: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Verificar si el usuario es SuperAdmin
  useEffect(() => {
    if (session?.user?.email) {
      const email = session.user.email.toLowerCase().trim();
      setIsSuperAdmin(SUPER_ADMIN_EMAILS.includes(email));
    } else {
      setIsSuperAdmin(false);
    }
  }, [session]);

  // Cargar eventos existentes
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      console.log("🔍 Cargando eventos desde Supabase...");
      
      // Múltiples estrategias para obtener los datos
      let finalData = [];
      
      // Estrategia 1: Consulta normal
      const { data: normalData, error: normalError } = await supabase
        .from("admins")
        .select("id, email, event_slug");
        
      console.log("📊 Consulta normal:", { normalData, normalError });
      
      if (normalData && normalData.length > 0 && !normalError) {
        finalData = normalData;
      } else {
        // Estrategia 2: Intentar con RPC call (si existe una función)
        console.log("🔄 Intentando con RPC call...");
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_all_admins_for_superadmin');
            
          console.log("📊 RPC resultado:", { rpcData, rpcError });
          
          if (rpcData && !rpcError) {
            finalData = rpcData;
          }
        } catch (rpcErr) {
          console.log("ℹ️ RPC no disponible, continuando...");
        }
        
        // Estrategia 3: Consulta con select *
        if (finalData.length === 0) {
          console.log("🔄 Intentando consulta con select *...");
          const { data: altData, error: altError } = await supabase
            .from("admins")
            .select("*");
            
          console.log("📊 Consulta alternativa:", { altData, altError });
          
          if (altData && !altError) {
            finalData = altData.map(item => ({
              id: item.id,
              email: item.email,
              event_slug: item.event_slug
            }));
          }
        }
      }

      console.log(`✅ ${finalData?.length || 0} eventos encontrados:`, finalData);
      
      // Ordenar manualmente en el frontend
      const sortedData = finalData ? [...finalData].sort((a, b) => a.event_slug.localeCompare(b.event_slug)) : [];
      console.log("📋 Datos finales ordenados:", sortedData);
      setEvents(sortedData);
      
      if (finalData.length === 0) {
        showMessage("⚠️ No se encontraron eventos. Verifica las políticas RLS en Supabase.", "error");
      }
      
    } catch (error) {
      console.error("❌ Error cargando eventos:", error);
      showMessage("Error cargando eventos: " + error.message, "error");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    console.log("🔄 useEffect ejecutado - isSuperAdmin:", isSuperAdmin);
    if (isSuperAdmin) {
      console.log("✅ Llamando a fetchEvents...");
      fetchEvents();
    }
  }, [isSuperAdmin]);

  // Mostrar mensaje temporal
  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  // Crear nuevo evento
  const createEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.email || !newEvent.eventSlug) {
      showMessage("Por favor completa todos los campos", "error");
      return;
    }

    // Validar formato del eventSlug usando la utilidad
    const validation = validateEventSlug(newEvent.eventSlug);
    if (!validation.isValid) {
      showMessage(validation.errors[0], "error");
      return;
    }

    setIsCreating(true);
    try {
      // Verificar si ya existe un admin para este evento
      const { data: existing } = await supabase
        .from("admins")
        .select("id")
        .eq("event_slug", newEvent.eventSlug)
        .eq("email", newEvent.email.toLowerCase().trim())
        .single();

      if (existing) {
        showMessage("Ya existe un admin con ese email para este evento", "error");
        setIsCreating(false);
        return;
      }

      // Crear el registro en la tabla admins
      const { error } = await supabase
        .from("admins")
        .insert([{
          email: newEvent.email.toLowerCase().trim(),
          event_slug: newEvent.eventSlug
        }]);

      if (error) throw error;

      // Mostrar instrucciones de setup
      const instructions = getEventAssetInstructions(newEvent.eventSlug);
      const instructionsWithEmail = instructions.instructions.map(inst => 
        inst.replace('[EMAIL_DEL_ADMIN]', newEvent.email)
      );
      
      const instructionText = `✅ Evento "${newEvent.eventSlug}" creado exitosamente!\n\n📋 Próximos pasos:\n${instructionsWithEmail.join('\n')}\n\n� Panel Admin: ${instructions.adminUrl}\n🌐 Evento: ${instructions.eventUrl}`;
      
      showMessage(instructionText, "success");
      setNewEvent({ email: "", eventSlug: "" });
      await fetchEvents(); // Recargar la lista

    } catch (error) {
      console.error("❌ Error creando evento:", error);
      showMessage("Error creando el evento", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Eliminar evento
  const deleteEvent = async (id, eventSlug) => {
    if (!confirm(`¿Estás seguro de eliminar el evento "${eventSlug}"?`)) return;

    try {
      const { error } = await supabase
        .from("admins")
        .delete()
        .eq("id", id);

      if (error) throw error;

      showMessage(`Evento "${eventSlug}" eliminado exitosamente`, "success");
      await fetchEvents(); // Recargar la lista
    } catch (error) {
      console.error("❌ Error eliminando evento:", error);
      showMessage("Error eliminando el evento", "error");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <h1 className="text-white text-2xl">Cargando...</h1>
      </div>
    );
  }

  // No authenticated
  if (!session) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          SuperAdmin Panel
        </h1>
        <p className="text-gray-300 mb-8">Acceso restringido para súper administradores</p>
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 bg-white/90 text-black font-bold rounded-lg flex items-center gap-2 shadow-md hover:bg-gray-100 transition"
        >
          <img src="/google.png" alt="Google" className="w-6 h-6" />
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  // Not authorized
  if (session && !isSuperAdmin) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 gap-4">
        <h1 className="text-red-400 text-3xl font-bold">Acceso Denegado</h1>
        <p className="text-gray-300">
          Usuario: {session.user?.email ?? "sin email"}
        </p>
        <p className="text-gray-400 text-sm">
          No tienes permisos de súper administrador
        </p>
        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  // Debug: Log current events state
  console.log("🎯 Estado actual de eventos:", events);

  // SuperAdmin Panel
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 px-4 py-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">SuperAdmin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-green-400">✓ {session.user.email}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-600/20 border border-green-500 text-green-200" 
              : "bg-red-600/20 border border-red-500 text-red-200"
          }`}>
            <pre className="whitespace-pre-wrap font-sans text-sm">{message.text}</pre>
          </div>
        )}

        {/* Create Event Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Crear Nuevo Evento</h2>
          <form onSubmit={createEvent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              placeholder="Email del administrador"
              value={newEvent.email}
              onChange={(e) => setNewEvent(prev => ({ ...prev, email: e.target.value }))}
              className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-blue-400 focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Event slug (ej: boda-maria-juan)"
              value={newEvent.eventSlug}
              onChange={(e) => setNewEvent(prev => ({ ...prev, eventSlug: e.target.value.toLowerCase() }))}
              className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-blue-400 focus:outline-none"
              pattern="[a-z0-9-]+"
              title="Solo letras minúsculas, números y guiones"
              required
            />
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition"
            >
              {isCreating ? "Creando..." : "Crear Evento"}
            </button>
          </form>
          <p className="text-gray-400 text-sm mt-2">
            El slug del evento será la URL: /{newEvent.eventSlug || "evento-slug"}
          </p>
        </div>

        {/* Events List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Eventos Existentes ({events.length})
              </h2>
              <p className="text-gray-400 text-sm">
                Debug: isSuperAdmin={isSuperAdmin.toString()}, events.length={events.length}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchEvents}
                disabled={loadingEvents}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:bg-blue-800 disabled:cursor-not-allowed"
              >
                {loadingEvents ? "🔄 Cargando..." : "🔄 Refrescar"}
              </button>
              <button
                onClick={async () => {
                  console.log("🧪 Ejecutando debug test...");
                  const { data: allData, error } = await supabase.from("admins").select("*");
                  console.log("🔍 Debug - Todos los registros:", allData);
                  alert(`Debug: ${allData?.length || 0} registros encontrados. Ver consola para detalles.`);
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm"
              >
                🧪 Debug
              </button>
            </div>
          </div>
          
          {loadingEvents ? (
            <p className="text-gray-400">🔄 Cargando eventos...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-400">No hay eventos creados aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-gray-300 py-3 px-4">Event Slug</th>
                    <th className="text-gray-300 py-3 px-4">Admin Email</th>
                    <th className="text-gray-300 py-3 px-4">Estado</th>
                    <th className="text-gray-300 py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="text-white py-3 px-4 font-semibold">{event.event_slug}</td>
                      <td className="text-gray-300 py-3 px-4">{event.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-yellow-400 text-sm">⚙️ Pendiente configuración</span>
                          <span className="text-gray-400 text-xs">Ir a Admin → Configurar Assets</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 flex-wrap">
                          <a
                            href={`/${event.event_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                            title="Ver evento público"
                          >
                            Ver
                          </a>
                          <a
                            href={`/${event.event_slug}/admin`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                            title="Panel de administración y AssetWizard"
                          >
                            Admin
                          </a>
                          <button
                            onClick={() => deleteEvent(event.id, event.event_slug)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                            title="Eliminar evento"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
          <h3 className="text-yellow-200 font-semibold mb-2">📋 Proceso para crear eventos:</h3>
          <ul className="text-yellow-100 text-sm space-y-1">
            <li>• <strong>Paso 1:</strong> Crea un evento ingresando el email del admin y un slug único</li>
            <li>• <strong>Paso 2:</strong> El admin debe ir a /{`{slug}`}/admin e iniciar sesión</li>
            <li>• <strong>Paso 3:</strong> Usar "Configurar Assets" para subir imágenes al AssetWizard</li>
            <li>• <strong>Assets requeridos:</strong> background.png y marco.png</li>
            <li>• <strong>Assets opcionales:</strong> bgchosee.png, bggallery.png, adminbg.png</li>
            <li>• <strong>Resultado:</strong> El evento estará disponible en /{`{slug}`}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;