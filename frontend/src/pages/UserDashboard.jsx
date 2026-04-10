import React from 'react';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center mt-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido a tu panel, futuro universitario</h1>
      <p className="text-gray-600 max-w-2xl mx-auto mb-8">
        Aquí podrás gestionar tus universidades favoritas, comparar rankings y editar tu perfil. Explora las opciones en tu nueva barra de navegación.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link to="/favoritos" className="p-6 border border-gray-100 rounded-lg hover:shadow-md transition-shadow group flex flex-col items-center">
          <div className="text-blue-600 text-4xl mb-4 group-hover:scale-110 transition-transform">⭐</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Mis favoritos</h3>
          <p className="text-gray-500 text-sm">Gestiona la lista de universidades que has guardado para tu futuro.</p>
        </Link>
        <Link to="/ranking" className="p-6 border border-gray-100 rounded-lg hover:shadow-md transition-shadow group flex flex-col items-center">
          <div className="text-blue-600 text-4xl mb-4 group-hover:scale-110 transition-transform">🏆</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Ranking</h3>
          <p className="text-gray-500 text-sm">Consulta el ranking de las mejores opciones de acuerdo a tus intereses.</p>
        </Link>
        <Link to="/perfil" className="p-6 border border-gray-100 rounded-lg hover:shadow-md transition-shadow group flex flex-col items-center">
          <div className="text-blue-600 text-4xl mb-4 group-hover:scale-110 transition-transform">👤</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Mi perfil</h3>
          <p className="text-gray-500 text-sm">Actualiza tu información, preferencias y datos de contacto.</p>
        </Link>
      </div>
    </div>
  );
};

export default UserDashboard;
