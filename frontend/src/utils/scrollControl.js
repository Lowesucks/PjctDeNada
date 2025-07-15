/**
 * Utilidades para controlar el scroll y prevenir scroll no deseado en móviles
 */

/**
 * Bloquear scroll en el body y html
 */
export const blockScroll = () => {
  // Detectar si es Safari en iOS
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isSafari && isIOS) {
    // Para Safari en iOS, usar configuración específica
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'relative';
    document.body.style.height = '100dvh';
    document.body.style.width = '100vw';
    document.body.style.touchAction = 'none';
    
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'relative';
    document.documentElement.style.height = '100dvh';
    document.documentElement.style.width = '100vw';
    document.documentElement.style.touchAction = 'none';
  } else {
    // Para otros navegadores, usar configuración estándar
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.bottom = '0';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    document.body.style.touchAction = 'none';
    
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.top = '0';
    document.documentElement.style.left = '0';
    document.documentElement.style.right = '0';
    document.documentElement.style.bottom = '0';
    document.documentElement.style.width = '100vw';
    document.documentElement.style.height = '100vh';
    document.documentElement.style.touchAction = 'none';
  }
  
  console.log('🔒 Scroll bloqueado');
};

/**
 * Permitir scroll en el body y html
 */
export const allowScroll = () => {
  // Restaurar scroll en body
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.bottom = '';
  document.body.style.width = '';
  document.body.style.height = '';
  document.body.style.touchAction = '';
  
  // Restaurar scroll en html
  document.documentElement.style.overflow = '';
  document.documentElement.style.position = '';
  document.documentElement.style.top = '';
  document.documentElement.style.left = '';
  document.documentElement.style.right = '';
  document.documentElement.style.bottom = '';
  document.documentElement.style.width = '';
  document.documentElement.style.height = '';
  document.documentElement.style.touchAction = '';
  
  console.log('🔓 Scroll permitido');
};

/**
 * Bloquear scroll solo en móviles
 */
export const blockScrollMobile = () => {
  if (window.innerWidth <= 768) {
    blockScroll();
  }
};

/**
 * Permitir scroll solo en elementos específicos
 */
export const allowScrollInElement = (element) => {
  if (!element) return;
  
  element.style.overflowY = 'auto';
  element.style.webkitOverflowScrolling = 'touch';
  element.style.touchAction = 'pan-y';
  
  console.log('📜 Scroll permitido en elemento específico');
};

/**
 * Bloquear scroll en elemento específico
 */
export const blockScrollInElement = (element) => {
  if (!element) return;
  
  element.style.overflow = 'hidden';
  element.style.touchAction = 'none';
  
  console.log('🔒 Scroll bloqueado en elemento específico');
};

/**
 * Prevenir scroll con gestos táctiles
 */
export const preventTouchScroll = (element) => {
  if (!element) return;
  
  element.addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, { passive: false });
  
  element.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });
  
  element.addEventListener('touchend', (e) => {
    e.preventDefault();
  }, { passive: false });
  
  console.log('👆 Gestos táctiles bloqueados en elemento');
};

/**
 * Permitir scroll solo en dirección vertical
 */
export const allowVerticalScrollOnly = (element) => {
  if (!element) return;
  
  element.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    
    element.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      // Solo permitir scroll vertical
      if (Math.abs(deltaY) > 10) {
        e.stopPropagation();
      }
    }, { passive: true });
  }, { once: true });
  
  console.log('📏 Scroll vertical permitido en elemento');
};

/**
 * Inicializar control de scroll
 */
export const initScrollControl = () => {
  // Aplicar configuración específica para Safari en iOS
  if (isSafariIOS()) {
    adjustViewportForSafari();
  }
  
  // Bloquear scroll en móviles al cargar
  if (window.innerWidth <= 768) {
    if (isSafariIOS()) {
      applySafariConfig();
    } else {
      blockScrollMobile();
    }
  }
  
  // Escuchar cambios de tamaño de ventana
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      if (isSafariIOS()) {
        applySafariConfig();
      } else {
        blockScrollMobile();
      }
    } else {
      allowScroll();
    }
  });
  
  // Prevenir scroll en el body y html (solo si no es Safari iOS)
  if (!isSafariIOS()) {
    document.body.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    document.documentElement.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }
  
  console.log('🎛️ Control de scroll inicializado');
};

/**
 * Configurar scroll para elementos específicos
 */
export const setupElementScroll = () => {
  // Permitir scroll en contenido de sheets
  const sheetContents = document.querySelectorAll('.sheet-content, .drawer-content, .results-list, .results-list-mobile');
  sheetContents.forEach(element => {
    allowScrollInElement(element);
  });
  
  // Bloquear scroll en overlays
  const overlays = document.querySelectorAll('.drawer-overlay, .modal-overlay, .bottom-sheet-mobile');
  overlays.forEach(element => {
    blockScrollInElement(element);
  });
  
  // Bloquear scroll en navegación
  const navs = document.querySelectorAll('.mobile-nav, .mobile-header-redesign');
  navs.forEach(element => {
    blockScrollInElement(element);
  });
  
  console.log('🎯 Scroll configurado para elementos específicos');
};

/**
 * Verificar estado del scroll
 */
export const checkScrollState = () => {
  const bodyOverflow = getComputedStyle(document.body).overflow;
  const htmlOverflow = getComputedStyle(document.documentElement).overflow;
  const bodyPosition = getComputedStyle(document.body).position;
  const htmlPosition = getComputedStyle(document.documentElement).position;
  
  console.log('🔍 Estado del Scroll:');
  console.log('Body overflow:', bodyOverflow);
  console.log('HTML overflow:', htmlOverflow);
  console.log('Body position:', bodyPosition);
  console.log('HTML position:', htmlPosition);
  
  return {
    bodyOverflow,
    htmlOverflow,
    bodyPosition,
    htmlPosition,
    isBlocked: bodyOverflow === 'hidden' && htmlOverflow === 'hidden'
  };
};

/**
 * Detectar si es Safari en iOS
 */
export const isSafariIOS = () => {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isSafari && isIOS;
};

/**
 * Ajustar viewport para Safari en iOS
 */
export const adjustViewportForSafari = () => {
  if (isSafariIOS()) {
    // Ajustar viewport para Safari
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1.0');
    }
    
    // Agregar estilos específicos para Safari
    const style = document.createElement('style');
    style.id = 'safari-scroll-fix';
    style.textContent = `
      @supports (-webkit-touch-callout: none) {
        body, html, #root {
          height: 100dvh !important;
          width: 100vw !important;
          overflow: hidden !important;
          position: relative !important;
          -webkit-overflow-scrolling: auto !important;
          overscroll-behavior: none !important;
        }
        
        .app-mobile-redesign {
          height: 100dvh !important;
          width: 100vw !important;
          overflow: hidden !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          -webkit-overflow-scrolling: auto !important;
          overscroll-behavior: none !important;
        }
        
        .mobile-nav {
          bottom: env(safe-area-inset-bottom, 0px) !important;
          padding-bottom: 16px !important;
          z-index: 1000 !important;
        }
        
        .bottom-sheet-mobile {
          padding-bottom: env(safe-area-inset-bottom) !important;
          z-index: 1000 !important;
        }
      }
    `;
    
    // Remover estilos anteriores si existen
    const existingStyle = document.getElementById('safari-scroll-fix');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
    
    console.log('🍎 Viewport ajustado para Safari iOS');
  }
};

/**
 * Aplicar configuración específica para Safari en iOS
 */
export const applySafariConfig = () => {
  if (isSafariIOS()) {
    // Configuración específica para Safari en iOS
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'relative';
    document.body.style.height = '100dvh';
    document.body.style.width = '100vw';
    document.body.style.touchAction = 'none';
    document.body.style.webkitOverflowScrolling = 'auto';
    
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'relative';
    document.documentElement.style.height = '100dvh';
    document.documentElement.style.width = '100vw';
    document.documentElement.style.touchAction = 'none';
    document.documentElement.style.webkitOverflowScrolling = 'auto';
    
    // Ajustar viewport para Safari
    adjustViewportForSafari();
    
    console.log('🍎 Configuración Safari iOS aplicada');
  }
};

/**
 * Aplicar configuraciones de scroll según el dispositivo
 */
export const applyScrollConfig = () => {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    if (isSafariIOS()) {
      // Configuración específica para Safari en iOS
      applySafariConfig();
    } else {
      // Configuración estándar para otros navegadores móviles
      blockScrollMobile();
    }
    setupElementScroll();
  } else {
    allowScroll();
  }
  
  console.log(`📱 Configuración de scroll aplicada para ${isMobile ? 'móvil' : 'desktop'} ${isSafariIOS() ? '(Safari iOS)' : ''}`);
}; 