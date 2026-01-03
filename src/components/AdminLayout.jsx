import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AdminSidebar from './AdminSidebar';
import { notificationsAPI, demandesAPI, accidentsAPI, signalementsAPI } from '../services/apiService';

export default function AdminLayout({ children, title = 'Administration' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemsCount, setNewItemsCount] = useState({
    inscriptions: 0,
    accidents: 0,
    problemes: 0
  });

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      navigate(createPageUrl('AdminLogin'));
      return;
    }
    
    const adminData = JSON.parse(session);
    setAdmin(adminData);
    loadNotifications(adminData.id);
    loadNewItemsCount();
    setLoading(false);
  }, [navigate]);

  // Rafraîchir les notifications quand on navigue vers la page des notifications
  useEffect(() => {
    if (admin && location.pathname === '/AdminNotifications') {
      loadNotifications(admin.id);
    }
  }, [location.pathname, admin]);

  // Rafraîchir les notifications et les compteurs toutes les 30 secondes
  useEffect(() => {
    if (!admin) return;
    
    const loadAllData = async () => {
      await loadNotifications(admin.id);
      await loadNewItemsCount();
    };
    
    loadAllData();
    const interval = setInterval(loadAllData, 30000);
    
    return () => clearInterval(interval);
  }, [admin]);

  const loadNotifications = async (adminId) => {
    try {
      const response = await notificationsAPI.getByUser(adminId, 'admin');
      const notifs = response?.data || response || [];
      setNotifications(notifs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
    } catch (err) {
      console.warn('Erreur lors du chargement des notifications:', err);
      setNotifications([]);
    }
  };

  const loadNewItemsCount = async () => {
    try {
      // Compter les nouvelles inscriptions (demandes en attente ou en cours de traitement)
      const demandesRes = await demandesAPI.getAll();
      const demandes = demandesRes?.data || demandesRes || [];
      const nouvellesInscriptions = demandes.filter(d => 
        d.type_demande === 'inscription' && 
        (d.statut === 'En attente' || d.statut === 'En cours de traitement')
      ).length;

      // Compter les nouveaux accidents non validés
      const accidentsRes = await accidentsAPI.getAll();
      const accidents = accidentsRes?.data || accidentsRes || [];
      const nouveauxAccidents = accidents.filter(a => a.statut === 'En attente').length;

      // Compter les nouveaux problèmes non résolus
      const signalementsRes = await signalementsAPI.getAll();
      const signalements = signalementsRes?.data || signalementsRes || [];
      const nouveauxProblemes = signalements.filter(s => 
        s.statut === 'En attente' || s.statut === 'En cours'
      ).length;

      setNewItemsCount({
        inscriptions: nouvellesInscriptions,
        accidents: nouveauxAccidents,
        problemes: nouveauxProblemes
      });
    } catch (err) {
      console.warn('Erreur lors du chargement des compteurs:', err);
      setNewItemsCount({ inscriptions: 0, accidents: 0, problemes: 0 });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate(createPageUrl('Home'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      <AdminSidebar
        admin={admin}
        notifications={notifications}
        newItemsCount={newItemsCount}
        onLogout={handleLogout}
        onNotificationClick={() => {}}
      />
      
      <main className="lg:ml-[280px] min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

