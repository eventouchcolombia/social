import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AuthenticationSupabase from "./AuthenticationSupabase";
import { supabase } from "../../../config/supabaseClient";

export default function Register() {
  const navigate = useNavigate();
  const { signInWithGoogle } = AuthenticationSupabase();

  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const processingRef = useRef(false);


  //  FUNCIÓN QUE HACE EL UPDATE (FUERA DEL onAuthStateChange)
  
  const updatePendingRegister = async (pendingId, email) => {
  try {
    

    const {  error } = await supabase
      .from("registerusers")
      .update({ email })
      .eq("id", pendingId)
      .select()
      .single();

    if (error) {
      console.warn("Email ya registrado");

      //  Si el correo ya existe en otra fila → eliminar el registro preliminar
      if (error.code === "23505") {
        console.warn(" Email duplicado");

        // Eliminar SOLO el registro preliminar
        await supabase
          .from("registerusers")
          .delete()
          .eq("id", pendingId);

        localStorage.removeItem("pending_register_id");

        setErrorMessage("Tu correo ya se encuentra registrado.");

      } else {
        setErrorMessage("Error guardando tus datos. Intenta nuevamente.");
      }

      await supabase.auth.signOut();
      return false;
    }


    localStorage.removeItem("pending_register_id");

    setShowSuccessModal(true);
    return true;
  } catch (err) {
    console.error(" ERROR en updatePendingRegister:", err);
    return false;
  }
};

  
  // 1️. REGISTRO PRELIMINAR (ANTES DE LOGIN)

  const handleRegisterUser = async () => {
    if (!phone.trim()) {
      setErrorMessage("El teléfono es obligatorio.");
      return;
    }

    if (!/^\+?[0-9]{7,15}$/.test(phone)) {
      setErrorMessage(
        "Ingresa un teléfono válido (solo números, opcional +, 7-15 dígitos)."
      );
      return;
    }

    try {
      setErrorMessage("");

      const { data, error } = await supabase
        .from("registerusers")
        .insert({
          phone,
          type: userType,
        })
        .select()
        .single();

      if (error) {
        console.error(" Error insertando registro preliminar:", error);
        setErrorMessage("Error al registrar tus datos. Intenta nuevamente.");
        return;
      }

      console.log(" Registro preliminar creado:", data);

      localStorage.setItem("pending_register_id", data.id);

      await signInWithGoogle();
    } catch (err) {
      console.error(" Error:", err);
      setErrorMessage("Ocurrió un error inesperado.");
    }
  };

  
  // 2️. CUANDO GOOGLE DEVUELVE EL USUARIO
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event !== "SIGNED_IN") return;

        if (!session?.user) {
          console.error(" No hay sesión después de Google.");
          return;
        }

        if (processingRef.current) {
          
          return;
        }

        processingRef.current = true;

        const email = session.user.email;
      

        let pendingId = localStorage.getItem("pending_register_id");
        if (!pendingId) {
          console.error(" No existe pending_register_id.");
          setErrorMessage("Error interno. Intenta registrarte de nuevo.");
          await supabase.auth.signOut();
          processingRef.current = false;
          return;
        }

        pendingId = pendingId.trim();

      

        //  CLAVE: mover el UPDATE fuera del evento SIGNED_IN
        setTimeout(() => {
          updatePendingRegister(pendingId, email).then(() => {
            processingRef.current = false;
          });
        }, 50);
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, [navigate]);

 
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[url('/Mobile.png')] bg-cover bg-center text-[#753E89] p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-6 whitespace-nowrap">
          Regístrate en EvenTouch
        </h1>

        <label className="w-full block text-left text-sm text-gray-200 mb-4">
          Teléfono
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            className="mt-2 w-full px-3 py-2 rounded-lg bg-white/20 text-black placeholder-gray-200 border border-transparent focus:border-[#753E89] outline-none transition"
          />
        </label>

        <label className="w-full block text-left text-sm text-gray-200 mb-6">
          Tipo
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="mt-2 w-full px-3 py-2 rounded-lg bg-white/20 text-black border border-transparent focus:border-[#753E89] outline-none transition"
          >
            <option value="" disabled>
              Selecciona el tipo
            </option>
            <option value="persona">Persona</option>
            <option value="empresa">Empresa</option>
          </select>
        </label>

        <button
          onClick={handleRegisterUser}
          className="flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold px-4 py-2 rounded-full shadow-md hover:bg-gray-100 transition-all w-full"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google logo"
            className="w-5 h-5"
          />
          Regístrate con Google
        </button>

        {errorMessage && (
          <p className="mt-4 text-[#753E89] font-medium text-sm">
            {errorMessage}
          </p>
        )}

        <p className="mt-6 text-sm text-gray-300">
          ¿Ya tienes cuenta?{" "}
          <a href="/" className="text-[#753E89] hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl text-center shadow-xl w-80 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#753E89] mb-2">
              ¡Tu registro ha sido completado!
            </h2>
            <p className="text-gray-700 mb-4">
              Nuestro equipo se comunicará contigo.
            </p>

            <button
              onClick={async () => {
                setShowSuccessModal(false);
                await supabase.auth.signOut();
                navigate("/");
              }}
              className="bg-[#753E89] text-white px-4 py-2 rounded-full w-full hover:bg-[#5e3070] transition"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
