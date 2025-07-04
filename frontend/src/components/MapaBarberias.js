import React, { useState, useEffect, useRef } from 'react';
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
const createBarberiaIcon = (extraClass = '') => {
  return L.divIcon({
    html: `<div class="custom-marker ${extraClass}" style="width: 32px; height: 32px; background: #f59e0b; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 18px; color: white; font-weight: bold;">✂️</div>`,
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

// Crear icono especial para la ubicación del usuario
const createUserLocationIcon = () => {
  return L.divIcon({
    html: `<div style="width: 36px; height: 36px; background: #3b82f6; border: 3px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(59,130,246,0.3); font-size: 20px; color: white; font-weight: bold;">📍</div>`,
    className: 'user-location-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// Componente para asegurar que mapRef y mapReady se setean correctamente
const MapReadySetter = ({ setMapReady, mapRef }) => {
  const map = useMap();
  React.useEffect(() => {
    if (map) {
      mapRef.current = map;
      setMapReady(true);
      console.log("MapReadySetter: mapa listo", map);
    }
  }, [map, mapRef, setMapReady]);
  return null;
};

const MapaBarberias = ({ barberias, onBarberiaSelect, onSolicitarUbicacion, userLocation, barberiasOSM = [] }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [hasCentered, setHasCentered] = useState(false);
  const [pendingCenter, setPendingCenter] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [shouldFadeInMarkers, setShouldFadeInMarkers] = useState(false);
  const mapRef = useRef(null);
  const initialCenter = useRef(MAP_CONFIG.defaultCenter);
  const initialZoom = useRef(MAP_CONFIG.defaultZoom);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Permitir centrar manualmente al pulsar el botón
  // SUGERENCIA: Usa flyTo para animar el viaje al centro del usuario
  // const handleCenterOnUser = () => {
  //   if (userLocation && mapRef.current) {
  //     mapRef.current.flyTo(userLocation, 17, {
  //       animate: true,
  //       duration: 2 // segundos
  //     });
  //   }
  // };
  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current && mapReady) {
      setShowMarkers(false); // Oculta marcadores
      setShouldFadeInMarkers(true); // Solo animar tras centrado
      mapRef.current.flyTo(userLocation, 17, {
        animate: true,
        duration: 2
      });
      setTimeout(() => {
        setShowMarkers(true); // Muestra marcadores después de la animación
        setTimeout(() => setShouldFadeInMarkers(false), 800); // Quita animación tras fade
      }, 2000);
    }
  };

  useEffect(() => {
    if (userLocation && mapRef.current && mapReady) {
      setShowMarkers(false);
      mapRef.current.flyTo(userLocation, 17, {
        animate: true,
        duration: 2
      });
      setTimeout(() => {
        setShowMarkers(true);
      }, 2000);
    }
  }, [userLocation, mapReady]);

  // Marcador de ubicación del usuario (coordenadas obtenidas)
  const userLocationMarker = userLocation ? (
    <Marker position={userLocation} icon={createUserLocationIcon()} zIndexOffset={2000}>
      <Popup>
        <div style={{ textAlign: 'center', padding: '12px', minWidth: '150px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>
            ¡Aquí estás!
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
            Lat: {userLocation[0]?.toFixed(6) ?? '0.000000'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Lng: {userLocation[1]?.toFixed(6) ?? '0.000000'}
          </div>
        </div>
      </Popup>
    </Marker>
  ) : null;

  // Agrega este useEffect después de la declaración de mapRef y mapReady
  useEffect(() => {
    if (userLocation && mapRef.current && mapReady) {
      mapRef.current.flyTo(userLocation, 17, {
        animate: true,
        duration: 2
      });
    }
  }, [userLocation, mapReady]);

  return (
    <div className="mapa-simple">
      <MapContainer
        whenCreated={mapInstance => {
          // console.log("MapContainer creado", mapInstance);
          // mapRef.current = mapInstance;
          // setMapReady(true);
        }}
        center={initialCenter.current}
        zoom={initialZoom.current}
        className="mapa-element"
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={!isMobile}
      >
        <TileLayer
          url={MAP_CONFIG.tileLayer}
          attribution={MAP_CONFIG.attribution}
        />
        <MapReadySetter setMapReady={setMapReady} mapRef={mapRef} />
        {/* Marcador de ubicación del usuario */}
        {userLocationMarker}
        {/* Marcadores de barberías */}
        {barberias.map(barberia => {
          const position = barberia.latitud && barberia.longitud 
            ? [barberia.latitud, barberia.longitud]
            : userLocation || initialCenter.current;
          let markerClass = '';
          if (!showMarkers) markerClass = 'fade-out-marker';
          else if (shouldFadeInMarkers) markerClass = 'fade-in-marker';
          else markerClass = 'fade-visible-marker';
          return (
            <Marker 
              key={barberia.id} 
              position={position} 
              icon={createBarberiaIcon(markerClass)}
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
                      {(barberia.calificacion_promedio ?? 0).toFixed(1)} ({barberia.total_calificaciones})
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* Marcadores de barberías OSM */}
        {barberiasOSM.map(barberia => (
          <Marker
            key={barberia.id}
            position={[barberia.latitud, barberia.longitud]}
            icon={createBarberiaIcon('fade-visible-marker')}
          >
            <Popup>
              <div style={{ padding: '8px', maxWidth: '200px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>
                  {barberia.nombre}
                </h3>
                {barberia.direccion && (
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                    {barberia.direccion}
                  </p>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {barberia.tags && barberia.tags.shop && <span>Tipo: {barberia.tags.shop}</span>}
                  {barberia.tags && barberia.tags.amenity && <span> Tipo: {barberia.tags.amenity}</span>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {/* Controles del mapa */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 2000
      }}>
        {/* Botón para obtener ubicación (siempre visible en desktop y móvil) */}
        <button 
          onClick={onSolicitarUbicacion}
          className="location-btn"
          style={{
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
            fontSize: '20px',
            transition: 'all 0.3s ease',
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 2000
          }}
          title={userLocation ? "Centrar en mi ubicación" : "Buscar mi ubicación"}
        >
          {userLocation ? '📍' : '📍'}
        </button>

        {/* Indicador de estado de ubicación */}
        {!userLocation && (
          <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: '#fff',
            padding: '8px 16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            color: '#6b7280',
            fontWeight: '500',
            zIndex: 2000,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🌍 Vista mundial
          </div>
        )}
      </div>

      {/* Controles de zoom para desktop */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          zIndex: 2000
        }}>
          <button 
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomIn();
              }
            }}
            style={{
              background: 'white',
              color: '#374151',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            title="Acercar"
          >
            +
          </button>
          <button 
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomOut();
              }
            }}
            style={{
              background: 'white',
              color: '#374151',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            title="Alejar"
          >
            −
          </button>
        </div>
      )}
    </div>
  );
};

export default MapaBarberias; 