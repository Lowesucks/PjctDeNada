import React, { useState } from 'react';
import api, { setAuthToken } from '../utils/api';
import './AuthModals.css';

const LoginModal = ({ isOpen, onClose, onLoginSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', formData);
      
      if (response.status === 200) {
        const { token, usuario } = response.data;
        
        // Guardar token en localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(usuario));
        
              // Configurar el token para futuras peticiones
      setAuthToken(token);
        
        onLoginSuccess(usuario);
        onClose();
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.response?.data?.error || 'Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>Iniciar Sesión</h2>
          <button className="auth-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="auth-form-group">
            <label htmlFor="username">Nombre de Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="Ingresa tu nombre de usuario"
              disabled={loading}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Ingresa tu contraseña"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading || !formData.username || !formData.password}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-modal-footer">
          <p>
            ¿No tienes una cuenta?{' '}
            <button 
              className="auth-link-btn" 
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Regístrate aquí
            </button>
          </p>
        </div>

        <div className="auth-demo-accounts">
          <h4>Cuentas de Prueba:</h4>
          <div className="demo-account">
            <strong>Admin:</strong> admin / admin123
          </div>
          <div className="demo-account">
            <strong>Usuario:</strong> juan_perez / password123
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 