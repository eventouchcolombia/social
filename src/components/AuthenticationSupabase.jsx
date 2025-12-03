
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthenticationSupabase = () => {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

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
        .eq("email", email);

      if (error) {
        console.error("❌ Error consultando admins:", error);
        setIsAdmin(false);
        return false;
      }

      const isUserAdmin = data && data.length > 0;
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

      //  Activar auto-refresh nativo de Supabase
      supabase.auth.startAutoRefresh();

      setLoading(false);
    };

    init();

    return () => {
      unsub?.subscription?.unsubscribe();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  // === Refrescar sesión manual cada 5 minutos ===
  useEffect(() => {
    console.log("🕒 useEffect activo — iniciando cron cada 5 minutos");

    const refreshSession = async () => {
      console.log(
        "⏰ Ejecutando refreshSession:",
        new Date().toLocaleTimeString()
      );
      // eslint-disable-next-line no-unused-vars
      const { data, error } = await supabase.auth.refreshSession();
      if (error) console.warn("⚠️ Error al refrescar sesión:", error.message);
    };

    const interval = setInterval(refreshSession, 5 * 60 * 1000); // cada 1 minuto

    refreshSession();

    return () => {
      clearInterval(interval);
      console.log("🧹 useEffect desmontado — cron detenido");
    };
  }, []);

  // === Validar si el usuario ya existe en registerusers ===
  const checkIfUserExists = async (email) => {
    console.log("🔍 checkIfUserExists() EJECUTÁNDOSE con:", email);
    if (!email) {
      console.log("⛔ Email llegó vacío");
      return false;
    }

    try {
       console.log("📡 Lanzando query a registerusers...");
      const { data, error } = await supabase
        .from("registerusers")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      console.log("📊 Resultado query:", data);
      console.log("❌ Error query:", error);

      if (error) {
        console.error("❌ Error consultando registerusers:", error);
        return false;
      }

      // Si existe una fila, el usuario ya está registrado
      return !!data;
    } catch (err) {
      console.error("❌ Error en checkIfUserExists:", err);
      return false;
    }
  };



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
      console.log("🚪 Cerrando sesión...");
      setIsAdmin(false);
      setSession(null);
      setLoading(true);

      // 🧩 Verificar si hay sesión activa
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        console.warn("⚠️ No hay sesión activa, limpieza manual forzada.");
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("/");
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn(
          "⚠️ Supabase signOut falló o el token expiró:",
          error.message
        );
      }

      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/");
    } catch (err) {
      console.error("❌ Error general al cerrar sesión:", err);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/");
    } finally {
      setLoading(false);
    }
  };

  const getSession = async () => {
    return supabase.auth.getSession();
  };

  return {
    session,
    isAdmin,
    loading,
    signInWithGoogle,
    signOut,
    getSession,
    checkIfUserExists,
  };
};

export default AuthenticationSupabase;
