import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    
                    {/* Columna 1: Branding */}
                    <div className="col-span-1 md:col-span-1">
                        <h2 className="text-2xl font-black text-blue-600 tracking-tighter mb-4">
                            EncuentraTuFuturo
                        </h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            La plataforma líder en México para conectar estudiantes con su universidad ideal. Tu camino profesional empieza con una decisión informada.
                        </p>
                    </div>

                    {/* Columna 2: Enlaces Rápidos */}
                    <div>
                        <h4 className="text-slate-900 font-bold mb-6">Plataforma</h4>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li><Link to="/" className="hover:text-blue-600 transition-colors">Explorar Universidades</Link></li>
                            <li><Link to="/faqs" className="hover:text-blue-600 transition-colors">Preguntas Frecuentes</Link></li>
                            <li><Link to="/login" className="hover:text-blue-600 transition-colors">Mi Panel Académico</Link></li>
                        </ul>
                    </div>

                    {/* Columna 3: Soporte */}
                    <div>
                        <h4 className="text-slate-900 font-bold mb-6">Soporte</h4>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Centro de Ayuda</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Términos de Servicio</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Privacidad</a></li>
                        </ul>
                    </div>

                    {/* Columna 4: Newsletter/Contacto */}
                    <div>
                        <h4 className="text-slate-900 font-bold mb-6">Mantente al día</h4>
                        <div className="flex flex-col space-y-3">
                            <input 
                                type="email" 
                                placeholder="tu@correo.com" 
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button className="bg-blue-600 text-white font-bold py-2 rounded-xl text-sm hover:bg-blue-700 transition-all">
                                Suscribirme
                            </button>
                        </div>
                    </div>
                </div>

                {/* Línea final y Copyright */}
                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-400 text-xs">
                        © 2026 EncuentraTuFuturo. Todos los derechos reservados. Hecho con ❤️ en México.
                    </p>
                    <div className="flex gap-6">
                        {/* Aquí irían iconos de redes sociales */}
                        <span className="text-slate-300 text-xs">Síguenos en redes sociales</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;