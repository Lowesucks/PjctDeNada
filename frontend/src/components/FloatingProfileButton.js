import React from 'react';
import './FloatingProfileButton.css';

const FloatingProfileButton = ({ user, onClick }) => {
  return (
    <button className="floating-profile-btn" onClick={onClick} title={user ? 'Mi perfil' : 'Iniciar sesión o registrarse'}>
      {user ? (
        <div className="floating-avatar">{user.nombre_completo.charAt(0).toUpperCase()}</div>
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="12" fill="white"/>
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
        </svg>
      )}
    </button>
  );
};

export default FloatingProfileButton; 