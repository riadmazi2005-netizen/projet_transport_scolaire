import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import TuteurSidebar from './TuteurSidebar';
import { notificationsAPI } from '../services/apiService';

export default function TuteurLayout({ children, title = 'Espace Tuteur' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tuteur, setTuteur] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    
    const tuteurData = JSON.parse(session);
    setTuteur(tuteurData);
    loadNotifications(tuteurData.id);
    setLoading(false);
  }, [navigate]);

  // Rafraîchir les notifications quand on navigue vers la page des notifications
  useEffect(() => {
    if (tuteur && location.pathname === '/TuteurNotifications') {
      loadNotifications(tuteur.id);
    }
  }, [location.pathname, tuteur]);

  // Rafraîchir les notifications toutes les 30 secondes
  useEffect(() => {
    if (!tuteur) return;
    
    const loadAllData = async () => {
      await loadNotifications(tuteur.id);
    };
    
    loadAllData();
    const interval = setInterval(loadAllData, 30000);
    
    return () => clearInterval(interval);
  }, [tuteur]);

  const loadNotifications = async (tuteurId) => {
    try {
      const response = await notificationsAPI.getByUser(tuteurId, 'tuteur');
      const notifs = response?.data || response || [];
      setNotifications(notifs.sort((a, b) => new Date(b.date || b.date_creation || 0) - new Date(a.date || a.date_creation || 0)));
    } catch (err) {
      console.warn('Erreur lors du chargement des notifications:', err);
      setNotifications([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tuteur_session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate(createPageUrl('Home'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-lime-50">
      <TuteurSidebar
        tuteur={tuteur}
        notifications={notifications}
        onLogout={handleLogout}
      />
      
      <main className="lg:ml-[280px] min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

