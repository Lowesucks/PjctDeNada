import React, { createContext, useState, useMemo, useEffect } from 'react';

// Creamos el contexto
export const ThemeContext = createContext();

// Creamos el proveedor del contexto
export const ThemeProvider = ({ children }) => {
  // Estado para guardar el tema actual. Leemos el tema guardado en localStorage o usamos 'light' por defecto.
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Guardar el tema en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('theme', theme);
    // Añadimos/quitamos la clase 'dark' al body para que el CSS reaccione
    document.body.className = '';
    document.body.classList.add(theme);
  }, [theme]);

  // Función para cambiar el tema
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Usamos useMemo para evitar que el valor del contexto se recalcule en cada render
  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 