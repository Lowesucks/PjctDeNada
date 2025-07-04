import React from 'react';

const BarberiaCard = ({ barberia, onVerDetalles }) => {
  // Nombre y dirección robustos
  const nombre = barberia.nombre || 'Barbería / Estética';
  const direccion = barberia.direccion && barberia.direccion.trim() ? barberia.direccion : 'Dirección no disponible';
  const categoria = barberia.categoria || '';
  const isOSM = barberia.fuente === 'osm';

  return (
    <div className="barberia-card" onClick={onVerDetalles} style={{cursor: isOSM ? 'default' : 'pointer'}}>
      <div className="barberia-header">
        <div>
          <div className="barberia-nombre">{nombre} {isOSM && <span style={{color:'#3b82f6', fontSize:'12px'}}>(OSM)</span>}</div>
          <div className="barberia-direccion">{direccion}</div>
          {isOSM && categoria && (
            <div style={{fontSize: '11px', color: '#6b7280', marginTop: '2px'}}>🏷️ {categoria}</div>
          )}
        </div>
      </div>
      <div className="barberia-info">
        {!isOSM && barberia.telefono && barberia.telefono !== 'No disponible' && (
          <span>📞 {barberia.telefono}</span>
        )}
        {!isOSM && barberia.horario && barberia.horario !== 'Horario no disponible' && (
          <span>🕒 {barberia.horario}</span>
        )}
        {!isOSM && (
          <span>👥 {barberia.total_calificaciones ?? 0} calificaciones</span>
        )}
        {isOSM && (
          <span className="osm-badge" style={{
            background: '#3b82f6',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600',
            marginLeft: '8px'
          }}>🗺️ OSM</span>
        )}
      </div>
      {isOSM ? (
        <button className="btn btn-secondary" disabled style={{opacity:0.7, cursor:'not-allowed', marginTop:'10px'}}>
          Solo visualización (OSM)
        </button>
      ) : (
        <button className="btn btn-secondary" onClick={onVerDetalles} style={{marginTop:'10px'}}>
          Ver detalles y calificar
        </button>
      )}
    </div>
  );
};

export default BarberiaCard; 