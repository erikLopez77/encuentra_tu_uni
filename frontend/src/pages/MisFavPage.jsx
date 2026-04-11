import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Lee el token CSRF de la cookie que Django pone al hacer GET /api/perfil/
const getCsrf = () => {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
};

const API = 'http://localhost:8000/api';
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

const MisFavPage = () => {
    const [unis, setUnis] = useState([]);       // array de universidades completas
    const [ids, setIds] = useState([]);          // array de IDs favoritos
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [quitando, setQuitando] = useState(null); // ID del que se está procesando

    useEffect(() => {
        document.title = 'Mis Favoritos | EncuentraTuFuturo';
        const fetchFavoritos = async () => {
            setLoading(true);
            setError('');
            try {
                // GET /api/perfil/ — Django también pone la cookie csrftoken aquí
                const res = await axios.get(`${API}/perfil/`, { withCredentials: true });
                setUnis(res.data.favoritos_detalles ?? []);
                setIds(res.data.favoritos ?? []);
            } catch (err) {
                console.error('Error cargando favoritos:', err);
                if (err.response?.status === 403 || err.response?.status === 401) {
                    setError('Tu sesión expiró. Por favor inicia sesión de nuevo.');
                } else {
                    setError('No se pudo cargar tu lista de favoritos. Intenta recargar la página.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchFavoritos();
    }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const quitarFavorito = async (uni) => {
        setQuitando(uni.id);
        const nuevosIds = ids.filter((id) => id !== uni.id);

        try {
            // Obtenemos el token de la cookie
            const csrfToken = getCsrf();

            await axios.put(
                `${API}/perfil/`,
                { favoritos: nuevosIds },
                {
                    withCredentials: true, // Crucial para la sesión
                    headers: {
                        'X-CSRFToken': csrfToken // Crucial para la seguridad de Django
                    }
                }
            );

            // Actualizamos los estados locales solo si la API respondió 200 OK
            setUnis((prev) => prev.filter((u) => u.id !== uni.id));
            setIds(nuevosIds);
            showToast(`"${uni.nombre}" eliminado`);
        } catch (err) {
            console.error('Error al eliminar favorito:', err);
            // Si el error es 403, probablemente el token CSRF falló o expiró
            if (err.response?.status === 403) {
                alert("Error de permisos (CSRF). Intenta recargar la página.");
            } else {
                showToast("No se pudo eliminar de favoritos");
            }
        } finally {
            setQuitando(null);
        }
    };

    // ─── Render ─────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-600" />
                <p className="text-gray-400 font-medium animate-pulse">Cargando tus favoritos...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-semibold flex items-center gap-2 pointer-events-none">
                    ⭐ {toast}
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm px-6 py-10">
                <div className="max-w-5xl mx-auto">
                    <p className="text-amber-500 font-bold text-sm uppercase tracking-widest mb-2">⭐ Colección personal</p>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-1">Mis Favoritos</h1>
                    <p className="text-gray-500 text-lg">
                        {unis.length > 0
                            ? `Tienes ${unis.length} universidad${unis.length !== 1 ? 'es' : ''} guardada${unis.length !== 1 ? 's' : ''}.`
                            : 'Aquí aparecerán las universidades que marques como favoritas.'}
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 mb-8 flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-bold">Ocurrió un error</p>
                            <p className="text-sm mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {/* Estado vacío */}
                {!error && unis.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-5xl mb-6">
                            ☆
                        </div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-3">
                            No hay universidades agregadas por el momento
                        </h2>
                        <p className="text-gray-400 max-w-sm mb-8">
                            Explora el ranking y presiona el botón <strong>"Agregar"</strong> en las universidades que te interesen.
                        </p>
                        <Link
                            to="/ranking"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-200"
                        >
                            Ir al Ranking →
                        </Link>
                    </div>
                )}

                {/* Lista de favoritos */}
                {unis.length > 0 && (
                    <div className="flex flex-col gap-5">
                        {unis.map((uni, index) => {
                            const fotoUrl = uni.foto_reference
                                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${uni.foto_reference}&key=${API_KEY}`
                                : 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=80';

                            return (
                                <div
                                    key={uni.id}
                                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row"
                                >
                                    {/* Foto */}
                                    <div className="relative sm:w-52 md:w-64 flex-shrink-0 min-h-[180px] sm:min-h-0 overflow-hidden">
                                        <img
                                            src={fotoUrl}
                                            alt={uni.nombre}
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=80';
                                            }}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 shadow-md">
                                            <span className="text-amber-500 font-black text-sm">★ {uni.rating_google}</span>
                                        </div>
                                    </div>

                                    {/* Datos */}
                                    <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                                <Link
                                                    to={`/universidad/${uni.id}`}
                                                    className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors leading-tight hover:underline"
                                                >
                                                    {uni.nombre}
                                                </Link>
                                                <span className={`flex-shrink-0 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg ${uni.tipo === 'PUB'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-indigo-100 text-indigo-700'
                                                    }`}>
                                                    {uni.tipo === 'PUB' ? '🏛 PÚBLICA' : '🎓 PRIVADA'}
                                                </span>
                                            </div>

                                            <div className="flex items-center text-gray-500 text-sm mb-4">
                                                <span className="mr-1.5">📍</span>
                                                {uni.ciudad}, {uni.estado}
                                            </div>

                                            {uni.descripcion_ia && (
                                                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">
                                                    {uni.descripcion_ia}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-4 text-sm">
                                                {uni.telefono && (
                                                    <span className="flex items-center gap-1 text-gray-500">
                                                        <span>📞</span> {uni.telefono}
                                                    </span>
                                                )}
                                                {uni.sitio_oficial && (
                                                    <a
                                                        href={uni.sitio_oficial}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium"
                                                    >
                                                        <span>🌐</span> Sitio oficial
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
                                            <Link
                                                to={`/universidad/${uni.id}`}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition-colors"
                                            >
                                                Ver perfil completo →
                                            </Link>

                                            <button
                                                onClick={() => quitarFavorito(uni)}
                                                disabled={quitando === uni.id}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-red-200 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {quitando === uni.id ? (
                                                    <span className="animate-spin">⏳</span>
                                                ) : (
                                                    <span>🗑</span>
                                                )}
                                                {quitando === uni.id ? 'Quitando...' : 'Quitar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MisFavPage;