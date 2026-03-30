import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* El Navbar siempre visible arriba */}
        <Navbar />

        {/* Contenido de las páginas */}
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={
              <div className="text-center py-20">
                <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                  Encuentra la universidad <span className="text-blue-600">ideal para ti</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Explora rankings, carreras y opiniones de estudiantes para tomar la mejor decisión sobre tu futuro académico.
                </p>
              </div>
            } />
            
            <Route path="/login" element={<div className="text-center text-2xl font-bold p-10">Sección de Login (Próximamente)</div>} />
            <Route path="/faqs" element={<div className="text-center text-2xl font-bold p-10">Preguntas Frecuentes</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;