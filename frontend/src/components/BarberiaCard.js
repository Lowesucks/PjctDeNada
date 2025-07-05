import React from 'react';

const StarRating = ({ rating = 0 }) => {
  const totalStars = 5;
  let stars = [];
  for (let i = 1; i <= totalStars; i++) {
    if (i <= rating) {
      stars.push(<span key={i} className="star filled">★</span>);
    } else {
      stars.push(<span key={i} className="star">☆</span>);
    }
  }
  return <div className="star-rating">{stars}</div>;
};

function BarberiaCard({ barberia, onVerDetalles, onVerEnMapa, isFavorite, onToggleFavorite }) {
  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Evitar que se abra el modal de detalles
    onToggleFavorite();
  };

  return (
    <div className="barberia-card" onClick={onVerDetalles}>
      <div className="card-header">
        <h3 className="card-title">{barberia.nombre}</h3>
        <button 
          className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
          onClick={handleFavoriteClick}
          aria-label="Añadir a favoritos"
        >
          ❤
        </button>
      </div>
      <p className="card-address">{barberia.direccion}</p>
      
      <div className="card-rating">
        <span className="rating-value">{barberia.calificacion_promedio?.toFixed(1) || 'N/A'}</span>
        <StarRating rating={barberia.calificacion_promedio} />
        <span className="total-ratings">({barberia.total_calificaciones || 0} calificaciones)</span>
      </div>
      
      <div className="card-actions">
        <button className="card-btn" onClick={onVerDetalles}>Ver detalles</button>
        <button className="card-btn-secondary" onClick={(e) => { e.stopPropagation(); onVerEnMapa(); }}>Ver en mapa</button>
      </div>
    </div>
  );
}

export default BarberiaCard; 