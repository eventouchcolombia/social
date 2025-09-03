import { useNavigate } from "react-router-dom";

const Choose = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center  px-4"
     style={{ backgroundImage: "url('/background.png')" }}>
      {/* Botón Ir al inicio */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 bg-purple-400 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-600 transition"
      >
        Ir al inicio
      </button>

      {/* Título */}
      <h1 className="text-4xl sm:text-3xl font-bold text-white mb-20 text-center">
        ¿Qué quieres hacer primero?
      </h1>

      {/* Opciones */}
      <div className="w-full max-w-xs flex flex-col gap-4">
        <button
          onClick={() => navigate("/photo")}
          className="w-full bg-purple-400 text-white py-3 rounded-xl text-lg font-semibold shadow-md hover:bg-purple-600 transition"
        >
          Tomate una foto 
        </button>

        <button
          onClick={() => navigate("/gallery")}
          className="w-full bg-purple-400 text-white py-3 rounded-xl text-lg font-semibold shadow-md hover:bg-gray-200 transition"
        >
          Ir a la galería 
        </button>
      </div>
    </div>
  );
};

export default Choose;
