import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Guardia de interfaz basada en la pista local. La autorización real la valida
 * el gateway en cada petición; así una carga de página pública no fuerza un 401.
 */
const ProtectedRoute = () => {
  const [sesionIndicada, setSesionIndicada] = useState(() => Boolean(localStorage.getItem('usuarioId')));

  useEffect(() => {
    const syncAuthHint = () => setSesionIndicada(Boolean(localStorage.getItem('usuarioId')));
    window.addEventListener('auth-change', syncAuthHint);
    const handleStorage = (event) => { if (event.key === 'usuarioId') syncAuthHint(); };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('auth-change', syncAuthHint);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (!sesionIndicada) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
