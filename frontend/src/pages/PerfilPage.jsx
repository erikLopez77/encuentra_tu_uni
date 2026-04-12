import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000/api';
// Lee el token CSRF de la cookie que Django pone al hacer GET /api/perfil/
const getCsrf = () => {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
};

const PerfilPage = () => {
    const [user, setUser] = useState({
        nombre: '',
        apellidos: '',
        email: '',
    });
    const [editando, setEditando] = useState(null); // Guarda el nombre del campo que se edita (p. ej. 'nombre')
    const [tempValue, setTempValue] = useState(''); // Valor temporal mientras escribes
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const res = await axios.get(`${API}/perfil/`, { withCredentials: true });
            setUser({
                nombre: res.data.nombre || '',
                apellidos: res.data.apellidos || '',
                email: res.data.email || '',
            });
        } catch (err) {
            console.error("Error al cargar perfil", err);
        } finally {
            setLoading(false);
        }
    };

    const iniciarEdicion = (campo, valor) => {
        setEditando(campo);
        setTempValue(valor);
    };

    // Cambia la función guardarCambio para que envíe las llaves correctas
    const guardarCambio = async (campoParaBackend, valor) => {
        try {
            await axios.put(`${API}/perfil/`,
                { [campoParaBackend]: valor }, // Enviamos la llave que Django espera
                {
                    withCredentials: true,
                    headers: { 'X-CSRFToken': getCsrf() }
                });

            // Actualizamos el estado local de la UI
            const campoUI = campoParaBackend === 'first_name' ? 'nombre' : 'apellidos';
            setUser({ ...user, [campoUI]: valor });

            setEditando(null);
            setMensaje({ texto: 'Información actualizada', tipo: 'success' });
        } catch (err) {
            setMensaje({ texto: err.response?.data?.error || 'Error al actualizar', tipo: 'error' });
        } finally {
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    if (loading) return <div className="text-center py-20">Cargando perfil...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Header */}
                <div className="bg-blue-600 p-8 text-white">
                    <h1 className="text-2xl font-bold">Mi Perfil</h1>
                    <p className="opacity-80 text-sm">Gestiona tu información personal</p>
                </div>

                <div className="p-8 space-y-6">
                    {mensaje.texto && (
                        <div className={`p-4 rounded-xl text-sm font-medium ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {mensaje.texto}
                        </div>
                    )}

                    {/* Campo: Nombre */}
                    <div className="flex flex-col gap-2 border-b border-gray-50 pb-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre</label>
                        <div className="flex items-center justify-between group">
                            {editando === 'first_name' ? (
                                <input
                                    className="flex-1 border-b-2 border-blue-500 outline-none py-1 text-gray-700 font-medium"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    autoFocus
                                    onBlur={() => setEditando(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && guardarCambio('first_name', tempValue)}
                                />
                            ) : (
                                <p className="text-lg text-gray-800 font-medium">{user.nombre}</p>
                            )}
                            <button
                                onClick={() => iniciarEdicion('first_name', user.nombre)}
                                className="text-gray-400 hover:text-blue-600 p-2 transition-colors"
                            >
                                ✎
                            </button>
                        </div>
                    </div>

                    {/* Campo: Apellidos */}
                    <div className="flex flex-col gap-2 border-b border-gray-50 pb-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Apellidos</label>
                        <div className="flex items-center justify-between">
                            {editando === 'last_name' ? (
                                <input
                                    className="flex-1 border-b-2 border-blue-500 outline-none py-1 text-gray-700 font-medium"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    autoFocus
                                    onBlur={() => setEditando(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && guardarCambio('last_name', tempValue)}
                                />
                            ) : (
                                <p className="text-lg text-gray-800 font-medium">{user.apellidos}</p>
                            )}
                            <button
                                onClick={() => iniciarEdicion('last_name', user.apellidos)}
                                className="text-gray-400 hover:text-blue-600 p-2 transition-colors"
                            >
                                ✎
                            </button>
                        </div>
                    </div>

                    {/* Campo: Email (Normalmente no se edita tan fácil, pero aquí está la estructura) */}
                    <div className="flex flex-col gap-2 border-b border-gray-50 pb-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico</label>
                        <p className="text-lg text-gray-500 font-medium">{user.email}</p>
                        <span className="text-[10px] text-gray-400">El email no puede modificarse directamente por seguridad.</span>
                    </div>

                    {/* Campo: Contraseña */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contraseña</label>
                        <div className="flex items-center justify-between">
                            <p className="text-lg text-gray-800 tracking-tighter">••••••••••••</p>
                            <button className="text-blue-600 text-sm font-bold hover:underline">
                                Cambiar contraseña
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 text-center">
                    <p className="text-gray-400 text-xs">Miembro desde 2026 • EncuentraTuFuturo</p>
                </div>
            </div>
        </div>
    );
};

export default PerfilPage;