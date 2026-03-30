import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    // 'shadow-sm' da una línea sutil abajo, 'bg-white' fondo blanco limpio
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LADO IZQUIERDO: Logo o Nombre */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">
              EncuentraTuUni
            </Link>
          </div>

          {/* LADO DERECHO: Hiperenlaces */}
          {/* 'space-x-8' separa los enlaces horizontalmente */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Inicio
            </Link>
            <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Login
            </Link>
            <Link to="/faqs" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              FAQ's
            </Link>
            
            {/* Botón de acción opcional para que se vea más robusto */}
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm">
              Empezar
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;