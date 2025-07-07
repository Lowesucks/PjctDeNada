import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import BarberiaCard from './components/BarberiaCard';
import BarberiaModal from './components/BarberiaModal';
import CalificarModal from './components/CalificarModal';
import MapaBarberias from './components/MapaBarberias';
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

  const sortLabels = {
    distancia: 'Cercanía',
    calificacion: 'Calificación',
    reseñas: 'Reseñas',
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

    const handleResize = () => {
      checkScreenSize();
      applyScrollConfig(); // Reaplicar configuración de scroll al cambiar tamaño
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
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
        const response = await axios.get(`/api/barberias/buscar?q=${encodeURIComponent(query)}`);
        setBarberias(response.data);
      } else {
        // Si la búsqueda se vacía, volvemos a cargar las barberías cercanas.
        await cargarBarberias(userLocation);
      }
    } catch (error) {
      console.error('Error al buscar barberías:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleBusqueda = (e) => {
    const query = e.target.value;
    setBusqueda(query);
    buscarBarberias(query);
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

  // Adaptar barberías para que tengan lat y lng
  const barberiasAdaptadas = barberias.map(b => ({
    ...b,
    lat: b.lat || b.latitud,
    lng: b.lng || b.longitud,
  }));

  // Filtrar solo barberías de Google con lat y lng válidos para mostrar en el mapa y la lista
  const barberiasGoogle = barberiasAdaptadas
    .filter(b => b.fuente === 'google' && typeof b.lat === 'number' && typeof b.lng === 'number' && !isNaN(b.lat) && !isNaN(b.lng));

  // Filtrar barberías según la vista actual
  const barberiasFiltradas = useMemo(() => {
    if (currentView === 'favoritos') {
      return barberiasGoogle.filter(b => favorites.has(b.id));
    }
    return barberiasGoogle;
  }, [barberiasGoogle, currentView, favorites]);

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
            <button className="mobile-profile-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
            </button>
          </div>
          <div className="mobile-search-wrapper">
            <input
              type="text"
              className="mobile-search-input-redesign"
              placeholder="Buscar barberías..."
              value={busqueda}
              onChange={handleBusqueda}
            />
             <div className="search-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
             </div>
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
                      : 'No se encontraron lugares'}
                  </h3>
                  <p>
                    {currentView === 'favoritos' 
                      ? 'Usa el icono del corazón ❤ para guardar lugares.' 
                      : 'Prueba a moverte por el mapa.'}
                  </p>
                </div>
              ) : (
                <div className="results-list-mobile">
                  <div className="sort-container mobile">
                    <button onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} className="sort-button">
                      <span>Ordenar por: <strong>{sortLabels[sortOrder]}</strong></span>
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
          />
        )}
        {mostrarCalificar && barberiaSeleccionada && (
          <CalificarModal
            barberia={barberiaSeleccionada}
            onClose={() => setMostrarCalificar(false)}
            onCalificacionEnviada={handleCalificacionEnviada}
          />
        )}
      </div>
    );
  }

  // Vista desktop (sidebar colapsable + overlay)
  if (!isMobile) {
    return (
      <div className="app-desktop-redesign">
        {/* Panel Izquierdo Fijo */}
        <div className="left-panel">
          <header className="left-panel-header">
            <div className="left-panel-header-top">
              <h1>✂️ Cuts</h1>
              <button className="desktop-profile-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
              </button>
            </div>
            <div className="view-switcher">
              <button onClick={() => setCurrentView('cercanos')} className={currentView === 'cercanos' ? 'active' : ''}>Cercanos</button>
              <button onClick={() => setCurrentView('favoritos')} className={currentView === 'favoritos' ? 'active' : ''}>Favoritos</button>
              <button onClick={() => setCurrentView('configuracion')} className={currentView === 'configuracion' ? 'active' : ''}>Ajustes</button>
            </div>
            {currentView !== 'configuracion' && (
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  className="search-input-redesign"
                  value={busqueda}
                  onChange={handleBusqueda}
                />
              </div>
            )}
            {currentView !== 'configuracion' && (
              <div className="sort-container">
                <button onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} className="sort-button">
                  <span>Ordenar por: <strong>{sortLabels[sortOrder]}</strong></span>
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
            )}
          </header>

          <div className="results-list">
            {cargando ? (
              <div className="loading-redesign">
                <div className="loading-spinner"></div>
                <p>Buscando barberías...</p>
              </div>
            ) : currentView === 'configuracion' ? (
              <div className="settings-view">
                <h2>Ajustes</h2>
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
                    : 'No se encontraron barberías'}
                </h3>
                <p>
                  {currentView === 'favoritos' 
                    ? 'Usa el icono del corazón ❤ para guardar lugares.' 
                    : 'Intenta mover el mapa o realizar otra búsqueda.'}
                </p>
              </div>
            ) : (
              barberiasFiltradas.map(barberia => (
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
              ))
            )}
          </div>
        </div>

        {/* Contenedor del Mapa */}
        <div className="map-container-redesign">
          <MapaBarberias 
            barberias={barberiasFiltradas}
            onBarberiaSelect={handleBarberiaSelectFromMap}
            userLocation={userLocation}
            center={mapCenter}
            zoom={mapZoom}
            onSolicitarUbicacion={handleSolicitarUbicacion}
            barberiaParaCentrar={barberiaParaCentrar}
            mapStyle={theme === 'dark' ? mapStyles.dark : mapStyles.light}
            iconConfig={ICON_CONFIG}
          />
        </div>

        {/* Modales (se superponen a toda la app) */}
        {mostrarModal && barberiaSeleccionada && (
          <BarberiaModal
            barberia={barberiaSeleccionada}
            onClose={() => setMostrarModal(false)}
            onCalificar={handleCalificar}
          />
        )}

        {mostrarCalificar && barberiaSeleccionada && (
          <CalificarModal
            barberia={barberiaSeleccionada}
            onClose={() => setMostrarCalificar(false)}
            onCalificacionEnviada={handleCalificacionEnviada}
          />
        )}
      </div>
    );
  }
}

export default App; 