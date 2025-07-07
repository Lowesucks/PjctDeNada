/**
 * Utilidades para probar y verificar configuraciones táctiles
 */

/**
 * Verifica si las configuraciones táctiles están aplicadas correctamente
 */
export const verifyTouchConfig = () => {
  const results = {
    touchDevice: false,
    mapContainer: false,
    touchAction: false,
    gestureHandling: false,
    buttons: false,
  };

  // Verificar si es dispositivo táctil
  results.touchDevice = 'ontouchstart' in window || 
                       navigator.maxTouchPoints > 0 || 
                       navigator.msMaxTouchPoints > 0;

  // Verificar contenedor del mapa
  const mapContainer = document.querySelector('.map-container-redesign, .map-container-mobile, .mapa-container');
  if (mapContainer) {
    results.mapContainer = true;
    
    // Verificar touch-action
    const computedStyle = window.getComputedStyle(mapContainer);
    results.touchAction = computedStyle.touchAction.includes('pan-x') && 
                         computedStyle.touchAction.includes('pan-y') &&
                         computedStyle.touchAction.includes('pinch-zoom');
  }

  // Verificar botones táctiles
  const touchButtons = document.querySelectorAll('.location-btn, .center-location-btn, .sheet-btn, .mobile-nav button');
  if (touchButtons.length > 0) {
    const firstButton = touchButtons[0];
    const buttonStyle = window.getComputedStyle(firstButton);
    results.buttons = parseInt(buttonStyle.minWidth) >= 44 || parseInt(buttonStyle.minHeight) >= 44;
  }

  return results;
};

/**
 * Muestra un reporte de las configuraciones táctiles en la consola
 */
export const logTouchConfigReport = () => {
  const results = verifyTouchConfig();
  
  console.log('🔍 Reporte de Configuraciones Táctiles:');
  console.log('=====================================');
  console.log(`📱 Dispositivo táctil: ${results.touchDevice ? '✅ Sí' : '❌ No'}`);
  console.log(`🗺️ Contenedor del mapa: ${results.mapContainer ? '✅ Encontrado' : '❌ No encontrado'}`);
  console.log(`👆 Touch-action configurado: ${results.touchAction ? '✅ Correcto' : '❌ Incorrecto'}`);
  console.log(`🔘 Botones táctiles: ${results.buttons ? '✅ Optimizados' : '❌ No optimizados'}`);
  
  if (results.touchDevice) {
    console.log('\n📋 Recomendaciones para dispositivos táctiles:');
    console.log('• Usa un dedo para navegar por el mapa');
    console.log('• Usa dos dedos para hacer zoom');
    console.log('• Los botones tienen área mínima de 44px para mejor precisión');
  }
  
  return results;
};

/**
 * Aplica configuraciones táctiles adicionales si es necesario
 */
export const applyAdditionalTouchConfig = () => {
  // Aplicar configuraciones adicionales a elementos específicos
  const elements = document.querySelectorAll('.map-container-redesign, .map-container-mobile, .mapa-container');
  
  elements.forEach(element => {
    // Asegurar que las configuraciones táctiles estén aplicadas
    element.style.touchAction = 'pan-x pan-y pinch-zoom';
    element.style.webkitTouchCallout = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.userSelect = 'none';
    element.style.webkitTapHighlightColor = 'transparent';
    element.style.webkitOverflowScrolling = 'touch';
  });

  // Aplicar configuraciones a botones
  const buttons = document.querySelectorAll('.location-btn, .center-location-btn, .sheet-btn, .mobile-nav button, .card-btn, .card-btn-secondary, .favorite-btn');
  
  buttons.forEach(button => {
    button.style.minWidth = '44px';
    button.style.minHeight = '44px';
    button.style.touchAction = 'manipulation';
    button.style.webkitTapHighlightColor = 'transparent';
  });

  console.log('✅ Configuraciones táctiles adicionales aplicadas');
};

/**
 * Inicializa las verificaciones táctiles
 */
export const initTouchVerification = () => {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        logTouchConfigReport();
        applyAdditionalTouchConfig();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      logTouchConfigReport();
      applyAdditionalTouchConfig();
    }, 1000);
  }
}; 