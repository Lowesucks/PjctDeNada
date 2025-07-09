/**
 * Configuraciones optimizadas para navegación táctil en Google Maps
 * Mejora la experiencia de uso con un solo dedo en dispositivos móviles
 */

export const mapTouchOptions = {
  // Configuración principal para gestos táctiles
  gestureHandling: 'greedy', // Permite navegación con un dedo
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  scrollwheel: false, // Desactiva zoom con rueda del mouse
  
  // Configuraciones de arrastre optimizadas
  draggable: true,
  draggableCursor: 'grab',
  draggingCursor: 'grabbing',
  
  // Optimizaciones para móviles
  // clickableIcons: true, // This line is removed as per the edit hint
  keyboardShortcuts: false, // Desactiva atajos de teclado en móviles
  
  // Configuraciones de zoom
  minZoom: 10,
  maxZoom: 18,
  
  // Configuraciones de renderizado para mejor rendimiento
  tilt: 0, // Sin inclinación 3D para mejor rendimiento
  heading: 0, // Sin rotación
  
  // Configuraciones específicas para touch
  // disableDefaultUI: false, // This line is removed as per the edit hint
  zoomControlOptions: {
    position: window.google?.maps?.ControlPosition?.RIGHT_CENTER || 3,
    style: window.google?.maps?.ZoomControlStyle?.SMALL || 2
  },
  
  // Configuraciones de controles
  // fullscreenControl: false, // This line is removed as per the edit hint
  // streetViewControl: false, // This line is removed as per the edit hint
  // mapTypeControl: false, // This line is removed as per the edit hint
  
  // Configuraciones de estilo para mejor visibilidad en móviles
  backgroundColor: '#f8fafc',
  
  // Configuraciones específicas para dispositivos táctiles
  isFractionalZoomEnabled: true, // Permite zoom suave
};

export const markerTouchOptions = {
  // Configuraciones para marcadores optimizados para touch
  clickable: true,
  draggable: false,
  optimized: true, // Optimiza el rendimiento de los marcadores
  
  // Configuraciones de cursor
  cursor: 'pointer',
  
  // Configuraciones de z-index para mejor interacción
  zIndex: 1,
};

/**
 * Configuraciones CSS para mejorar la experiencia táctil
 */
export const touchCSSConfig = {
  // Configuraciones para contenedores del mapa
  mapContainer: {
    touchAction: 'pan-x pan-y pinch-zoom',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    WebkitOverflowScrolling: 'touch',
  },
  
  // Configuraciones para botones táctiles
  touchButton: {
    minWidth: '44px',
    minHeight: '44px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  },
  
  // Configuraciones para pantallas pequeñas
  smallScreen: {
    minWidth: '48px',
    minHeight: '48px',
  },
  
  // Configuraciones para pantallas muy pequeñas
  verySmallScreen: {
    minWidth: '52px',
    minHeight: '52px',
  },
};

/**
 * Función para aplicar configuraciones táctiles dinámicamente
 */
export const applyTouchConfig = (mapElement) => {
  if (!mapElement) return;
  
  // Aplicar configuraciones CSS
  Object.assign(mapElement.style, touchCSSConfig.mapContainer);
  
  // Aplicar configuraciones específicas para móviles
  if (window.innerWidth <= 768) {
    mapElement.style.setProperty('--touch-min-size', touchCSSConfig.smallScreen.minWidth);
  } else if (window.innerWidth <= 480) {
    mapElement.style.setProperty('--touch-min-size', touchCSSConfig.verySmallScreen.minWidth);
  }
};

/**
 * Función para detectar si el dispositivo es táctil
 */
export const isTouchDevice = () => {
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         navigator.msMaxTouchPoints > 0;
};

/**
 * Función para obtener configuraciones optimizadas según el dispositivo
 */
export const getOptimizedConfig = () => {
  const isTouch = isTouchDevice();
  const isMobile = window.innerWidth <= 768;
  
  return {
    ...mapTouchOptions,
    gestureHandling: isTouch ? 'greedy' : 'cooperative',
    zoomControl: !isMobile, // Desactivar controles de zoom en móviles
    zoomControlOptions: {
      position: window.google?.maps?.ControlPosition?.RIGHT_CENTER || 3,
      style: window.google?.maps?.ZoomControlStyle?.LARGE || 1
    },
    // Configuraciones adicionales para dispositivos táctiles
    ...(isMobile && {
      zoomControl: false, // Sin controles de zoom en móviles
      gestureHandling: 'greedy', // Gestos táctiles optimizados
      scrollwheel: false, // Sin zoom con rueda del mouse
      keyboardShortcuts: false, // Sin atajos de teclado
    })
  };
}; 