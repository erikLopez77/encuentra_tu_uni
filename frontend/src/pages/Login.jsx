import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Login = () => {
    const backgroundUrl = "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=2000&auto=format&fit=crop";
    
    // 1. Estados para manejar el mensaje de éxito
    const [showSuccess, setShowSuccess] = useState(false);
    const location = useLocation();

    useEffect(() => {
        document.title = "Login | EncuentraTuFuturo";
        
        // 2. Detectar si venimos de un registro exitoso (?registered=true)
        const params = new URLSearchParams(location.search);
        if (params.get('registered') === 'true') {
            setShowSuccess(true);
        }
    }, [location]);

    return (
        <div 
            className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
        >
            <div className="absolute min-h-screen inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

            <div className="max-w-md w-full bg-white/95 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md border border-white/20 relative z-10 transition-all duration-300">
                
                {/* 3. Mensaje de Éxito Estético */}
                {showSuccess && (
                    <div className="mb-8 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-xl relative animate-bounce-subtle">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500 text-white rounded-full p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-black text-sm uppercase tracking-wide">¡Bienvenido!</p>
                                <p className="text-xs font-semibold opacity-90">Tu cuenta de EncuentraTuFuturo ha sido creada. Ya puedes iniciar sesión.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowSuccess(false)}
                            className="absolute top-2 right-2 text-emerald-400 hover:text-emerald-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-blue-600 tracking-tighter">
                        EncuentraTuFuturo
                    </h2>
                    <p className="text-slate-600 mt-3 font-semibold text-lg">
                        Tu camino profesional empieza aquí
                    </p>
                </div>

                <form className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-2 ml-1">
                            Correo electrónico
                        </label>
                        <input 
                            autoComplete="off"
                            type="email" 
                            name="email" 
                            placeholder="ejemplo@universidad.edu.mx"
                            className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-inner"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2 ml-1">
                            <label className="text-sm font-bold text-slate-800">Contraseña</label>
                            <Link to="/recuperar-cuenta" className="text-xs font-semibold text-blue-600 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                        <input 
                            autoComplete="off"
                            type="password" 
                            name="password" 
                            placeholder="••••••••"
                            className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-inner"
                        />
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200/50 transition-all active:scale-[0.98] mt-6 text-lg">
                        Ingresar a mi cuenta
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                    <p className="text-slate-600 font-medium">
                        ¿Nuevo en el futuro académico?
                        <Link to="/crear-cuenta" className="text-blue-600 font-black ml-1.5 hover:underline">
                            Crea tu perfil gratis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;