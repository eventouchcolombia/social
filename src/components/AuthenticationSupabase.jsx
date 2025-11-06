// src/components/AuthenticationSupabase.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthenticationSupabase = () => {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null); // 🧩 antes estaba en false
  const [loading, setLoading] = useState(true);

  // === Verificar si el usuario es admin ===
  // === Verificar si el usuario es admin ===
const checkIfAdmin = async (user) => {
  try {
    if (!user?.email) {
      setIsAdmin(false);
      return false;
    }

    const email = user.email.toLowerCase().trim();

    const { data, error } = await supabase
      .from("admins")
      .select("id, email")
      .eq("email", email)
      

    if (error) {
      console.error("❌ Error consultando admins:", error);
      setIsAdmin(false);
      return false;
    }

    // ✅ Si existe en la tabla admins → es admin
    const isUserAdmin = !!data;
    setIsAdmin(isUserAdmin);
    return isUserAdmin;
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
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const currentSession = data?.session ?? null;
      setSession(currentSession);

      if (currentSession?.user) {
        await checkIfAdmin(currentSession.user);
      } else {
        setIsAdmin(false);
      }

      const { data: listener } = supabase.auth.onAuthStateChange(
        async (event, sessionObj) => {
          const ses = sessionObj?.session ?? sessionObj;
          setSession(ses);

          if (event === "SIGNED_IN" && ses?.user) {
            await checkIfAdmin(ses.user);
          }

          if (event === "SIGNED_OUT") {
            setIsAdmin(false);
            setSession(null);
          }

          setLoading(false);
        }
      );

      unsub = listener;
      setLoading(false);
    };

    init();

    return () => {
      unsub?.subscription?.unsubscribe();
    };
  }, []);

  // === Métodos de login/logout ===
  const signInWithGoogle = async () => {
    try {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const pathname = window.location.pathname;

      let redirectUrl;
      if (host.includes("localhost")) {
        redirectUrl = `http://localhost:5174${pathname}`;
      } else {
        redirectUrl = `${protocol}//${host}${pathname}`;
      }

      console.log("🔗 Redirect URL:", redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });

      if (error) console.error("❌ Error de autenticación:", error);
    } catch (error) {
      console.error("❌ Error de autenticación:", error);
    }
  };

  const signOut = async () => {
    try {
      setIsAdmin(false);
      setSession(null);
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Error al cerrar sesión:", error);
        setLoading(false);
        return;
      }

      window.location.replace("/");
    } catch (err) {
      console.error("❌ Error al cerrar sesión:", err);
      setLoading(false);
    }
  };

  const getSession = async () => {
    return supabase.auth.getSession();
  };

  return { session, isAdmin, loading, signInWithGoogle, signOut, getSession };
};

export default AuthenticationSupabase;
