import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage'; 
import UniversidadDetalle from './pages/UniversidadDetalle';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<HomePage />} /> 
            <Route path="/universidad/:id" element={<UniversidadDetalle/>}/>
            <Route path="/login" element={<div className="text-center text-2xl font-bold p-10">Página de Login</div>} />
            <Route path="/faqs" element={<div className="text-center text-2xl font-bold p-10">Preguntas Frecuentes</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;