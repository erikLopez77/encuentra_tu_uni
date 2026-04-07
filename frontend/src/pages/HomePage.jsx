import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [unis, setUnis] = useState([]);
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagActual, setActualPage] = useState(1);
  const estados = ["Ciudad de Mexico", "Guadalajara","Leon","Merida", "Monterrey", "Puebla", "Queretaro", "San Luis Potosi", "Tijuana"];

  useEffect(() => {
    setActualPage(1);
  }, [estado]);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/universidades/?page=${pagActual}`, {
          params: { 
            estado: estado, 
          }
        });
        setUnis(response.data.results);
        setTotalPaginas(Math.ceil(response.data.count / 12));
      } catch (error) {
        console.error("Error cargando el ranking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
    // Al cambiar de página, hacemos scroll suave hacia arriba de la sección
    window.scrollTo({ top: 700, behavior: 'smooth' });
  }, [estado,pagActual]);
  // Si cambia el filtro de estado, reiniciamos a la página 1
  useEffect(() => {
    setActualPage(1);
  }, [estado]);

  // Creamos el array de números para los botones aquí, fuera del return
  const listaBotones = Array.from({ length: totalPaginas }, (_, i) => i + 1);
  return (
    <div className="space-y-24 bg-gray-50/50">
      
      {/* SECCIÓN 1: HERO ELABORADO - Misión y Futuro */}
      <section className="relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100">
        <div className="container mx-auto px-0 flex flex-col lg:flex-row items-stretch min-h-[600px]">
          
          {/* Imagen Lateral Izquierda (Estilo la imagen del chico con lentes) */}
          <div className="lg:w-1/2 relative min-h-[400px]">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80" 
              alt="Estudiantes universitarios" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
          </div>

          {/* Contenido Texto (Estilo sección azul/oscura de las capturas) */}
          <div className="lg:w-1/2 bg-[#1a2b3c] text-white p-10 lg:p-16 flex flex-col justify-center relative">
            {/* Adorno visual de "Proyecto en Crecimiento" */}
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-8 self-start">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>Proyecto en fase Beta 1.0</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Encuentra el lugar donde <br /> 
              <span className="text-blue-400">tu carrera despega</span>.
            </h1>

            <div className="space-y-6 text-gray-300 text-lg leading-relaxed max-w-xl">
              <p>
                Sabemos que elegir una universidad es una de las decisiones más determinantes de tu vida. No se trata solo de un título, sino de tu entorno, tus mentores y tu futuro profesional.
              </p>
              <p className="font-medium text-white italic border-l-4 border-blue-500 pl-4">
                "Este es un proyecto que nace de la necesidad de transparencia académica en México."
              </p>
              <p className="text-sm">
                Aunque estamos iniciando este camino, nuestra hoja de ruta es ambiciosa: planeamos integrar tours virtuales, comparativas de costos en tiempo real y conexiones directas con egresados. Hoy te ofrecemos la base más sólida de datos de Google Maps para que inicies tu proceso de admisión con seguridad.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={() => window.scrollTo({top: 800, behavior: 'smooth'})} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20">
                Explorar Ranking Ahora
              </button>
              <div className="flex items-center text-gray-400 text-sm">
                <span className="mr-2">🚀</span> +1,000 instituciones analizadas
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: Ranking y Filtros */}
      <section className="px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-gray-200 pb-8">
          <div className="max-w-xl">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Ranking Nacional 2026</h2>
            <p className="text-gray-600 text-lg">Utiliza nuestros filtros inteligentes para descubrir la excelencia.</p>
          </div>

          <div className="w-full md:w-80">
            <select 
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none text-gray-700 font-medium"
            >
              <option value="">Todo México (Top Global)</option>
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            <p className="text-gray-500 font-medium animate-pulse">Sincronizando con base de datos...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {unis.map((uni, index) => (
                <Link to={`/universidad/${uni.id}`} key={uni.id} className="block group">
                  <div className="h-full bg-white rounded-3xl p-7 shadow-sm border border-gray-100 group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                        #{(pagActual - 1) * 12 + index + 1}
                      </span>
                      <div className="flex items-center bg-orange-50 px-3 py-1 rounded-xl">
                        <span className="text-orange-500 font-bold mr-1">★</span>
                        <span className="text-orange-700 font-bold">{uni.rating_google}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                      {uni.nombre}
                    </h3>
                    
                    <div className="flex items-center text-gray-500 mb-6 italic text-sm">
                      <span className="inline-block p-1 bg-gray-100 rounded-md mr-2">📍</span>
                      {uni.ciudad}, {uni.estado}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50 relative z-10">
                      <span className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg shadow-sm ${
                        uni.tipo === 'PUB' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                      }`}>
                        {uni.tipo === 'PUB' ? 'PÚBLICA' : 'PRIVADA'}
                      </span>
                      <span className="text-blue-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                        Perfil Completo →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* BARRA DE PAGINACIÓN ACTUALIZADA */}
            <div className="flex flex-wrap justify-center items-center gap-3 mt-20">
              {listaBotones.map((num) => (
                <button 
                  key={num} 
                  onClick={() => setActualPage(num)}
                  className={`min-w-[45px] h-[45px] font-bold rounded-xl transition-all duration-300 shadow-md ${
                    pagActual === num 
                    ? 'bg-blue-600 text-white scale-110 shadow-blue-200' 
                    : 'bg-white text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-gray-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default HomePage;