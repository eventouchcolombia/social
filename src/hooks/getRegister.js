import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function useGetRegister(userId = null) {
  const [data, setData] = useState(null);
  const [loadingRegister, setloadingRegister] = useState(true);
  const [error, setError] = useState(null);

  const fetchRegister = async () => {
    setloadingRegister(true);
    setError(null);

    try {
      let query = supabase.from("registerusers").select("*");

      // Si envías userId, trae solo ese registro
      if (userId) {
        query = query.eq("user_id", userId).single();
      }

      const { data: result, error: err } = await query;

      if (err) throw err;

      setData(result);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setloadingRegister(false);
    }
  };

  useEffect(() => {
    fetchRegister();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { data, loadingRegister, error, refetch: fetchRegister };
}
