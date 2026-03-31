import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HomePage = () => {
  const [unis, setUnis] = useState([]);
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);

  // Lista de estados para el filtro (puedes añadir más)
  const estados = ["Ciudad de Mexico", "Jalisco", "Nuevo Leon", "Puebla", "Queretaro", "Yucatan"];

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        // Conexión a tu backend de Django
        const response = await axios.get('http://localhost:8000/api/universidades/', {
          params: { estado: estado, limit: 12 } // Traemos 12 para el grid
        });
        setUnis(response.data);
      } catch (error) {
        console.error("Error cargando el ranking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [estado]);

  return (
    <div className="space-y-16">
      {/* SECCIÓN 1: Propósito de la página (Hero) */}
      <section className="text-center py-12 bg-white rounded-3xl shadow-sm border border-gray-100 px-6">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Tu futuro académico empieza <span className="text-blue-600">aquí</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Nuestra misión es ayudarte a encontrar la institución ideal mediante datos reales de 
          Google Maps y rankings actualizados. Filtra por estado, compara calificaciones y 
          descubre dónde están las mejores oportunidades para tu carrera.
        </p>
      </section>

      {/* SECCIÓN 2: Ranking y Filtros */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Ranking Nacional</h2>
            <p className="text-gray-500">Basado en valoraciones de Google y excelencia académica</p>
          </div>

          {/* Filtro por Estado */}
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por ubicación</label>
            <select 
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="">Todo México (Top 100)</option>
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {/* Listado de Universidades */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {unis.map((uni, index) => (
              <div key={uni.id || index} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-1 rounded">
                    #{index + 1} Ranking
                  </span>
                  <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                    <span className="text-yellow-600 font-bold mr-1">★</span>
                    <span className="text-yellow-700 font-medium">{uni.rating_google}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {uni.nombre}
                </h3>
                <p className="text-gray-500 text-sm mt-1 mb-4 flex items-center">
                  <span className="mr-1">📍</span> {uni.ciudad}, {uni.estado}
                </p>

                <div className="flex items-center justify-between border-t pt-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    uni.tipo === 'PUB' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {uni.tipo === 'PUB' ? 'PÚBLICA' : 'PRIVADA'}
                  </span>
                  <a 
                    href={uni.sitio_web} 
                    target="_blank" 
                    className="text-blue-600 text-sm font-bold hover:text-blue-800 transition-colors"
                  >
                    Ver Sitio →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;