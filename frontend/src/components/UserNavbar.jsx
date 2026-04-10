import React from 'react';
import { Link } from 'react-router-dom';

const UserNavbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* LADO IZQUIERDO: Logo o Nombre */}
          <div className="flex-shrink-0">
            <Link to="/dashboard" className="text-2xl font-extrabold text-blue-600 tracking-tight">
              EncuentraTuFuturo
            </Link>
          </div>

          {/* LADO DERECHO: Hiperenlaces para usuario autenticado */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Inicio
            </Link>
            <Link to="/favoritos" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Mis favoritos
            </Link>
            <Link to="/ranking" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Ranking
            </Link>
            <Link to="/perfil" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Mi perfil
            </Link>
            
            <Link to="/" className="text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors">
              Cerrar Sesión
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;
