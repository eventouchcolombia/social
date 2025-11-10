import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import useAuthenticationSupabase from "./AuthenticationSupabase";
import ShareEvent from "./ShareEvent";

// Lista de emails autorizados para SuperAdmin (hardcodeada)
const SUPER_ADMIN_EMAILS = [
  "eventouchcolombia@gmail.com",
  // Agrega aquí más emails de super administradores
];

const SuperAdmin = () => {
  const { session, loading, signInWithGoogle, signOut } =
    useAuthenticationSupabase();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ email: "", identificador: "", eventSlug: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedEventSlug, setSelectedEventSlug] = useState("");
  const [requests, setRequests] = useState([]);
  const [newEvent, setNewEvent] = useState({ identificador: "", eventSlug: "" });
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState(new Set());

  useEffect(() => {
    if (isSuperAdmin) fetchRequests();
  }, [isSuperAdmin]);

  // Verificar si el usuario es SuperAdmin
  useEffect(() => {
    if (session?.user?.email) {
      const email = session.user.email.toLowerCase().trim();
      setIsSuperAdmin(SUPER_ADMIN_EMAILS.includes(email));
    } else {
      setIsSuperAdmin(false);
    }
  }, [session]);

  // Cargar administradores existentes
  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      console.log("🔍 Cargando administradores desde Supabase...");

      // Consulta completa incluyendo registros con identificador NULL
      const { data: allData, error } = await supabase
        .from("admins")
        .select("id, email, event_slug, identificador, is_active, created_at")
        .order('identificador', { ascending: true, nullsFirst: false })
        .order('email', { ascending: true });

      console.log("📊 Consulta completa:", { allData, error });

      if (error) {
        console.error("❌ Error en consulta:", error);
        throw error;
      }

      if (!allData || allData.length === 0) {
        console.log("⚠️ No se encontraron registros");
        setAdmins([]);
        showMessage("No se encontraron administradores en la base de datos.", "error");
        return;
      }

      // Procesar y limpiar los datos
      const processedData = allData.map((item, index) => ({
        id: item.id,
        email: item.email,
        event_slug: item.event_slug,
        identificador: item.identificador || `legacy-${index}`, // Manejar NULLs
        is_active: item.is_active ?? true,
        created_at: item.created_at,
        isLegacy: !item.identificador // Marcar registros legacy
      }));

      console.log("📋 Datos procesados:", processedData);
      setAdmins(processedData);

      // Mostrar estadísticas
      const withIdentifier = processedData.filter(admin => !admin.isLegacy).length;
      const withoutIdentifier = processedData.filter(admin => admin.isLegacy).length;
      const withEvents = processedData.filter(admin => admin.event_slug).length;

      console.log(`📊 Estadísticas: ${processedData.length} total, ${withIdentifier} con identificador, ${withoutIdentifier} legacy, ${withEvents} con eventos`);

    } catch (error) {
      console.error("❌ Error cargando administradores:", error);
      showMessage("Error cargando administradores: " + error.message, "error");
      setAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    console.log("🔄 useEffect ejecutado - isSuperAdmin:", isSuperAdmin);
    if (isSuperAdmin) {
      console.log("✅ Llamando a fetchAdmins...");
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  // 🔔 Escuchar solicitudes en tiempo real
  useEffect(() => {
    if (!isSuperAdmin) return;

    const channel = supabase
      .channel("event_requests_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_requests" },
        (payload) => {
          const { email, name } = payload.new;
          showMessage(
            `📩 Nueva solicitud de ${name || email} para crear evento.`,
            "success"
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSuperAdmin]);

  const fetchRequests = async () => {
  const { data, error } = await supabase
    .from("event_requests")
    .select("*")
    .order("requested_at", { ascending: false }); // ✅ columna correcta

  if (error) {
    console.error("❌ Error cargando solicitudes:", error);
  } else {
    setRequests(data);
  }
};


  // Mostrar mensaje temporal
  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  // Generar identificador único
  const generateIdentifier = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Crear nuevo administrador
  const createAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.email || !newAdmin.identificador) {
      showMessage("Por favor completa email e identificador", "error");
      return;
    }

    setIsCreating(true);
    try {
      console.log("🚀 Iniciando creación de administrador:", newAdmin);

      // Verificar si ya existe un admin con este email
      console.log("🔍 Verificando email existente...");
      const { data: existingByEmail, error: emailCheckError } = await supabase
        .from("admins")
        .select("id")
        .eq("email", newAdmin.email.toLowerCase().trim());

      console.log("📧 Resultado verificación email:", { existingByEmail, emailCheckError });

      // Si hay datos y no hay error, significa que existe
      if (existingByEmail && existingByEmail.length > 0) {
        showMessage(
          "Ya existe un administrador con ese email",
          "error"
        );
        setIsCreating(false);
        return;
      }

      // Verificar si ya existe un admin con este identificador
      console.log("🔍 Verificando identificador existente...");
      const { data: existingByIdentifier, error: identifierCheckError } = await supabase
        .from("admins")
        .select("id")
        .eq("identificador", newAdmin.identificador);

      console.log("🆔 Resultado verificación identificador:", { existingByIdentifier, identifierCheckError });

      // Si hay datos y no hay error, significa que existe
      if (existingByIdentifier && existingByIdentifier.length > 0) {
        showMessage(
          "Ya existe un administrador con ese identificador",
          "error"
        );
        setIsCreating(false);
        return;
      }

      // Si se proporciona un event_slug, verificar que no esté en uso
      if (newAdmin.eventSlug && newAdmin.eventSlug.trim()) {
        console.log("🔍 Verificando event_slug existente...");
        const { data: existingEvent, error: eventCheckError } = await supabase
          .from("admins")
          .select("id")
          .eq("event_slug", newAdmin.eventSlug.trim());

        console.log("🎯 Resultado verificación event_slug:", { existingEvent, eventCheckError });

        if (existingEvent && existingEvent.length > 0) {
          showMessage(
            "Ya existe un evento con ese slug",
            "error"
          );
          setIsCreating(false);
          return;
        }
      }

      // Crear el registro en la tabla admins
      const adminData = {
        email: newAdmin.email.toLowerCase().trim(),
        identificador: newAdmin.identificador,
        is_active: true
      };

      // Solo agregar event_slug si se proporcionó
      if (newAdmin.eventSlug && newAdmin.eventSlug.trim()) {
        adminData.event_slug = newAdmin.eventSlug.trim();
      }

      console.log("💾 Insertando datos en la base de datos:", adminData);
      const { data: insertedData, error: insertError } = await supabase
        .from("admins")
        .insert([adminData])
        .select();

      console.log("📊 Resultado de inserción:", { insertedData, insertError });

      if (insertError) {
        console.error("❌ Error de inserción:", insertError);
        throw insertError;
      }

      const adminUrl = `/admin/${newAdmin.identificador}`;
      const eventUrl = newAdmin.eventSlug ? `/${newAdmin.eventSlug}` : "No asignado";

      const successMessage = `✅ Administrador creado exitosamente!\n\n📋 Información:\n• Email: ${newAdmin.email}\n• Identificador: ${newAdmin.identificador}\n• Event Slug: ${newAdmin.eventSlug || 'No asignado'}\n\n🔗 Enlaces:\n• Panel Admin: ${adminUrl}\n• Evento: ${eventUrl}`;

      showMessage(successMessage, "success");
      setNewAdmin({ email: "", identificador: "", eventSlug: "" });
      await fetchAdmins(); // Recargar la lista
    } catch (error) {
      console.error("❌ Error creando administrador:", error);
      showMessage(`Error creando el administrador: ${error.message}`, "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Crear evento para administrador existente
  const createEventForAdmin = async (e) => {
    e.preventDefault();
    if (!newEvent.identificador || !newEvent.eventSlug) {
      showMessage("Por favor completa identificador y event slug", "error");
      return;
    }

    setIsCreatingEvent(true);
    try {
      console.log("🚀 Iniciando creación de evento:", newEvent);

      // Verificar que existe el administrador con ese identificador
      const { data: existingAdmins, error: adminError } = await supabase
        .from("admins")
        .select("id, email, event_slug, identificador")
        .eq("identificador", newEvent.identificador);

      console.log("👤 Administradores encontrados:", { existingAdmins, adminError });

      if (adminError || !existingAdmins || existingAdmins.length === 0) {
        showMessage(
          "No se encontró un administrador con ese identificador",
          "error"
        );
        setIsCreatingEvent(false);
        return;
      }

      // Tomar el primer admin encontrado
      const existingAdmin = existingAdmins[0];
      console.log("📋 Admin seleccionado:", existingAdmin);

      // Verificar que el event_slug no esté en uso globalmente
      const { data: existingEvent, error: eventCheckError } = await supabase
        .from("admins")
        .select("id, identificador, email")
        .eq("event_slug", newEvent.eventSlug);

      console.log("🎯 Eventos existentes con ese slug:", { existingEvent, eventCheckError });

      if (existingEvent && existingEvent.length > 0) {
        showMessage(
          `Ya existe un evento con ese slug "${newEvent.eventSlug}" asignado a: ${existingEvent[0].email} (${existingEvent[0].identificador || 'sin identificador'})`,
          "error"
        );
        setIsCreatingEvent(false);
        return;
      }

      // SIEMPRE crear un nuevo registro con identificador NULL para eventos
      console.log("📝 Creando registro de evento con identificador NULL...");
      
      const newEventData = {
        email: existingAdmin.email,
        identificador: null, // ✅ IMPORTANTE: Identificador NULL para eventos
        event_slug: newEvent.eventSlug,
        is_active: true
      };
      
      console.log("💾 Datos del nuevo registro de evento:", newEventData);

      const { error: insertError } = await supabase
        .from("admins")
        .insert([newEventData]);

      if (insertError) {
        console.error("❌ Error creando evento:", insertError);
        throw insertError;
      }

      const adminUrl = `/admin/${newEvent.identificador}`;
      const eventUrl = `/${newEvent.eventSlug}`;

      const successMessage = `✅ Evento creado exitosamente!\n\n📋 Información:\n• Administrador: ${existingAdmin.email}\n• Identificador Admin: ${newEvent.identificador}\n• Event Slug: ${newEvent.eventSlug}\n• Tipo: Evento independiente (sin identificador)\n\n🔗 Enlaces:\n• Panel Admin: ${adminUrl}\n• Evento: ${eventUrl}\n\n💡 El evento se ha creado como registro independiente vinculado al email del administrador.`;

      showMessage(successMessage, "success");
      setNewEvent({ identificador: "", eventSlug: "" });
      await fetchAdmins(); // Recargar la lista
    } catch (error) {
      console.error("❌ Error asignando evento:", error);
      showMessage(`Error creando el evento: ${error.message}`, "error");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Eliminar administrador
  const deleteAdmin = async (id, email, identificador) => {
    if (!confirm(`¿Estás seguro de eliminar al administrador "${email}" (${identificador})?`)) return;

    try {
      const { error } = await supabase.from("admins").delete().eq("id", id);

      if (error) throw error;

      showMessage(`Administrador "${email}" eliminado exitosamente`, "success");
      await fetchAdmins(); // Recargar la lista
    } catch (error) {
      console.error("❌ Error eliminando administrador:", error);
      showMessage("Error eliminando el administrador", "error");
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
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-white mb-6 sm:mb-8">
          SuperAdmin Panel
        </h1>
        <p className="text-gray-300 mb-6 sm:mb-8 text-center text-sm sm:text-base">
          Acceso restringido para súper administradores
        </p>
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 bg-white/90 text-black font-bold rounded-lg flex items-center gap-2 shadow-md hover:bg-gray-100 transition text-sm sm:text-base w-full max-w-xs"
        >
          <img
            src="/google.png"
            alt="Google"
            className="w-5 h-5 sm:w-6 sm:h-6"
          />
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  // Not authorized
  if (session && !isSuperAdmin) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 gap-4 px-4">
        <h1 className="text-red-400 text-2xl sm:text-3xl font-bold text-center">
          Acceso Denegado
        </h1>
        <p className="text-gray-300 text-center text-sm sm:text-base break-all">
          Usuario: {session.user?.email ?? "sin email"}
        </p>
        <p className="text-gray-400 text-xs sm:text-sm text-center">
          No tienes permisos de súper administrador
        </p>
        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base w-full max-w-xs"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  // Debug: Log current admins state
  console.log("🎯 Estado actual de administradores:", admins);

  // SuperAdmin Panel
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 px-2 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            SuperAdmin Panel
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <span className="text-green-400 text-sm sm:text-base truncate max-w-full">
              ✓ {session.user.email}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base w-full sm:w-auto"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-600/20 border border-green-500 text-green-200"
                : "bg-red-600/20 border border-red-500 text-red-200"
            }`}
          >
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {message.text}
            </pre>
          </div>
        )}

        {/* Create Admin Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
            Crear Nuevo Administrador
          </h2>
          <form
            onSubmit={createAdmin}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email del administrador"
                value={newAdmin.email}
                onChange={(e) =>
                  setNewAdmin((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-blue-400 focus:outline-none text-sm sm:text-base"
                required
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Identificador (ej: AbC12)"
                  value={newAdmin.identificador}
                  onChange={(e) =>
                    setNewAdmin((prev) => ({
                      ...prev,
                      identificador: e.target.value,
                    }))
                  }
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-blue-400 focus:outline-none text-sm sm:text-base"
                  maxLength="10"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setNewAdmin((prev) => ({
                      ...prev,
                      identificador: generateIdentifier(),
                    }))
                  }
                  className="px-3 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm"
                  title="Generar identificador automático"
                >
                  🎲
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Event slug (opcional, ej: boda-maria-juan)"
              value={newAdmin.eventSlug}
              onChange={(e) =>
                setNewAdmin((prev) => ({
                  ...prev,
                  eventSlug: e.target.value.toLowerCase(),
                }))
              }
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-blue-400 focus:outline-none text-sm sm:text-base"
              pattern="^[a-z0-9-]*$"
              title="Solo letras minúsculas, números y guiones (opcional)"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition text-sm sm:text-base font-medium"
            >
              {isCreating ? "Creando..." : "Crear Administrador"}
            </button>
          </form>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            Panel admin: /admin/{newAdmin.identificador || "identificador"}
            {newAdmin.eventSlug && (
              <span> • Evento: /{newAdmin.eventSlug}</span>
            )}
          </p>
        </div>

        {/* Create Event for Existing Admin Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
            Crear Evento para Administrador
          </h2>
          <form
            onSubmit={createEventForAdmin}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <select
                value={newEvent.identificador}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, identificador: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white border border-white/30 focus:border-blue-400 focus:outline-none text-sm sm:text-base"
                required
              >
                <option value="" className="bg-gray-800">Seleccionar administrador...</option>
                {admins
                  .filter(admin => admin.identificador && admin.identificador.trim() && !admin.isLegacy) // Solo admins con identificador válido
                  .reduce((unique, admin) => {
                    // Agrupar por identificador para evitar duplicados en el select
                    if (!unique.find(u => u.identificador === admin.identificador)) {
                      unique.push(admin);
                    }
                    return unique;
                  }, [])
                  .map((admin) => {
                    // Contar cuántos eventos tiene este admin
                    const adminEvents = admins.filter(a => a.identificador === admin.identificador && a.event_slug);
                    const eventCount = adminEvents.length;
                    
                    return (
                      <option key={admin.identificador} value={admin.identificador} className="bg-gray-800">
                        {admin.identificador} - {admin.email} {eventCount > 0 ? `(${eventCount} eventos)` : '(sin eventos)'}
                      </option>
                    );
                  })}
              </select>
              <input
                type="text"
                placeholder="Event slug (ej: boda-maria-juan)"
                value={newEvent.eventSlug}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    eventSlug: e.target.value.toLowerCase(),
                  }))
                }
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-blue-400 focus:outline-none text-sm sm:text-base"
                pattern="^[a-z0-9-]+$"
                title="Solo letras minúsculas, números y guiones"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isCreatingEvent || admins.filter(admin => admin.identificador && admin.identificador.trim() && !admin.isLegacy).length === 0}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed transition text-sm sm:text-base font-medium"
            >
              {isCreatingEvent ? "Creando..." : "Crear Evento"}
            </button>
          </form>
          {admins.filter(admin => admin.identificador && admin.identificador.trim() && !admin.isLegacy).length === 0 && (
            <p className="text-yellow-400 text-xs sm:text-sm mt-2">
              No hay administradores con identificador disponibles
            </p>
          )}
          <div className="text-gray-400 text-xs sm:text-sm mt-2 space-y-1">
            <p>Panel admin: /admin/{newEvent.identificador || "identificador"}</p>
            {newEvent.eventSlug && (
              <p>Evento: /{newEvent.eventSlug}</p>
            )}
            <p className="text-yellow-300">
              💡 El evento se asignará al identificador seleccionado
            </p>
            <p className="text-blue-300">
              ℹ️ Los administradores pueden tener múltiples eventos con el mismo identificador
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-6">
          <h2 className="text-xl text-white mb-4">
            Solicitudes de creación de eventos
          </h2>
          {requests.length === 0 ? (
            <p className="text-gray-400">No hay solicitudes pendientes.</p>
          ) : (
            <ul className="space-y-2">
              {requests.map((req) => (
                <li key={req.id} className="text-gray-200">
                  📧 {req.email} — {req.name || "Sin nombre"} —{" "}
                  <span className="text-gray-400 text-sm">
                   {new Date(req.requested_at).toLocaleString()}

                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Admins List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 mt-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Registros de Administradores ({admins.length} registros)
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                Agrupados por usuario - Expandir para ver eventos de cada administrador
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={fetchAdmins}
                disabled={loadingAdmins}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:bg-blue-800 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {loadingAdmins ? "🔄 Cargando..." : "🔄 Refrescar"}
              </button>
              <button
                onClick={async () => {
                  console.log("🧪 Ejecutando análisis completo...");
                  const { data: allData, error } = await supabase
                    .from("admins")
                    .select("*");
                  
                  console.log("🔍 Todos los registros raw:", allData);
                  
                  // Analizar por tipo de registro
                  const withId = allData?.filter(admin => admin.identificador) || [];
                  const withoutId = allData?.filter(admin => !admin.identificador) || [];
                  const withEvents = allData?.filter(admin => admin.event_slug) || [];
                  
                  console.log("📊 Análisis:");
                  console.log("  - Con identificador:", withId.length, withId);
                  console.log("  - Sin identificador (eventos):", withoutId.length, withoutId);
                  console.log("  - Con eventos:", withEvents.length, withEvents);
                  
                  alert(`Análisis completo:\n- Total: ${allData?.length || 0}\n- Con ID: ${withId.length}\n- Sin ID (eventos): ${withoutId.length}\n- Con eventos: ${withEvents.length}\n\nVer consola para detalles.`);
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm w-full sm:w-auto"
              >
                🔍 Análisis DB
              </button>
            </div>
          </div>

          {loadingAdmins ? (
            <p className="text-gray-400">🔄 Cargando administradores...</p>
          ) : admins.length === 0 ? (
            <p className="text-gray-400">No hay registros en la base de datos.</p>
          ) : (() => {
            // Agrupar por email
            const adminsByEmail = admins.reduce((acc, admin) => {
              const email = admin.email;
              if (!acc[email]) {
                acc[email] = {
                  email: email,
                  adminRecord: null, // Registro con identificador
                  events: [] // Registros de eventos (sin identificador)
                };
              }
              
              if (admin.identificador && !admin.isLegacy) {
                // Es un registro de admin (con identificador)
                acc[email].adminRecord = admin;
              } else {
                // Es un registro de evento (sin identificador o legacy)
                acc[email].events.push(admin);
              }
              
              return acc;
            }, {});

            const adminEmails = Object.keys(adminsByEmail);

            const toggleUser = (email) => {
              const newExpanded = new Set(expandedUsers);
              if (newExpanded.has(email)) {
                newExpanded.delete(email);
              } else {
                newExpanded.add(email);
              }
              setExpandedUsers(newExpanded);
            };

            return (
              <>
                <div className="space-y-2">
                  {adminEmails.map((email) => {
                    const userData = adminsByEmail[email];
                    const isExpanded = expandedUsers.has(email);
                    const hasAdminAccess = userData.adminRecord !== null;
                    const eventCount = userData.events.length;
                    
                    return (
                      <div key={email} className="border border-white/20 rounded-lg overflow-hidden">
                        {/* Header del usuario */}
                        <div 
                          className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                          onClick={() => toggleUser(email)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-lg ${isExpanded ? 'transform rotate-90' : ''} transition-transform`}>
                                ▶️
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-400">👤</span>
                                <span className="text-white font-medium">{email}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              {hasAdminAccess && (
                                <span className="text-green-400 text-xs px-2 py-1 bg-green-500/20 rounded flex items-center gap-1">
                                  🔑 Admin: {userData.adminRecord.identificador}
                                </span>
                              )}
                              {eventCount > 0 && (
                                <span className="text-blue-400 text-xs px-2 py-1 bg-blue-500/20 rounded flex items-center gap-1">
                                  🎯 {eventCount} evento{eventCount !== 1 ? 's' : ''}
                                </span>
                              )}
                              {!hasAdminAccess && eventCount === 0 && (
                                <span className="text-yellow-400 text-xs px-2 py-1 bg-yellow-500/20 rounded">
                                  ⚠️ Sin configurar
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contenido expandible */}
                        {isExpanded && (
                          <div className="p-4 bg-white/5 border-t border-white/10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Admin Record */}
                              <div>
                                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                  🔑 Acceso Administrativo
                                </h4>
                                {userData.adminRecord ? (
                                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-green-300 font-medium">
                                        ID: {userData.adminRecord.identificador}
                                      </span>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        userData.adminRecord.is_active 
                                          ? 'bg-green-600/20 text-green-300' 
                                          : 'bg-red-600/20 text-red-300'
                                      }`}>
                                        {userData.adminRecord.is_active ? 'Activo' : 'Inactivo'}
                                      </span>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                      <button
                                        onClick={() => deleteAdmin(userData.adminRecord.id, email, userData.adminRecord.identificador)}
                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                                      >
                                        🗑️ Eliminar Admin
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                    <p className="text-yellow-300 text-sm mb-2">
                                      Sin acceso administrativo configurado
                                    </p>
                                    <p className="text-yellow-200 text-xs">
                                      Use "Crear Nuevo Administrador" para dar acceso al panel
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Events */}
                              <div>
                                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                  🎯 Eventos ({eventCount})
                                </h4>
                                {eventCount > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {userData.events.map((event) => (
                                      <div key={event.id} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-blue-300 font-medium flex items-center gap-2">
                                            🎉 {event.event_slug || 'Sin slug'}
                                          </span>
                                          <span className={`text-xs px-2 py-1 rounded ${
                                            event.is_active 
                                              ? 'bg-green-600/20 text-green-300' 
                                              : 'bg-red-600/20 text-red-300'
                                          }`}>
                                            {event.is_active ? 'Activo' : 'Inactivo'}
                                          </span>
                                        </div>
                                        {event.event_slug && (
                                          <div className="flex gap-2 flex-wrap">
                                            <a
                                              href={`/${event.event_slug}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                                            >
                                              🌐 Ver Evento
                                            </a>
                                            <button
                                              onClick={() => deleteAdmin(event.id, email, event.event_slug || 'evento')}
                                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                                            >
                                              🗑️ Eliminar Evento
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3">
                                    <p className="text-gray-300 text-sm mb-2">
                                      Sin eventos asignados
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                      Use "Crear Evento para Administrador" para asignar eventos
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Enhanced Summary Section */}
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <h3 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                      📊 Resumen por Usuarios
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{adminEmails.length}</div>
                        <div className="text-gray-400">Usuarios únicos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {Object.values(adminsByEmail).filter(user => user.adminRecord !== null).length}
                        </div>
                        <div className="text-gray-400">Con acceso admin</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {Object.values(adminsByEmail).reduce((total, user) => total + user.events.length, 0)}
                        </div>
                        <div className="text-gray-400">Total eventos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {admins.length}
                        </div>
                        <div className="text-gray-400">Total registros DB</div>
                      </div>
                    </div>
                  </div>

                  {/* Users without admin access */}
                  {(() => {
                    const usersWithoutAdmin = Object.values(adminsByEmail).filter(user => user.adminRecord === null);
                    return usersWithoutAdmin.length > 0 && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <h3 className="text-yellow-300 font-semibold mb-2 flex items-center gap-2">
                          ⚠️ Usuarios sin Acceso Administrativo
                        </h3>
                        <p className="text-yellow-200 text-sm mb-3">
                          {usersWithoutAdmin.length} usuario{usersWithoutAdmin.length !== 1 ? 's' : ''} tienen eventos pero no pueden acceder al panel administrativo.
                        </p>
                        <div className="text-xs text-yellow-300 space-y-1">
                          {usersWithoutAdmin.slice(0, 3).map(user => (
                            <div key={user.email}>• {user.email} ({user.events.length} evento{user.events.length !== 1 ? 's' : ''})</div>
                          ))}
                          {usersWithoutAdmin.length > 3 && (
                            <div className="text-yellow-400">... y {usersWithoutAdmin.length - 3} más</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            );
          })()}
        </div>

        {/* Instructions */}
        <div className="mt-6 sm:mt-8 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3 sm:p-4">
          <h3 className="text-yellow-200 font-semibold mb-2 text-sm sm:text-base">
            📋 Proceso para crear administradores y eventos:
          </h3>
          <ul className="text-yellow-100 text-xs sm:text-sm space-y-1 sm:space-y-2">
            <li className="break-words">
              • <strong>Opción 1:</strong> Crear administrador completo (con email, identificador y evento opcional)
            </li>
            <li className="break-words">
              • <strong>Opción 2:</strong> Crear solo administrador (email + identificador) y luego asignar evento
            </li>
            <li className="break-words">
              • <strong>Acceso:</strong> El admin debe ir a /admin/{`{identificador}`} e iniciar sesión
            </li>
            <li className="break-words">
              • <strong>Configuración:</strong> Si tiene evento, usar "Configurar Assets" para subir imágenes
            </li>
            <li className="break-words">
              • <strong>Flexibilidad:</strong> Los admins pueden existir sin evento y asignárselo después
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
