import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const CalificarModal = ({ barberia, onClose, onCalificacionEnviada }) => {
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
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombreUsuario.trim() || calificacion === 0) {
      alert('Por favor completa tu nombre y calificación');
      return;
    }

    try {
      setEnviando(true);
      await api.post(`/api/barberias/${barberia.id}/calificar`, {
        nombre_usuario: nombreUsuario.trim(),
        calificacion: calificacion,
        comentario: comentario.trim()
      });
      
      onCalificacionEnviada();
    } catch (error) {
      console.error('Error al enviar calificación:', error);
      alert('Error al enviar la calificación. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`rating-btn ${i <= calificacion ? 'active' : ''}`}
          onClick={() => setCalificacion(i)}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Calificar {barberia.nombre}</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tu nombre *</label>
            <input
              type="text"
              className="form-input"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              placeholder="Ingresa tu nombre"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Calificación *</label>
            <div className="rating-input">
              {renderStars()}
            </div>
            <div style={{ marginTop: '8px', color: '#86868b', fontSize: '14px' }}>
              {calificacion > 0 ? `${calificacion} estrella${calificacion > 1 ? 's' : ''}` : 'Selecciona una calificación'}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Comentario (opcional)</label>
            <textarea
              className="form-input form-textarea"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Comparte tu experiencia con esta barbería..."
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            disabled={enviando}
            style={{ marginTop: '20px' }}
          >
            {enviando ? 'Enviando...' : 'Enviar calificación'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CalificarModal; 