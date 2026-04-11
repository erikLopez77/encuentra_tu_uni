import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ESTADOS = [
  "Ciudad de Mexico", "Guadalajara", "Leon", "Merida",
  "Monterrey", "Puebla", "Queretaro", "San Luis Potosi", "Tijuana"
];
const TIPOS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'PUB', label: 'Pública' },
  { value: 'PRI', label: 'Privada' },
];
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

const StarRating = ({ rating }) => {
  const stars = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-4 h-4 ${s <= stars ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.37 2.448c-.785.57-1.84-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.642 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-bold text-gray-700">{rating}</span>
    </div>
  );
};

const RankingPage = () => {
  const [unis, setUnis] = useState([]);
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagActual, setPagActual] = useState(1);
  const [favoritos, setFavoritos] = useState(new Set()); // Guardaremos IDs de universidades
  const [toastMsg, setToastMsg] = useState('');

  // 1. Cargar los favoritos del usuario desde la DB al iniciar
  useEffect(() => {
    const fetchFavoritosUser = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/perfil/');
        // Asumiendo que res.data.favoritos es una lista de IDs: [1, 5, 10]
        setFavoritos(new Set(res.data.favoritos));
      } catch (err) {
        console.error("Error cargando favoritos iniciales:", err);
      }
    };
    fetchFavoritosUser();
  }, []);

  // Resetear página al cambiar filtros
  useEffect(() => { setPagActual(1); }, [estado, tipo]);

  useEffect(() => {
    const fetchUnis = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/universidades/?page=${pagActual}`, {
          params: { estado, tipo: tipo || undefined }
        });
        setUnis(response.data.results);
        setTotalPaginas(Math.ceil(response.data.count / 12));
      } catch (err) {
        console.error('Error cargando ranking:', err);
      } finally {
        setLoading(false);
      }
    };
    document.title = 'Ranking | EncuentraTuFuturo';
    fetchUnis();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [estado, tipo, pagActual]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // 2. Lógica para guardar en la DB
  const toggleFavorito = useCallback(async (uni) => {
    const yaEsFavorito = favoritos.has(uni.id);

    // Crear la nueva lista de IDs para enviar al backend
    let nuevosFavoritosIds;
    if (yaEsFavorito) {
      nuevosFavoritosIds = Array.from(favoritos).filter(id => id !== uni.id);
    } else {
      nuevosFavoritosIds = [...Array.from(favoritos), uni.id];
    }

    try {
      // Petición al backend para actualizar el perfil
      await axios.put('/api/perfil/', {
        favoritos: nuevosFavoritosIds
      }, {
        // Forzamos el encabezado manualmente si es necesario
        headers: {
          'X-CSRFToken': document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1]
        }
      });

      // Si la DB respondió bien, actualizamos el estado local
      setFavoritos(new Set(nuevosFavoritosIds));

      showToast(yaEsFavorito
        ? `"${uni.nombre}" eliminado de favoritos`
        : `"${uni.nombre}" agregado a favoritos ⭐`
      );
    } catch (err) {
      console.error("Error al guardar favorito:", err);
      showToast("Error al conectar con el servidor");
    }
  }, [favoritos]);

  const listaBotones = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-semibold animate-bounce-subtle flex items-center gap-2 pointer-events-none">
          <span>{toastMsg.includes('eliminado') ? '🗑️' : '⭐'}</span> {toastMsg}
        </div>
      )}

      {/* ... (Resto del JSX se mantiene igual) ... */}

      <div className="bg-white border-b border-gray-100 shadow-sm px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-2">🏆 Top Universidades</p>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-1">Ranking Nacional 2026</h1>
              <p className="text-gray-500 text-lg">Descubre las mejores instituciones y agrégalas a tus favoritos.</p>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="appearance-none w-full sm:w-56 px-4 py-3 bg-white border-2 border-gray-100 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium pr-10 cursor-pointer"
                >
                  <option value="">📍 Todo México</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>

              <div className="relative">
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="appearance-none w-full sm:w-44 px-4 py-3 bg-white border-2 border-gray-100 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium pr-10 cursor-pointer"
                >
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-600"></div>
            <p className="text-gray-400 font-medium animate-pulse">Cargando ranking...</p>
          </div>
        ) : unis.length === 0 ? (
          <div className="text-center py-32 text-gray-400">
            <p className="text-5xl mb-4">🏫</p>
            <p className="text-xl font-semibold">No se encontraron universidades con esos filtros.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-6 font-medium">
              Mostrando página <strong className="text-gray-700">{pagActual}</strong> de <strong className="text-gray-700">{totalPaginas}</strong>
            </p>

            <div className="flex flex-col gap-5">
              {unis.map((uni, index) => {
                const esFav = favoritos.has(uni.id);
                const posicion = (pagActual - 1) * 12 + index + 1;
                const fotoUrl = uni.foto_reference
                  ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${uni.foto_reference}&key=${API_KEY}`
                  : `https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=80`;

                return (
                  <div key={uni.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row">
                    {/* Foto */}
                    <div className="relative sm:w-52 md:w-64 flex-shrink-0 min-h-[180px] sm:min-h-0 overflow-hidden">
                      <img
                        src={fotoUrl}
                        alt={uni.nombre}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=80'; }}
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 shadow-md">
                        <span className="text-blue-600 font-black text-sm">#{posicion}</span>
                      </div>
                    </div>

                    {/* Datos */}
                    <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <Link to={`/universidad/${uni.id}`} className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight hover:underline">
                            {uni.nombre}
                          </Link>
                          <span className={`flex-shrink-0 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg ${uni.tipo === 'PUB' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {uni.tipo === 'PUB' ? ' PÚBLICA' : ' PRIVADA'}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm mb-4">
                          <span className="mr-1.5">📍</span>
                          <span>{uni.ciudad}, {uni.estado}</span>
                        </div>
                        <div className="mb-4">
                          <StarRating rating={uni.rating_google} />
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
                        <Link to={`/universidad/${uni.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition-colors">
                          Ver perfil completo <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                        </Link>

                        <button
                          onClick={() => toggleFavorito(uni)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${esFav
                            ? 'bg-amber-400 text-white shadow-md shadow-amber-200 hover:bg-amber-500'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300'
                            }`}
                        >
                          <span className={`text-base transition-transform ${esFav ? 'scale-125' : ''}`}>
                            {esFav ? '⭐' : '☆'}
                          </span>
                          {esFav ? 'En favoritos' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-14">
                <button onClick={() => setPagActual(p => Math.max(1, p - 1))} disabled={pagActual === 1} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                  ← Anterior
                </button>
                {listaBotones.map((num) => (
                  <button key={num} onClick={() => setPagActual(num)} className={`min-w-[42px] h-[42px] font-bold rounded-xl transition-all duration-200 shadow-sm border ${pagActual === num ? 'bg-blue-600 text-white border-blue-600 scale-110 shadow-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600'}`}>
                    {num}
                  </button>
                ))}
                <button onClick={() => setPagActual(p => Math.min(totalPaginas, p + 1))} disabled={pagActual === totalPaginas} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RankingPage;