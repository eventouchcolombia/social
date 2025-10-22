
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const RedirectEventLocal = () => {
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("eventSlug") || "mi-slug";
    setSlug(s);
  }, []);

  if (!slug) return null;
  return <Navigate to={`/${slug}`} replace />;
};

export default RedirectEventLocal;