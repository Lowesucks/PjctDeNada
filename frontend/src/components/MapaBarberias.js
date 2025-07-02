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
      map.setView(userLocation, 15);
    }
  }, [userLocation, centerOnUser, map]);
  
  return null;
};

// Crear icono personalizado para barberías
const createBarberiaIcon = () => {
  return L.divIcon({
    html: `<div style="width: 32px; height: 32px; background: #f59e0b; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 18px; color: white; font-weight: bold;">✂️</div>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Crear icono para ubicación del usuario
const createUserIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
        position: relative;
        box-shadow: 0 4px 16px rgba(59,130,246,0.25), 0 0 0 4px #fff;
        border-radius: 50%;
      ">
        <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='16' cy='16' r='14' fill='#3b82f6' stroke='white' stroke-width='4'/>
          <circle cx='16' cy='16' r='5' fill='white' stroke='#3b82f6' stroke-width='2'/>
        </svg>
      </div>
    `,
    className: 'user-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44]
  });
};

const MapaBarberias = ({ barberias, onBarberiaSelect }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [centerOnUser, setCenterOnUser] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtener ubicación del usuario
  useEffect(() => {
    const getUserLocationAsync = async () => {
      try {
        setLoading(true);
        const location = await getCurrentLocation();
        setUserLocation(location);
        setCenterOnUser(true);
        setTimeout(() => setCenterOnUser(false), 100);
      } catch (error) {
        setUserLocation(null);
      } finally {
        setLoading(false);
      }
    };
    getUserLocationAsync();
  }, []);

  // Función para generar posiciones aleatorias cerca del centro
  const getRandomPositionNearCenter = () => {
    const center = userLocation || MAP_CONFIG.defaultCenter;
    const lat = center[0] + (Math.random() - 0.5) * 0.01;
    const lng = center[1] + (Math.random() - 0.5) * 0.01;
    return [lat, lng];
  };

  if (loading) {
    return (
      <div className="mapa-loading">
        <div className="loading-spinner"></div>
        <p>Obteniendo tu ubicación...</p>
      </div>
    );
  }

  // Fallback visual si no hay ubicación
  const userMarker = userLocation ? (
    <Marker position={userLocation} icon={createUserIcon()} zIndexOffset={1000}>
      <Popup>
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <strong>📍 Tu ubicación</strong>
        </div>
      </Popup>
    </Marker>
  ) : null;

  return (
    <div className="mapa-simple">
      <MapContainer
        center={userLocation || MAP_CONFIG.defaultCenter}
        zoom={userLocation ? 15 : MAP_CONFIG.defaultZoom}
        className="mapa-element"
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={true}
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
        {userMarker}
        
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
                    margin: '0 0 4px 0', 
                    fontSize: '14px', 
                    color: '#1f2937',
                    fontWeight: '600'
                  }}>
                    {barberia.nombre}
                  </h3>
                  <p style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: '12px', 
                    color: '#6b7280'
                  }}>
                    {barberia.direccion}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginTop: '4px'
                  }}>
                    <span style={{ 
                      color: '#f59e0b', 
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}>★</span>
                    <span style={{ 
                      marginLeft: '4px', 
                      fontSize: '12px', 
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
      {/* Fallback visual si no hay ubicación */}
      {!userLocation && (
        <div style={{position:'absolute',top:10,right:10,background:'#fff',padding:'8px 16px',borderRadius:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',color:'#3b82f6',fontWeight:'bold',zIndex:2000}}>
          Ubicación no disponible
        </div>
      )}
    </div>
  );
};

export default MapaBarberias; 