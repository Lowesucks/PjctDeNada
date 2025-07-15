/**
 * Utilidades para verificar la correcta aplicación de estilos móviles
 */

/**
 * Verifica que las variables CSS estén definidas
 */
export const verifyCSSVariables = () => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  const requiredVariables = [
    '--color-text',
    '--color-text-secondary', 
    '--color-background',
    '--color-surface',
    '--color-border',
    '--color-primary',
    '--color-primary-hover',
    '--color-switch-bg',
    '--color-shadow',
    '--color-label-text'
  ];
  
  const results = {};
  
  requiredVariables.forEach(variable => {
    const value = computedStyle.getPropertyValue(variable);
    results[variable] = {
      defined: value !== '',
      value: value || 'undefined'
    };
  });
  
  return results;
};

/**
 * Verifica que las clases móviles principales estén aplicadas
 */
export const verifyMobileClasses = () => {
  const results = {
    appContainer: false,
    mapContainer: false,
    header: false,
    navigation: false,
    searchWrapper: false,
    bottomSheet: false
  };
  
  // Verificar contenedor principal
  const appContainer = document.querySelector('.app-mobile-redesign');
  if (appContainer) {
    results.appContainer = true;
    
    // Verificar estilos del contenedor
    const computedStyle = getComputedStyle(appContainer);
    results.appContainerStyles = {
      height: computedStyle.height,
      width: computedStyle.width,
      position: computedStyle.position,
      overflow: computedStyle.overflow
    };
  }
  
  // Verificar contenedor del mapa
  const mapContainer = document.querySelector('.map-container-mobile');
  if (mapContainer) {
    results.mapContainer = true;
    
    const computedStyle = getComputedStyle(mapContainer);
    results.mapContainerStyles = {
      position: computedStyle.position,
      touchAction: computedStyle.touchAction,
      overscrollBehavior: computedStyle.overscrollBehavior
    };
  }
  
  // Verificar header
  const header = document.querySelector('.mobile-header-redesign');
  if (header) {
    results.header = true;
    
    const computedStyle = getComputedStyle(header);
    results.headerStyles = {
      position: computedStyle.position,
      zIndex: computedStyle.zIndex,
      backdropFilter: computedStyle.backdropFilter
    };
  }
  
  // Verificar navegación
  const navigation = document.querySelector('.mobile-nav');
  if (navigation) {
    results.navigation = true;
    
    const computedStyle = getComputedStyle(navigation);
    results.navigationStyles = {
      position: computedStyle.position,
      bottom: computedStyle.bottom,
      zIndex: computedStyle.zIndex,
      backdropFilter: computedStyle.backdropFilter
    };
  }
  
  // Verificar wrapper de búsqueda
  const searchWrapper = document.querySelector('.mobile-search-wrapper');
  if (searchWrapper) {
    results.searchWrapper = true;
  }
  
  // Verificar bottom sheet
  const bottomSheet = document.querySelector('.bottom-sheet-mobile');
  if (bottomSheet) {
    results.bottomSheet = true;
    
    const computedStyle = getComputedStyle(bottomSheet);
    results.bottomSheetStyles = {
      position: computedStyle.position,
      height: computedStyle.height,
      zIndex: computedStyle.zIndex
    };
  }
  
  return results;
};

/**
 * Verifica el control de scroll
 */
export const verifyScrollControl = () => {
  const results = {
    bodyScroll: false,
    htmlScroll: false,
    rootScroll: false,
    mapTouchAction: false,
    sheetScroll: false
  };
  
  // Verificar body
  const bodyStyle = getComputedStyle(document.body);
  results.bodyScroll = {
    overflow: bodyStyle.overflow,
    touchAction: bodyStyle.touchAction,
    height: bodyStyle.height,
    overscrollBehavior: bodyStyle.overscrollBehavior
  };
  
  // Verificar html
  const htmlStyle = getComputedStyle(document.documentElement);
  results.htmlScroll = {
    overflow: htmlStyle.overflow,
    touchAction: htmlStyle.touchAction,
    height: htmlStyle.height,
    overscrollBehavior: htmlStyle.overscrollBehavior
  };
  
  // Verificar root
  const root = document.getElementById('root');
  if (root) {
    const rootStyle = getComputedStyle(root);
    results.rootScroll = {
      overflow: rootStyle.overflow,
      touchAction: rootStyle.touchAction,
      height: rootStyle.height,
      overscrollBehavior: rootStyle.overscrollBehavior
    };
  }
  
  // Verificar mapa
  const mapContainer = document.querySelector('.map-container-mobile');
  if (mapContainer) {
    const mapStyle = getComputedStyle(mapContainer);
    results.mapTouchAction = {
      touchAction: mapStyle.touchAction,
      overscrollBehavior: mapStyle.overscrollBehavior
    };
  }
  
  // Verificar sheet content
  const sheetContent = document.querySelector('.sheet-content');
  if (sheetContent) {
    const sheetStyle = getComputedStyle(sheetContent);
    results.sheetScroll = {
      overflowY: sheetStyle.overflowY,
      touchAction: sheetStyle.touchAction,
      webkitOverflowScrolling: sheetStyle.webkitOverflowScrolling
    };
  }
  
  return results;
};

/**
 * Verifica botones táctiles
 */
export const verifyTouchButtons = () => {
  const results = {
    navButtons: [],
    otherButtons: []
  };
  
  // Verificar botones de navegación
  const navButtons = document.querySelectorAll('.mobile-nav button');
  navButtons.forEach((button, index) => {
    const computedStyle = getComputedStyle(button);
    results.navButtons.push({
      index,
      minWidth: computedStyle.minWidth,
      minHeight: computedStyle.minHeight,
      touchAction: computedStyle.touchAction,
      webkitTapHighlightColor: computedStyle.webkitTapHighlightColor
    });
  });
  
  // Verificar otros botones táctiles
  const otherButtons = document.querySelectorAll('.location-btn, .center-location-btn, .sheet-btn, .card-btn, .favorite-btn, .close-btn');
  otherButtons.forEach((button, index) => {
    const computedStyle = getComputedStyle(button);
    results.otherButtons.push({
      index,
      className: button.className,
      minWidth: computedStyle.minWidth,
      minHeight: computedStyle.minHeight,
      touchAction: computedStyle.touchAction,
      webkitTapHighlightColor: computedStyle.webkitTapHighlightColor
    });
  });
  
  return results;
};

/**
 * Verifica soporte de características modernas
 */
export const verifyModernFeatures = () => {
  const results = {
    dvh: false,
    safeArea: false,
    backdropFilter: false,
    overscrollBehavior: false
  };
  
  // Verificar soporte de dvh
  results.dvh = CSS.supports('height', '100dvh');
  
  // Verificar soporte de safe-area-inset
  results.safeArea = CSS.supports('padding-top', 'env(safe-area-inset-top)');
  
  // Verificar soporte de backdrop-filter
  results.backdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
  
  // Verificar soporte de overscroll-behavior
  results.overscrollBehavior = CSS.supports('overscroll-behavior', 'none');
  
  return results;
};

/**
 * Ejecuta todas las verificaciones
 */
export const runAllVerifications = () => {
  console.log('🔍 Iniciando verificación de estilos móviles...');
  
  const results = {
    cssVariables: verifyCSSVariables(),
    mobileClasses: verifyMobileClasses(),
    scrollControl: verifyScrollControl(),
    touchButtons: verifyTouchButtons(),
    modernFeatures: verifyModernFeatures()
  };
  
  console.log('📊 Resultados de verificación:', results);
  
  // Mostrar resumen
  const summary = {
    variablesDefined: Object.values(results.cssVariables).every(v => v.defined),
    classesApplied: Object.values(results.mobileClasses).some(v => v === true),
    scrollBlocked: results.scrollControl.bodyScroll.overflow === 'hidden',
    buttonsTouchable: results.touchButtons.navButtons.length > 0,
    modernSupported: Object.values(results.modernFeatures).some(v => v === true)
  };
  
  console.log('✅ Resumen de verificación:', summary);
  
  return { results, summary };
};

/**
 * Verificación rápida para desarrollo
 */
export const quickCheck = () => {
  const appContainer = document.querySelector('.app-mobile-redesign');
  const mobileNav = document.querySelector('.mobile-nav');
  const bodyOverflow = getComputedStyle(document.body).overflow;
  
  const status = {
    appContainer: !!appContainer,
    mobileNav: !!mobileNav,
    scrollBlocked: bodyOverflow === 'hidden',
    isMobile: window.innerWidth <= 768
  };
  
  console.log('🚀 Verificación rápida:', status);
  return status;
}; 