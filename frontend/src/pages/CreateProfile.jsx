import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CreateProfile = () => {
    const navigate = useNavigate();
    const backgroundUrl = "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=2000&auto=format&fit=crop";

    // 1. Estado para los campos del formulario
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        repetir_password: ''
    });

    // 2. Estado para errores y carga
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = "Crear cuenta | EncuentraTuFuturo";
    }, []);

    // Manejador de cambios en inputs
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(""); // Limpiar error mientras el usuario escribe
    };

    // 3. Lógica de validación
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validaciones básicas
        if (!formData.first_name || !formData.email || !formData.password) {
            setError("Por favor, llena todos los campos obligatorios.");
            return;
        }

        if (formData.password !== formData.repetir_password) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (formData.password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        // 4. Petición al Backend
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/register/', { // Ajusta tu URL
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.email, // Usualmente el email es el username
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Éxito: Redirigir al login
                navigate('/login?registered=true');
            } else {
                // Error del servidor (ej. el correo ya existe)
                setError(data.detail || data.error || "Error al crear la cuenta.");
            }
        } catch (err) {
            setError("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat relative"
             style={{ backgroundImage: `url(${backgroundUrl})` }}>
            <div className="absolute min-h-screen inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

            <div className="max-w-md w-full bg-white/95 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md border border-white/20 relative z-10">
                
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black text-blue-600 tracking-tighter">EncuentraTuFuturo</h2>
                    <p className="text-slate-600 mt-2 font-semibold">Crea tu perfil académico</p>
                </div>

                {/* Mensaje de Error Estético */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl animate-pulse">
                        <p className="font-bold">Atención:</p>
                        <p>{error}</p>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Nombre(s)</label>
                            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} autocomplete="off"
                                   className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500 transition-all text-sm" placeholder="Tu nombre(s)" />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Apellido(s)</label>
                            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} autocomplete="off"
                                   className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500 transition-all text-sm" placeholder="Tus apellido(s)" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Correo electrónico</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} autocomplete="off"
                               className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500 transition-all text-sm" placeholder="ejemplo@uni.mx" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Contraseña</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} autocomplete="off"
                               className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500 transition-all text-sm" placeholder="••••••••" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Confirmar contraseña</label>
                        <input type="password" name="repetir_password" value={formData.repetir_password} onChange={handleChange} autocomplete="off"
                               className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-blue-500 transition-all text-sm" placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={loading}
                            className={`w-full ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] mt-4`}>
                        {loading ? "Procesando..." : "Crear cuenta"}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <Link to="/login" className="text-slate-600 font-bold text-xs hover:text-blue-600 transition-colors">← Volver al login</Link>
                    <Link to="/recuperar-cuenta" className="text-blue-600 font-bold text-xs hover:underline">¿Olvidaste tu clave?</Link>
                </div>
            </div>
        </div>
    );
}

export default CreateProfile;