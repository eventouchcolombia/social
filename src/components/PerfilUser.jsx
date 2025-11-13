import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticationSupabase from "./AuthenticationSupabase";
import { supabase } from "../supabaseClient";

const PerfilUser = () => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { signOut, session, loading } = AuthenticationSupabase();

  

  useEffect(() => {
    if (loading) return;
    if (!session) {
 console.log("Usuario no autenticado, redirigiendo a /");
 navigate("/", { replace: true });
 }
   
  }, [session, loading, navigate]);

  const handleCreateRequest = async () => {
    if (!session?.user) return;

    setIsRequesting(true);
    setErrorMsg("");

    try {
      const { email, user_metadata } = session.user;
      const name =
        user_metadata?.full_name ||
        user_metadata?.name ||
        email.split("@")[0];

      const { error } = await supabase.from("event_requests").insert([
        {
          email,
          name,
        },
      ]);

      if (error) throw error;

      setRequestSent(true);
    } catch (err) {
      console.error("❌ Error enviando solicitud:", err);
      setErrorMsg("Error al enviar la solicitud. Intenta nuevamente.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[url('/Mobile.png')] bg-cover bg-center text-white p-6">
       <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white mx-auto mb-4"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start pt-20 bg-[url('/Mobile.png')] bg-cover bg-center text-white p-6">
      {/* 🔹 Botón de cerrar sesión (imagen) */}
      <img
        src="/Log_Out.png"
        alt="Cerrar sesión"
        onClick={signOut}
        className="absolute top-4 right-4 w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
      />

      <div className="w-full max-w-sm text-center">
        {session?.user ? (
          <>
            <h1 className="text-2xl sm:text-2xl font-bold leading-tight mb-2 mt-8 whitespace-nowrap">
              Tu experiencia en{" "}
              <span className="text-[#753E89]">EvenTouch</span>
            </h1>

            <h2 className="text-2xl font-bold mb-20">comienza aquí.</h2>
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 mb-6 shadow-lg text-black">
              <div className="text-xl font-bold mb-6">
                <p>¡Gracias por unirte!</p>
                <p className="font-semibold text-[#753E89]">
                  {session.user.user_metadata?.full_name ||
                    session.user.user_metadata?.name ||
                    session.user.email.split("@")[0]}
                </p>
              </div>

              <button
                onClick={handleCreateRequest}
                disabled={isRequesting || requestSent}
                className={`${
                  requestSent
                    ? "bg-[#361044]"
                    : "bg-[#753E89] hover:bg-purple-700"
                } transition-all text-white font-semibold px-4 py-2 rounded-full shadow-md w-full mb-2`}
              >
                {requestSent
                  ? " Solicitud enviada"
                  : isRequesting
                  ? "Enviando..."
                  : "Solicitar crear evento"}
              </button>

              {errorMsg && (
                <p className="text-red-600 text-sm mt-2">{errorMsg}</p>
              )}
            </div>
          </>
        ) : (
          <p>No hay sesión activa.</p>
        )}
      </div>
    </div>
  );
};

export default PerfilUser;
