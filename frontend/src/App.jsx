import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import UserNavbar from './components/UserNavbar';
import HomePage from './pages/HomePage'; 
import UniversidadDetalle from './pages/UniversidadDetalle';
import Faqs from './pages/Faqs';
import Login from './pages/Login';
import CreateProfile from './pages/CreateProfile';
import RetriveAccount from './pages/RetriveAccount';
import UserDashboard from './pages/UserDashboard';
import RankingPage from './pages/RankingPage';
import Footer from './components/Footer';

const MainLayout = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    <main className="flex-grow max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const AuthLayout = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <UserNavbar />
    <main className="flex-grow max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full">
      <Outlet />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} /> 
          <Route path="/universidad/:id" element={<UniversidadDetalle/>}/>
          <Route path="/login" element={<Login/>} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="/crear-cuenta" element={<CreateProfile />} />
          <Route path="/recuperar-cuenta" element={<RetriveAccount />} />
        </Route>
        
        <Route element={<AuthLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/favoritos" element={<UserDashboard />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/perfil" element={<UserDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;