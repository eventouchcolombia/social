import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import {
  CircleCheck,
  AlertTriangle,
  Info,
  Calendar,
  Truck,
} from "lucide-react";

const ReservaTotemForm = ({ onClose }) => {
  const [fecha, setFecha] = useState("");
  const [transporte, setTransporte] = useState(null);
  const [fechasOcupadas, setFechasOcupadas] = useState([]);
  const [authUser, setAuthUser] = useState(null);

  const [modal, setModal] = useState({ show: false, message: "", type: "" });

  // Obtener usuario autenticado
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthUser(user);
    };
    fetchUser();
  }, []);

  // Cargar fechas ocupadas
  useEffect(() => {
    const fetchFechas = async () => {
      const { data, error } = await supabase
        .from("reservatotem")
        .select("fecha_reserva");

      if (!error && data) {
        setFechasOcupadas(data.map((f) => f.fecha_reserva));
      }
    };

    fetchFechas();
  }, []);

  const fechaOcupada = fechasOcupadas.includes(fecha);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authUser) {
      openModal("Error: Usuario no encontrado.", "error");
      return;
    }

    if (fechaOcupada) {
      openModal("Esta fecha ya está reservada. Por favor elige otra.", "error");
      return;
    }

    const { error } = await supabase.from("reservatotem").insert([
      {
        user_id: authUser.id,
        nombre: authUser.user_metadata.full_name,
        correo: authUser.email,
        fecha_reserva: fecha,
        transporte,
      },
    ]);

    if (error) {
      console.log(error);
      openModal("Error al guardar la reserva", "error");
    } else {
      openModal("Reserva creada con éxito", "success");
      setTimeout(() => onClose?.(), 3200);
    }
  };

  const openModal = (message, type = "info") => {
    setModal({ show: true, message, type });

    // Cierre automático en 3 segundos
    setTimeout(() => {
      setModal({ show: false, message: "", type: "" });
    }, 3000);
  };

  return (
    <>
      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="relative space-y-4 p-6 bg-white rounded-2xl shadow-xl border border-[#e5d4ef] ring-1 ring-[#753E89]/40"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
        >
          ×
        </button>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#753E89] mt-4 mb-2">
            <Calendar className="w-4 h-4" />
            Fecha de Reserva
          </label>

          <input
            type="date"
            value={fecha}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setFecha(e.target.value)}
            className="text-sm border p-2 rounded w-full border-gray-300"
            required
          />

          {fecha && fechaOcupada && (
            <p className="text-[#753E89] text-sm mt-1">
              Esta fecha ya está reservada.
            </p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#753E89] mt-4 mb-2">
            <Truck className="w-4 h-4" />
            ¿Necesitas transporte?
          </label>

          <select
            value={transporte === null ? "" : transporte}
            onChange={(e) =>
              setTransporte(
                e.target.value === "" ? null : e.target.value === "true"
              )
            }
            className="border border-gray-300 text-sm p-2 rounded w-full"
          >
            <option value="">Selecciona</option>
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </div>

        <button className="bg-[#753E89] cursor-pointer text-white rounded-lg px-4 py-2 mt-2 text-sm font-semibold hover:bg-[#8a4ea0] transition">
          Guardar Reserva
        </button>
      </form>

      {modal.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-[#753E89] shadow-xl p-6 w-80 text-center relative">
            {/* ÍCONO + TÍTULO */}
            <div className="flex flex-col items-center justify-center mb-3">
              {modal.type === "success" && (
                <CircleCheck className="w-10 h-10 text-green-600 mb-2" />
              )}

              {modal.type === "error" && (
                <AlertTriangle className="w-10 h-10 text-red-600 mb-2" />
              )}

              {modal.type === "info" && (
                <Info className="w-10 h-10 text-[#753E89] mb-2" />
              )}

              <h3 className={"text-lg font-semibold"}>
                {modal.type === "error"}
                {modal.type === "success"}
                {modal.type === "info"}
              </h3>
            </div>

            {/* MENSAJE */}
            <p className="text-gray-700 mb-4">{modal.message}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ReservaTotemForm;
