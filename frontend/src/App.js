'''import React, { useState, useEffect, useMemo, useRef, useCallback, useContext } from 'react';
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
import { obtenerFavoritos, toggleFavorito } from './utils/api';
import { initDeviceDetection, isMobileDevice } from './utils/mobileDetection';

const ICON_CONFIG = {
  url: '/icono_ubicaciones.png',
  scaledSize: { width: 40, height: 55 }, 
  anchor: { x: 20, y: 55 },
};

const CATEGORIAS = {
  barberias: { label: 'Barberías', icon: '✂️' },
  peluquerias: { label: 'Peluquerías', icon: '💇‍♀️' },
  unas: { label: 'Uñas', icon: '💅' },
  spa: { label: 'Spa', icon: '💆‍♂️' },
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
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(12);
  const [favorites, setFavorites] = useState(new Set());
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(new Set(Object.keys(CATEGORIAS)));
  const { theme } = useContext(ThemeContext);

  const searchTimeoutRef = useRef(null);

  const checkScreenSize = () => {
    setIsMobile(isMobileDevice());
  };

  const handleCategoryToggle = (categoryKey) => {
    setSelectedCategories(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(categoryKey)) {
        newSelection.delete(categoryKey);
      } else {
        newSelection.add(categoryKey);
      }
      if (newSelection.size === 0) {
        return new Set(Object.keys(CATEGORIAS));
      }
      return newSelection;
    });
  };

  const CategoryFilters = () => (
    <div className="category-filters">
      {Object.entries(CATEGORIAS).map(([key, { label, icon }]) => (
        <button 
          key={key} 
          className={`filter-btn ${selectedCategories.has(key) ? 'active' : ''}`}
          onClick={() => handleCategoryToggle(key)}
        >
          <span className="filter-icon">{icon}</span>
          <span className="filter-label">{label}</span>
        </button>
      ))}
    </div>
  );

  const cargarBarberias = useCallback(async () => {
    if (!userLocation) return;
    setCargando(true);
    try {
      const categoriesParam = Array.from(selectedCategories).join(',');
      const url = `/api/barberias/cercanas?lat=${userLocation.lat}&lng=${userLocation.lng}&radio=10000&categorias=${categoriesParam}`;
      const response = await api.get(url);
      setBarberias(response.data);
    } catch (error) {
      console.error('Error al cargar lugares del backend:', error);
      setBarberias([]);
    } finally {
      setCargando(false);
    }
  }, [userLocation, selectedCategories]);

  const handleSolicitarUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          setMapCenter(loc);
          setMapZoom(15);
        },
        () => {
          const defaultLocation = { lat: 19.432608, lng: -99.133209 };
          setUserLocation(defaultLocation);
          setMapCenter(defaultLocation);
          setCargando(false);
        }
      );
    } else {
      setCargando(false);
    }
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  useEffect(() => {
    handleSolicitarUbicacion();
    checkScreenSize();
    checkAuthStatus();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (userLocation) {
      cargarBarberias();
    }
  }, [userLocation, selectedCategories, cargarBarberias]);

  // El resto de la lógica y el JSX se renderiza aquí...
  // Asegúrate de que todos los manejadores de eventos que se usan en el JSX estén definidos.

  return (
    <div className={`app-desktop-redesign ${theme === 'dark' ? 'dark' : ''}`}>
      <aside className="sidebar-left">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">Cuts</h1>
        </div>
        <div className="sidebar-search-nav">
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <CategoryFilters />
          {/* ...el resto de la barra lateral */}
        </div>
      </aside>
      <main className="desktop-map-container">
        <MapaBarberias 
          barberias={barberias}
          onBarberiaSelect={(b) => setBarberiaSeleccionada(b)}
          userLocation={userLocation}
          center={mapCenter}
          zoom={mapZoom}
          mapStyle={theme === 'dark' ? mapStyles.dark : mapStyles.light}
          iconConfig={ICON_CONFIG}
        />
      </main>
      {/* ...Modales y otros componentes... */}
    </div>
  );
}

export default App;
''