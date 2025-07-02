// Configuración de OpenStreetMap con Leaflet
export const MAP_CONFIG = {
  defaultCenter: [19.4326, -99.1332], // Ciudad de México por defecto [lat, lng]
  defaultZoom: 12,
  tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Función para obtener la ubicación actual del usuario
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([
          position.coords.latitude,
          position.coords.longitude
        ]);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
}; 