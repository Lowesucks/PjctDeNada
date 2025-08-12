import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import '../config/suppressWarnings'; // Suprimir advertencias de deprecación
import { getOptimizedConfig, markerTouchOptions, applyTouchConfig, isTouchDevice } from '../config/mapTouchConfig';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 19.432608,
  lng: -99.133209,
};

function MapaBarberias({ barberias, onBarberiaSelect, userLocation, center, zoom, onMapDoubleClick, mapStyle, iconConfig }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const mapCenter = center && center.lat && center.lng ? center : defaultCenter;

  const handleMarkerClick = (barberia) => {
    if (onBarberiaSelect) {
      onBarberiaSelect(barberia);
    }
  };

  // Obtener configuraciones optimizadas según el dispositivo
  const optimizedMapOptions = getOptimizedConfig();

  // Combinar con el estilo del mapa
  const finalMapOptions = {
    ...optimizedMapOptions,
    styles: mapStyle,
  };

  if (loadError) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3>🚨 Error al cargar Google Maps</h3>
          <p>No se pudo cargar el mapa de Google Maps.</p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>🔑 Posibles causas:</h4>
          <ul style={{ textAlign: 'left', maxWidth: '400px' }}>
            <li>API key no configurada</li>
            <li>Facturación no habilitada en Google Cloud</li>
            <li>API key inválida o expirada</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>🛠️ Soluciones:</h4>
          <ol style={{ textAlign: 'left', maxWidth: '400px' }}>
            <li>Configura REACT_APP_GOOGLE_MAPS_API_KEY en frontend/.env</li>
            <li>Habilita facturación en Google Cloud Console</li>
            <li>Verifica que la API key tenga permisos para Maps JavaScript API</li>
          </ol>
        </div>
        
        <div style={{ 
          background: '#f0f8ff', 
          padding: '15px', 
          borderRadius: '5px', 
          border: '1px solid #4285F4',
          maxWidth: '500px'
        }}>
          <h4>📋 Pasos para configurar Google Maps:</h4>
          <ol style={{ textAlign: 'left' }}>
            <li>Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
            <li>Crea un proyecto nuevo o selecciona uno existente</li>
            <li>Habilita "Maps JavaScript API" en la biblioteca de APIs</li>
            <li>Crea credenciales (API Key) en "Credenciales"</li>
            <li>Habilita facturación (tienes $200 gratis mensual)</li>
            <li>Copia la API key a frontend/.env</li>
          </ol>
        </div>
      </div>
    );
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={zoom || 13}
      onDblClick={onMapDoubleClick}
      options={finalMapOptions}
      onLoad={(map) => {
        // Aplicar configuraciones táctiles adicionales cuando el mapa se carga
        if (isTouchDevice()) {
          // Configurar el mapa para mejor experiencia táctil
          map.setOptions({
            gestureHandling: 'greedy',
            zoomControl: true,
          });
        }
      }}
    >
      {/* Marcador para la ubicación del usuario */}
      {userLocation && (
        <MarkerF
          position={userLocation}
          title={"Tu Ubicación"}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 8
          }}
          {...markerTouchOptions}
        />
      )}

      {/* Marcadores para las barberías */}
      {barberias.map((barberia) => {
        const lat = Number(barberia.lat);
        const lng = Number(barberia.lng);

        // Solo renderiza el marcador si ambos son números válidos
        if (isNaN(lat) || isNaN(lng)) {
          console.warn("Barbería con lat/lng inválido:", barberia);
          return null;
        }

        const finalIcon = isLoaded && iconConfig ? {
          url: iconConfig.url,
          scaledSize: new window.google.maps.Size(iconConfig.scaledSize.width, iconConfig.scaledSize.height),
          anchor: new window.google.maps.Point(iconConfig.anchor.x, iconConfig.anchor.y),
        } : undefined;

        return (
          <MarkerF
            key={barberia.id}
            position={{ lat, lng }}
            onClick={() => handleMarkerClick(barberia)}
            title={barberia.nombre}
            icon={finalIcon}
            {...markerTouchOptions}
          />
        );
      })}
    </GoogleMap>
  ) : (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      fontSize: '18px'
    }}>
      ⏳ Cargando mapa...
    </div>
  );
}

export default MapaBarberias; 