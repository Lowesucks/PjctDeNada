import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import BarberiaCard from './components/BarberiaCard';
import BarberiaModal from './components/BarberiaModal';
import CalificarModal from './components/CalificarModal';
import MapaBarberias from './components/MapaBarberias';
import './App.css';

function App() {
  const [barberias, setBarberias] = useState([]); // eslint-disable-line no-unused-vars
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

  const cargarBarberias = useCallback(async () => {
    try {
      setCargando(true);
      // Siempre intentar cargar barberías cercanas primero (funciona con o sin API key)
      if (userLocation) {
        const response = await axios.get(`/api/barberias/cercanas?lat=${userLocation.lat}&lng=${userLocation.lng}&radio=5000`);
        setBarberias(response.data);
        
        // Verificar si hay barberías de Foursquare en los resultados
        const hasFoursquareData = response.data.some(barberia => barberia.fuente === 'foursquare');
        setFoursquareAvailable(hasFoursquareData);
      } else {
        // Si no hay ubicación, cargar barberías locales
        const response = await axios.get('/api/barberias');
        setBarberias(response.data);
        setFoursquareAvailable(false);
      }
    } catch (error) {
      console.error('Error al cargar barberías:', error);
      // Fallback a barberías locales
      try {
        const response = await axios.get('/api/barberias');
        setBarberias(response.data);
        setFoursquareAvailable(false);
      } catch (fallbackError) {
        console.error('Error al cargar barberías locales:', fallbackError);
      }
    } finally {
      setCargando(false);
    }
  }, [userLocation]);

  useEffect(() => {
    cargarBarberias();
    checkScreenSize();
    
    const handleResize = () => {
      checkScreenSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cargarBarberias]);

  const checkScreenSize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  const buscarBarberias = async (query) => {
    try {
      setCargando(true);
      if (query.trim()) {
        const response = await axios.get(`/api/barberias/buscar?q=${encodeURIComponent(query)}`);
        setBarberias(response.data);
      } else {
        await cargarBarberias();
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
    await cargarBarberias();
  };

  const handleBarberiaSelectFromMap = (barberia) => {
    setBarberiaSeleccionada(barberia);
    setMostrarModal(true);
  };

  // Función para consultar Overpass API
  const fetchBarberiasOSM = async (center, radio = 5000) => {
    if (center && !Array.isArray(center) && typeof center === 'object' && center.lat !== undefined && center.lng !== undefined) {
      center = [center.lat, center.lng];
    }
    if (!Array.isArray(center) || center.length !== 2 || isNaN(center[0]) || isNaN(center[1])) {
      console.warn('fetchBarberiasOSM: center inválido', center);
      return;
    }
    let lat = center[0];
    let lon = center[1];
    const latDiff = radio / 111320;
    const lonDiff = radio / (40075000 * Math.cos((lat * Math.PI) / 180) / 360);
    const s = lat - latDiff;
    const w = lon - lonDiff;
    const n = lat + latDiff;
    const e = lon + lonDiff;
    const query = `
      [out:json][timeout:25];
      (
        node["shop"="hairdresser"](${s},${w},${n},${e});
        node["shop"="barber"](${s},${w},${n},${e});
        node["shop"="beauty"](${s},${w},${n},${e});
        node["amenity"="hairdresser"](${s},${w},${n},${e});
        node["amenity"="beauty"](${s},${w},${n},${e});
      );
      out body;
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

  // CAMBIO: La lista y el mapa siempre muestran barberiasOSMAdaptadas
  const todasLasBarberias = barberiasOSMAdaptadas;

  const handleSolicitarUbicacion = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(loc);
        await fetchBarberiasOSM([loc.lat, loc.lng]);
      },
      (error) => {
        setUserLocation(null);
      }
    );
  };

  // Función para centrar el mapa en la barbería seleccionada
  const handleVerEnMapa = (barberia) => {
    setBarberiaParaCentrar(barberia);
    // Opcional: podrías cerrar el modal o sheet si quieres
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
          osmBarberias={barberiasOSMAdaptadas}
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
            osmBarberias={barberiasOSMAdaptadas}
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