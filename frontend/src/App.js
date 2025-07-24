import React, { useState, useEffect, useMemo, useRef, useCallback, useContext } from 'react';
import './styles/desktop.css';
import './styles/mobile.css';
import MapaBarberias from './components/MapaBarberias';
import BarberiaCard from './components/BarberiaCard';
import BarberiaModal from './components/BarberiaModal';
import CalificarModal from './components/CalificarModal';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import UserProfile from './components/UserProfile';
import { ThemeContext } from './context/ThemeContext';
import api from './utils/api';
import { mapStyles } from './config/mapStyles';
import { obtenerFavoritos, toggleFavorito, verificarFavorito } from './utils/api';
import { initTouchVerification } from './utils/touchTest';
import { initDeviceDetection } from './utils/mobileDetection';
import { initScrollControl, applyScrollConfig } from './utils/scrollControl';
import { quickCheck } from './utils/styleVerification';
import axios from 'axios';

// El interceptor ya está configurado en utils/api.js

const ICON_CONFIG = {
  url: '/icono_ubicaciones.png',
  scaledSize: { width: 80, height: 110 }, 
  anchor: { x: 70, y: 70 },
};

function App() {
  const [barberias, setBarberias] = useState([]);
  const [barberiaSeleccionada, setBarberiaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarCalificar, setMostrarCalificar] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const [userLocation, setUserLocation] = useState(null);
  const [barberiaParaCentrar, setBarberiaParaCentrar] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(12);
  const [favorites, setFavorites] = useState(new Set());
  const [currentView, setCurrentView] = useState('cercanos'); // 'cercanos', 'favoritos', 'configuracion'
  const [mobileListVisible, setMobileListVisible] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [barberiaSeleccionadaParaSheet, setBarberiaSeleccionadaParaSheet] = useState(null);
  const [sortOrder, setSortOrder] = useState('distancia'); // 'distancia', 'calificacion', 'reseñas'
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  
  // Estados de autenticación
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // Estados para el contador y mostrar todas
  const [mostrandoTodas, setMostrandoTodas] = useState(false);
  const [totalEncontradas, setTotalEncontradas] = useState(0);
  
  // Estados para el arrastre de la pestaña móvil
  const [sheetPosition, setSheetPosition] = useState(75); // Porcentaje de altura (75% = 75% de la pantalla)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartPosition, setDragStartPosition] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [lastTouchY, setLastTouchY] = useState(0);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  
  // Ref para el debounce de búsqueda
  const searchTimeoutRef = useRef(null);

  const sortLabels = {
    distancia: 'Cercanía',
    calificacion: 'Calificación',
    reseñas: 'Reseñas',
  };
  
  const getSortLabel = (sortOrder) => {
    return sortLabels[sortOrder];
  };
  
  const viewLabels = {
    cercanos: '📍 Cercanos',
    favoritos: '❤ Favoritos',
    configuracion: '⚙ Configuración'
  };

  useEffect(() => {
    // Al montar el componente, solo solicitamos la ubicación una vez.
    handleSolicitarUbicacion();
    checkScreenSize();
    
    // Inicializar verificaciones táctiles
    initTouchVerification();
    
    // Inicializar detección de dispositivos móviles
    initDeviceDetection();
    
    // Inicializar control de scroll para prevenir scroll no deseado
    initScrollControl();
    applyScrollConfig();

    // Verificar estilos móviles
    setTimeout(() => quickCheck(), 1000);

    // Verificar si hay un usuario autenticado
    checkAuthStatus();

    const handleResize = () => {
      checkScreenSize();
      applyScrollConfig(); // Reaplicar configuración de scroll al cambiar tamaño
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Limpiar timeout al desmontar
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Limpiar requestAnimationFrame pendiente
      if (throttledTouchMove.current) {
        cancelAnimationFrame(throttledTouchMove.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // El array vacío asegura que esto se ejecute solo una vez.

  useEffect(() => {
    // Aplicar configuración de scroll según el dispositivo
    applyScrollConfig();
    
    // Función de limpieza para restaurar el scroll si el componente se desmonta.
    return () => {
      // Restaurar scroll al desmontar
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [isMobile]);

  useEffect(() => {
    // Este efecto se dispara SOLO cuando tenemos la ubicación del usuario.
    if (userLocation) {
      setCargando(true);
      cargarBarberias(userLocation).finally(() => setCargando(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]); // Se ejecuta solo cuando userLocation cambia.
  
  // Efecto para manejar cambios de vista
  useEffect(() => {
    // Si no hay búsqueda activa, cargar datos según la vista
    if (!busqueda.trim()) {
      cargarDatosSegunVista();
    }
    // Resetear estado de "mostrar todas" cuando cambia la vista
    setMostrandoTodas(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, busqueda]);

  // Efecto para resetear la posición del sheet cuando se cierra
  useEffect(() => {
    if (!mobileListVisible) {
      setSheetPosition(75); // Resetear a posición por defecto
      setIsClosing(false); // Resetear estado de cierre
      // Resetear valores de seguimiento
      setDragStartTime(0);
      setLastTouchY(0);
      setLastTouchTime(0);
    }
  }, [mobileListVisible]);

  // Ref para el elemento del sheet
  const sheetRef = useRef(null);

  const checkScreenSize = () => {
    // Simplificar la detección para que coincida con CSS
    const width = window.innerWidth;
    
    // Usar el mismo breakpoint que en CSS: 900px
    const isMobileDevice = width <= 900;
    
    console.log('Screen detection:', { width, isMobileDevice });
    setIsMobile(isMobileDevice);
  };

  const cargarBarberias = async (location, mostrarTodas = false) => {
    // Si no hay ubicación, no hacemos nada.
    if (!location) return;
    try {
      // Construir URL con parámetros
      let url = `/api/barberias/cercanas?lat=${location.lat}&lng=${location.lng}&radio=5000`;
      if (mostrarTodas) {
        url += '&todas=true';
      }
      
      const response = await api.get(url);
      setBarberias(response.data);
      
      // Si estamos mostrando todas, actualizar el contador
      if (mostrarTodas) {
        setTotalEncontradas(response.data.length);
        setMostrandoTodas(true);
      } else {
        // Si no estamos mostrando todas, asumir que hay más (Google Places puede devolver hasta 20)
        setTotalEncontradas(response.data.length);
        setMostrandoTodas(false);
      }
    } catch (error) {
      console.error('Error al cargar barberías del backend:', error);
      setBarberias([]); // En caso de error, vaciamos la lista para evitar datos viejos.
    }
  };

  const buscarBarberias = async (query) => {
    try {
      setCargando(true);
      if (query.trim()) {
        // Incluir coordenadas del usuario en la búsqueda si están disponibles
        let url = `/api/barberias/buscar?q=${encodeURIComponent(query)}`;
        if (userLocation && userLocation.lat && userLocation.lng) {
          url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }
        const response = await api.get(url);
        setBarberias(response.data);
      } else {
        // Si la búsqueda se vacía, cargar según el filtro actual
        if (currentView === 'favoritos') {
          // Mantener la vista de favoritos
          return;
        } else if (currentView === 'cercanos') {
          // Cargar barberías cercanas
          await cargarBarberias(userLocation);
        }
      }
    } catch (error) {
      console.error('Error al buscar barberías:', error);
      // En caso de error, mantener las barberías actuales o cargar cercanas
      if (!query.trim() && currentView !== 'favoritos') {
        await cargarBarberias(userLocation);
      }
    } finally {
      setCargando(false);
    }
  };

  const handleBusqueda = (e) => {
    const query = e.target.value;
    setBusqueda(query);
    
    // Cancelar búsqueda anterior si existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Si la búsqueda está vacía, cargar según el filtro actual
    if (!query.trim()) {
      if (currentView === 'favoritos') {
        // Si estamos en favoritos, mantener esa vista
        return;
      } else if (currentView === 'cercanos') {
        // Si estamos en cercanos, cargar barberías cercanas
        cargarBarberias(userLocation);
      }
      return;
    }
    
    // Esperar 500ms antes de ejecutar la búsqueda (debounce)
    searchTimeoutRef.current = setTimeout(() => {
      buscarBarberias(query);
    }, 500);
  };

  const handleVerBarberia = async (barberia) => {
    try {
      // Validar que barberia existe y tiene las propiedades necesarias
      if (!barberia) {
        console.error('Barbería no definida');
        return;
      }

      let barberiaConDireccion = { ...barberia };

      // Si la dirección no está disponible y tenemos coordenadas, la buscamos.
      if ((!barberia.direccion || barberia.direccion === 'Dirección no disponible') && barberia.lat && barberia.lng) {
        try {
          const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
          const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${barberia.lat},${barberia.lng}&key=${apiKey}`);
          if (response.data.results && response.data.results[0]) {
            barberiaConDireccion.direccion = response.data.results[0].formatted_address;
          }
        } catch (geoError) {
          console.error('Error en Geocoding API:', geoError);
          // Si falla, no hacemos nada y dejamos la dirección que ya tenía.
        }
      }

      // Mostrar detalles para todas las barberías
      setBarberiaSeleccionada(barberiaConDireccion);
      setMostrarModal(true);
      
      // En móvil, también mostrar la tarjeta de detalle inferior
      if (isMobile) {
        setBarberiaSeleccionadaParaSheet(barberiaConDireccion);
      }
      
    } catch (error) {
      console.error('Error al cargar detalles de la barbería:', error);
      
      // Asegurar que tenemos un objeto válido antes de establecer el estado
      const barberiaSegura = barberia || {
        id: 'unknown',
        nombre: 'Barbería desconocida',
        direccion: 'Dirección no disponible',
        calificacion_promedio: 0,
        total_calificaciones: 0
      };
      
      setBarberiaSeleccionada(barberiaSegura);
      setMostrarModal(true);
      
      // En móvil, también mostrar la tarjeta de detalle inferior
      if (isMobile) {
        setBarberiaSeleccionadaParaSheet(barberiaSegura);
      }
    }
  };

  const handleCalificar = () => {
    setMostrarCalificar(true);
    setMostrarModal(false);
  };

  const handleCalificacionEnviada = async () => {
    setMostrarCalificar(false);
    if (barberiaSeleccionada) {
      await handleVerBarberia({ id: barberiaSeleccionada.id });
    }
    await cargarBarberias(userLocation);
  };

  const handleBarberiaSelectFromMap = (barberia) => {
    // Llamamos a la función principal que ya tiene la lógica de geocoding
    handleVerBarberia(barberia);
  };

  // Función para centrar el mapa en la barbería seleccionada
  const handleVerEnMapa = (barberia) => {
    if (!barberia || typeof barberia.lat === 'undefined' || typeof barberia.lng === 'undefined') {
      console.warn("Barbería sin lat/lng:", barberia);
      return;
    }
    setBarberiaParaCentrar(barberia);
    setMapCenter({ lat: barberia.lat, lng: barberia.lng });
    setMapZoom(17); // Zoom más cercano al seleccionar una barbería
    setMobileListVisible(false); // Ocultar lista al seleccionar en mapa
    setMostrarModal(false); // Cerrar modal si está abierto
  };

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setMapZoom(15);
    }
  };

  const handleMobileNavClick = (view) => {
    setCurrentView(view);
    setMobileListVisible(true);
    
    // Cargar datos según la vista seleccionada si no hay búsqueda activa
    if (!busqueda.trim() && view === 'cercanos') {
      cargarBarberias(userLocation);
    }
  };

  const handleToggleFavorite = async (barberiaId) => {
    console.log('Toggle favorite clicked for barberia:', barberiaId);
    
    // Verificar si el usuario está autenticado
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    try {
      const esFavorito = favorites.has(barberiaId);
      const nuevoEstado = await toggleFavorito(barberiaId, esFavorito);
      
      setFavorites(prevFavorites => {
        const newFavorites = new Set(prevFavorites);
        if (nuevoEstado) {
          newFavorites.add(barberiaId);
          console.log('Added to favorites:', barberiaId);
        } else {
          newFavorites.delete(barberiaId);
          console.log('Removed from favorites:', barberiaId);
        }
        console.log('Current favorites:', Array.from(newFavorites));
        return newFavorites;
      });
      
      // Si estamos en la vista de favoritos y no hay búsqueda, actualizar la vista
      if (currentView === 'favoritos' && !busqueda.trim()) {
        // La vista se actualizará automáticamente por el useMemo
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Mostrar mensaje de error al usuario
      alert('Error al actualizar favoritos. Por favor, intenta de nuevo.');
    }
  };

  const handleSolicitarUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          setMapCenter(loc); // Centrar mapa en el usuario
          setMapZoom(15); // Acercar el mapa
        },
        (error) => {
          console.error("Error al obtener la ubicación:", error);
          setCargando(false);
          setUserLocation(null);
        }
      );
    } else {
      console.log("Geolocalización no es soportada por este navegador.");
      setCargando(false);
    }
  };

  // Función para calcular distancia entre dos puntos (fórmula de Haversine)
  const calcularDistancia = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Adaptar barberías para que tengan lat y lng y calcular distancias si no las tienen
  const barberiasAdaptadas = barberias.map(b => {
    const barberia = {
      ...b,
      lat: b.lat || b.latitud,
      lng: b.lng || b.longitud,
    };
    
    // Si no tiene distancia calculada y tenemos ubicación del usuario, calcularla
    if (userLocation && barberia.lat && barberia.lng && typeof barberia.distancia === 'undefined') {
      barberia.distancia = calcularDistancia(
        userLocation.lat, 
        userLocation.lng, 
        barberia.lat, 
        barberia.lng
      );
    }
    
    return barberia;
  });

  // Filtrar solo barberías de Google con lat y lng válidos para mostrar en el mapa y la lista
  const barberiasGoogle = barberiasAdaptadas
    .filter(b => b.fuente === 'google' && typeof b.lat === 'number' && typeof b.lng === 'number' && !isNaN(b.lat) && !isNaN(b.lng));

  // Filtrar y ordenar barberías según la vista actual y criterios de ordenamiento
  const barberiasFiltradas = useMemo(() => {
    let barberiasFiltradas = barberiasGoogle;
    
    // Filtrar por vista
    if (currentView === 'favoritos') {
      barberiasFiltradas = barberiasFiltradas.filter(b => favorites.has(b.id));
    }
    
    // Ordenar según el criterio seleccionado
    barberiasFiltradas = [...barberiasFiltradas].sort((a, b) => {
      switch (sortOrder) {
        case 'distancia':
          // Ordenar por distancia (más cercanas primero)
          const distanciaA = a.distancia || 0;
          const distanciaB = b.distancia || 0;
          return distanciaA - distanciaB;
          
        case 'calificacion':
          // Ordenar por calificación (más alta primero)
          const calificacionA = a.calificacion_promedio || 0;
          const calificacionB = b.calificacion_promedio || 0;
          return calificacionB - calificacionA; // Orden descendente
          
        case 'reseñas':
          // Ordenar por número de reseñas (más reseñas primero)
          const reseñasA = a.total_calificaciones || 0;
          const reseñasB = b.total_calificaciones || 0;
          return reseñasB - reseñasA; // Orden descendente
          
        default:
          return 0;
      }
    });
    
    return barberiasFiltradas;
  }, [barberiasGoogle, currentView, favorites, sortOrder]);
  
  // Función para cargar datos según la vista actual
  const cargarDatosSegunVista = () => {
    if (currentView === 'favoritos') {
      // Para favoritos, no necesitamos cargar nada nuevo
      return;
    } else if (currentView === 'cercanos' && !busqueda.trim()) {
      // Para cercanos sin búsqueda, cargar barberías cercanas
      cargarBarberias(userLocation, mostrandoTodas);
    }
  };

  // Función para manejar el botón "Mostrar todas"
  const handleMostrarTodas = async () => {
    if (userLocation) {
      setCargando(true);
      await cargarBarberias(userLocation, true);
      setCargando(false);
    }
  };

  // Función para manejar el botón "Mostrar menos" (volver a las 20 más cercanas)
  const handleMostrarMenos = async () => {
    if (userLocation) {
      setCargando(true);
      await cargarBarberias(userLocation, false);
      setCargando(false);
    }
  };

  // Funciones para el arrastre de la pestaña móvil
  const handleSheetTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStartY(touch.clientY);
    setDragStartPosition(sheetPosition);
    setDragStartTime(Date.now()); // Registrar el tiempo de inicio del arrastre
    setLastTouchY(touch.clientY); // Registrar la posición inicial del último toque
    setLastTouchTime(Date.now()); // Registrar el tiempo del último toque
    // Prevenir scroll y selección de texto
    e.preventDefault();
    e.stopPropagation();
  }, [sheetPosition]);

  // Función para detectar gestos de "flick" (gestos muy rápidos)
  const isFlickGesture = useCallback((velocity, distance, direction) => {
    // Un flick es un gesto muy rápido con distancia mínima
    const isFast = velocity > 0.8; // Muy rápido
    const hasMinDistance = Math.abs(distance) > 80; // Distancia mínima
    const isDownward = direction === 'down';
    
    return isFast && hasMinDistance && isDownward;
  }, []);

  const handleSheetTouchEnd = useCallback((e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Cancelar requestAnimationFrame pendiente
    if (throttledTouchMove.current) {
      cancelAnimationFrame(throttledTouchMove.current);
      throttledTouchMove.current = null;
    }
    
    // Prevenir eventos adicionales
    e.preventDefault();
    e.stopPropagation();
    
    const currentTime = Date.now();
    const totalDragTime = currentTime - dragStartTime;
    const totalDistance = dragStartY - lastTouchY;
    const velocity = Math.abs(totalDistance) / totalDragTime; // píxeles por milisegundo
    
    // Calcular la dirección del gesto (positivo = hacia arriba, negativo = hacia abajo)
    const isSwipingDown = totalDistance < 0;
    const isSwipingUp = totalDistance > 0;
    
    // Lógica inteligente para determinar si cerrar
    let shouldClose = false;
    
    // Caso 1: Gesto rápido hacia abajo (swipe down rápido)
    if (isSwipingDown && velocity > 0.5) {
      shouldClose = true;
    }
    
    // Caso 2: Gesto hacia abajo con distancia significativa
    else if (isSwipingDown && Math.abs(totalDistance) > 100) {
      shouldClose = true;
    }
    
    // Caso 3: Posición muy baja (menos del 30%)
    else if (sheetPosition < 30) {
      shouldClose = true;
    }
    
    // Caso 4: Gesto hacia abajo moderado pero consistente
    else if (isSwipingDown && velocity > 0.2 && Math.abs(totalDistance) > 50) {
      shouldClose = true;
    }
    
    // Caso 5: Gesto de "flick" hacia abajo (muy rápido)
    else if (isFlickGesture(velocity, totalDistance, isSwipingDown ? 'down' : 'up')) {
      shouldClose = true;
    }
    
    // Caso 6: Gesto hacia abajo con velocidad moderada pero distancia larga
    else if (isSwipingDown && velocity > 0.15 && Math.abs(totalDistance) > 150) {
      shouldClose = true;
    }
    
    // Si debe cerrar, iniciar animación
    if (shouldClose) {
      setIsClosing(true);
      setTimeout(() => {
        setMobileListVisible(false);
        setIsClosing(false);
        setSheetPosition(75); // Resetear para la próxima vez
      }, 250);
      return;
    }
    
    // Si no debe cerrar, hacer snap a posiciones específicas
    let snapPosition;
    
    // Si el gesto fue hacia arriba, ir a posición máxima
    if (isSwipingUp && velocity > 0.3) {
      snapPosition = 90;
    }
    // Si el gesto fue hacia abajo pero no lo suficiente para cerrar, ir a posición mínima
    else if (isSwipingDown && !shouldClose) {
      snapPosition = 25;
    }
    // Snap basado en posición actual
    else if (sheetPosition < 45) {
      snapPosition = 25; // Mínimo
    } else if (sheetPosition > 70) {
      snapPosition = 90; // Máximo
    } else {
      snapPosition = 75; // Medio (por defecto)
    }
    
    // Usar requestAnimationFrame para mejor rendimiento
    requestAnimationFrame(() => {
      setSheetPosition(snapPosition);
    });
  }, [isDragging, dragStartTime, dragStartY, lastTouchY, sheetPosition, isFlickGesture]);

  const handleSheetHandleClick = (e) => {
    e.stopPropagation();
    // Alternar entre posiciones al hacer clic en el handle
    if (sheetPosition > 75) {
      setSheetPosition(75); // Ir a posición media
    } else {
      setSheetPosition(25); // Ir a posición mínima
    }
  };

  // Función para determinar las clases CSS basadas en la posición
  const getSheetClasses = () => {
    let classes = 'bottom-sheet-mobile';
    
    // Agregar clase de tema
    if (theme === 'dark') {
      classes += ' dark';
    }
    
    if (isDragging) {
      classes += ' dragging';
    }
    
    if (isClosing) {
      classes += ' closing';
    }
    
    // Eliminadas las clases de transparencia condicional
    return classes;
  };

  // Función optimizada para el arrastre con throttling
  const throttledTouchMove = useRef(null);
  
  const handleSheetTouchMoveOptimized = useCallback((e) => {
    if (!isDragging) return;
    
    // Usar throttling para mejorar rendimiento
    if (throttledTouchMove.current) {
      return;
    }
    
    throttledTouchMove.current = requestAnimationFrame(() => {
      const touch = e.touches[0];
      const currentTime = Date.now();
      const deltaY = dragStartY - touch.clientY;
      const screenHeight = window.innerHeight;
      const deltaPercentage = (deltaY / screenHeight) * 100;
      
      let newPosition = dragStartPosition + deltaPercentage;
      
      // Limitar la posición entre 0% y 90%
      newPosition = Math.max(0, Math.min(90, newPosition));
      
      // Actualizar posiciones de seguimiento para calcular velocidad
      setLastTouchY(touch.clientY);
      setLastTouchTime(currentTime);
      
      setSheetPosition(newPosition);
      throttledTouchMove.current = null;
    });
    
    e.preventDefault();
    e.stopPropagation();
  }, [isDragging, dragStartY, dragStartPosition]);

  // Funciones de autenticación
  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        // setAuthToken(token); // No es necesario llamar a setAuthToken aquí, ya que el interceptor lo maneja
      } catch (error) {
        console.error('Error parsing user data:', error);
        handleLogout();
      }
    }
  };

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    setShowLoginModal(false);

    // Cargar favoritos del usuario
    try {
      const favoritosData = await obtenerFavoritos();
      const favoritosIds = favoritosData.favoritos.map(f => f.barberia_id);
      setFavorites(new Set(favoritosIds));
      console.log('Favoritos cargados:', favoritosIds);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    }
  };

  const handleRegisterSuccess = async (userData) => {
    setUser(userData);
    setShowLoginModal(false);
    setShowRegisterModal(false);
    // Mostrar mensaje de éxito
    alert('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');

    // Cargar favoritos del usuario
    try {
      const favoritosData = await obtenerFavoritos();
      const favoritosIds = favoritosData.favoritos.map(f => f.barberia_id);
      setFavorites(new Set(favoritosIds));
      console.log('Favoritos cargados:', favoritosIds);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowUserProfile(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // setAuthToken(null); // No es necesario llamar a setAuthToken aquí, ya que el interceptor lo maneja
  };

  const handleShowLogin = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
  };

  const handleShowRegister = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
  };

  const handleShowProfile = () => {
    setShowUserProfile(true);
  };

  // Detectar sistema operativo y agregar clase al body
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      document.body.classList.add('is-ios');
    } else if (/Android/i.test(navigator.userAgent)) {
      document.body.classList.add('is-android');
    }
  }

  // Efecto para manejar los event listeners del sheet
  useEffect(() => {
    const sheetElement = sheetRef.current;
    
    if (sheetElement && mobileListVisible) {
      // Buscar el handle dentro del sheet
      const handleElement = sheetElement.querySelector('.sheet-handle');
      
      if (handleElement) {
        // Configurar event listeners solo en el handle para evitar el comportamiento pasivo
        handleElement.addEventListener('touchstart', handleSheetTouchStart, { passive: false });
        handleElement.addEventListener('touchmove', handleSheetTouchMoveOptimized, { passive: false });
        handleElement.addEventListener('touchend', handleSheetTouchEnd, { passive: false });
        
        // Función de limpieza
        return () => {
          handleElement.removeEventListener('touchstart', handleSheetTouchStart);
          handleElement.removeEventListener('touchmove', handleSheetTouchMoveOptimized);
          handleElement.removeEventListener('touchend', handleSheetTouchEnd);
        };
      }
    }
  }, [mobileListVisible, handleSheetTouchStart, handleSheetTouchMoveOptimized, handleSheetTouchEnd]);

  // Vista móvil (estilo Uber)
  if (isMobile) {
    return (
      <div className="app-mobile-redesign">
        <div 
          className="map-container-mobile" 
          onClick={() => { 
            if (mobileListVisible) setMobileListVisible(false);
            if (barberiaSeleccionadaParaSheet) setBarberiaSeleccionadaParaSheet(null);
          }}
        >
          <MapaBarberias 
            barberias={barberiasFiltradas}
            onBarberiaSelect={handleBarberiaSelectFromMap}
            userLocation={userLocation}
            center={mapCenter}
            zoom={mapZoom}
            onSolicitarUbicacion={handleSolicitarUbicacion}
            onMapDoubleClick={handleCenterOnUser}
            barberiaParaCentrar={barberiaParaCentrar}
            mapStyle={theme === 'dark' ? mapStyles.dark : mapStyles.light}
            iconConfig={ICON_CONFIG}
          />
        </div>

        {/* --- NUEVA BARRA SUPERIOR --- */}
        <div className="mobile-header-redesign">
          <div className="mobile-header-top">
            <span className="mobile-header-title">Cuts</span>
            {!busqueda.trim() && (
              <span className="view-indicator">
                {viewLabels[currentView]}
              </span>
            )}
            {/* Botón de perfil móvil eliminado */}
          </div>
          <div className="mobile-search-wrapper" style={{ position: 'relative' }}>
            {/* Icono lupa a la izquierda */}
            <span className="search-icon-left">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
            </span>
            <input
              type="text"
              className="mobile-search-input-redesign"
              placeholder={userLocation ? "Buscar barberías cerca de ti..." : "Buscar barberías..."}
              value={busqueda}
              onChange={handleBusqueda}
              style={{ paddingLeft: 40, paddingRight: userLocation ? 40 : 16 }}
            />
            {/* Icono localización a la derecha */}
            {userLocation && (
              <span className="search-icon-right" title="Usando tu ubicación">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </span>
            )}
          </div>
        </div>
        
        {/* --- TARJETA DE DETALLE INFERIOR --- */}
        {barberiaSeleccionadaParaSheet && (
          <div className="mobile-detail-sheet">
            <BarberiaCard
              barberia={barberiaSeleccionadaParaSheet}
              onVerDetalles={() => handleVerBarberia(barberiaSeleccionadaParaSheet)}
              onVerEnMapa={() => handleVerEnMapa(barberiaSeleccionadaParaSheet)}
              isFavorite={favorites.has(barberiaSeleccionadaParaSheet.id)}
              onToggleFavorite={() => handleToggleFavorite(barberiaSeleccionadaParaSheet.id)}
              isDetailView={true} // Prop para un renderizado diferente en la tarjeta
            />
          </div>
        )}
        
        {/* --- LISTA DE RESULTADOS (BOTTOM SHEET) --- */}
        {mobileListVisible && (
          <div 
            className={getSheetClasses()}
            onClick={(e) => e.stopPropagation()}
            style={{ height: `${sheetPosition}%` }}
            ref={sheetRef}
          >
            <div 
              className="sheet-handle" 
              onClick={handleSheetHandleClick}
            >
              <div className="sheet-handle-bar pulse"></div>
            </div>
            <div className="sheet-content">
              {cargando ? (
                <div className="loading-redesign">
                  <div className="loading-spinner"></div>
                  <p>Buscando...</p>
                </div>
              ) : currentView === 'configuracion' ? (
                <div className="settings-view">
                  <h2>Configuración</h2>
                  <div className="settings-item">
                    <span>Modo Oscuro</span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        onChange={toggleTheme} 
                        checked={theme === 'dark'}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              ) : barberiasFiltradas.length === 0 ? (
                <div className="empty-state-redesign favoritos-empty">
                  <h3>No tienes favoritos</h3>
                  <p>Usa el icono del corazón ❤ para guardar lugares.</p>
                </div>
              ) : (
                <div className="results-list-mobile">
                  <div className="sort-container mobile">
                    <button onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} className="sort-button">
                      <span>Ordenar por: <strong>{getSortLabel(sortOrder)}</strong></span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                    {isSortMenuOpen && (
                      <div className="sort-dropdown">
                        {Object.keys(sortLabels).map(key => (
                          <button key={key} onClick={() => { setSortOrder(key); setIsSortMenuOpen(false); }}>
                            {sortLabels[key]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Contador y botón de mostrar todas */}
                  {currentView === 'cercanos' && !busqueda.trim() && barberiasFiltradas.length > 0 && (
                    <div className="results-counter-mobile">
                      <div className="counter-info">
                        {mostrandoTodas ? (
                          <span>Mostrando todas las {totalEncontradas} barberías encontradas</span>
                        ) : (
                          <span>Mostrando las {barberiasFiltradas.length} más cercanas</span>
                        )}
                      </div>
                      <div className="counter-actions">
                        {mostrandoTodas ? (
                          <button onClick={handleMostrarMenos} className="show-more-btn">
                            Mostrar menos
                          </button>
                        ) : (
                          <button onClick={handleMostrarTodas} className="show-more-btn">
                            Mostrar todas
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {barberiasFiltradas.map(barberia => (
                    <BarberiaCard
                      key={barberia.id}
                      barberia={barberia}
                      onVerDetalles={handleVerBarberia}
                      onVerEnMapa={handleVerEnMapa}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favorites.has(barberia.id)}
                      isMobile={isMobile}
                      onCalificar={handleCalificar}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="mobile-nav">
          <div className="mobile-nav__inner">
            <button onClick={() => handleMobileNavClick('cercanos')} className={currentView === 'cercanos' ? 'active' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>
            </button>
            <button onClick={() => handleMobileNavClick('favoritos')} className={currentView === 'favoritos' ? 'active' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
            </button>
            <button onClick={() => handleMobileNavClick('configuracion')} className={currentView === 'configuracion' ? 'active' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                <path d="M19.14 12.94c.04-.31.07-.63.07-.94s-.03-.63-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.42-.49-.42h-3.84c-.25 0-.45.18-.49.42l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22l-1.92 3.32c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.07.63-.07.94s.03.63.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.21.08-.47-.12-.61l-2.01-1.58z"/>
                <circle cx="12" cy="12" r="1.3" fill="var(--color-background)"/>
              </svg>
            </button>
            <button 
              onClick={() => {
                if (user) setShowUserProfile(true);
                else setShowLoginModal(true);
              }} 
              className="mobile-profile-nav-btn"
              title={user ? 'Mi perfil' : 'Iniciar sesión'}
            >
              {user ? (
                <div className="mobile-user-avatar">
                  {user.nombre_completo.charAt(0).toUpperCase()}
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </button>
          </div>
        </nav>

        {mostrarModal && barberiaSeleccionada && (
          <BarberiaModal
            barberia={barberiaSeleccionada}
            onClose={() => setMostrarModal(false)}
            onCalificar={handleCalificar}
            isFavorite={favorites.has(barberiaSeleccionada.id)}
            onToggleFavorite={() => handleToggleFavorite(barberiaSeleccionada.id)}
            onVerEnMapa={handleVerEnMapa}
          />
        )}

        {mostrarCalificar && barberiaSeleccionada && (
          <CalificarModal
            barberia={barberiaSeleccionada}
            onClose={() => setMostrarCalificar(false)}
            onCalificacionEnviada={handleCalificacionEnviada}
          />
        )}

        {/* Modales de autenticación */}
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={handleShowRegister}
          />
        )}

        {showRegisterModal && (
          <RegisterModal
            isOpen={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={handleShowLogin}
          />
        )}

        {showUserProfile && user && (
          <UserProfile
            user={user}
            onLogout={handleLogout}
            onClose={() => setShowUserProfile(false)}
          />
        )}
      </div>
    );
  }

  // Vista desktop
  if (!isMobile) {
    return (
      <div className={`app-desktop-redesign ${theme === 'dark' ? 'dark' : ''}`}>
        {/* Sidebar izquierdo */}
        <aside className="sidebar-left">
          <div className="sidebar-header">
            <h1 className="sidebar-logo">Cuts</h1>
          </div>
          <div className="sidebar-search-nav">
            <input
              type="text"
              className="sidebar-search-input"
              placeholder={userLocation ? "Buscar barberías cerca de ti..." : "Buscar barberías..."}
              value={busqueda}
              onChange={handleBusqueda}
            />
            <nav className="sidebar-nav">
              <button 
                onClick={() => setCurrentView('cercanos')} 
                className={currentView === 'cercanos' ? 'active' : ''} 
                aria-label="Ver barberías cercanas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>Cercanos</span>
              </button>
              <button 
                onClick={() => setCurrentView('favoritos')} 
                className={currentView === 'favoritos' ? 'active' : ''} 
                aria-label="Ver favoritos"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span>Favoritos</span>
              </button>
              <button 
                onClick={() => setCurrentView('configuracion')} 
                className={currentView === 'configuracion' ? 'active' : ''} 
                aria-label="Configuración"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.31.07-.63.07-.94s-.03-.63-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.42-.49-.42h-3.84c-.25 0-.45.18-.49.42l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22l-1.92 3.32c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.07.63-.07.94s.03.63.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.21.08-.47-.12-.61l-2.01-1.58z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Configuración</span>
              </button>
            </nav>
          </div>

          {/* Contenido del sidebar según la vista actual */}
          <div className="sidebar-content-area" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {currentView === 'configuracion' ? (
              <div className="sidebar-settings-view">
                <h2>Configuración</h2>
                <div className="settings-item">
                  <span>Modo Oscuro</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      onChange={toggleTheme} 
                      checked={theme === 'dark'}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                {user && (
                  <div className="settings-item">
                    <span>Usuario: {user.nombre_completo}</span>
                    <button 
                      onClick={handleLogout}
                      className="logout-btn"
                      style={{
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Contador y filtros */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {barberiasFiltradas.length} {barberiasFiltradas.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}
                  </div>
                  
                  {/* Contador y botón de mostrar todas */}
                  {currentView === 'cercanos' && !busqueda.trim() && barberiasFiltradas.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {mostrandoTodas ? (
                        <button onClick={handleMostrarMenos} className="show-more-btn">
                          Mostrar menos
                        </button>
                      ) : (
                        <button onClick={handleMostrarTodas} className="show-more-btn">
                          Mostrar todas
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Lista de resultados */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                  {cargando ? (
                    <div className="sidebar-loading">
                      <div className="loading-spinner"></div>
                      <p>Buscando barberías...</p>
                    </div>
                  ) : barberiasFiltradas.length === 0 ? (
                    <div className="sidebar-empty-state">
                      <h3>
                        {currentView === 'favoritos' 
                          ? 'No tienes favoritos' 
                          : busqueda.trim() 
                            ? 'No se encontraron lugares' 
                            : 'No hay barberías cerca'}
                      </h3>
                      <p>
                        {currentView === 'favoritos' 
                          ? 'Usa el icono del corazón ❤ para guardar lugares.' 
                          : busqueda.trim()
                            ? 'Prueba con otros términos de búsqueda.'
                            : 'Intenta expandir el área de búsqueda.'}
                      </p>
                    </div>
                  ) : (
                    <div className="sidebar-barberias-list">
                      {barberiasFiltradas.map(barberia => (
                        <BarberiaCard
                          key={barberia.id}
                          barberia={barberia}
                          onVerDetalles={handleVerBarberia}
                          onVerEnMapa={handleVerEnMapa}
                          onToggleFavorite={handleToggleFavorite}
                          isFavorite={favorites.has(barberia.id)}
                          onCalificar={handleCalificar}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>
        
        {/* Header desktop profesional */}
        <header className="desktop-header-main">
          <h1 className="header-title">Cuts - Barberías</h1>
          <div className="header-actions">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              aria-label="Cambiar tema"
              title="Cambiar tema"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 9c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/>
                </svg>
              )}
            </button>
            <div className="user-menu" onClick={() => {
              if (user) setShowUserProfile(true);
              else setShowLoginModal(true);
            }}>
              {user ? (
                <>
                  <div className="user-avatar-desktop">
                    {user.nombre_completo.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.nombre_completo.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <div className="user-avatar-desktop">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <span>Iniciar sesión</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Contenedor principal del mapa */}
        <main className="desktop-map-container">
          <MapaBarberias 
            barberias={barberiasFiltradas}
            onBarberiaSelect={handleBarberiaSelectFromMap}
            userLocation={userLocation}
            center={mapCenter}
            zoom={mapZoom}
            onSolicitarUbicacion={handleSolicitarUbicacion}
            onMapDoubleClick={handleCenterOnUser}
            barberiaParaCentrar={barberiaParaCentrar}
            mapStyle={theme === 'dark' ? mapStyles.dark : mapStyles.light}
            iconConfig={ICON_CONFIG}
          />
        </main>

        
        {/* Modales */}
        {mostrarModal && barberiaSeleccionada && (
          <BarberiaModal
            barberia={barberiaSeleccionada}
            onClose={() => setMostrarModal(false)}
            onCalificar={handleCalificar}
            isFavorite={favorites.has(barberiaSeleccionada.id)}
            onToggleFavorite={() => handleToggleFavorite(barberiaSeleccionada.id)}
          />
        )}
        {mostrarCalificar && barberiaSeleccionada && (
          <CalificarModal
            barberia={barberiaSeleccionada}
            onClose={() => setMostrarCalificar(false)}
            onCalificacionEnviada={handleCalificacionEnviada}
          />
        )}

        {/* Modales de autenticación */}
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={handleShowRegister}
          />
        )}

        {showRegisterModal && (
          <RegisterModal
            isOpen={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={handleShowLogin}
          />
        )}

        {showUserProfile && user && (
          <UserProfile
            user={user}
            onLogout={handleLogout}
            onClose={() => setShowUserProfile(false)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* ...tu layout actual... */}
      {/* Botón flotante de perfil - ELIMINADO */}
    </>
  );
}

export default App; 