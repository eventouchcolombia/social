import { AlertCircle } from "lucide-react";

const EventInactive = ({ eventSlug }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <AlertCircle className="w-20 h-20 mx-auto text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Evento no disponible
        </h1>
        <p className="text-gray-600 mb-2">
          El evento <strong className="text-[#753E89]">{eventSlug}</strong> está actualmente desactivado.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Si eres el administrador, activa el evento desde tu panel de control.
        </p>
        <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700">
          <p>💡 <strong>Nota:</strong> Contacta al organizador del evento para más información.</p>
        </div>
      </div>
    </div>
  );
};

export default EventInactive;
