import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import { Calendar, Truck, X, AlertTriangle } from "lucide-react";

const ReserveTotem = () => {
  const [authUser, setAuthUser] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);

  useEffect(() => {
    const getUserAndReservas = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      setAuthUser(user);

      const { data: reservasData } = await supabase
        .from("reservatotem")
        .select("id, fecha_reserva, transporte")
        .eq("user_id", user.id)
        .order("fecha_reserva", { ascending: true });

      setReservas(reservasData || []);
      setLoading(false);
    };

    getUserAndReservas();
  }, []);

  // 🟢 FIX timezone
  const formatFecha = (fecha) => {
    const [year, month, day] = fecha.split("-");
    return `${day} de ${new Date(year, month - 1).toLocaleString("es-CO", {
      month: "long",
    })} de ${year}`;
  };

  const openCancelModal = (reserva) => {
    setSelectedReserva(reserva);
    setShowConfirm(true);
  };

  const confirmCancel = async () => {
    if (!selectedReserva) return;

    const { error } = await supabase
      .from("reservatotem")
      .delete()
      .eq("id", selectedReserva.id);

    if (!error) {
      setReservas((prev) =>
        prev.filter((r) => r.id !== selectedReserva.id)
      );
    }

    setShowConfirm(false);
    setSelectedReserva(null);
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Cargando tus reservas...
      </div>
    );
  }

  if (!reservas.length) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No tienes reservas registradas.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">
          {authUser?.user_metadata?.full_name},
          <br />
          <span className="text-[#753E89]">estas son tus reservas:</span>
        </h3>

        <ul className="space-y-3">
          {reservas.map((reserva) => (
            <li
              key={reserva.id}
              className="relative p-4 rounded-xl border border-[#e5d4ef] bg-gray-200 shadow-2xl"
            >
              {/* ❌ Botón cancelar */}
              <button
                onClick={() => openCancelModal(reserva)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Calendar className="w-4 h-4 text-[#753E89]" />
                {formatFecha(reserva.fecha_reserva)}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                <Truck className="w-4 h-4" />
                {reserva.transporte
                  ? "Incluye transporte"
                  : "No incluye transporte"}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 🟥 MODAL CONFIRMACIÓN */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-80 text-center relative">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />

            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              ¿Deseas cancelar la reserva?
            </h3>

            <p className="text-xs text-gray-500 mb-4">
              Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 text-sm py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                No
              </button>

              <button
                onClick={confirmCancel}
                className="flex-1 text-sm py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReserveTotem;
