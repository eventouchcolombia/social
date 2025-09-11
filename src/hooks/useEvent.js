import { useParams } from 'react-router-dom';

export const useEvent = () => {
  const { eventSlug } = useParams();
  
  // Si no hay eventSlug en la URL, usar uno por defecto
  const currentEventSlug = eventSlug || 'boda-principal';
  
  // Generar las URLs de los assets basados en el evento
  const getAssetUrl = (assetName) => {
    return `/events/${currentEventSlug}/${assetName}`;
  };
  
  // Obtener el directorio de Firebase Storage para este evento
  const getStoragePath = (subPath = '') => {
    return `photos/${currentEventSlug}/${subPath}`;
  };
  
  return {
    eventSlug: currentEventSlug,
    getAssetUrl,
    getStoragePath
  };
};
