import { useState } from "react";
import { X } from "lucide-react";

const Terms = ({ isOpen, onAccept, onClose }) => {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Términos y condiciones
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            Para confirmar la reserva, el cliente deberá realizar el{" "}
            <strong>pago total</strong> dentro de los{" "}
            <strong>dos (2) días calendario</strong> posteriores a la reserva
            (aplica para alquileres mayores a cinco días). De no recibirse el
            pago, la reserva podrá ser cancelada automáticamente.
          </p>

          <p>
            El tótem deberá usarse únicamente para el fin y lugar acordados.
          </p>

          <p>
            En caso de falla técnica no solucionable, se evaluará un reembolso
            proporcional.
          </p>
          <p> El cliente deberá informar a los usuarios sobre la
            recolección de datos, cuando aplique.</p>
        </div>

        {/* Checkbox */}
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1"
          />
          <span>Acepto los términos y condiciones</span>
        </label>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onAccept}
            disabled={!accepted}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition
              ${
                accepted
                  ? "bg-[#753E89] hover:bg-gray-800"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Terms;
