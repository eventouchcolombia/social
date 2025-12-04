import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export const useEventStatus = (eventSlug) => {
  const [isActive, setIsActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkEventStatus = async () => {
      if (!eventSlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("admins")
          .select("is_active")
          .eq("event_slug", eventSlug)
          .single();

        if (error) throw error;

        setIsActive(data?.is_active ?? false);
        setError(null);
      } catch (err) {
        console.error("❌ Error verificando estado del evento:", err);
        setError(err.message);
        setIsActive(false);
      } finally {
        setLoading(false);
      }
    };

    checkEventStatus();
  }, [eventSlug]);

  return { isActive, loading, error };
};
