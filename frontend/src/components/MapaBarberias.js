import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

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

  if (loadError) {
    return <div>Error al cargar el mapa. Asegúrate de que la clave de API sea correcta.</div>;
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={zoom || 13}
      onDblClick={onMapDoubleClick}
      options={{
        styles: mapStyle,
        disableDoubleClickZoom: true,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
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
        />
      )}

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
          />
        );
      })}
    </GoogleMap>
  ) : (
    <div>Cargando mapa...</div>
  );
}

export default React.memo(MapaBarberias); 