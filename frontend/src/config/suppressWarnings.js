// Configuración para suprimir advertencias específicas de desarrollo
// Esto es temporal hasta que las librerías se actualicen

// Suprimir advertencias específicas en la consola
const originalWarn = console.warn;
const originalError = console.error;

console.warn = function(...args) {
  const message = args.join(' ');
  
  // Suprimir advertencias específicas de Google Maps
  if (message.includes('google.maps.Marker is deprecated') || 
      message.includes('AdvancedMarkerElement') ||
      message.includes('Marker is deprecated') ||
      message.includes('google.maps.Marker')) {
    return; // No mostrar esta advertencia
  }
  
  // Suprimir advertencias de React sobre StrictMode (si las hay)
  if (message.includes('StrictMode') || 
      message.includes('findDOMNode') ||
      message.includes('componentWillReceiveProps')) {
    return;
  }
  
  // Mostrar todas las demás advertencias normalmente
  originalWarn.apply(console, args);
};

console.error = function(...args) {
  const message = args.join(' ');
  
  // Suprimir errores específicos que no son críticos
  if (message.includes('google.maps.Marker is deprecated') ||
      message.includes('AdvancedMarkerElement')) {
    return;
  }
  
  // Mostrar todos los demás errores normalmente
  originalError.apply(console, args);
};

// Configuración para el entorno de desarrollo
const config = {
  suppressWarnings: true,
  suppressDeprecationWarnings: true
};

export default config; 