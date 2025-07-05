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

function MapaBarberias({ barberias, onBarberiaSelect, userLocation, center, zoom }) {
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

      {barberias.map((barberia) => (
        <MarkerF
            key={barberia.id}
          position={{ lat: barberia.latitud, lng: barberia.longitud }}
          onClick={() => handleMarkerClick(barberia)}
          title={barberia.nombre}
        />
      ))}
    </GoogleMap>
  ) : (
    <div>Cargando mapa...</div>
  );
}

export default React.memo(MapaBarberias); 