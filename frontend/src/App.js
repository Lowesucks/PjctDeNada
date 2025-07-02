import React, { useState, useEffect } from 'react';
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
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [sheetTipo, setSheetTipo] = useState('lista'); // 'lista' o 'buscar'
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarExpandida, setSidebarExpandida] = useState(false); // Sidebar colapsable
  const [menuActivo, setMenuActivo] = useState('inicio');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);

  useEffect(() => {
    cargarBarberias();
    checkScreenSize();
    // Animación de apertura automática
    setTimeout(() => setSidebarExpandida(true), 400);
    const handleResize = () => {
      checkScreenSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Colapsar sidebar al hacer clic fuera
  useEffect(() => {
    if (!sidebarExpandida) return;
    function handleClickOutside(e) {
      const sidebar = document.querySelector('.sidebar-colapsable');
      if (sidebar && !sidebar.contains(e.target)) {
        setSidebarExpandida(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarExpandida]);

  // Mostrar drawer cuando menuActivo es 'lista'
  useEffect(() => {
    if (menuActivo === 'lista') {
      setDrawerVisible(true);
      setDrawerClosing(false);
    } else if (drawerVisible) {
      setDrawerClosing(true);
      setTimeout(() => {
        setDrawerVisible(false);
        setDrawerClosing(false);
      }, 350); // igual a la duración de la animación
    }
  }, [menuActivo]);

  const checkScreenSize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  const cargarBarberias = async () => {
    try {
      setCargando(true);
      const response = await axios.get('/api/barberias');
      setBarberias(response.data);
    } catch (error) {
      console.error('Error al cargar barberías:', error);
    } finally {
      setCargando(false);
    }
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
      const response = await axios.get(`/api/barberias/${barberia.id}`);
      setBarberiaSeleccionada(response.data);
      setMostrarModal(true);
    } catch (error) {
      console.error('Error al cargar detalles de la barbería:', error);
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

  const barberiasFiltradas = barberias.filter(barberia =>
    barberia.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    barberia.direccion.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Vista móvil (estilo Uber)
  if (isMobile) {
    return (
      <div className="app-sheet-container">
        {/* Mapa de fondo */}
        <MapaBarberias 
          barberias={barberiasFiltradas}
          onBarberiaSelect={handleBarberiaSelectFromMap}
        />

        {/* Header flotante */}
        <div className="header-sheet">
          <h1>✂️ Barberías</h1>
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
                ) : barberiasFiltradas.length === 0 ? (
                  <div className="empty-state">
                    <h3>No se encontraron barberías</h3>
                    <p>Intenta con una búsqueda diferente</p>
                  </div>
                ) : (
                  <div className="barberias-grid">
                    {barberiasFiltradas.map(barberia => (
                      <BarberiaCard
                        key={barberia.id}
                        barberia={barberia}
                        onVerDetalles={() => handleVerBarberia(barberia)}
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
      <div className="app-desktop">
        {/* Botón hamburguesa flotante fuera de la sidebar */}
        {!sidebarExpandida && (
          <button
            className="sidebar-float-toggle-btn junto-barra"
            onClick={() => setSidebarExpandida(true)}
            aria-label="Expandir menú"
          >
            <span className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        )}
        {/* Sidebar de navegación */}
        <aside className={`sidebar-colapsable${sidebarExpandida ? ' expandida' : ' colapsada'}`}>
          <nav className="sidebar-menu">
            <ul style={!sidebarExpandida ? { pointerEvents: 'none', opacity: 0.5 } : {}}>
              <li onClick={() => setMenuActivo('inicio')} className={menuActivo === 'inicio' ? 'activo' : ''}><span className="menu-icon">🏠</span>{sidebarExpandida && <span className="menu-text">Inicio</span>}</li>
              <li onClick={() => setMenuActivo('lista')} className={menuActivo === 'lista' ? 'activo' : ''}><span className="menu-icon">📋</span>{sidebarExpandida && <span className="menu-text">Lista</span>}</li>
              <li onClick={() => setMenuActivo('favoritos')} className={menuActivo === 'favoritos' ? 'activo' : ''}><span className="menu-icon">⭐</span>{sidebarExpandida && <span className="menu-text">Favoritos</span>}</li>
              <li onClick={() => setMenuActivo('ajustes')} className={menuActivo === 'ajustes' ? 'activo' : ''}><span className="menu-icon">⚙️</span>{sidebarExpandida && <span className="menu-text">Ajustes</span>}</li>
            </ul>
          </nav>
        </aside>

        {/* Mapa de fondo */}
        <div className={`desktop-map-bg${sidebarExpandida ? ' sidebar-expandida' : ' sidebar-colapsada'}`}>
          <MapaBarberias 
            barberias={barberiasFiltradas}
            onBarberiaSelect={handleBarberiaSelectFromMap}
          />
        </div>

        {/* Drawer de lista de barberías (derecha) */}
        {drawerVisible && (
          <div className="drawer-overlay" onClick={() => setMenuActivo('inicio')}>
            <aside className={`drawer-barberias${drawerClosing ? ' cerrando' : ''}`} onClick={e => e.stopPropagation()}>
              <div className="drawer-header">
                <h2>Barberías cercanas</h2>
                <span className="results-count">{barberiasFiltradas.length} resultados</span>
              </div>
              <div className="drawer-content">
                {cargando ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Cargando barberías...</p>
                  </div>
                ) : barberiasFiltradas.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No se encontraron barberías</h3>
                    <p>Intenta con una búsqueda diferente</p>
                  </div>
                ) : (
                  <div className="barberias-list">
                    {barberiasFiltradas.map(barberia => (
                      <BarberiaCard
                        key={barberia.id}
                        barberia={barberia}
                        onVerDetalles={() => handleVerBarberia(barberia)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* Header flotante */}
        <header className="desktop-header overlay-header">
          <div className="header-content">
            <h1>✂️ Barberías</h1>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Buscar barberías..."
                value={busqueda}
                onChange={handleBusqueda}
              />
            </div>
            <div className="header-stats">
              <span className="stat-item">
                <strong>{barberiasFiltradas.length}</strong> barberías
              </span>
            </div>
          </div>
        </header>

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
}

export default App; 