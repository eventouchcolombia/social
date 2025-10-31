import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticationSupabase from "./AuthenticationSupabase";
import { supabase } from "../supabaseClient";

export default function Register() {
  const navigate = useNavigate();
  const { session, signInWithGoogle, loading } = AuthenticationSupabase();

  useEffect(() => {
    // Si el usuario ya tiene sesión activa
    if (!loading && session) {
      navigate("/profile");
    }

    // Escucha los cambios de sesión (cuando se logea)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          navigate("/profile");
        }
      }
    );

    // Limpia el listener al desmontar
    return () => listener.subscription.unsubscribe();
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[url('/Mobile.png')] bg-cover bg-center text-[#753E89] p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-6 whitespace-nowrap">
          Regístrate en EvenTouch
        </h1>
        <button
          onClick={signInWithGoogle}
          className="flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold px-4 py-2 rounded-full shadow-md hover:bg-gray-100 transition-all w-full"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google logo"
            className="w-5 h-5"
          />
          Regístrate con Google
        </button>

        <p className="mt-6 text-sm text-gray-300">
          ¿Ya tienes cuenta?{" "}
          <a href="/" className="text-[#753E89] hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
