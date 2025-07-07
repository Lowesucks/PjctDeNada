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
    return <div>Error al cargar el mapa. Asegúrate de que la clave de API sea correcta.</div>;
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
    <div>Cargando mapa...</div>
  );
}

export default React.memo(MapaBarberias); 