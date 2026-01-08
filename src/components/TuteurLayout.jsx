import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import TuteurSidebar from './TuteurSidebar';
import { notificationsAPI, demandesAPI, accidentsAPI, paiementsAPI, tuteursAPI } from '../services/apiService';

export default function TuteurLayout({ children, title = 'Espace Tuteur' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tuteur, setTuteur] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [newCounts, setNewCounts] = useState({
    inscriptions: 0,
    accidents: 0,
    paiements: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }

    try {
      const tuteurData = JSON.parse(session);
      setTuteur(tuteurData);

      // Charger les données en arrière-plan sans bloquer le rendu
      Promise.all([
        loadNotifications(tuteurData.id).catch(err => {
          console.warn('Erreur chargement notifications dans Layout:', err);
        }),
        loadNewCounts(tuteurData).catch(err => {
          console.warn('Erreur chargement compteurs dans Layout:', err);
        })
      ]).finally(() => {
        setLoading(false);
      });
    } catch (err) {
      console.error('Erreur parsing session dans TuteurLayout:', err);
      setLoading(false);
    }
  }, [navigate]);

  // Rafraîchir les notifications quand on navigue vers la page des notifications
  useEffect(() => {
    if (tuteur && location.pathname === '/TuteurNotifications') {
      loadNotifications(tuteur.id);
    }
  }, [location.pathname, tuteur]);

  // Rafraîchir les notifications et compteurs toutes les 30 secondes
  useEffect(() => {
    if (!tuteur) return;

    const loadAllData = async () => {
      await Promise.all([
        loadNotifications(tuteur.id),
        loadNewCounts(tuteur)
      ]);
    };

    loadAllData();
    loadAllData();
    const interval = setInterval(loadAllData, 15000); // Rafraîchir toutes les 15 secondes (plus rapide)

    return () => clearInterval(interval);
  }, [tuteur]);

  const loadNotifications = async (tuteurId) => {
    try {
      const response = await notificationsAPI.getByUser(tuteurId, 'tuteur');
      let notifs = response?.data || response || [];

      // Si on est sur la page des notifications, on les considère comme lues localement
      // pour que le badge disparaisse immédiatement
      if (location.pathname === '/TuteurNotifications') {
        notifs = notifs.map(n => ({ ...n, lue: true }));
      }

      setNotifications(notifs.sort((a, b) => new Date(b.date || b.date_creation || 0) - new Date(a.date || a.date_creation || 0)));

      // Compter les notifications non lues (en tenant compte de l'optimisme local)
      const unreadCount = notifs.filter(n => !n.lue).length;
      setNewCounts(prev => ({ ...prev, notifications: unreadCount }));
    } catch (err) {
      console.warn('Erreur lors du chargement des notifications:', err);
      setNotifications([]);
    }
  };

  const loadNewCounts = async (tuteurData) => {
    try {
      const tuteurId = tuteurData.type_id || tuteurData.id;

      // Compter les nouvelles inscriptions (demandes en attente ou en cours de traitement)
      try {
        const demandesRes = await demandesAPI.getByTuteur(tuteurId);
        const demandes = demandesRes?.data || demandesRes || [];
        const nouvellesInscriptions = demandes.filter(d =>
          d.type_demande === 'inscription' &&
          (d.statut === 'En attente' || d.statut === 'En cours de traitement')
        ).length;
        setNewCounts(prev => ({ ...prev, inscriptions: nouvellesInscriptions }));
      } catch (err) {
        console.warn('Erreur chargement demandes:', err);
      }

      // Compter les accidents concernant les élèves du tuteur
      try {
        // Récupérer tous les élèves du tuteur
        const elevesRes = await tuteursAPI.getEleves(tuteurId);
        const eleves = elevesRes?.data || elevesRes || [];
        const elevesIds = Array.isArray(eleves) ? eleves.map(e => e.id || e.eleve_id).filter(Boolean) : [];

        if (elevesIds.length > 0) {
          // Récupérer tous les accidents
          const accidentsRes = await accidentsAPI.getAll();
          const accidents = accidentsRes?.data || accidentsRes || [];

          // Filtrer les accidents récents (non résolus) qui concernent les élèves du tuteur
          const accidentsRecents = accidents.filter(accident => {
            try {
              const elevesConcernes = accident.eleves_concernes
                ? (typeof accident.eleves_concernes === 'string'
                  ? JSON.parse(accident.eleves_concernes || '[]')
                  : accident.eleves_concernes
                )
                : [];

              const concerneEleve = Array.isArray(elevesConcernes) &&
                elevesConcernes.some(eleveId => elevesIds.includes(parseInt(eleveId)) || elevesIds.includes(eleveId));

              if (!concerneEleve) return false;

              // Considérer comme "nouveau" si l'accident est non résolu ou créé récemment (7 derniers jours)
              const dateAccident = new Date(accident.date || accident.date_creation || 0);
              const joursDepuisAccident = (new Date() - dateAccident) / (1000 * 60 * 60 * 24);
              const estRecent = joursDepuisAccident <= 7;
              const nonResolu = accident.statut !== 'Résolu' && accident.statut !== 'résolu' && accident.statut !== 'Resolu';

              return nonResolu || estRecent;
            } catch (parseErr) {
              console.warn('Erreur parsing eleves_concernes:', parseErr);
              return false;
            }
          }).length;

          setNewCounts(prev => ({ ...prev, accidents: accidentsRecents }));
        } else {
          setNewCounts(prev => ({ ...prev, accidents: 0 }));
        }
      } catch (err) {
        console.warn('Erreur chargement accidents:', err);
        setNewCounts(prev => ({ ...prev, accidents: 0 }));
      }

      // Compter les paiements impayés ou en attente
      try {
        const paiementsRes = await paiementsAPI.getByTuteur(tuteurId);
        const paiements = paiementsRes?.data || paiementsRes || [];

        // Compter les paiements mensuels impayés
        const paiementsImpayes = paiements.filter(p =>
          p.type_paiement === 'mensuel' &&
          (p.statut === 'Impayé' || p.statut === 'En attente' || p.statut === 'impayé' || p.statut === 'en attente')
        ).length;

        setNewCounts(prev => ({ ...prev, paiements: paiementsImpayes }));
      } catch (err) {
        console.warn('Erreur chargement paiements:', err);
      }
    } catch (err) {
      console.warn('Erreur lors du chargement des compteurs:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tuteur_session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate(createPageUrl('Home'));
  };

  // Ne pas bloquer le rendu si on a déjà le tuteur, même si loading est true
  // Cela permet au contenu de s'afficher pendant que les notifications se chargent
  if (loading && !tuteur) {
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
        newCounts={newCounts}
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

