import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Bus,
  Fuel,
  Wrench,
  AlertCircle,
  User,
  LogOut,
  UserCog,
  Menu,
  X,
  Bell
} from 'lucide-react';

export default function ChauffeurSidebar({ chauffeur, notifications = [], onLogout, activeTab, setActiveTab, onCollapseChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Notifier le parent du changement d'état collapsed
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

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
      id: null,
      link: null
    },
    {
      title: 'Mon Bus & Trajet',
      icon: Bus,
      id: 'bus',
      link: null
    },
    {
      title: 'Essence',
      icon: Fuel,
      id: 'essence',
      link: null
    },
    {
      title: 'Problèmes',
      icon: Wrench,
      id: 'signalements',
      link: null
    },
    {
      title: 'Mes Accidents',
      icon: AlertCircle,
      id: 'accidents',
      link: null
    },
    {
      title: 'Notifications',
      icon: Bell,
      id: 'notifications',
      link: 'ChauffeurNotifications'
    },
    {
      title: 'Profil',
      icon: User,
      id: 'profile',
      link: null
    },
  ];

  const handleNavigation = (item) => {
    // Si l'élément a un lien, naviguer vers cette page
    if (item.link) {
      navigate(createPageUrl(item.link));
      // Fermer le menu mobile après navigation
      if (window.innerWidth < 1024) {
        setIsMobileOpen(false);
      }
      return;
    }
    
    // Sinon, utiliser le système d'onglets existant
    if (setActiveTab) {
      setActiveTab(item.id);
    }
    // Fermer le menu mobile après navigation
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.lue).length;

  return (
    <>
      {/* Hamburger Menu Button - Visible sur tous les écrans */}
      <button
        onClick={() => {
          const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
          if (isDesktop) {
            // Desktop: toggle collapse
            setIsCollapsed(!isCollapsed);
            setIsMobileOpen(false);
          } else {
            // Mobile: toggle menu
            setIsMobileOpen(!isMobileOpen);
          }
        }}
        className="fixed top-4 left-4 z-50 p-2.5 bg-green-500 text-white rounded-xl shadow-lg hover:bg-green-600 transition-colors"
      >
        {(!isMobileOpen && isCollapsed) ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
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
            style={{ pointerEvents: 'auto' }}
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
          fixed left-0 top-0 h-full bg-gradient-to-b from-green-50 to-white
          border-r-2 border-green-200 shadow-2xl z-40
          flex flex-col
          ${isCollapsed ? 'items-center' : ''}
        `}
        style={{ pointerEvents: 'auto' }}
      >
        {/* User Info - En haut */}
        {!isCollapsed && chauffeur && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-b border-green-200 mt-16"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                {chauffeur.prenom?.[0] || chauffeur.nom?.[0] || 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-base truncate">
                  {chauffeur.prenom} {chauffeur.nom}
                </p>
                <p className="text-sm text-gray-500 truncate">{chauffeur.email}</p>
              </div>
            </div>
          </motion.div>
        )}
        
        {isCollapsed && chauffeur && (
          <div className="mt-16 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md mx-auto">
            {chauffeur.prenom?.[0] || chauffeur.nom?.[0] || 'C'}
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              const isAccidents = item.id === 'accidents';
              const isNotifications = item.id === 'notifications';
              const isActiveLink = isNotifications && location.pathname === '/ChauffeurNotifications';
              
              return (
                <motion.button
                  key={item.id || 'dashboard'}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNavigation(item)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${active || isActiveLink
                      ? isAccidents
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-green-100 hover:text-green-700'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.title : ''}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${active || isActiveLink ? 'text-white' : 'text-gray-600'}`} />
                    {isNotifications && unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 99 ? '99+' : unreadCount}
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
        <div className="p-4 border-t border-green-200 space-y-2">
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
