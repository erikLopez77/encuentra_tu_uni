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
    const [showModal, setShowModal] = useState(false);
    const [errorModal, setErrorModal] = useState('');
    const [passwords, setPasswords] = useState({ nueva: '', confirmar: '' });

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
        if (!valor || valor.trim().length === 0) {
            setMensaje({ texto: `El campo ${campoParaBackend === 'first_name' ? 'nombre' : 'apellidos'} no puede estar vacío`, tipo: 'error' });
            return;
        }

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

    const cambiarPassword = async () => {
        // 1. Limpiamos errores previos (ahora lo manejamos como un string para que funcione con tu JSX)
        setErrorModal('');

        // 2. Validación: Vacío (Sustituye a isNull/isEmpty)
        if (!passwords.nueva || !passwords.confirmar) {
            setErrorModal('La contraseña no puede ir vacía');
            return;
        }

        // 3. Validación: Coincidencia
        if (passwords.nueva !== passwords.confirmar) {
            setErrorModal('Las contraseñas no coinciden');
            return;
        }

        // 4. Validación: Longitud
        if (passwords.nueva.length < 8) {
            setErrorModal('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        // 5. Validación: Solo números (Sustituye a isdigit)
        if (/^\d+$/.test(passwords.nueva)) {
            setErrorModal('La contraseña no puede ser solo números');
            return;
        }

        try {
            await axios.put(`${API}/perfil/`,
                { password: passwords.nueva },
                {
                    withCredentials: true,
                    headers: { 'X-CSRFToken': getCsrf() }
                }
            );

            // Si todo sale bien, cerramos y limpiamos
            setMensaje({ texto: 'Contraseña actualizada correctamente', tipo: 'success' });
            setShowModal(false);
            setPasswords({ nueva: '', confirmar: '' });
            setErrorModal(''); // Limpiar error

            // Quitar el mensaje de éxito después de 3 segundos
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);

        } catch (err) {
            // Esto nos dirá qué dice el servidor exactamente
            console.error("Error completo de Axios:", err.response);

            // Si el backend envió un mensaje de error (ej: "Solo letras"), úsalo.
            // Si no, usa el mensaje de error de la respuesta, y como última opción el genérico.
            const mensajeError = err.response?.data?.error ||
                err.response?.data?.detail ||
                "Error interno en el servidor (500)";

            setErrorModal(mensajeError);
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
                            <button className="text-blue-600 text-sm font-bold hover:underline" onClick={() => setShowModal(true)}>
                                Cambiar contraseña
                            </button>
                        </div>
                    </div>
                </div>
                {/* --- EL MODAL (Añadir al final del return, antes del último </div>) --- */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-bold mb-2">Cambiar contraseña</h2>
                            <p className="text-gray-500 text-sm mb-6">Introduce tu nueva contraseña para actualizarla.</p>
                            {errorModal && (
                                <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">
                                    ⚠️ {errorModal}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Nueva contraseña</label>
                                    <input
                                        type="password"
                                        className="w-full border-b-2 border-gray-100 focus:border-blue-600 outline-none py-2 transition-colors"
                                        value={passwords.nueva}
                                        onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Confirmar contraseña</label>
                                    <input
                                        type="password"
                                        className="w-full border-b-2 border-gray-100 focus:border-blue-600 outline-none py-2 transition-colors"
                                        value={passwords.confirmar}
                                        onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && cambiarPassword()}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => { setShowModal(false); setErrorModal('') }}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={cambiarPassword}
                                    className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 p-6 text-center">
                    <p className="text-gray-400 text-xs">Miembro desde 2026 • EncuentraTuFuturo</p>
                </div>
            </div>
        </div>
    );
};

export default PerfilPage;