import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BarberiaCard from './components/BarberiaCard';
import BarberiaModal from './components/BarberiaModal';
import CalificarModal from './components/CalificarModal';
import MapaBarberias from './components/MapaBarberias';

function App() {
  const [barberias, setBarberias] = useState([]);
  const [barberiaSeleccionada, setBarberiaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarCalificar, setMostrarCalificar] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista' o 'mapa'

  useEffect(() => {
    cargarBarberias();
  }, []);

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

  return (
    <div className="container">
      <div className="header">
        <h1>✂️ Barberías</h1>
        <p>Encuentra y califica las mejores barberías</p>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar barberías..."
          value={busqueda}
          onChange={handleBusqueda}
        />
      </div>

      <div className="vista-selector">
        <button 
          className={`vista-btn ${vistaActual === 'lista' ? 'active' : ''}`}
          onClick={() => setVistaActual('lista')}
        >
          📋 Lista
        </button>
        <button 
          className={`vista-btn ${vistaActual === 'mapa' ? 'active' : ''}`}
          onClick={() => setVistaActual('mapa')}
        >
          🗺️ Mapa
        </button>
      </div>

      {vistaActual === 'lista' ? (
        <div className="barberias-list">
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
            barberiasFiltradas.map(barberia => (
              <BarberiaCard
                key={barberia.id}
                barberia={barberia}
                onVerDetalles={() => handleVerBarberia(barberia)}
              />
            ))
          )}
        </div>
      ) : (
        <MapaBarberias 
          barberias={barberiasFiltradas}
          onBarberiaSelect={handleBarberiaSelectFromMap}
        />
      )}

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

export default App; 