import { ref, getDownloadURL } from "firebase/storage"; // Asegúrate de importar `ref`
import { storage } from "../firebase/firebase"; // Importar la configuración de Firebase

/**
 * Utilidades para gestión de assets de eventos
 */

/**
 * Genera las instrucciones para configurar un evento nuevo
 * @param {string} eventSlug - El slug del evento
 * @returns {object} Instrucciones y rutas necesarias
 */
export const getEventAssetInstructions = (eventSlug) => {
  return {
    eventSlug,
    requiredAssets: [
      {
        name: "background.png",
        description: "Fondo principal para las pantallas del evento"
      },
      {
        name: "marco.png", 
        description: "Marco personalizado que se superpone sobre las fotos"
      },
      {
        name: "bgchosee.png",
        description: "Fondo para la pantalla de selección (opcional)"
      },
      {
        name: "bggallery.png", 
        description: "Fondo para la pantalla de galería (opcional)"
      },
      {
        name: "adminbg.png",
        description: "Fondo para la pantalla de administración (opcional)"
      }
    ],
    instructions: [
      `1. Ir al panel admin: /${eventSlug}/admin`,
      `2. Hacer login con el email: [EMAIL_DEL_ADMIN]`,
      `3. Hacer clic en "Configurar Assets"`,
      `4. Subir los assets necesarios usando el AssetWizard`,
      `5. El evento estará listo en: /${eventSlug}`
    ],
    adminUrl: `/${eventSlug}/admin`,
    eventUrl: `/${eventSlug}`
  };
};

/**
 * Valida que un slug de evento sea válido
 * @param {string} slug - El slug a validar
 * @returns {object} Resultado de la validación
 */
export const validateEventSlug = (slug) => {
  const errors = [];
  
  if (!slug) {
    errors.push("El slug es requerido");
  }
  
  if (slug && slug.length < 3) {
    errors.push("El slug debe tener al menos 3 caracteres");
  }
  
  if (slug && slug.length > 50) {
    errors.push("El slug no puede tener más de 50 caracteres");
  }
  
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    errors.push("El slug solo puede contener letras minúsculas, números y guiones");
  }
  
  if (slug && slug.startsWith('-') || slug.endsWith('-')) {
    errors.push("El slug no puede empezar o terminar con guión");
  }
  
  if (slug && slug.includes('--')) {
    errors.push("El slug no puede contener guiones consecutivos");
  }

  // Slugs reservados
  const reservedSlugs = ['admin', 'api', 'superadmin', 'www', 'assets', 'static'];
  if (slug && reservedSlugs.includes(slug)) {
    errors.push("Este slug está reservado y no puede ser usado");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Genera la URL del panel admin para configurar assets
 * @param {string} eventSlug - El slug del evento
 * @returns {string} URL del panel admin
 */
export const getAdminConfigUrl = (eventSlug) => {
  return `/${eventSlug}/admin`;
};

/**
 * Lista de eventos de ejemplo que ya tienen assets configurados
 */
export const getExampleEvents = () => {
  return {
    examples: [
      {
        slug: "boda",
        description: "Evento de boda con assets completos"
      },
      {
        slug: "happybirth",
        description: "Evento de cumpleaños con assets personalizados"
      },
      {
        slug: "cocacola",
        description: "Evento corporativo Coca-Cola"
      }
    ]
  };
};

/**
 * Verifica si un evento tiene los assets necesarios en Firebase Storage
 * @param {string} eventSlug - El slug del evento  
 * @param {function} getAssetUrl - Función del hook useEvent para obtener URLs
 * @returns {Promise<object>} Estado de los assets
 */
export const checkEventAssets = async (eventSlug, getAssetUrl) => {
  const requiredAssets = ['background.png', 'marco.png'];
  const optionalAssets = ['bgchosee.png', 'bggallery.png', 'adminbg.png'];
  const status = {};
  
  // Verificar assets requeridos
  for (const asset of requiredAssets) {
    try {
      const url = await getAssetUrl(asset);
      status[asset] = !!url;
    } catch {
      status[asset] = false;
    }
  }
  
  // Verificar assets opcionales
  for (const asset of optionalAssets) {
    try {
      const url = await getAssetUrl(asset);
      status[asset] = !!url;
    } catch {
      status[asset] = false;
    }
  }
  
  const requiredExist = requiredAssets.every(asset => status[asset]);
  
  return {
    eventSlug,
    assets: status,
    hasRequiredAssets: requiredExist,
    missingRequired: requiredAssets.filter(asset => !status[asset]),
    missingOptional: optionalAssets.filter(asset => !status[asset]),
    isFullyConfigured: requiredExist
  };
};

/**
 * Descarga un archivo desde Firebase Storage
 * @param {string} path - La ruta del archivo en Firebase Storage
 * @returns {Promise<string>} URL del archivo descargado
 */
export const downloadFileFromFirebase = async (path) => {
  try {
    const fileRef = ref(storage, path); // Usar `ref` correctamente
    const url = await getDownloadURL(fileRef);
    console.log(`✅ Archivo descargado: ${url}`);
    return url;
  } catch (error) {
    console.error(`❌ Error descargando archivo desde Firebase: ${path}`, error);
    throw error;
  }
};