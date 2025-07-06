// Configuración para suprimir advertencias de deprecación de Google Maps
// Esto es temporal hasta que @react-google-maps/api soporte AdvancedMarkerElement

// Suprimir advertencias de deprecación en la consola
const originalWarn = console.warn;
console.warn = function(...args) {
  const message = args.join(' ');
  
  // Suprimir advertencias específicas de Google Maps Marker deprecation
  if (message.includes('google.maps.Marker is deprecated') || 
      message.includes('AdvancedMarkerElement')) {
    return; // No mostrar esta advertencia
  }
  
  // Mostrar todas las demás advertencias normalmente
  originalWarn.apply(console, args);
};

export default {}; 