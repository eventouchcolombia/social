import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Guarda la sesión en localStorage
    autoRefreshToken: true, // Renueva automáticamente el token
    detectSessionInUrl: true, // Necesario si usas OAuth (Google, etc.)
    flowType: "pkce",
  },
});
