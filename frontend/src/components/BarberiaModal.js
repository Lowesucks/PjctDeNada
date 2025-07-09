import React, { useEffect, useState } from 'react';

const BarberiaModal = ({ barberia, onClose, onCalificar, isFavorite, onToggleFavorite, onVerEnMapa }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Bloquear scroll cuando el modal se abre
    document.body.classList.add('modal-open');
    
    // Desbloquear scroll cuando el modal se cierra
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Validar que barberia existe después de los hooks
  if (!barberia) {
    console.error('BarberiaModal: barberia es undefined');
    return null;
  }

  const handleClose = () => {
    document.body.classList.remove('modal-open');
    if (onClose) {
      onClose();
    }
  };

  const handleFavoriteClick = () => {
    if (onToggleFavorite && barberia.id) {
      onToggleFavorite(barberia.id);
    }
  };

  const handleCalificarClick = () => {
    if (onCalificar) {
      onCalificar();
    }
  };

  const handleVerEnMapa = () => {
    // Cerrar el modal y centrar el mapa en la barbería
    handleClose();
    if (onVerEnMapa) {
      onVerEnMapa(barberia);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const ratingValue = rating || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= ratingValue ? 'filled' : 'empty'}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  const formatDistance = (distance) => {
    if (distance === undefined || distance === null) return null;
    return distance < 1 
      ? `${Math.round(distance * 1000)}m` 
      : `${distance.toFixed(1)}km`;
  };

  const getSourceInfo = () => {
    if (barberia.fuente === 'osm') {
      return {
        name: 'OpenStreetMap',
        icon: '🗺️',
        description: 'Datos comunitarios',
        canRate: false
      };
    } else if (barberia.fuente === 'google') {
      return {
        name: 'Google Places',
        icon: '🔍',
        description: 'Datos verificados',
        canRate: true
      };
    }
    return {
      name: 'Sistema',
      icon: '📍',
      description: 'Datos del sistema',
      canRate: true
    };
  };

  const sourceInfo = getSourceInfo();

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{barberia.nombre || 'Sin nombre'}</h2>
            {onToggleFavorite && (
              <button 
                className={`favorite-btn-modal ${isFavorite ? 'favorited' : ''}`}
                onClick={handleFavoriteClick}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                {isFavorite ? '❤️' : '🤍'}
              </button>
            )}
          </div>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="barberia-info">
          <div className="info-item">
            <span className="info-icon">📍</span>
            <span className="info-text">{barberia.direccion || 'Dirección no disponible'}</span>
          </div>
          
          {barberia.telefono && barberia.telefono !== 'No disponible' && (
            <div className="info-item">
              <span className="info-icon">📞</span>
              <span className="info-text">{barberia.telefono}</span>
            </div>
          )}
          
          {barberia.horario && barberia.horario !== 'Horario no disponible' && (
            <div className="info-item">
              <span className="info-icon">🕒</span>
              <span className="info-text">{barberia.horario}</span>
            </div>
          )}

          {barberia.distancia !== undefined && (
            <div className="info-item">
              <span className="info-icon">📏</span>
              <span className="info-text">{formatDistance(barberia.distancia)} de distancia</span>
            </div>
          )}

          <div className="source-badge">
            {sourceInfo.icon} {sourceInfo.name}
            <span className="source-badge-detail">
              • {sourceInfo.description}
            </span>
          </div>
        </div>

        <div className="rating-section">
          <div className="stars">
            {renderStars(Math.round(barberia.calificacion_promedio || 0))}
          </div>
          <div className="rating-text">
            {(barberia.calificacion_promedio || 0).toFixed(1)} de 5 estrellas
          </div>
          <div className="total-ratings-modal">
            ({barberia.total_calificaciones || 0} calificaciones)
          </div>
        </div>

        <div className="calificaciones-list">
          <h3 className="recent-comments-title">Comentarios recientes</h3>
          {barberia.calificaciones && barberia.calificaciones.length > 0 ? (
            barberia.calificaciones.slice(0, 5).map(calificacion => (
              <div key={calificacion.id} className="calificacion-item">
                <div className="calificacion-header">
                  <span className="calificacion-usuario">{calificacion.nombre_usuario || 'Usuario'}</span>
                  <div className="stars">
                    {renderStars(calificacion.calificacion || 0)}
                  </div>
                </div>
                {calificacion.comentario && (
                  <div className="calificacion-texto">{calificacion.comentario}</div>
                )}
                <div className="calificacion-fecha">{calificacion.fecha || 'Fecha no disponible'}</div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No hay comentarios aún. ¡Sé el primero en calificar!</p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={handleVerEnMapa}
          >
            🗺️ Ver en mapa
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleCalificarClick} 
            disabled={!sourceInfo.canRate}
          >
            {sourceInfo.canRate ? '✨ Calificar esta barbería' : '🗺️ Solo visualización'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarberiaModal; 