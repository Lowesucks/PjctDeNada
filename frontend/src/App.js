import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import BarberiaCard from './components/BarberiaCard';
import BarberiaModal from './components/BarberiaModal';
import CalificarModal from './components/CalificarModal';
import MapaBarberias from './components/MapaBarberias';
import './App.css';

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
      // Si es una barbería OSM, usar los datos directamente
      if (barberia.fuente === 'osm') {
        setBarberiaSeleccionada(barberia);
        setMostrarModal(true);
        return;
      }
      
      // Si es una barbería local, obtener detalles completos de la API
      const response = await axios.get(`/api/barberias/${barberia.id}`);
      setBarberiaSeleccionada(response.data);
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
    setBarberiaSeleccionada(barberia);
    setMostrarModal(true);
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
    latitud: lugar.lat,
    longitud: lugar.lon,
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
    setMapCenter({ lat: barberia.latitud, lng: barberia.longitud });
    setMapZoom(17); // Zoom más cercano al seleccionar una barbería
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
      <div className="app-sheet-container">
        {/* Mapa de fondo */}
        <MapaBarberias 
          barberias={todasLasBarberias}
          onBarberiaSelect={handleBarberiaSelectFromMap}
          userLocation={userLocation}
          center={mapCenter}
          zoom={mapZoom}
          onSolicitarUbicacion={handleSolicitarUbicacion}
          barberiasOSM={barberiasOSMAdaptadas}
          barberiaParaCentrar={barberiaParaCentrar}
        />

        {/* Header flotante */}
        <div className="header-sheet">
          <div>
            <h1>✂️ Barberías</h1>
            {!foursquareAvailable && userLocation && (
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                📍 Solo barberías locales
                <span style={{ 
                  background: '#fef3c7', 
                  color: '#92400e', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  Foursquare no configurado
                </span>
              </div>
            )}
            {barberiasOSMAdaptadas.length > 0 && (
              <div style={{ 
                fontSize: '12px', 
                color: '#3b82f6', 
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                🗺️ {barberiasOSMAdaptadas.length} barberías de OSM encontradas
              </div>
            )}
          </div>
          <div className="header-sheet-btns">
            <button className="sheet-btn" onClick={() => { setSheetTipo('buscar'); setSheetAbierto(true); }}>🔍 Buscar</button>
            <button className="sheet-btn" onClick={() => { setSheetTipo('lista'); setSheetAbierto(true); }}>📋 Lista</button>
          </div>
        </div>

        {/* Bottom sheet */}
        {sheetAbierto && (
          <div className="bottom-sheet">
            <div className="sheet-bar"></div>
            <button className="sheet-close" onClick={() => setSheetAbierto(false)}>✕</button>
            {sheetTipo === 'buscar' && (
              <div className="sheet-content">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar barberías..."
                  value={busqueda}
                  onChange={handleBusqueda}
                  autoFocus
                />
              </div>
            )}
            {sheetTipo === 'lista' && (
              <div className="sheet-content">
                {cargando ? (
                  <div className="loading">
                    <p>Cargando barberías...</p>
                  </div>
                ) : todasLasBarberias.length === 0 ? (
                  <div className="empty-state">
                    <h3>No se encontraron barberías</h3>
                    <p>Intenta con una búsqueda diferente</p>
                  </div>
                ) : (
                  <div className="barberias-grid">
                    {todasLasBarberias.map(barberia => (
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
            )}
          </div>
        )}

        {/* Modales */}
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
            <h1>✂️ Barberías</h1>
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar por nombre o dirección..."
                className="search-input-redesign"
                value={busqueda}
                onChange={handleBusqueda}
              />
            </div>
            {/* Aquí podríamos agregar filtros en el futuro */}
          </header>

          <div className="results-list">
            {cargando ? (
              <div className="loading-redesign">
                <div className="loading-spinner"></div>
                <p>Buscando barberías...</p>
              </div>
            ) : todasLasBarberias.length === 0 ? (
              <div className="empty-state-redesign">
                <h3>No se encontraron barberías</h3>
                <p>Intenta buscar tu ciudad o activa la ubicación.</p>
              </div>
            ) : (
              todasLasBarberias.map(barberia => (
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