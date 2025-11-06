// src/components/AuthenticationSupabase.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthenticationSupabase = () => {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);


  
function generateIdentifier() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 5; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}

  // === Verificar si el usuario es admin ===
// AuthenticationSupabase.jsx
// ✅ Nueva versión de checkIfAdmin


const checkIfAdmin = async (user) => {
  try {
    if (!user?.email) return false;
    const email = user.email.toLowerCase().trim();

    const { data: admin, error } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;

    // Si no existe el admin, no hacemos nada aún (posiblemente usuario nuevo)
    if (!admin) {
      console.log("🚫 No existe admin con ese correo");
      return false;
    }

    // Si el admin no tiene identificador aún, lo generamos y actualizamos
    if (!admin.identificador) {
      const nuevoId = generateIdentifier();
      const { error: updateError } = await supabase
        .from("admins")
        .update({ identificador: nuevoId })
        .eq("id", admin.id);

      if (updateError) console.error("❌ Error al asignar identificador:", updateError);
      else console.log(`✅ Identificador generado: ${nuevoId}`);
      admin.identificador = nuevoId;
    }

    // ✅ Si tiene identificador, permitimos el acceso
    setIsAdmin(true);
    return true;
  } catch (err) {
    console.error("❌ Error en checkIfAdmin:", err);
    setIsAdmin(false);
    return false;
  }
};


  // === Inicializar sesión y escuchar cambios ===
  useEffect(() => {
    let unsub;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data?.session ?? null;
      setSession(currentSession);

      if (currentSession?.user) {
        // 🔹 Obtén el slug actual de la URL
        // const slug = window.location.pathname.split("/")[1]; // ej: /happybirth/admin → "happybirth"
        await checkIfAdmin(currentSession.user);
      }

      unsub = supabase.auth.onAuthStateChange(async (event, sessionObj) => {
        const ses = sessionObj?.session ?? sessionObj;
        setSession(ses);

        if (event === "SIGNED_IN" && ses?.user) {
          await checkIfAdmin(ses.user);
        }
        if (event === "SIGNED_OUT") {
          setIsAdmin(false);
          setSession(null);
          setLoading(true); // evita mostrar UI privada durante la transición
        }
        setLoading(false);
      });
    };

    init();

    return () => {
      unsub?.data?.subscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Métodos de login/logout ===
  const signInWithGoogle = async () => {
    try {
      // Construir la URL de redirect manualmente para asegurar que use el dominio correcto
      const protocol = window.location.protocol;
      const host = window.location.host;
      const pathname = window.location.pathname;
      
      // Asegurar que estamos usando el host correcto (local o producción)
      let redirectUrl;
      if (host.includes('localhost')) {
        redirectUrl = `http://localhost:5174${pathname}`;
      } else {
        redirectUrl = `${protocol}//${host}${pathname}`;
      }
      
      console.log("🔗 Redirect URL:", redirectUrl);
      console.log("🌍 Current host:", host);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) console.error("❌ Error de autenticación:", error);
    } catch (error) {
      console.error("❌ Error de autenticación:", error);
    }
  };

  const signOut = async () => {
    try {
      // Oculta inmediatamente la UI de admin y marca loading
      setIsAdmin(false);
      setSession(null);
      setLoading(true);

      // Realiza el sign out (no esperamos a que React actualice el state)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Error al cerrar sesión:", error);
        // si falla, deja loading en false para que UI pueda reaccionar
        setLoading(false);
        return;
      }

      // Redirige al root; use replace para no dejar la ruta anterior en el historial
      window.location.replace("/");
    } catch (err) {
      console.error("❌ Error al cerrar sesión:", err);
      setLoading(false);
    }
  };
  // ...existing code...

   const getSession = async () => {
        return supabase.auth.getSession();
    };

  return { session, isAdmin, loading, signInWithGoogle, signOut,getSession };
};

export default AuthenticationSupabase;
