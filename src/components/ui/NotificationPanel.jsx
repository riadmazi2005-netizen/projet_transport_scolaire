import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function NotificationPanel({ 
  notifications = [], 
  onMarkAsRead, 
  onDelete,
  onClose,
  isOpen
}) {
  const [filter, setFilter] = useState('all'); // all, unread, read

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.lue;
    if (filter === 'read') return notif.lue === true;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.lue).length;

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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (titre) => {
    const lowerTitle = titre?.toLowerCase() || '';
    if (lowerTitle.includes('urgent') || lowerTitle.includes('alerte')) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (lowerTitle.includes('attention') || lowerTitle.includes('avertissement')) {
      return <AlertCircle className="w-5 h-5 text-green-500" />;
    }
    return <Info className="w-5 h-5 text-green-500" />;
  };

  const getNotificationColor = (titre) => {
    const lowerTitle = titre?.toLowerCase() || '';
    if (lowerTitle.includes('urgent') || lowerTitle.includes('alerte')) {
      return 'border-l-red-500 bg-red-50';
    }
    if (lowerTitle.includes('attention') || lowerTitle.includes('avertissement')) {
      return 'border-l-green-500 bg-green-50';
    }
    return 'border-l-green-500 bg-green-50';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Notifications</h2>
                  <p className="text-white/80 text-sm">{unreadCount} non lue(s)</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {['all', 'unread', 'read'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-white text-green-600 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {f === 'all' ? 'Toutes' : f === 'unread' ? 'Non lues' : 'Lues'}
                  {f === 'unread' && unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[calc(80vh-200px)] p-6 space-y-3">
            <AnimatePresence>
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-gray-400"
                >
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune notification</p>
                </motion.div>
              ) : (
                filteredNotifications.map((notif, index) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative border-l-4 rounded-xl p-4 transition-all ${
                      getNotificationColor(notif.titre)
                    } ${!notif.lue ? 'shadow-md' : 'opacity-75'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notif.titre)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-800 text-sm">
                            {notif.titre}
                          </h4>
                          {!notif.lue && (
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-gray-400">
                            {formatDate(notif.date || notif.date_creation)}
                          </p>
                          
                          <div className="flex gap-2">
                            {!notif.lue && (
                              <button
                                onClick={() => onMarkAsRead && onMarkAsRead(notif.id)}
                                className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Marquer comme lue
                              </button>
                            )}
                            
                            {onDelete && (
                              <button
                                onClick={() => onDelete(notif.id)}
                                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {filteredNotifications.length} notification(s)
              </p>
              {unreadCount > 0 && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    filteredNotifications
                      .filter(n => !n.lue)
                      .forEach(n => onMarkAsRead(n.id));
                  }}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}