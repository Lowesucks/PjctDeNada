import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import axios from 'axios';
import BarberiaCard from './components/BarberiaCard';
import BarberiaModal from './components/BarberiaModal';
import CalificarModal from './components/CalificarModal';
import MapaBarberias from './components/MapaBarberias';
import './App.css';
import { ThemeContext } from './context/ThemeContext';
import { mapStyles } from './config/mapStyles';

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
  
  // Estados para la vista móvil (bottom sheet)
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [sheetTipo, setSheetTipo] = useState('lista'); // 'lista' o 'buscar'

  const [userLocation, setUserLocation] = useState(null);
  const [foursquareAvailable, setFoursquareAvailable] = useState(false);
  const [osmBarberias, setOsmBarberias] = useState([]);
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

    const handleResize = () => checkScreenSize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // El array vacío asegura que esto se ejecute solo una vez.

  useEffect(() => {
    // Bloquea el scroll del body en la vista móvil para una experiencia de app nativa.
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Función de limpieza para restaurar el scroll si el componente se desmonta.
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobile]);

  useEffect(() => {
    // Este efecto se dispara SOLO cuando tenemos la ubicación del usuario.
    if (userLocation) {
      const fetchAllData = async () => {
        setCargando(true);
        // Hacemos todas las peticiones en paralelo para más eficiencia.
        await Promise.all([
          cargarBarberias(userLocation),
          fetchBarberiasOSM(userLocation)
        ]);
        setCargando(false);
      };
      fetchAllData();
    }
    // El warning de dependencias se puede ignorar aquí de forma segura.
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

      // Si es una barbería local, obtener detalles completos de la API
      if (barberia.fuente !== 'osm') {
        const response = await axios.get(`/api/barberias/${barberia.id}`);
        // Combinamos los datos, manteniendo la dirección que ya obtuvimos si era necesaria
        barberiaConDireccion = { ...response.data, direccion: barberiaConDireccion.direccion };
      }
      
      setBarberiaSeleccionada(barberiaConDireccion);
      setMostrarModal(true);
    } catch (error) {
      console.error('Error al cargar detalles de la barbería:', error);
      // Fallback: usar los datos básicos disponibles
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

  // Función para consultar Overpass API
  const fetchBarberiasOSM = async (location) => {
    if (!location) return;
    const center = [location.lat, location.lng];
    const radio = 5000; // 5km
    
    const latDiff = radio / 111320;
    const lonDiff = radio / (40075000 * Math.cos((center[0] * Math.PI) / 180) / 360);
    const s = center[0] - latDiff;
    const w = center[1] - lonDiff;
    const n = center[0] + latDiff;
    const e = center[1] + lonDiff;

    // --- Consulta a OSM más estricta ---
    const query = `
      [out:json][timeout:25];
      (
        node["shop"~"barber|hairdresser|beauty"](${s},${w},${n},${e});
        way["shop"~"barber|hairdresser|beauty"](${s},${w},${n},${e});
      );
      out body;
      >;
      out skel qt;
    `;
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const data = await res.json();
      console.log('Respuesta OSM:', data.elements);
      setOsmBarberias(data.elements || []);
    } catch (err) {
      setOsmBarberias([]);
      console.error('Error al consultar OSM:', err);
    }
  };

  // Adaptar los lugares OSM al formato esperado por BarberiaCard
  const barberiasOSMAdaptadas = osmBarberias.map(lugar => ({
    id: 'osm-' + lugar.id,
    fuente: 'osm',
    nombre: lugar.tags?.name || 'Barbería / Estética',
    direccion: [
      lugar.tags?.['addr:street'] || '',
      lugar.tags?.['addr:housenumber'] || ''
    ].join(' ').trim() || 'Dirección no disponible',
    telefono: lugar.tags?.phone || lugar.tags?.['contact:phone'] || 'No disponible',
    horario: lugar.tags?.opening_hours || 'Horario no disponible',
    lat: lugar.lat,
    lng: lugar.lon,
    calificacion_promedio: 0,
    total_calificaciones: 0,
    categoria: lugar.tags?.shop || lugar.tags?.amenity || 'Barbería'
  }));

  // Después de crear barberiasOSMAdaptadas, agrega este log:
  console.log('Barberías OSM adaptadas:', barberiasOSMAdaptadas);

  // 1. Loguea el contenido de barberiasOSMAdaptadas y userLocation
  console.log('DEBUG - barberiasOSMAdaptadas:', barberiasOSMAdaptadas);
  console.log('DEBUG - userLocation:', userLocation);

  // COMBINAR Y DE-DUPLICAR FUENTES DE DATOS
  const uniquePlaces = new Map();
  // Primero añadimos los de Google/backend, que suelen ser de mayor calidad
  barberias.forEach(p => uniquePlaces.set(p.google_place_id || p.id, p));
  // Luego añadimos los de OSM, solo si no existe un ID similar
  barberiasOSMAdaptadas.forEach(p => {
    if (!uniquePlaces.has(p.id)) {
      uniquePlaces.set(p.id, p);
    }
  });
  const todasLasBarberias = Array.from(uniquePlaces.values());

  // Lógica de ordenamiento
  const getDistance = (lat1, lon1, lat2, lon2) => {
      if ((lat1 === lat2) && (lon1 === lon2)) {
          return 0;
      }
      const radlat1 = Math.PI * lat1/180;
      const radlat2 = Math.PI * lat2/180;
      const theta = lon1-lon2;
      const radtheta = Math.PI * theta/180;
      let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
          dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515 * 1.609344;
      return dist; // en KM
  }

  const sortedBarberias = useMemo(() => {
    const listToSort = [...todasLasBarberias];

    if (userLocation) {
        listToSort.forEach(b => {
            if (b.lat && b.lng) {
                b.distancia = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
            } else {
                b.distancia = Infinity;
            }
        });
    }

    switch (sortOrder) {
        case 'calificacion':
            return listToSort.sort((a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0));
        case 'reseñas':
            return listToSort.sort((a, b) => (b.total_calificaciones || 0) - (a.total_calificaciones || 0));
        case 'distancia':
        default:
            return listToSort.sort((a, b) => a.distancia - b.distancia);
    }
  }, [todasLasBarberias, sortOrder, userLocation]);

  // Filtrar la lista de barberías según la vista actual
  const displayedBarberias = currentView === 'favoritos'
    ? sortedBarberias.filter(b => favorites.has(b.id))
    : sortedBarberias;

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
          // Si el usuario niega el permiso, no podemos hacer nada automáticamente.
          setCargando(false);
          setUserLocation(null);
        }
      );
    } else {
      console.log("Geolocalización no es soportada por este navegador.");
      // Si no hay geolocalización, la carga se detiene.
      setCargando(false);
    }
  };

  // Función para centrar el mapa en la barbería seleccionada
  const handleVerEnMapa = (barberia) => {
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
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(barberiaId)) {
        newFavorites.delete(barberiaId);
      } else {
        newFavorites.add(barberiaId);
      }
      return newFavorites;
    });
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
            barberias={todasLasBarberias}
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
              placeholder="Search"
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
              ) : displayedBarberias.length === 0 ? (
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
                  {displayedBarberias.map(barberia => (
                    <BarberiaCard
                      key={barberia.id}
                      barberia={barberia}
                      onVerDetalles={() => handleVerBarberia(barberia)}
                      onVerEnMapa={() => handleVerEnMapa(barberia)}
                      isFavorite={favorites.has(barberia.id)}
                      onToggleFavorite={() => handleToggleFavorite(barberia.id)}
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2 3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path></svg>
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
            ) : displayedBarberias.length === 0 ? (
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
              displayedBarberias.map(barberia => (
                <BarberiaCard
                  key={barberia.id}
                  barberia={barberia}
                  onVerDetalles={() => handleVerBarberia(barberia)}
                  onVerEnMapa={() => handleVerEnMapa(barberia)}
                  isFavorite={favorites.has(barberia.id)}
                  onToggleFavorite={() => handleToggleFavorite(barberia.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Contenedor del Mapa */}
        <div className="map-container-redesign">
          <MapaBarberias 
            barberias={todasLasBarberias}
            onBarberiaSelect={handleBarberiaSelectFromMap}
            userLocation={userLocation}
            center={mapCenter}
            zoom={mapZoom}
            onSolicitarUbicacion={handleSolicitarUbicacion}
            barberiasOSM={barberiasOSMAdaptadas}
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