import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UniversidadesPage = () => {
  const [unis, setUnis] = useState([]);
  const [estado, setEstado] = useState(''); // Estado seleccionado
  const [loading, setLoading] = useState(false);

  // Cada vez que 'estado' cambie, este useEffect se vuelve a ejecutar
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Llamamos a TU backend de Django
        const response = await axios.get(`http://localhost:8000/api/universidades/`, {
          params: { estado: estado, limit: 100 }
        });
        setUnis(response.data);
      } catch (error) {
        console.error("Error al traer datos", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [estado]); // <--- La clave: se dispara cuando 'estado' cambia

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Ranking de Universidades</h1>
        
        {/* Filtros Profesionales con Tailwind */}
        <div className="flex gap-4">
          <select 
            onChange={(e) => setEstado(e.target.value)}
            className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todo México (Top 100)</option>
            <option value="Ciudad de Mexico">CDMX</option>
            <option value="Guadalajara">Jalisco</option>
            <option value="Monterrey">Monterrey</option>
           <option value="Puebla">Puebla</option>
           <option value="Queretaro">Queretaro</option>
           <option value="San Luis Potosi">San Luis Potosi</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Cargando mejores universidades...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unis.map(uni => (
            <div key={uni.id} className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{uni.nombre}</h3>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm font-bold">
                  ★ {uni.rating_google}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-2">{uni.ciudad}, {uni.estado}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className={`text-xs font-bold px-2 py-1 rounded ${uni.tipo === 'PUB' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                  {uni.tipo === 'PUB' ? 'PÚBLICA' : 'PRIVADA'}
                </span>
                <button className="text-blue-600 font-semibold text-sm hover:underline">Ver detalles</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UniversidadesPage;