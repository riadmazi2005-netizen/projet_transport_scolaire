import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ChauffeurSidebar from './ChauffeurSidebar';
import { notificationsAPI } from '../services/apiService';

export default function ChauffeurLayout({ children, title = 'Espace Chauffeur', activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [chauffeur, setChauffeur] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('chauffeur_session');
    if (!session) {
      navigate(createPageUrl('ChauffeurLogin'));
      return;
    }
    
    const chauffeurData = JSON.parse(session);
    setChauffeur(chauffeurData);
    loadNotifications(chauffeurData.id);
    setLoading(false);
  }, [navigate]);

  // Rafraîchir les notifications toutes les 30 secondes
  useEffect(() => {
    if (!chauffeur) return;
    
    const loadAllData = async () => {
      await loadNotifications(chauffeur.id);
    };
    
    loadAllData();
    const interval = setInterval(loadAllData, 30000);
    
    return () => clearInterval(interval);
  }, [chauffeur]);

  const loadNotifications = async (chauffeurId) => {
    try {
      const response = await notificationsAPI.getByUser(chauffeurId, 'chauffeur');
      const notifs = response?.data || response || [];
      setNotifications(notifs.sort((a, b) => new Date(b.date || b.date_creation || 0) - new Date(a.date || a.date_creation || 0)));
    } catch (err) {
      console.warn('Erreur lors du chargement des notifications:', err);
      setNotifications([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chauffeur_session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate(createPageUrl('Home'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <ChauffeurSidebar
        chauffeur={chauffeur}
        notifications={notifications}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCollapseChange={setSidebarCollapsed}
      />
      
      <main className={`min-h-screen p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'
      }`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

