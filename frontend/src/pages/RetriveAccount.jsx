import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
// Si usas una imagen local, impórtala así. Si no, usa el enlace de Unsplash.
// import bgImage from '../assets/images/biblioteca_moderna.jpg'; 
const getCsrf = () => {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
};
const RetriveAccount = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repetir_password, setRepetirPassword] = useState('');
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    // Imagen de fondo inspiradora (una biblioteca moderna y brillante)
    const backgroundUrl = "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=2000&auto=format&fit=crop";
    useEffect(() => {
        document.title = "Recuperar cuenta | EncuentraTuFuturo";
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // 1. Validaciones locales antes de activar loading
        if (!password || !email) {
            setError("Por favor, llena todos los campos obligatorios.");
            return;
        }
        if (password !== repetir_password) {
            setError("Las contraseñas no coinciden");
            return;
        }
        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        setLoading(true); // Solo activamos loading si pasó las pruebas locales

        try {
            const res = await axios.post("http://localhost:8000/api/retrieve/", {
                email: email,
                password: password,
            }, {
                headers: { 'X-CSRFToken': getCsrf() }
            });

            setIsSuccess(true); // exito
            setError("¡Contraseña actualizada con éxito! Redirigiendo al login...");

            setEmail('');
            setPassword('');
            setRepetirPassword('');

            setTimeout(() => window.location.href = "/login", 3000);

        } catch (err) {
            setIsSuccess(false); // <--- Marcamos que NO es éxito (es error)
            const mensajeError = err.response?.data?.error || "Error al conectar con el servidor";
            setError(mensajeError);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
        >
            {/* Capa de superposición oscura (Overlay) para contraste */}
            <div className="absolute min-h-screen inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

            {/* Tarjeta Principal (con blur de cristal) */}
            <div className="max-w-md w-full bg-white/95 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md border border-white/20 relative z-10 transition-all duration-300">

                {/* Encabezado con tu nuevo Logo Azul */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-blue-600 tracking-tighter">
                        EncuentraTuFuturo
                    </h2>
                    <p className="text-slate-600 mt-3 font-semibold text-lg">
                        Tu camino profesional empieza aquí
                    </p>
                </div>
                {error && (
                    <div className={`mb-6 p-4 border-l-4 rounded-r-xl transition-all duration-300 ${isSuccess
                        ? "bg-blue-50 border-blue-500 text-blue-800"  // Estilo para Éxito
                        : "bg-red-50 border-red-500 text-red-800"     // Estilo para Error
                        }`}>
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                )}
                <form className="space-y-6" onSubmit={handleSubmit} >
                    {/* Campo de Email */}
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2 ml-1">
                            Correo electrónico
                        </label>
                        <input
                            autoComplete='off'
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@universidad.edu.mx"
                            className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-inner"
                        />
                    </div>

                    {/* Campo de Contraseña */}
                    <div>
                        <div className="flex justify-between mb-2 ml-1">
                            <label className="text-sm font-bold text-slate-800">Nueva contraseña</label>

                        </div>
                        <input
                            autoComplete='off'
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-inner"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-2 ml-1">
                            <label className="text-sm font-bold text-slate-800">Repite tu nueva contraseña</label>

                        </div>
                        <input
                            autoComplete='off'
                            type="password"
                            name="repetir_password"
                            value={repetir_password}
                            onChange={(e) => setRepetirPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-inner"
                        />
                    </div>

                    {/* Botón Principal (Azul Profundo) */}
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200/50 transition-all active:scale-[0.98] mt-6 text-lg">
                        Restablecer mi contraseña
                    </button>
                </form>

                {/* Footer del Login */}
                {/* Footer del Login */}
                <div className="mt-10 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center w-full">
                        <Link
                            to="/login"
                            className="text-slate-600 font-bold text-sm hover:text-blue-600 transition-colors"
                        >
                            ← Iniciar sesión
                        </Link>

                        <Link
                            to="/crear-cuenta"
                            className="text-blue-600 font-bold text-sm hover:underline"
                        >
                            Crear cuenta
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RetriveAccount;