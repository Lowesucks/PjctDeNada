import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import axios from 'axios';
import BarberiaCard from './components/BarberiaCard';
import BarberiaModal from './components/BarberiaModal';
import CalificarModal from './components/CalificarModal';
import MapaBarberias from './components/MapaBarberias';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import UserProfile from './components/UserProfile';
import FloatingProfileButton from './components/FloatingProfileButton';
import './App.css';
import './styles/mobileOptimization.css';
import './styles/scrollControl.css';
import { ThemeContext } from './context/ThemeContext';
import { mapStyles } from './config/mapStyles';
import { initTouchVerification } from './utils/touchTest';
import { initDeviceDetection } from './utils/mobileDetection';
import { applyScrollConfig, initScrollControl } from './utils/scrollControl';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, busqueda]);

  const checkScreenSize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  const cargarBarberias = async (location) => {
    // Si no hay ubicación, no hacemos nada.
    if (!location) return;
    try {
      // Pasamos la ubicación como argumento para evitar depender del estado.
      const response = await axios.get(`/api/barberias/cercanas?lat=${location.lat}&lng=${location.lng}&radio=5000`);
      setBarberias(response.data);
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
        const response = await axios.get(url);
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

      // Solo mostrar detalles para barberías de Google
      if (barberia.fuente === 'google') {
        setBarberiaSeleccionada(barberiaConDireccion);
        setMostrarModal(true);
      }
      // Si no es de Google, no hacer nada
    } catch (error) {
      console.error('Error al cargar detalles de la barbería:', error);
      setBarberiaSeleccionada(barberia);
      setMostrarModal(true);
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

  const handleToggleFavorite = (barberiaId) => {
    console.log('Toggle favorite clicked for barberia:', barberiaId);
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(barberiaId)) {
        newFavorites.delete(barberiaId);
        console.log('Removed from favorites:', barberiaId);
      } else {
        newFavorites.add(barberiaId);
        console.log('Added to favorites:', barberiaId);
      }
      console.log('Current favorites:', Array.from(newFavorites));
      return newFavorites;
    });
    
    // Si estamos en la vista de favoritos y no hay búsqueda, actualizar la vista
    if (currentView === 'favoritos' && !busqueda.trim()) {
      // La vista se actualizará automáticamente por el useMemo
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
      cargarBarberias(userLocation);
    }
  };

  // Funciones de autenticación
  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing user data:', error);
        handleLogout();
      }
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
    setShowRegisterModal(false);
    // Mostrar mensaje de éxito
    alert('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
  };

  const handleLogout = () => {
    setUser(null);
    setShowUserProfile(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    delete axios.defaults.headers.common['Authorization'];
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
            <button className="mobile-profile-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
            </button>
          </div>
          <div className="mobile-search-wrapper">
            <input
              type="text"
              className="mobile-search-input-redesign"
              placeholder={userLocation ? "Buscar barberías cerca de ti..." : "Buscar barberías..."}
              value={busqueda}
              onChange={handleBusqueda}
            />
             <div className="search-icon-wrapper">
                {cargando ? (
                  <div className="search-loading-spinner"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
                )}
             </div>
             {userLocation && (
               <div className="location-indicator" title="Usando tu ubicación">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                 </svg>
               </div>
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
          <div className="bottom-sheet-mobile" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" onClick={() => setMobileListVisible(false)}></div>
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
                <div className="empty-state-redesign">
                  <h3>
                    {currentView === 'favoritos' 
                      ? 'No tienes favoritos' 
                      : busqueda.trim() 
                        ? 'No se encontraron lugares' 
                        : 'Cargando barberías cercanas...'}
                  </h3>
                  <p>
                    {currentView === 'favoritos' 
                      ? 'Usa el icono del corazón ❤ para guardar lugares.' 
                      : busqueda.trim()
                        ? 'Prueba con otros términos de búsqueda.'
                        : 'Buscando barberías cerca de ti...'}
                  </p>
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
        </nav>

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

        {/* Botón flotante de perfil */}
        <FloatingProfileButton user={user} onClick={() => {
          if (user) setShowUserProfile(true);
          else setShowLoginModal(true);
        }} />
      </div>
    );
  }

  // Vista desktop
  if (!isMobile) {
    return (
      <div className={`app-desktop-sidebar ${theme === 'dark' ? 'dark' : ''}`}> 
        {/* Barra lateral izquierda */}
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
              <button onClick={() => setCurrentView('cercanos')} className={currentView === 'cercanos' ? 'active' : ''} aria-label="Cercanos">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </button>
              <button onClick={() => setCurrentView('favoritos')} className={currentView === 'favoritos' ? 'active' : ''} aria-label="Favoritos">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
              </button>
                          <button onClick={() => setCurrentView('configuracion')} className={currentView === 'configuracion' ? 'active' : ''} aria-label="Configuración">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                <path d="M19.14 12.94c.04-.31.07-.63.07-.94s-.03-.63-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.42-.49-.42h-3.84c-.25 0-.45.18-.49.42l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22l-1.92 3.32c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.07.63-.07.94s.03.63.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.21.08-.47-.12-.61l-2.01-1.58z"/>
                <circle cx="12" cy="12" r="1.3" fill="var(--color-background)"/>
              </svg>
            </button>
            {user ? (
              <button onClick={handleShowProfile} className="user-profile-btn" aria-label="Mi Perfil">
                <div className="user-avatar-small">
                  {user.nombre_completo.charAt(0).toUpperCase()}
                </div>
              </button>
            ) : (
              <button onClick={handleShowLogin} className="login-btn" aria-label="Iniciar Sesión">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </button>
            )}
            </nav>
          </div>
          <div className="sidebar-list-section">
            <div className="sidebar-list-header">
              <span className="sidebar-list-title">
                {viewLabels[currentView]}
              </span>
              <div className="sidebar-sort-container">
                <button onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} className="sort-button">
                  <span>Ordenar por: <strong>{getSortLabel(sortOrder)}</strong></span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
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
            </div>
            {/* Lista o mensajes */}
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
                      : 'Cargando barberías cercanas...'}
                </h3>
                <p>
                  {currentView === 'favoritos' 
                    ? 'Usa el icono del corazón ❤ para guardar lugares.' 
                    : busqueda.trim()
                      ? 'Prueba con otros términos de búsqueda.'
                      : 'Buscando barberías cerca de ti...'}
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
          {/* Configuración */}
          {currentView === 'configuracion' && (
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
            </div>
          )}
        </aside>
        {/* Mapa a la derecha, ocupa todo el espacio restante */}
        <main className="main-map-area">
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

        {/* Botón flotante de perfil */}
        <FloatingProfileButton user={user} onClick={() => {
          if (user) setShowUserProfile(true);
          else setShowLoginModal(true);
        }} />
      </div>
    );
  }

  return (
    <>
      {/* ...tu layout actual... */}
      {/* Botón flotante de perfil */}
      <FloatingProfileButton user={user} onClick={() => {
        if (user) setShowUserProfile(true);
        else setShowLoginModal(true);
      }} />
    </>
  );
}

export default App; 