import React, { useState } from 'react';
import axios from 'axios';
import './AuthModals.css';

const RegisterModal = ({ isOpen, onClose, onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nombre_completo: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // Validar username
    if (formData.username.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Ingresa un email válido';
    }

    // Validar password
    if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar confirmación de password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validar nombre completo
    if (formData.nombre_completo.trim().length < 2) {
      errors.nombre_completo = 'Ingresa tu nombre completo';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) setError('');
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono || undefined
      });
      
      if (response.status === 201) {
        onRegisterSuccess(response.data.usuario);
        onClose();
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setError(error.response?.data?.error || 'Error al registrar usuario. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal auth-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>Crear Cuenta</h2>
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

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label htmlFor="username">Nombre de Usuario *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="usuario123"
                disabled={loading}
                className={validationErrors.username ? 'auth-input-error' : ''}
              />
              {validationErrors.username && (
                <span className="auth-validation-error">{validationErrors.username}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="tu@email.com"
                disabled={loading}
                className={validationErrors.email ? 'auth-input-error' : ''}
              />
              {validationErrors.email && (
                <span className="auth-validation-error">{validationErrors.email}</span>
              )}
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label htmlFor="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                className={validationErrors.password ? 'auth-input-error' : ''}
              />
              {validationErrors.password && (
                <span className="auth-validation-error">{validationErrors.password}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Repite tu contraseña"
                disabled={loading}
                className={validationErrors.confirmPassword ? 'auth-input-error' : ''}
              />
              {validationErrors.confirmPassword && (
                <span className="auth-validation-error">{validationErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label htmlFor="nombre_completo">Nombre Completo *</label>
              <input
                type="text"
                id="nombre_completo"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleInputChange}
                required
                placeholder="Juan Pérez"
                disabled={loading}
                className={validationErrors.nombre_completo ? 'auth-input-error' : ''}
              />
              {validationErrors.nombre_completo && (
                <span className="auth-validation-error">{validationErrors.nombre_completo}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="telefono">Teléfono (opcional)</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="555-1234"
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="auth-modal-footer">
          <p>
            ¿Ya tienes una cuenta?{' '}
            <button 
              className="auth-link-btn" 
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal; 