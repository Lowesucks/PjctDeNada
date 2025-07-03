import React, { useEffect } from 'react';

const BarberiaModal = ({ barberia, onClose, onCalificar }) => {
  useEffect(() => {
    // Bloquear scroll cuando el modal se abre
    document.body.classList.add('modal-open');
    
    // Desbloquear scroll cuando el modal se cierra
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleClose = () => {
    document.body.classList.remove('modal-open');
    onClose();
  };
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? '' : 'empty'}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{barberia.nombre}</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="barberia-info">
          <p><strong>📍 Dirección:</strong> {barberia.direccion}</p>
          {barberia.telefono && barberia.telefono !== 'Teléfono no disponible' && (
            <p><strong>📞 Teléfono:</strong> {barberia.telefono}</p>
          )}
          {barberia.horario && barberia.horario !== 'Horario no disponible' && (
            <p><strong>🕒 Horario:</strong> {barberia.horario}</p>
          )}
          {barberia.fuente === 'foursquare' && (
            <div style={{ 
              background: '#00b894', 
              color: 'white', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              marginTop: '12px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'inline-block'
            }}>
              📍 Datos de Foursquare
              {barberia.distancia && (
                <span style={{ marginLeft: '8px', opacity: 0.9 }}>
                  • {(barberia.distancia / 1000).toFixed(1)} km
                </span>
              )}
            </div>
          )}
        </div>

        <div className="rating" style={{ marginBottom: '20px' }}>
          <div className="stars">
            {renderStars(Math.round(barberia.calificacion_promedio))}
          </div>
          <div className="rating-text">
            {barberia.calificacion_promedio.toFixed(1)} de 5 estrellas
          </div>
          <div style={{ marginLeft: '10px', color: '#86868b' }}>
            ({barberia.total_calificaciones} calificaciones)
          </div>
        </div>

        <div className="calificaciones-list">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Comentarios recientes</h3>
          {barberia.calificaciones && barberia.calificaciones.length > 0 ? (
            barberia.calificaciones.slice(0, 5).map(calificacion => (
              <div key={calificacion.id} className="calificacion-item">
                <div className="calificacion-header">
                  <span className="calificacion-usuario">{calificacion.nombre_usuario}</span>
                  <div className="stars">
                    {renderStars(calificacion.calificacion)}
                  </div>
                </div>
                {calificacion.comentario && (
                  <div className="calificacion-texto">{calificacion.comentario}</div>
                )}
                <div className="calificacion-fecha">{calificacion.fecha}</div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No hay comentarios aún. ¡Sé el primero en calificar!</p>
            </div>
          )}
        </div>

        <button className="btn" onClick={onCalificar} style={{ marginTop: '20px' }}>
          ✨ Calificar esta barbería
        </button>
      </div>
    </div>
  );
};

export default BarberiaModal; 