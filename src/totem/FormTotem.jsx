import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import {
  CircleCheck,
  AlertTriangle,
  Info,
  Calendar,
  Truck,
} from "lucide-react";
import Terms from "./termsTotem/Terms";

const ReservaTotemForm = ({ onClose }) => {
  const [fecha, setFecha] = useState("");
  const [transporte, setTransporte] = useState(null);
  const [fechasOcupadas, setFechasOcupadas] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  

  const [modal, setModal] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data.user);
    });
  }, []);

  useEffect(() => {
    supabase
      .from("reservatotem")
      .select("fecha_reserva")
      .then(({ data }) => {
        if (data) {
          setFechasOcupadas(data.map((f) => f.fecha_reserva));
        }
      });
  }, []);

  const fechaOcupada = fechasOcupadas.includes(fecha);

  const openModal = (message, type = "info") => {
    setModal({ show: true, message, type });
    setTimeout(() => setModal({ show: false }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authUser) {
      openModal("Usuario no autenticado", "error");
      return;
    }

    if (!termsAccepted) {
      openModal("Debes aceptar los términos y condiciones", "error");
      return;
    }

    if (fechaOcupada) {
      openModal("Esta fecha ya está reservada", "error");
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
      openModal("Error al guardar la reserva", "error");
    } else {
      openModal("Reserva creada con éxito", "success");
      setTimeout(() => onClose?.(), 3000);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="relative space-y-4 p-6 bg-white rounded-2xl shadow-xl border border-[#e5d4ef]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
        >
          ×
        </button>

        <label className="flex items-center gap-2 text-sm font-semibold text-[#753E89]">
          <Calendar className="w-4 h-4" />
          Fecha de Reserva
        </label>

        <input
          type="date"
          value={fecha}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => setFecha(e.target.value)}
          className="text-sm border p-2 rounded w-full"
          required
        />

        <label className="flex items-center gap-2 text-sm font-semibold text-[#753E89]">
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
          className="border text-sm p-2 rounded w-full"
        >
          <option value="">Selecciona</option>
          <option value="false">No</option>
          <option value="true">Sí</option>
        </select>

        {/* Términos */}
        <div className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={termsAccepted} readOnly />
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="text-[#753E89] underline"
          >
            Términos y Condiciones
          </button>
        </div>

        <button
          type="submit"
          disabled={!termsAccepted}
          className={`w-full mt-3 rounded-lg px-4 py-2 text-sm font-semibold
            ${
              termsAccepted
                ? "bg-[#753E89] text-white hover:bg-[#8a4ea0]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
        >
          Guardar Reserva
        </button>
      </form>

      <Terms
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setShowTerms(false);
        }}
      />

      {modal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            {modal.type === "success" && (
              <CircleCheck className="w-10 h-10 text-green-600 mx-auto mb-2" />
            )}
            {modal.type === "error" && (
              <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-2" />
            )}
            {modal.type === "info" && (
              <Info className="w-10 h-10 text-[#753E89] mx-auto mb-2" />
            )}
            <p className="text-gray-700">{modal.message}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ReservaTotemForm;
