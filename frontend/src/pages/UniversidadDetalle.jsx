import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const UniversidadDetalle = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  useEffect(() => {
    const getDetalle = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/universidades/${id}/`);
        
        // Procesamiento de la descripción de la IA
        let texto = res.data.descripcion_ia || "";
        texto = texto.replace(/\\n/g, '\n');
        const parrafos = texto.split(/\n+/);

        if (parrafos.length > 1) {
          parrafos.shift(); 
          texto = parrafos.join('\n\n');
        }

        setData({ ...res.data, descripcion_ia: texto });
      } catch (error) {
        console.error("Error al obtener la universidad", error);
      }
    };
    document.title = "Universidad | EncuentraTuFuturo";
    getDetalle();
  }, [id]);

  if (!data) return <div className="text-center py-20 text-gray-500 font-medium">Cargando información detallada...</div>;

  const fotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${data.foto_reference}&key=${API_KEY}`;

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100">
      {/* Banner de Imagen */}
      <div className="h-[450px] w-full bg-gray-200 relative">
        <img 
          src={data.foto_reference ? fotoUrl : 'https://images.unsplash.com/photo-1562774053-701939374585?w=800'} 
          alt={data.nombre} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-6 left-10">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                {data.tipo === 'PUB' ? 'Institución Pública' : 'Institución Privada'}
            </span>
        </div>
      </div>
      
      <div className="p-10 lg:p-14">
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
            <div className="flex-1">
                <h1 className="text-5xl font-black text-gray-900 leading-tight mb-2">{data.nombre}</h1>
                <p className="text-xl text-blue-600 flex items-center gap-2 font-medium">
                    <span className="text-2xl">📍</span> {data.ciudad}, {data.estado}
                </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex flex-col items-center min-w-[120px]">
                <span className="text-4xl text-yellow-500 font-black">★ {data.rating_google}</span>
                <span className="text-[10px] text-yellow-700 uppercase font-bold tracking-tighter">Google Score</span>
            </div>
        </div>

        {/* Grid de Información Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Contacto Directo</h3>
                <div className="space-y-4">
                    {data.telefono ? (
                        <p className="flex items-center gap-3 text-gray-700 font-semibold">
                            <span className="bg-white p-2 rounded-lg shadow-sm">📞</span> {data.telefono}
                        </p>
                    ) : (
                        <p className="text-gray-400 italic text-sm font-medium">Teléfono no disponible</p>
                    )}
                    
                    {data.sitio_oficial && (
                        <p className="flex items-center gap-3 text-blue-600 font-semibold break-all">
                            <span className="bg-white p-2 rounded-lg shadow-sm">🌐</span> 
                            <a href={data.sitio_oficial} target="_blank" rel="noreferrer" className="hover:underline">
                                {data.sitio_oficial.replace(/^https?:\/\//, '')}
                            </a>
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col justify-center gap-4">
                {/* Botón Principal: Sitio Web */}
                {data.sitio_oficial && (
                    <a href={data.sitio_oficial} target="_blank" rel="noreferrer" 
                       className="w-full text-center bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                        Ir al Sitio Web Oficial
                    </a>
                )}
                
                {/* Botón Secundario: Maps */}
                {data.google_maps_url && (
                    <a href={data.google_maps_url} target="_blank" rel="noreferrer" 
                       className="w-full text-center bg-white text-gray-700 border-2 border-gray-200 py-4 rounded-xl font-bold hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95">
                        Ver ubicación en Google Maps
                    </a>
                )}
            </div>
        </div>
        
        {/* Sección de Historia */}
        <div className="bg-white">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-800">
            <span className="h-8 w-2 bg-blue-600 rounded-full"></span>
            Historia y Trayectoria
          </h2>
          <div className="bg-blue-50/30 p-8 rounded-3xl border border-blue-50">
            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line italic">
                {data.descripcion_ia || "Nuestra inteligencia artificial está compilando la historia de esta universidad. Vuelve en unos minutos."}
            </p>
          </div>
        </div>

        {/* Footer del Detalle */}
        <div className="mt-14 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-400 text-sm italic">
                Datos actualizados mediante Google Places API y procesados por IA.
            </p>
        </div>
      </div>
    </div>
  );
};

export default UniversidadDetalle;