import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

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

function BarberiaCard({ barberia, onVerDetalles, onVerEnMapa, isFavorite, onToggleFavorite, isDetailView }) {
  if (isDetailView) {
    return (
      <div className="barberia-card-detail">
        <div className="card-header">
          <h3 className="card-title">{barberia.nombre}</h3>
        </div>
        <div className="card-rating">
          <span className="total-ratings">({barberia.total_calificaciones} calificaciones)</span>
        </div>
        <p className="card-description">
          {barberia.descripcion || barberia.direccion}
        </p>
      </div>
    );
  }

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Evitar que se abra el modal de detalles
    console.log('Favorite button clicked for barberia:', barberia.id);
    onToggleFavorite(barberia.id);
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
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      <p className="card-address">{barberia.direccion}</p>
      
      <div className="card-info">
        <div className="card-rating">
          <span className="rating-value">{barberia.calificacion_promedio?.toFixed(1) || 'N/A'}</span>
          <StarRating rating={barberia.calificacion_promedio} />
          <span className="total-ratings">({barberia.total_calificaciones || 0} calificaciones)</span>
        </div>
        
        {barberia.distancia !== undefined && (
          <div className="card-distance">
            <span className="distance-icon">📍</span>
            <span className="distance-text">
              {barberia.distancia < 1 
                ? `${Math.round(barberia.distancia * 1000)}m` 
                : `${barberia.distancia.toFixed(1)}km`}
            </span>
          </div>
        )}
      </div>
      
      <div className="card-actions">
        <button onClick={(e) => { e.stopPropagation(); onVerDetalles(); }} className="card-btn">Ver detalles</button>
        <button onClick={(e) => { e.stopPropagation(); onVerEnMapa(barberia); }} className="card-btn-secondary">Ver en mapa</button>
      </div>
    </div>
  );
}

export default BarberiaCard; 