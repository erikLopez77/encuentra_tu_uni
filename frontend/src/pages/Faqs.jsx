import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const faqs = [
    {
        id: 1,
        pregunta: "¿Cómo eligen las mejores universidades?",
        respuesta: "De momento tomamos en cuenta información de la API de google maps, ya que las opiniones son de los mismos estudiantes.  ",
        img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: 2,
        pregunta: "¿Cómo surgió este proyecto?",
        respuesta: "Este proyecto surge a partir de notar que algunos de nuestros estudiantes no estaban conformes con su universidad, ya que muchos de ellos son foráneos.",
        img: "https://images.unsplash.com/photo-1536925155833-43e9c2b2f499?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHVuaXZlcnNpdHl8ZW58MHx8MHx8fDA%3D"
    },
    {
        id: 3,
        pregunta: "¿Puedo comparar varias escuelas a la vez?",
        respuesta: "¡Claro! Puedes agregar hasta 3 universidades a tu lista de favoritos.",
        img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: 4,
        pregunta: "¿Por qué no aparece mi universidad?",
        respuesta: "Si tu universidad no aparece en nuestro ranking, puedes sugerirla a través de nuestro formulario de contacto. Estamos constantemente actualizando nuestra base de datos para incluir más instituciones.",
        img: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    }
];

const FAQCard = ({ faq, index }) => {
    // Determinamos si es par o impar para intercalar
    const isEven = index % 2 === 0;

    return (
        <motion.div 
            initial={{ opacity: 0, x: isEven ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 mb-24`}
        >
            {/* Contenedor de Imagen */}
            <div className="w-full md:w-1/2">
                <div className="relative">
                    <div className="absolute -inset-4 bg-blue-100 rounded-[2rem] -z-10 rotate-3"></div>
                    <img 
                        src={faq.img} 
                        alt={faq.pregunta}
                        className="w-full h-[350px] object-cover rounded-[2rem] shadow-2xl border-4 border-white"
                    />
                </div>
            </div>

            {/* Contenedor de Texto */}
            <div className="w-full md:w-1/2 space-y-6">
                <span className="text-blue-600 font-black text-6xl opacity-20">0{index + 1}</span>
                <h3 className="text-3xl font-black text-slate-800 leading-tight">
                    {faq.pregunta}
                </h3>
                <p className="text-xl text-slate-600 leading-relaxed border-l-4 border-blue-600 pl-6">
                    {faq.respuesta}
                </p>
    
            </div>
        </motion.div>
    );
};

const FAQs = () => {
    useEffect(() => {
        document.title = "FAQs | EncuentraTuFuturo";
    }, []);
    return (
        <div className="bg-slate-50 min-h-screen py-24 px-6">
            <div className="max-w-6xl mx-auto">
                
                {/* Header de la sección */}
                <div className="text-center mb-32">
                    <motion.span 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-blue-600 font-bold tracking-[0.2em] uppercase text-sm"
                    >
                        Centro de Ayuda
                    </motion.span>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-slate-900 mt-4 mb-8"
                    >
                        Preguntas <span className="text-blue-600">Frecuentes</span>
                    </motion.h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        Todo lo que necesitas saber para dar el siguiente gran paso en tu carrera profesional.
                    </p>
                </div>

                {/* Lista de Preguntas Intercaladas */}
                <div className="space-y-12">
                    {faqs.map((faq, index) => (
                        <FAQCard key={faq.id} faq={faq} index={index} />
                    ))}
                </div>

                {/* Call to Action Final */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="mt-32 bg-blue-600 p-12 rounded-[3rem] text-center text-white shadow-2xl shadow-blue-200"
                >
                    <h3 className="text-3xl font-bold mb-4">¿Aún tienes dudas?</h3>
                    <p className="text-blue-100 mb-8 text-lg">Nuestro equipo de orientadores está listo para ayudarte personalmente.</p>
                    <button className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black hover:bg-blue-50 transition-colors shadow-lg">
                        Contactar Soporte
                    </button>
                </motion.div>

            </div>
        </div>
    );
};

export default FAQs;