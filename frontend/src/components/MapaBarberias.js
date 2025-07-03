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
      map.setView(userLocation, 17);
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
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
        position: relative;
        box-shadow: 0 6px 20px rgba(59,130,246,0.4), 0 0 0 6px #fff;
        border-radius: 50%;
        animation: pulse 2s infinite;
      ">
        <svg width='36' height='36' viewBox='0 0 36 36' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='18' cy='18' r='16' fill='#3b82f6' stroke='white' stroke-width='4'/>
          <circle cx='18' cy='18' r='6' fill='white' stroke='#3b82f6' stroke-width='2'/>
        </svg>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        </style>
      </div>
    `,
    className: 'user-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });
};

const MapaBarberias = ({ barberias, onBarberiaSelect }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(MAP_CONFIG.defaultCenter);
  const [loading, setLoading] = useState(true);
  const [hasCentered, setHasCentered] = useState(false);

  // Obtener ubicación del usuario y centrar el mapa automáticamente solo la primera vez
  useEffect(() => {
    let cancelled = false;
    const getUserLocationAsync = async () => {
      try {
        setLoading(true);
        const location = await getCurrentLocation();
        if (!cancelled) {
          setUserLocation(location);
          if (!hasCentered) {
            setMapCenter(location);
            setHasCentered(true);
          }
        }
      } catch (error) {
        if (!cancelled) setUserLocation(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    getUserLocationAsync();
    return () => { cancelled = true; };
  }, [hasCentered]);

  // Botón para centrar en la ubicación del usuario
  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
    }
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
        <div style={{ textAlign: 'center', padding: '12px', minWidth: '150px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>
            📍 Tu ubicación
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
            Lat: {userLocation[0].toFixed(6)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Lng: {userLocation[1].toFixed(6)}
          </div>
        </div>
      </Popup>
    </Marker>
  ) : null;

  return (
    <div className="mapa-simple">
      <MapContainer
        center={mapCenter}
        zoom={userLocation ? 17 : MAP_CONFIG.defaultZoom}
        className="mapa-element"
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={true}
        key={mapCenter.join('-')}
      >
        <TileLayer
          url={MAP_CONFIG.tileLayer}
          attribution={MAP_CONFIG.attribution}
        />
        {/* Marcador de ubicación del usuario */}
        {userMarker}
        {/* Marcadores de barberías */}
        {barberias.map(barberia => {
          const position = barberia.latitud && barberia.longitud 
            ? [barberia.latitud, barberia.longitud]
            : userLocation || MAP_CONFIG.defaultCenter;
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
      {/* Botón para centrar en ubicación del usuario */}
      {userLocation && (
        <button 
          onClick={handleCenterOnUser}
          className="location-center-btn"
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            cursor: 'pointer',
            zIndex: 2000,
            fontSize: '20px'
          }}
          title="Centrar en mi ubicación"
        >
          📍
        </button>
      )}
      
      {/* Fallback visual si no hay ubicación */}
      {!userLocation && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: '#fff',
          padding: '8px 16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          color: '#ef4444',
          fontWeight: 'bold',
          zIndex: 2000,
          fontSize: '12px'
        }}>
          ⚠️ Ubicación no disponible
        </div>
      )}
    </div>
  );
};

export default MapaBarberias; 