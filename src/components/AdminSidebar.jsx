import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  ClipboardList,
  Users,
  Bus,
  Navigation,
  UserCog,
  CreditCard,
  AlertCircle,
  Bell,
  Menu,
  X,
  Shield,
  LogOut,
  GraduationCap,
  FileText
} from 'lucide-react';

export default function AdminSidebar({ admin, notifications = [], onLogout, onNotificationClick }) {
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
      icon: Shield,
      link: 'AdminDashboard',
      path: '/AdminDashboard'
    },
    {
      title: 'Statistiques',
      icon: BarChart3,
      link: 'AdminStats',
      path: '/AdminStats'
    },
    {
      title: 'Élèves',
      icon: GraduationCap,
      link: 'AdminEleves',
      path: '/AdminEleves'
    },
    {
      title: 'Inscriptions',
      icon: ClipboardList,
      link: 'AdminInscriptions',
      path: '/AdminInscriptions'
    },
    {
      title: 'Bus',
      icon: Bus,
      link: 'AdminBus',
      path: '/AdminBus'
    },
    {
      title: 'Chauffeurs',
      icon: Users,
      link: 'AdminChauffeurs',
      path: '/AdminChauffeurs'
    },
    {
      title: 'Responsables',
      icon: UserCog,
      link: 'AdminResponsables',
      path: '/AdminResponsables'
    },
    {
      title: 'Paiements',
      icon: CreditCard,
      link: 'AdminPaiements',
      path: '/AdminPaiements'
    },
    {
      title: 'Accidents',
      icon: AlertCircle,
      link: 'AdminAccidents',
      path: '/AdminAccidents'
    },
  ];

  const handleNavigation = (item) => {
    // Utiliser directement le path
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-amber-500 text-white rounded-xl shadow-lg hover:bg-amber-600 transition-colors"
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
          fixed left-0 top-0 h-full bg-gradient-to-b from-amber-50 to-white
          border-r-2 border-amber-200 shadow-2xl z-40
          flex flex-col
          ${isCollapsed ? 'items-center' : ''}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-amber-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">Mohammed 5</h2>
                  <p className="text-xs text-gray-500">School Bus</p>
                </div>
              </motion.div>
            )}
            {isCollapsed && (
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                <Shield className="w-6 h-6 text-white" />
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-2 hover:bg-amber-100 rounded-lg transition-colors text-gray-600 hover:text-amber-600"
            >
              {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && admin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-b border-amber-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                {admin.prenom?.[0] || admin.nom?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {admin.prenom} {admin.nom}
                </p>
                <p className="text-xs text-gray-500 truncate">{admin.email}</p>
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
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-amber-100 hover:text-amber-700'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.title : ''}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} />
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {item.badge}
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
        <div className="p-4 border-t border-amber-200 space-y-2">
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

