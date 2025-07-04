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

  // Detectar si es de OSM
  const isOSM = barberia.fuente === 'osm';
  // Adaptar campos si es OSM
  const nombre = isOSM ? (barberia.nombre || 'Barbería / Estética') : barberia.nombre;
  const direccion = isOSM ? (barberia.direccion || '') : barberia.direccion;
  const calificacion = isOSM ? (barberia.calificacion_promedio || 0) : barberia.calificacion_promedio;
  const totalCalificaciones = isOSM ? (barberia.total_calificaciones || 0) : barberia.total_calificaciones;

  return (
    <div className="barberia-card" onClick={onVerDetalles}>
      <div className="barberia-header">
        <div>
          <div className="barberia-nombre">{nombre} {isOSM && <span style={{color:'#3b82f6', fontSize:'12px'}}>(OSM)</span>}</div>
          <div className="barberia-direccion">{direccion}</div>
        </div>
        <div className="rating">
          <div className="stars">
            {renderStars(Math.round(calificacion))}
          </div>
          <div className="rating-text">
            {calificacion.toFixed(1)}
          </div>
        </div>
      </div>
      
      <div className="barberia-info">
        {barberia.telefono && barberia.telefono !== 'No disponible' && (
          <span>📞 {barberia.telefono}</span>
        )}
        {barberia.horario && barberia.horario !== 'Horario no disponible' && (
          <span>🕒 {barberia.horario}</span>
        )}
        <span>👥 {totalCalificaciones} calificaciones</span>
        {barberia.fuente === 'foursquare' && (
          <span className="foursquare-badge">📍 Foursquare</span>
        )}
        {barberia.fuente === 'osm' && (
          <span className="osm-badge" style={{
            background: '#3b82f6',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600'
          }}>🗺️ OSM</span>
        )}
        {barberia.distancia && !isOSM && (
          <span>📏 {(barberia.distancia / 1000).toFixed(1)} km</span>
        )}
        {isOSM && barberia.categoria && (
          <span style={{fontSize: '11px', color: '#6b7280'}}>🏷️ {barberia.categoria}</span>
        )}
      </div>
      
      <button className="btn btn-secondary">
        Ver detalles y calificar
      </button>
    </div>
  );
};

export default BarberiaCard; 