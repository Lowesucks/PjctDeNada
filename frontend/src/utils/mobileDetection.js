/**
 * Utilidades para detectar y optimizar dispositivos móviles
 */

/**
 * Detecta si el dispositivo es móvil
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

/**
 * Detecta si el dispositivo tiene notch
 */
export const hasNotch = () => {
  return 'CSS' in window && 'supports' in CSS && 
         CSS.supports('padding-top: env(safe-area-inset-top)') &&
         window.innerWidth <= 768;
};

/**
 * Detecta si el dispositivo tiene barra de navegación gestual
 */
export const hasGestureNavigation = () => {
  return 'CSS' in window && 'supports' in CSS && 
         CSS.supports('padding-bottom: env(safe-area-inset-bottom)') &&
         window.innerWidth <= 768;
};

/**
 * Obtiene las dimensiones del viewport
 */
export const getViewportDimensions = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
  };
};

/**
 * Obtiene información sobre las áreas seguras
 */
export const getSafeAreaInfo = () => {
  const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0px';
  const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0px';
  const safeAreaLeft = getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0px';
  const safeAreaRight = getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0px';
  
  return {
    top: safeAreaTop,
    bottom: safeAreaBottom,
    left: safeAreaLeft,
    right: safeAreaRight,
  };
};

/**
 * Detecta el tipo de dispositivo específico
 */
export const getDeviceType = () => {
  const userAgent = navigator.userAgent;
  const dimensions = getViewportDimensions();
  
  // iPhone
  if (/iPhone/i.test(userAgent)) {
    if (dimensions.width === 375 && dimensions.height === 667) return 'iPhone SE';
    if (dimensions.width === 414 && dimensions.height === 896) return 'iPhone XR/11';
    if (dimensions.width === 375 && dimensions.height === 812) return 'iPhone X/XS';
    if (dimensions.width === 414 && dimensions.height === 896) return 'iPhone XS Max/11 Pro Max';
    if (dimensions.width === 390 && dimensions.height === 844) return 'iPhone 12/13/14';
    if (dimensions.width === 428 && dimensions.height === 926) return 'iPhone 12/13/14 Pro Max';
    return 'iPhone';
  }
  
  // Android
  if (/Android/i.test(userAgent)) {
    if (dimensions.width <= 360) return 'Android Small';
    if (dimensions.width <= 480) return 'Android Medium';
    return 'Android Large';
  }
  
  // iPad
  if (/iPad/i.test(userAgent)) {
    return 'iPad';
  }
  
  return 'Unknown';
};

/**
 * Verifica si el dispositivo está en orientación landscape
 */
export const isLandscape = () => {
  return window.innerWidth > window.innerHeight;
};

/**
 * Obtiene información completa del dispositivo
 */
export const getDeviceInfo = () => {
  return {
    isMobile: isMobileDevice(),
    hasNotch: hasNotch(),
    hasGestureNavigation: hasGestureNavigation(),
    deviceType: getDeviceType(),
    isLandscape: isLandscape(),
    viewport: getViewportDimensions(),
    safeArea: getSafeAreaInfo(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
  };
};

/**
 * Muestra un reporte detallado del dispositivo en la consola
 */
export const logDeviceReport = () => {
  const deviceInfo = getDeviceInfo();
  
  console.log('📱 Reporte de Dispositivo Móvil:');
  console.log('================================');
  console.log(`📱 Tipo de dispositivo: ${deviceInfo.deviceType}`);
  console.log(`📐 Es móvil: ${deviceInfo.isMobile ? '✅ Sí' : '❌ No'}`);
  console.log(`📱 Tiene notch: ${deviceInfo.hasNotch ? '✅ Sí' : '❌ No'}`);
  console.log(`👆 Navegación gestual: ${deviceInfo.hasGestureNavigation ? '✅ Sí' : '❌ No'}`);
  console.log(`🔄 Orientación: ${deviceInfo.isLandscape ? 'Landscape' : 'Portrait'}`);
  console.log(`📏 Viewport: ${deviceInfo.viewport.width}x${deviceInfo.viewport.height}`);
  console.log(`🖥️ Pantalla: ${deviceInfo.viewport.screenWidth}x${deviceInfo.viewport.screenHeight}`);
  console.log(`🔍 Pixel ratio: ${deviceInfo.viewport.devicePixelRatio}`);
  console.log(`📐 Áreas seguras:`);
  console.log(`   - Superior: ${deviceInfo.safeArea.top}`);
  console.log(`   - Inferior: ${deviceInfo.safeArea.bottom}`);
  console.log(`   - Izquierda: ${deviceInfo.safeArea.left}`);
  console.log(`   - Derecha: ${deviceInfo.safeArea.right}`);
  
  if (deviceInfo.isMobile) {
    console.log('\n📋 Recomendaciones para este dispositivo:');
    console.log('• La aplicación está optimizada para pantalla completa');
    console.log('• Los controles están adaptados a las áreas seguras');
    console.log('• La navegación está optimizada para touch');
  }
  
  return deviceInfo;
};

/**
 * Aplica configuraciones específicas según el dispositivo
 */
export const applyDeviceSpecificConfig = () => {
  const deviceInfo = getDeviceInfo();
  
  if (deviceInfo.isMobile) {
    // Aplicar configuraciones específicas para móviles
    document.documentElement.style.setProperty('--device-type', deviceInfo.deviceType);
    document.documentElement.style.setProperty('--has-notch', deviceInfo.hasNotch ? '1' : '0');
    document.documentElement.style.setProperty('--has-gesture-nav', deviceInfo.hasGestureNavigation ? '1' : '0');
    
    // Configuraciones específicas por tipo de dispositivo
    if (deviceInfo.deviceType.includes('iPhone')) {
      document.documentElement.style.setProperty('--mobile-padding', 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)');
    } else if (deviceInfo.deviceType.includes('Android')) {
      document.documentElement.style.setProperty('--mobile-padding', '0px');
    }
    
    console.log('✅ Configuraciones específicas del dispositivo aplicadas');
  }
};

/**
 * Inicializa la detección de dispositivos
 */
export const initDeviceDetection = () => {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        logDeviceReport();
        applyDeviceSpecificConfig();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      logDeviceReport();
      applyDeviceSpecificConfig();
    }, 1000);
  }
  
  // Escuchar cambios de orientación
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      console.log('🔄 Orientación cambiada - Actualizando configuración...');
      applyDeviceSpecificConfig();
    }, 500);
  });
  
  // Escuchar cambios de tamaño de ventana
  window.addEventListener('resize', () => {
    setTimeout(() => {
      applyDeviceSpecificConfig();
    }, 100);
  });
}; 