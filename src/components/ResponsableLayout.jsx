import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ResponsableSidebar from './ResponsableSidebar';
import { notificationsAPI } from '../services/apiService';

export default function ResponsableLayout({ children, title = 'Espace Responsable' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [responsable, setResponsable] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('responsable_session');
    if (!session) {
      navigate(createPageUrl('ResponsableLogin'));
      return;
    }
    
    const responsableData = JSON.parse(session);
    setResponsable(responsableData);
    loadNotifications(responsableData.id);
    setLoading(false);
  }, [navigate]);

  // Rafraîchir les notifications toutes les 30 secondes
  useEffect(() => {
    if (!responsable) return;
    
    const loadAllData = async () => {
      await loadNotifications(responsable.id);
    };
    
    loadAllData();
    const interval = setInterval(loadAllData, 30000);
    
    return () => clearInterval(interval);
  }, [responsable]);

  const loadNotifications = async (responsableId) => {
    try {
      const response = await notificationsAPI.getByUser(responsableId, 'responsable');
      const notifs = response?.data || response || [];
      setNotifications(notifs.sort((a, b) => new Date(b.date || b.date_creation || 0) - new Date(a.date || a.date_creation || 0)));
    } catch (err) {
      console.warn('Erreur lors du chargement des notifications:', err);
      setNotifications([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('responsable_session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate(createPageUrl('Home'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <ResponsableSidebar
        responsable={responsable}
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

