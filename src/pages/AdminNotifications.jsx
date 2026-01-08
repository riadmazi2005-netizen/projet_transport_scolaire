import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { notificationsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import AdminLayout from '../components/AdminLayout';
import {
  Bell, ArrowLeft, CheckCircle, AlertCircle, Info, Trash2,
  Mail, FileText, AlertTriangle, XCircle, Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, info, alerte, warning, success
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      navigate(createPageUrl('AdminLogin'));
      return;
    }

    const adminData = JSON.parse(session);
    setAdmin(adminData);
    loadNotifications(adminData.id);
  }, [navigate]);

  const loadNotifications = async (userId) => {
    setLoading(true);
    try {
      const response = await notificationsAPI.getByUser(userId, 'admin');
      const notificationsData = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      // Trier par date décroissante (plus récentes en premier)
      const sortedNotifications = notificationsData.sort((a, b) => {
        const dateA = new Date(a.date || a.date_creation || 0);
        const dateB = new Date(b.date || b.date_creation || 0);
        return dateB - dateA;
      });
      setNotifications(sortedNotifications);

      // Marquer automatiquement comme lu si demandé par l'utilisateur
      // "si j'entre a la page il va s'eteindre"
      const unread = sortedNotifications.filter(n => !n.lue);
      if (unread.length > 0) {
        // Marquer tout comme lu silencieusement
        // On ne bloque pas l'UI, on lance juste les requêtes
        unread.forEach(n => {
          notificationsAPI.marquerLue(n.id).catch(console.error);
        });
        // Mettre à jour l'état local pour éteindre le badge immédiatement
        setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await notificationsAPI.marquerLue(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, lue: true } : n));
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      await notificationsAPI.delete(notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  const deleteAllNotifications = async () => {
    if (!admin) return;

    try {
      await notificationsAPI.deleteAll(admin.id, 'admin');
      setNotifications([]);
    } catch (err) {
      console.error('Erreur lors de la suppression de toutes les notifications:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type, titre) => {
    const lowerTitle = titre?.toLowerCase() || '';
    const lowerType = type?.toLowerCase() || '';

    if (lowerType === 'alerte' || lowerTitle.includes('accident') || lowerTitle.includes('urgent') || lowerTitle.includes('requis')) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (lowerType === 'warning' || lowerTitle.includes('attention') || lowerTitle.includes('avertissement')) {
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    }
    if (lowerTitle.includes('message') || lowerTitle.includes('contact')) {
      return <Mail className="w-5 h-5 text-blue-500" />;
    }
    if (lowerTitle.includes('rapport') || lowerTitle.includes('rapports')) {
      return <FileText className="w-5 h-5 text-purple-500" />;
    }
    if (lowerType === 'success' || lowerTitle.includes('confirm') || lowerTitle.includes('validé')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  const getNotificationColor = (type, titre) => {
    const lowerType = type?.toLowerCase() || '';
    const lowerTitle = titre?.toLowerCase() || '';

    if (lowerType === 'alerte' || lowerTitle.includes('accident') || lowerTitle.includes('urgent') || lowerTitle.includes('requis')) {
      return 'bg-red-50 border-red-200';
    }
    if (lowerType === 'warning' || lowerTitle.includes('attention')) {
      return 'bg-orange-50 border-orange-200';
    }
    if (lowerType === 'success' || lowerTitle.includes('confirm') || lowerTitle.includes('validé')) {
      return 'bg-green-50 border-green-200';
    }
    return 'bg-blue-50 border-blue-200';
  };

  const filteredNotifications = notifications.filter(notif => {
    // Filtre par lecture
    if (filter === 'unread' && notif.lue) return false;
    if (filter === 'read' && !notif.lue) return false;

    // Filtre par type
    if (typeFilter !== 'all') {
      if (typeFilter === 'message') {
        const lowerTitle = notif.titre?.toLowerCase() || '';
        // Un message peut être identifié par le titre "message" ou "contact"
        if (!lowerTitle.includes('message') && !lowerTitle.includes('contact')) return false;
      } else if (notif.type?.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.lue).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Mes Notifications">
      <div className="mb-4">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Mes Notifications</h1>
              <p className="text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                  : 'Aucune notification non lue'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-4 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Filtrer par statut
            </label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="unread">Non lues ({notifications.filter(n => !n.lue).length})</SelectItem>
                <SelectItem value="read">Lues ({notifications.filter(n => n.lue).length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Filtrer par type
            </label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="info">Informations</SelectItem>
                <SelectItem value="alerte">Alertes</SelectItem>
                <SelectItem value="warning">Avertissements</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Boutons d'action */}
        {notifications.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Marquer comme lu seulement les notifications filtrées visibles
                  const notifsToMark = filteredNotifications.filter(n => !n.lue);
                  notifsToMark.forEach(n => markAsRead(n.id));
                }}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer toutes les notifications
            </Button>
          </div>
        )}
      </motion.div>

      {/* Liste des notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune notification</h3>
            <p className="text-gray-500">
              {filter === 'all'
                ? 'Vous n\'avez aucune notification pour le moment.'
                : `Aucune notification ${filter === 'unread' ? 'non lue' : 'lue'} trouvée.`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 ${notif.lue
                ? 'border-gray-300 opacity-75'
                : 'border-amber-500'
                } ${getNotificationColor(notif.type, notif.titre)}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`mt-1 ${notif.lue ? 'opacity-50' : ''}`}>
                      {getNotificationIcon(notif.type, notif.titre)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={`font-semibold text-gray-800 ${notif.lue ? 'line-through' : ''}`}>
                          {notif.titre}
                        </h3>
                        {!notif.lue && (
                          <span className="px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full whitespace-nowrap">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{notif.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatDate(notif.date || notif.date_creation)}</span>
                        {notif.type && (
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium">
                            {notif.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notif.lue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notif.id)}
                        className="rounded-xl text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Marquer comme lu"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notif.id)}
                      className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Dialog de confirmation de suppression de toutes les notifications */}
      <ConfirmDialog
        isOpen={showDeleteAllConfirm}
        title="Supprimer toutes les notifications"
        message="Êtes-vous sûr de vouloir supprimer toutes les notifications ? Cette action est irréversible."
        onConfirm={() => {
          deleteAllNotifications();
          setShowDeleteAllConfirm(false);
        }}
        onCancel={() => setShowDeleteAllConfirm(false)}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </AdminLayout>
  );
}

