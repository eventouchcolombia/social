
const Modals = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target.id === "modal-backdrop") {
      onClose();
    }
  };

  return (
    <div
      id="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
        >
          ✕
        </button>

        {/* Contenido */}
        <h2 className="text-lg font-bold mb-4">¿Cómo funciona?</h2>

        <div className="space-y-4 text-left text-gray-700">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#753E89]  text-white text-sm font-bold">
              1
            </span>
            <p>
              <span className="font-bold">Selecciona una opción</span>
              <br />
              Elige entre ‘Tomar foto’ o ‘Ver galería’.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#753E89]  text-white text-sm font-bold">
              2
            </span>
            <p>
              <span className="font-bold">Captura tu momento</span>
              <br />
              Sonríe y presiona el botón de captura cuando estés listo.
            </p>
          </div>

          {/* <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#753E89]  text-white text-sm font-bold">
              3
            </span>
            <p>
              <span className="font-bold">Completa tus datos</span>
              <br />
              Ingresa tu nombre y email para enviarte la foto.
            </p>
          </div> */}

          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#753E89]  text-white text-sm font-bold">
              3
            </span>
            <p>
              <span className="font-bold">¡Disfruta tu foto!</span>
              <br />
              Revisa la galería, descarga tu foto o compártela en redes sociales.
            </p>
          </div>
        </div>

        {/* Botón acción */}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-[#753E89]  hover:bg-purple-800 text-white py-3 rounded-full font-bold transition"
        >
          Estoy listo para comenzar
        </button>
      </div>
    </div>
  );
};

export default Modals;
