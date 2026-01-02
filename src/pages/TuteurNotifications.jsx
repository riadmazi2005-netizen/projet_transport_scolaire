import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { notificationsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  Bell, ArrowLeft, CheckCircle, AlertCircle, Info, Trash2, 
  Mail, FileText, AlertTriangle, XCircle, Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TuteurNotifications() {
  const navigate = useNavigate();
  const [tuteur, setTuteur] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, info, alerte, warning, success

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    
    const tuteurData = JSON.parse(session);
    setTuteur(tuteurData);
    loadNotifications(tuteurData.id);
  }, [navigate]);

  const loadNotifications = async (userId) => {
    setLoading(true);
    try {
      const response = await notificationsAPI.getByUser(userId, 'tuteur');
      const notificationsData = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      // Trier par date décroissante (plus récentes en premier)
      const sortedNotifications = notificationsData.sort((a, b) => {
        const dateA = new Date(a.date || a.date_creation || 0);
        const dateB = new Date(b.date || b.date_creation || 0);
        return dateB - dateA;
      });
      setNotifications(sortedNotifications);
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
    
    if (lowerType === 'alerte' || lowerTitle.includes('accident') || lowerTitle.includes('urgent')) {
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
    
    if (lowerType === 'alerte' || lowerTitle.includes('accident') || lowerTitle.includes('urgent')) {
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
    if (typeFilter !== 'all' && notif.type?.toLowerCase() !== typeFilter.toLowerCase()) return false;
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.lue).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 via-white to-lime-50">
        <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-lime-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('TuteurDashboard')}>
                <Button variant="ghost" size="sm" className="rounded-xl">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Retour
                </Button>
              </Link>
              <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-lime-500 rounded-2xl flex items-center justify-center shadow-lg">
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
                  <SelectItem value="info">Informations</SelectItem>
                  <SelectItem value="alerte">Alertes</SelectItem>
                  <SelectItem value="warning">Avertissements</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 ${
                  notif.lue 
                    ? 'border-gray-300 opacity-75' 
                    : 'border-lime-500'
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
                            <span className="px-2 py-1 bg-lime-500 text-white text-xs font-semibold rounded-full whitespace-nowrap">
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
      </div>
    </div>
  );
}

