import React from 'react';

const BarberiaCard = ({ barberia, onVerDetalles }) => {
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
    <div className="barberia-card" onClick={onVerDetalles}>
      <div className="barberia-header">
        <div>
          <div className="barberia-nombre">{barberia.nombre}</div>
          <div className="barberia-direccion">{barberia.direccion}</div>
        </div>
        <div className="rating">
          <div className="stars">
            {renderStars(Math.round(barberia.calificacion_promedio))}
          </div>
          <div className="rating-text">
            {barberia.calificacion_promedio.toFixed(1)}
          </div>
        </div>
      </div>
      
      <div className="barberia-info">
        {barberia.telefono && barberia.telefono !== 'Teléfono no disponible' && (
          <span>📞 {barberia.telefono}</span>
        )}
        {barberia.horario && barberia.horario !== 'Horario no disponible' && (
          <span>🕒 {barberia.horario}</span>
        )}
        <span>👥 {barberia.total_calificaciones} calificaciones</span>
        {barberia.fuente === 'foursquare' && (
          <span className="foursquare-badge">📍 Foursquare</span>
        )}
        {barberia.distancia && (
          <span>📏 {(barberia.distancia / 1000).toFixed(1)} km</span>
        )}
      </div>
      
      <button className="btn btn-secondary">
        Ver detalles y calificar
      </button>
    </div>
  );
};

export default BarberiaCard; 