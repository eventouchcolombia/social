import { useNavigate } from "react-router-dom";
import { useEvent } from "../hooks/useEvent";

const Welcome = () => {
  const navigate = useNavigate();
  const { eventSlug, getAssetUrl } = useEvent();

  return (
    <div
      className="flex flex-col items-center justify-between min-h-screen bg-cover bg-center px-4"
      style={{ backgroundImage: `url('${getAssetUrl("background.jpg")}')` }}
    >
      <h1 className="text-4xl font-bold text-[#BFA065] text-center mt-8">
        EventPhotos
      </h1>

      <div className="mb-16">
        <button
          className="bg-yellow-100 text-[#BFA065] px-4 py-2 w-56 h-14 font-bold rounded-3xl text-2xl shadow-xl hover:bg-yellow-300 transition"
          onClick={() => navigate(`/${eventSlug}/choose`)}
        >
          Comenzar!
        </button>
      </div>
    </div>
  );
};

export default Welcome;
