import axios from 'axios';

// Crear instancia de axios con la URL base desde las variables de entorno
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Función para configurar el token de autorización
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;

// Función para obtener el token de autenticación
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Función para configurar headers con autenticación
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Función para limpiar datos de autenticación
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ===== FUNCIONES PARA FAVORITOS =====

// Obtener favoritos del usuario
export const obtenerFavoritos = async () => {
  try {
    const response = await api.get('/api/favoritos', {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo favoritos:', error);
    throw error;
  }
};

// Agregar barbería a favoritos
export const agregarFavorito = async (barberiaId) => {
  try {
    const response = await api.post(`/api/favoritos/${barberiaId}`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error agregando favorito:', error);
    throw error;
  }
};

// Eliminar barbería de favoritos
export const eliminarFavorito = async (barberiaId) => {
  try {
    const response = await api.delete(`/api/favoritos/${barberiaId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error eliminando favorito:', error);
    throw error;
  }
};

// Verificar si una barbería es favorita
export const verificarFavorito = async (barberiaId) => {
  try {
    const response = await api.get(`/api/favoritos/${barberiaId}/verificar`, {
      headers: getAuthHeaders()
    });
    return response.data.es_favorito;
  } catch (error) {
    console.error('Error verificando favorito:', error);
    return false;
  }
};

// Función para alternar favorito (agregar o eliminar)
export const toggleFavorito = async (barberiaId, esFavorito) => {
  try {
    if (esFavorito) {
      await eliminarFavorito(barberiaId);
      return false; // Ya no es favorito
    } else {
      await agregarFavorito(barberiaId);
      return true; // Ahora es favorito
    }
  } catch (error) {
    console.error('Error alternando favorito:', error);
    throw error;
  }
}; 