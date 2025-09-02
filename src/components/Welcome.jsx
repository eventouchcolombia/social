import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Bienvenidos a Eventia</h1>
      <p className="text-lg text-gray-600 text-center">Captura momentos únicos y compártelos en el evento.</p>
      <div className="mt-6">
        <button
          className="bg-purple-500 text-white px-4 py-2 rounded"
          onClick={() => navigate("/choose")}
        >
          Comenzar!
        </button>
      </div>
    </div>
  );
}

export default Welcome;