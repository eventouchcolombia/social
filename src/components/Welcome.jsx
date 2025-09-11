import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";

const Welcome = () => {
  const navigate = useNavigate();
  const { eventSlug, getAssetUrl } = useEvent();

  return (
     <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center px-4 "
      style={{ backgroundImage: `url('${getAssetUrl('background.jpg')}')` }}
    >
      <h1 className="text-4xl font-bold text-black mb-46 text-center mt-[-200px] ">EventPhotos</h1>
      {/* <p className="text-lg text-white text-center">Captura momentos únicos y compártelos en el evento</p> */}
      <div className="mt-6">
        <button
          className="bg-black/40 text-white px-4 py-2 w-44 h-14 font-semibold  rounded-2xl text-2xl"
          onClick={() => navigate(`/${eventSlug}/choose`)}
        >
          Comenzar!
        </button>
      </div>
    </div>
  );
}

export default Welcome;