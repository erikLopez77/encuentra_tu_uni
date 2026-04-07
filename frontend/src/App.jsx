import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage'; 
import UniversidadDetalle from './pages/UniversidadDetalle';
import Faqs from './pages/Faqs';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<HomePage />} /> 
            <Route path="/universidad/:id" element={<UniversidadDetalle/>}/>
            <Route path="/login" element={<Login/>} />
            <Route path="/faqs" element={<Faqs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;