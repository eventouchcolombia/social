import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { X, Copy, Share, MessageCircle, Mail } from "lucide-react";
import QRCode from "qrcode";

const ShareEvent = ({ eventSlug, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copying, setCopying] = useState(false);
  const [eventMessage, setEventMessage] = useState("¡Hola! Te invitamos a ser parte de nuestro evento especial. Visita el link para participir y compartir momentos únicos con nosotros.");
  
  const eventUrl = `${window.location.origin}/${eventSlug}`;
  const eventTitle = `¡Te invitamos a nuestro evento especial!`;

  useEffect(() => {
    // Generar el código QR
    const generateQR = async () => {
      try {
        const qrUrl = await QRCode.toDataURL(eventUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error("Error generando QR:", error);
      }
    };

    generateQR();
  }, [eventUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error("Error copiando URL:", error);
    }
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${eventMessage}\n\n${eventUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaMessenger = () => {
    const messengerUrl = `https://www.messenger.com/new?message=${encodeURIComponent(`${eventMessage}\n\n${eventUrl}`)}`;
    window.open(messengerUrl, '_blank');
  };

  const shareViaGmail = () => {
    const subject = encodeURIComponent(eventTitle);
    const body = encodeURIComponent(`${eventMessage}\n\nAccede al evento aquí: ${eventUrl}\n\n¡Te esperamos!`);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-2xl relative overflow-y-auto max-h-[95vh]"
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={24} />
        </button>

        {/* Título */}
        <div className="text-center mb-8">
          <Share className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Compartir Evento
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Comparte el evento "<span className="font-semibold">{eventSlug}</span>" con tus invitados
          </p>
        </div>

        {/* Código QR */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gray-50 rounded-2xl shadow-inner">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code del evento" 
                className="w-48 h-48 mx-auto"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-xl flex items-center justify-center">
                <span className="text-gray-500 text-sm">Generando QR...</span>
              </div>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-3">
            Escanea el código QR para acceder al evento
          </p>
        </div>

        {/* URL del evento */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            URL del Evento
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={eventUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-3 rounded-xl transition flex items-center gap-2 text-sm font-medium ${
                copying 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Copy size={16} />
              {copying ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Mensaje personalizable */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mensaje de Invitación
          </label>
          <textarea
            value={eventMessage}
            onChange={(e) => setEventMessage(e.target.value)}
            placeholder="Escribe el mensaje que se enviará junto con el link del evento..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
          />
          <p className="text-gray-500 text-xs mt-2">
            Este mensaje se enviará junto con el enlace del evento al compartir por WhatsApp, Messenger o Gmail.
          </p>
        </div>

        {/* Opciones de compartir */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Compartir por:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* WhatsApp */}
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center justify-center gap-3 p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition group"
            >
              <MessageCircle size={20} />
              <span className="font-medium">WhatsApp</span>
            </button>

            {/* Messenger */}
            <button
              onClick={shareViaMessenger}
              className="flex items-center justify-center gap-3 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition group"
            >
              <MessageCircle size={20} />
              <span className="font-medium">Messenger</span>
            </button>

            {/* Gmail */}
            <button
              onClick={shareViaGmail}
              className="flex items-center justify-center gap-3 p-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition group"
            >
              <Mail size={20} />
              <span className="font-medium">Gmail</span>
            </button>
          </div>
        </div>

        {/* Botón Cerrar */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ShareEvent;