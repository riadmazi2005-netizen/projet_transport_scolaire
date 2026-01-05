import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  FileText,
  Bell,
  User,
  LogOut,
  GraduationCap,
  Menu,
  X,
  Home,
  MapPin
} from 'lucide-react';

export default function TuteurSidebar({ tuteur, notifications = [], newCounts = { inscriptions: 0, accidents: 0, paiements: 0, notifications: 0 }, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fermer le menu mobile sur les grands écrans
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      link: 'TuteurDashboard',
      path: '/TuteurDashboard',
      badgeKeys: ['inscriptions', 'accidents', 'paiements'] // Badge combiné pour le dashboard
    },
    {
      title: 'Inscrire un élève',
      icon: UserPlus,
      link: 'TuteurInscription',
      path: '/TuteurInscription',
      badgeKey: null // Pas de badge sur "Inscrire"
    },
    {
      title: 'Mes Demandes',
      icon: FileText,
      link: 'TuteurDemandes',
      path: '/TuteurDemandes',
      badgeKey: 'inscriptions' // Badge pour nouvelles inscriptions (même compteur)
    },
    {
      title: 'Notifications',
      icon: Bell,
      link: 'TuteurNotifications',
      path: '/TuteurNotifications',
      badgeKey: 'notifications' // Badge pour notifications non lues
    },
    {
      title: 'Zones',
      icon: MapPin,
      link: 'TuteurZones',
      path: '/TuteurZones',
      badgeKey: null // Pas de badge pour zones
    },
    {
      title: 'Profil',
      icon: User,
      link: 'TuteurProfile',
      path: '/TuteurProfile',
      badgeKey: null // Pas de badge pour profil
    },
  ];

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
    } else {
      navigate(createPageUrl(item.link));
    }
    setIsMobileOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const unreadCount = notifications.filter(n => !n.lue).length;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-lime-500 text-white rounded-xl shadow-lg hover:bg-lime-600 transition-colors"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay pour mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '80px' : '280px',
          x: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024) ? '-100%' : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed left-0 top-0 h-full bg-gradient-to-b from-lime-50 to-white
          border-r-2 border-lime-200 shadow-2xl z-40
          flex flex-col
          ${isCollapsed ? 'items-center' : ''}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-lime-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">Espace Tuteur</h2>
                  <p className="text-xs text-gray-500">Transport Scolaire</p>
                </div>
              </motion.div>
            )}
            {isCollapsed && (
              <div className="w-12 h-12 bg-gradient-to-br from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-2 hover:bg-lime-100 rounded-lg transition-colors text-gray-600 hover:text-lime-600"
            >
              {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && tuteur && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-b border-lime-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center text-white font-bold">
                {tuteur.prenom?.[0] || tuteur.nom?.[0] || 'T'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {tuteur.prenom} {tuteur.nom}
                </p>
                <p className="text-xs text-gray-500 truncate">{tuteur.email}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              
              // Déterminer le badge à afficher
              let badgeCount = 0;
              
              // Si badgeKeys est un tableau (pour le dashboard avec plusieurs compteurs)
              if (item.badgeKeys && Array.isArray(item.badgeKeys)) {
                badgeCount = item.badgeKeys.reduce((total, key) => {
                  return total + (newCounts[key] || 0);
                }, 0);
              }
              // Sinon, utiliser badgeKey simple
              else if (item.badgeKey && newCounts[item.badgeKey] !== undefined) {
                badgeCount = newCounts[item.badgeKey] || 0;
              }
              
              const showBadge = badgeCount > 0;
              
              return (
                <motion.button
                  key={item.link}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNavigation(item)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${active
                      ? 'bg-gradient-to-r from-lime-500 to-lime-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-lime-100 hover:text-lime-700'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.title : ''}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} />
                    {showBadge && (
                      <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold ${
                        badgeCount > 99 ? 'px-1.5 py-0.5' : badgeCount > 9 ? 'min-w-[20px] h-5 px-1' : 'w-5 h-5'
                      }`}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="font-medium text-sm flex-1 text-left">{item.title}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-lime-200 space-y-2">
          <motion.button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-red-600 hover:bg-red-50 transition-all
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Déconnexion' : ''}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium text-sm">Déconnexion</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* Spacer pour le contenu principal */}
      <div
        className={`
          hidden lg:block transition-all duration-300
          ${isCollapsed ? 'ml-[80px]' : 'ml-[280px]'}
        `}
      />
    </>
  );
}

