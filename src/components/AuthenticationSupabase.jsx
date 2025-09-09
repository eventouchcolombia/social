// src/components/AuthenticationSupabase.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthenticationSupabase = () => {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // === Verificar si el usuario es admin ===
  const checkIfAdmin = async (user) => {
    try {
      if (!user?.email) {
        setIsAdmin(false);
        return false;
      }

      const email = user.email.toLowerCase().trim();

      const { data: admin, error } = await supabase
        .from("admins")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("❌ Error consultando admins:", error);
        setIsAdmin(false);
        return false;
      }

      setIsAdmin(!!admin);
      return !!admin;
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
        await checkIfAdmin(currentSession.user);
      }
      setLoading(false);

      unsub = supabase.auth.onAuthStateChange(async (event, sessionObj) => {
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
      });
    };

    init();

    return () => {
      unsub?.data?.subscription?.unsubscribe();
    };
  }, []);

  // === Métodos de login/logout ===
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/admin",
        },
      });
      if (error) console.error("❌ Error de autenticación:", error);
    } catch (error) {
      console.error("❌ Error de autenticación:", error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setSession(null);
  };

  return { session, isAdmin, loading, signInWithGoogle, signOut };
};

export default AuthenticationSupabase;
