import { createContext, useContext, useState, useEffect } from 'react';

const TotemContext = createContext();

export const useTotem = () => {
  const context = useContext(TotemContext);
  if (!context) {
    throw new Error('useTotem must be used within a TotemProvider');
  }
  return context;
};

export const TotemProvider = ({ children }) => {
  const [isTotemMode, setIsTotemMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar estado desde localStorage al inicializar
  useEffect(() => {
    const savedTotemMode = localStorage.getItem('totemMode');
    if (savedTotemMode === 'true') {
      setIsTotemMode(true);
    }
    setIsInitialized(true);
  }, []);

  // Escuchar cambios en el storage para sincronizar entre pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'totemMode') {
        setIsTotemMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const enableTotemMode = () => {
    setIsTotemMode(true);
    localStorage.setItem('totemMode', 'true');
  };

  const disableTotemMode = () => {
    setIsTotemMode(false);
    localStorage.removeItem('totemMode');
  };

  // No renderizar hasta que el estado esté inicializado
  if (!isInitialized) {
    return null;
  }

  return (
    <TotemContext.Provider value={{
      isTotemMode,
      enableTotemMode,
      disableTotemMode
    }}>
      {children}
    </TotemContext.Provider>
  );
};
