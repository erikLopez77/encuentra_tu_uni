import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

/**
 * Guardia de rutas autenticadas.
 * Verifica la sesión contra el auth_service (GET /api/v1/perfil/) y:
 *  - mientras carga: muestra un spinner (evita parpadeos de redirección),
 *  - sin sesión: redirige a "/" (replace para no dejar historial detrás),
 *  - con sesión: renderiza la ruta hija (Outlet).
 */
const ProtectedRoute = () => {
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'auth' | 'unauth'

  useEffect(() => {
    let vigente = true;
    axios.get('/api/v1/perfil/')
      .then((res) => {
        if (!vigente) return;
        // El auth_service responde 200 con { isAuthenticated: false } si no hay
        // sesión; con sesión devuelve el perfil (con id). Usamos id como señal.
        setEstado(res.data?.id ? 'auth' : 'unauth');
      })
      .catch(() => { if (vigente) setEstado('unauth'); });
    return () => { vigente = false; };
  }, []);

  if (estado === 'cargando') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '12px',
        background: '#f8fafc',
      }}>
        <div style={{
          width: '36px', height: '36px', border: '4px solid #e5e7eb',
          borderTopColor: '#3b82f6', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#64748b', fontSize: '13px' }}>Verificando sesión...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (estado === 'unauth') return <Navigate to="/" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
