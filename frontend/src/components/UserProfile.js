import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './UserProfile.css';

const UserProfile = ({ user, onLogout, onClose }) => {
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('perfil');

  useEffect(() => {
    if (user) {
      cargarCalificaciones();
    }
  }, [user]);

  const cargarCalificaciones = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/mis-calificaciones');
      setCalificaciones(response.data);
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
      setError('Error al cargar tus calificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Limpiar localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Limpiar token de autorización
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    onLogout();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (!user) return null;

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-profile-header">
          <h2>Mi Perfil</h2>
          <button className="user-profile-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="user-profile-tabs">
          <button 
            className={`user-profile-tab ${activeTab === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveTab('perfil')}
          >
            👤 Perfil
          </button>
          <button 
            className={`user-profile-tab ${activeTab === 'calificaciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('calificaciones')}
          >
            ⭐ Mis Calificaciones
          </button>
        </div>

        <div className="user-profile-content">
          {activeTab === 'perfil' && (
            <div className="user-profile-info">
              <div className="user-avatar">
                <span>{user.nombre_completo.charAt(0).toUpperCase()}</span>
              </div>
              
              <div className="user-details">
                <div className="user-detail-item">
                  <label>Nombre:</label>
                  <span>{user.nombre_completo}</span>
                </div>
                
                <div className="user-detail-item">
                  <label>Usuario:</label>
                  <span>@{user.username}</span>
                </div>
                
                <div className="user-detail-item">
                  <label>Email:</label>
                  <span>{user.email}</span>
                </div>
                
                {user.telefono && (
                  <div className="user-detail-item">
                    <label>Teléfono:</label>
                    <span>{user.telefono}</span>
                  </div>
                )}
                
                <div className="user-detail-item">
                  <label>Miembro desde:</label>
                  <span>{formatDate(user.fecha_registro)}</span>
                </div>
                
                {user.ultimo_acceso && (
                  <div className="user-detail-item">
                    <label>Último acceso:</label>
                    <span>{formatDate(user.ultimo_acceso)}</span>
                  </div>
                )}
                
                {user.es_admin && (
                  <div className="user-admin-badge">
                    👑 Administrador
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'calificaciones' && (
            <div className="user-calificaciones">
              {loading ? (
                <div className="loading-message">Cargando calificaciones...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : calificaciones.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⭐</div>
                  <h3>No has calificado ninguna barbería</h3>
                  <p>¡Explora las barberías cercanas y deja tus reseñas!</p>
                </div>
              ) : (
                <div className="calificaciones-list">
                  {calificaciones.map((cal) => (
                    <div key={cal.id} className="calificacion-item">
                      <div className="calificacion-header">
                        <h4>{cal.barberia_nombre}</h4>
                        <div className="calificacion-rating">
                          {renderStars(cal.calificacion)}
                        </div>
                      </div>
                      
                      {cal.comentario && (
                        <p className="calificacion-comentario">
                          "{cal.comentario}"
                        </p>
                      )}
                      
                      <div className="calificacion-fecha">
                        {formatDate(cal.fecha)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="user-profile-footer">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 