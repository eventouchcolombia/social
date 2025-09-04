import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  return (
     <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center px-4 "
      style={{ backgroundImage: "url('/anillos.jpg')" }}
    >
      <h1 className="text-6xl font-bold text-white mb-44 text-center mt-[-160px] ">PhotoLive</h1>
      {/* <p className="text-lg text-white text-center">Captura momentos únicos y compártelos en el evento</p> */}
      <div className="mt-6">
        <button
          className="bg-gray-500 text-white px-4 py-2 w-44 h-14 font-semibold  rounded-2xl text-2xl"
          onClick={() => navigate("/choose")}
        >
          Comenzar!
        </button>
      </div>
    </div>
  );
}

export default Welcome;