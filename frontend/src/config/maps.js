// Configuración de OpenStreetMap con Leaflet
export const MAP_CONFIG = {
  defaultCenter: [20, 0], // Centro del mundo por defecto [lat, lng]
  defaultZoom: 2, // Zoom mundial
  tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Función para obtener la ubicación actual del usuario
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada en este navegador'));
      return;
    }

    // Verificar si el usuario ya ha dado permiso
    navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
      if (permissionStatus.state === 'denied') {
        reject(new Error('Permiso de ubicación denegado. Por favor, habilita la ubicación en tu navegador.'));
        return;
      }
    }).catch(() => {
      // Si no se puede verificar el permiso, continuar con la solicitud
    });

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 segundos
      maximumAge: 60000 // 1 minuto
    };

    const successCallback = (position) => {
      console.log('Ubicación obtenida exitosamente:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
      
      resolve([
        position.coords.latitude,
        position.coords.longitude
      ]);
    };

    const errorCallback = (error) => {
      let errorMessage = 'Error al obtener la ubicación';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permiso de ubicación denegado. Por favor, habilita la ubicación en tu navegador.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Información de ubicación no disponible.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tiempo de espera agotado al obtener la ubicación.';
          break;
        default:
          errorMessage = 'Error desconocido al obtener la ubicación.';
      }
      
      console.error('Error de geolocalización:', errorMessage, error);
      reject(new Error(errorMessage));
    };

    try {
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    } catch (error) {
      console.error('Error al solicitar ubicación:', error);
      reject(new Error('Error al solicitar ubicación'));
    }
  });
}; 