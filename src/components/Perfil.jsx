import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { validateEventSlug, getEventAssetInstructions } from "../utils/eventAssets";
import { X } from "lucide-react";

const Perfil = ({ onClose, userEmail }) => {
  const [newEvent, setNewEvent] = useState({ eventSlug: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [userEvents, setUserEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showEventsList, setShowEventsList] = useState(false);
  const navigate = useNavigate();

  // Mostrar mensaje temporal
  const showMessage = (text, type = "success") => {
    setMessage({ text, type }); 
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  // Crear nuevo evento
  const createEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.eventSlug) {
      showMessage("Por favor ingresa el slug del evento", "error");
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
    // Obtener el admin_id del usuario actual
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("id")
      .eq("email", userEmail.toLowerCase().trim())
      .neq("identificador", null)
      .single();

    if (adminError || !adminData) {
      showMessage("Necesitas ser administrador para crear eventos", "error");
      return;
    }

    // Verificar si ya existe el evento
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("event_slug", newEvent.eventSlug)
      .single();

    if (existing) {
      showMessage("Ya existe un evento con ese nombre", "error");
      return;
    }

    // Crear el evento
    const { error } = await supabase
      .from("events")
      .insert([{
        event_slug: newEvent.eventSlug,
        admin_id: adminData.id,
        admin_email: userEmail.toLowerCase().trim(),
        is_active: true
      }]);

    if (error) throw error;

    const instructions = getEventAssetInstructions(newEvent.eventSlug);
    showMessage(`✅ Evento "${newEvent.eventSlug}" creado exitosamente!\n\n${instructions.instructions.join('\n')}`, "success");
    setNewEvent({ eventSlug: "" });
  } catch (error) {
      console.error("❌ Error creando evento:", error);
      showMessage("Error creando el evento", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Cargar eventos del usuario
const fetchUserEvents = async () => {
  setLoadingEvents(true);
  try {
    const { data, error } = await supabase
      .from("events")
      .select(`
        id, 
        event_slug, 
        is_active, 
        admin_id,
        created_at,
        admins!inner(identificador)
      `)
      .eq("admin_email", userEmail.toLowerCase().trim())
      .order('created_at', { ascending: false });

    if (error) throw error;
    setUserEvents(data || []);
  } catch (error) {
    console.error("❌ Error cargando eventos:", error);
    showMessage("Error cargando eventos", "error");
  } finally {
    setLoadingEvents(false);
  }
};

  // Toggle activar/desactivar evento
  const toggleEventStatus = async (eventId, currentStatus) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_active: !currentStatus })
        .eq("id", eventId);

      if (error) throw error;

      // Actualizar el estado local
      setUserEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { ...event, is_active: !currentStatus }
            : event
        )
      );

      showMessage(
        `Evento ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`,
        "success"
      );
    } catch (error) {
      console.error("❌ Error actualizando evento:", error);
      showMessage("Error actualizando el estado del evento", "error");
    }
  };

  // Reset loading state if stuck
  useEffect(() => {
    if (isCreating) {
      const timer = setTimeout(() => {
        setIsCreating(false);
        showMessage("La creación se detuvo. Intenta de nuevo.", "error");
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [isCreating]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex justify-start items-stretch z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white w-80 shadow-lg overflow-y-auto animate-slide-in-left p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-[#753E89] transition"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold mb-2 text-[#753E89]">Perfil</h2>
        
        {/* Mostrar email fijo */}
        <p className="text-gray-600 text-xs mb-6 break-all">
          {userEmail}
        </p>
        
        {/* Botones principales */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => setShowEventsList(false)}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${!showEventsList ? 'bg-[#753E89] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Crear Evento
          </button>
          <button
            onClick={() => {
              setShowEventsList(true);
              fetchUserEvents();
            }}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${showEventsList ? 'bg-[#753E89] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Mis Eventos
          </button>
        </div>
        
        {/* Message Alert */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-xs ${
            message.type === "success" 
              ? "bg-green-100 border border-green-500 text-green-700" 
              : "bg-red-100 border border-red-500 text-red-700"
          }`}>
            <pre className="whitespace-pre-wrap font-sans">{message.text}</pre>
          </div>
        )}

        {!showEventsList ? (
          // Formulario crear evento
          <form onSubmit={createEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del evento
              </label>
              <input
                type="text"
                placeholder="ej: boda-maria-juan"
                value={newEvent.eventSlug}
                onChange={(e) => setNewEvent(prev => ({ ...prev, eventSlug: e.target.value.toLowerCase() }))}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 text-black placeholder-gray-400 border border-gray-300 focus:border-[#753E89] focus:outline-none text-sm"
                pattern="[a-z0-9\-]+"
                title="Solo letras minúsculas, números y guiones"
                required
              />
              <p className="text-gray-500 text-xs mt-2">
                URL: /{newEvent.eventSlug || "evento-slug"}
              </p>
            </div>
            {newEvent.eventSlug && (
              <button
                type="submit"
                disabled={isCreating}
                className="w-full px-4 py-3 bg-[#753E89] text-white rounded-lg font-semibold hover:bg-[#8a4ea0] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creando..." : "Crear Evento"}
              </button>
            )}
          </form>
        ) : (
          // Lista de eventos
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Mis Eventos ({userEvents.length})</h3>
            {loadingEvents ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#753E89]"></div>
              </div>
            ) : userEvents.length > 0 ? (
              <ul className="space-y-2">
                {userEvents.map((event) => (
                  <li key={event.event_slug} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          navigate(`/admin/${event.admins.identificador}/${event.event_slug}`);
                          onClose();
                        }}
                        className="flex-1 text-left px-4 py-3 hover:bg-[#753E89] hover:text-white transition group"
                      >
                        <span className="text-sm font-medium">{event.event_slug}</span>
                        <span className="ml-2 text-xs text-gray-400 group-hover:text-white">→</span>
                      </button>
                      
                      {/* Toggle Switch */}
                      <div className="px-3 flex items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEventStatus(event.id, event.is_active);
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            event.is_active ? 'bg-[#753E89]' : 'bg-gray-300'
                          }`}
                          title={event.is_active ? 'Desactivar evento' : 'Activar evento'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              event.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    
                    {/* Estado visual */}
                    <div className={`px-4 py-1 text-xs ${
                      event.is_active 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {event.is_active ? '✓ Evento activo' : '✕ Evento desactivado'}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-2">No tienes eventos creados</p>
                <button
                  onClick={() => setShowEventsList(false)}
                  className="text-[#753E89] text-xs font-semibold hover:underline"
                >
                  Crear mi primer evento
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Perfil;
