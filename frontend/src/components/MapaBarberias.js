import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MAP_CONFIG, getCurrentLocation } from '../config/maps';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaBarberias.css';

// Componente para centrar el mapa en la ubicación del usuario
const MapController = ({ userLocation, centerOnUser }) => {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation && centerOnUser) {
      map.setView(userLocation, 14);
    }
  }, [userLocation, centerOnUser, map]);
  
  return null;
};

// Crear icono personalizado para barberías
const createBarberiaIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 32px; 
        height: 32px; 
        background: #f59e0b; 
        border: 2px solid white; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        font-size: 16px;
        color: white;
        font-weight: bold;
      ">
        ✂️
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Crear icono para ubicación del usuario
const createUserIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 24px; 
        height: 24px; 
        background: #3b82f6; 
        border: 2px solid white; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">
        📍
      </div>
    `,
    className: 'user-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const MapaBarberias = ({ barberias, onBarberiaSelect }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [centerOnUser, setCenterOnUser] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtener ubicación del usuario
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.log('No se pudo obtener la ubicación:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  // Función para generar posiciones aleatorias cerca del centro (simulación)
  const getRandomPositionNearCenter = () => {
    const lat = MAP_CONFIG.defaultCenter[0] + (Math.random() - 0.5) * 0.01;
    const lng = MAP_CONFIG.defaultCenter[1] + (Math.random() - 0.5) * 0.01;
    return [lat, lng];
  };

  // Centrar mapa en la ubicación del usuario
  const handleCenterOnUser = () => {
    if (userLocation) {
      setCenterOnUser(true);
      setTimeout(() => setCenterOnUser(false), 100);
    }
  };

  if (loading) {
    return (
      <div className="mapa-container">
        <div className="mapa-loading">
          <div className="loading-spinner"></div>
          <p>Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mapa-container">
      <div className="mapa-header">
        <h2>Barberías Cercanas</h2>
        <button 
          className="btn-ubicacion"
          onClick={handleCenterOnUser}
          disabled={!userLocation}
        >
          📍 Mi ubicación
        </button>
      </div>
      
      <div className="mapa-wrapper">
        <MapContainer
          center={MAP_CONFIG.defaultCenter}
          zoom={MAP_CONFIG.defaultZoom}
          className="mapa-element"
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            url={MAP_CONFIG.tileLayer}
            attribution={MAP_CONFIG.attribution}
          />
          
          <MapController 
            userLocation={userLocation} 
            centerOnUser={centerOnUser}
          />
          
          {/* Marcador de ubicación del usuario */}
          {userLocation && (
            <Marker position={userLocation} icon={createUserIcon()}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong>Tu ubicación</strong>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Marcadores de barberías */}
          {barberias.map(barberia => {
            const position = barberia.latitud && barberia.longitud 
              ? [barberia.latitud, barberia.longitud]
              : getRandomPositionNearCenter();
            
            return (
              <Marker 
                key={barberia.id} 
                position={position} 
                icon={createBarberiaIcon()}
                eventHandlers={{
                  click: () => {
                    if (onBarberiaSelect) {
                      onBarberiaSelect(barberia);
                    }
                  }
                }}
              >
                <Popup>
                  <div style={{ padding: '8px', maxWidth: '200px' }}>
                    <h3 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '16px', 
                      color: '#1f2937' 
                    }}>
                      {barberia.nombre}
                    </h3>
                    <p style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '14px', 
                      color: '#6b7280' 
                    }}>
                      {barberia.direccion}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginTop: '8px' 
                    }}>
                      <span style={{ 
                        color: '#f59e0b', 
                        fontWeight: 'bold' 
                      }}>★</span>
                      <span style={{ 
                        marginLeft: '4px', 
                        fontSize: '14px', 
                        color: '#374151' 
                      }}>
                        {barberia.calificacion_promedio} ({barberia.total_calificaciones})
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      <div className="mapa-info">
        <p>💡 Toca los marcadores para ver detalles de las barberías</p>
        {!userLocation && (
          <p className="location-note">
            📍 Permite acceso a tu ubicación para ver barberías más cercanas
          </p>
        )}
      </div>
    </div>
  );
};

export default MapaBarberias; 