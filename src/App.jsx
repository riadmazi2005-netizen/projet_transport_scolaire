// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import ChauffeurLogin from './pages/ChauffeurLogin';
import ChauffeurDashboard from './pages/ChauffeurDashboard';
import ResponsableLogin from './pages/ResponsableLogin';
import ResponsableDashboard from './pages/ResponsableDashboard';
import TuteurLogin from './pages/TuteurLogin';
import TuteurDashboard from './pages/TuteurDashboard';
import TuteurRegister from './pages/TuteurRegister';
import TuteurProfile from './pages/TuteurProfile';
import TuteurInscription from './pages/TuteurInscription';
import TuteurPaiement from './pages/TuteurPaiement';
import TuteurEleveDetails from './pages/TuteurEleveDetails';
import TuteurDemandes from './pages/TuteurDemandes';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminBus from './pages/AdminBus';
import AdminChauffeur from './pages/AdminChauffeur';
import AdminResponsable from './pages/AdminResponsable';
import AdminEleves from './pages/AdminEleves';
import AdminInscriptions from './pages/AdminInscriptions';
import AdminStats from './pages/AdminStats';
import AdminPaiements from './pages/AdminPaiements';
import AdminProfile from './pages/AdminProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />
        <Route path="/Home" element={<Home />} />

        {/* Chauffeur Routes */}
        <Route path="/ChauffeurLogin" element={<ChauffeurLogin />} />
        <Route path="/ChauffeurDashboard" element={<ChauffeurDashboard />} />

        {/* Responsable Routes */}
        <Route path="/ResponsableLogin" element={<ResponsableLogin />} />
        <Route path="/ResponsableDashboard" element={<ResponsableDashboard />} />

        {/* Tuteur Routes */}
        <Route path="/TuteurLogin" element={<TuteurLogin />} />
        <Route path="/TuteurRegister" element={<TuteurRegister />} />
        <Route path="/TuteurDashboard" element={<TuteurDashboard />} />
        <Route path="/TuteurProfile" element={<TuteurProfile />} />
        <Route path="/TuteurInscription" element={<TuteurInscription />} />
        <Route path="/TuteurPaiement" element={<TuteurPaiement />} />
        <Route path="/TuteurEleveDetails" element={<TuteurEleveDetails />} />
        <Route path="/TuteurDemandes" element={<TuteurDemandes />} />

        {/* Admin Routes */}
        <Route path="/AdminLogin" element={<AdminLogin />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/AdminEleves" element={<AdminEleves />} />
        <Route path="/AdminBus" element={<AdminBus />} />
        <Route path="/AdminChauffeurs" element={<AdminChauffeur />} />
        <Route path="/AdminResponsables" element={<AdminResponsable />} />
        <Route path="/AdminInscriptions" element={<AdminInscriptions />} />
        <Route path="/AdminStats" element={<AdminStats />} />
        <Route path="/AdminPaiements" element={<AdminPaiements />} />
        <Route path="/AdminProfile" element={<AdminProfile />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
