import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AdminSidebar from './AdminSidebar';
import { notificationsAPI } from '../services/apiService';

export default function AdminLayout({ children, title = 'Administration' }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      navigate(createPageUrl('AdminLogin'));
      return;
    }
    
    const adminData = JSON.parse(session);
    setAdmin(adminData);
    loadNotifications(adminData.id);
    setLoading(false);
  }, [navigate]);

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

