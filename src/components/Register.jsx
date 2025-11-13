/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticationSupabase from "./AuthenticationSupabase";
import { supabase } from "../supabaseClient";

export default function Register() {
  const navigate = useNavigate();
  const { signInWithGoogle, checkIfUserExists } = AuthenticationSupabase();

  const [errorMessage, setErrorMessage] = useState("");
  const processingRef = useRef(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, sessionObj) => {
      const ses = sessionObj?.session ?? sessionObj;

      if (processingRef.current) return;

      if (event === "SIGNED_IN" && ses?.user?.email) {
        processingRef.current = true;
        try {
          const email = ses.user.email;
          const exists = await checkIfUserExists(email);

          if (exists) {
            console.log("✅ El usuario ya existe:", email);
            setErrorMessage("Tu correo ya se encuentra registrado.");

            // Cerrar sesión automáticamente después de mostrar el mensaje
            setTimeout(async () => {
              try {
                await supabase.auth.signOut();
                localStorage.clear();
                sessionStorage.clear();
                // Limpieza de cookies de Supabase
                document.cookie.split(";").forEach((c) => {
                  document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                console.log("🚪 Sesión cerrada automáticamente tras detectar correo existente.");
              } catch (err) {
                console.error("❌ Error cerrando sesión:", err);
              }
            }, 2000); // Espera 2 segundos antes de cerrar sesión
            return;
          }

          // Usuario nuevo → ir al perfil
          navigate("/profile");
        } catch (err) {
          console.error("❌ Error validando usuario:", err);
        } finally {
          processingRef.current = false;
        }
      }
    });

    return () => {
      try {
        listener?.subscription?.unsubscribe();
      // eslint-disable-next-line no-empty
      } catch (e) {}
    };
  }, [navigate, checkIfUserExists]);

  const handleGoogleRegister = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("❌ Error al iniciar registro con Google:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[url('/Mobile.png')] bg-cover bg-center text-[#753E89] p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-6 whitespace-nowrap">Regístrate en EvenTouch</h1>

        <button
          onClick={handleGoogleRegister}
          className="flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold px-4 py-2 rounded-full shadow-md hover:bg-gray-100 transition-all w-full"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google logo"
            className="w-5 h-5"
          />
          Regístrate con Google
        </button>

        {/* Mensaje de error (debajo del botón) */}
        {errorMessage && (
          <p className="mt-4 text-[#753E89] font-medium text-sm">{errorMessage}</p>
        )}

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
