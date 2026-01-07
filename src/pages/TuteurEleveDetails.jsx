import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, presencesAPI, inscriptionsAPI, busAPI, trajetsAPI, chauffeursAPI, responsablesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TuteurLayout from '../components/TuteurLayout';
import { 
  GraduationCap, ArrowLeft, Calendar,
  User, Clock, BarChart3, Filter, AlertCircle, Bus
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Composant interne avec la logique principale
function TuteurEleveDetailsContent() {
  const navigate = useNavigate();
  const [eleve, setEleve] = useState(null);
  const [presences, setPresences] = useState([]);
  const [allPresences, setAllPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('semaine'); // jour, semaine, mois
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [periodeFilter, setPeriodeFilter] = useState('tous'); // matin, soir, tous
  const [bus, setBus] = useState(null);
  const [chauffeur, setChauffeur] = useState(null);
  const [responsable, setResponsable] = useState(null);
  const [trajet, setTrajet] = useState(null);
  const [renderError, setRenderError] = useState(null);

  // Déclarer loadData AVANT les useEffect qui l'utilisent
  const loadData = useCallback(async (eleveId) => {
    console.log('loadData appelé avec eleveId:', eleveId);
    
    if (!eleveId) {
      console.error('loadData: Aucun ID d\'élève fourni');
      setError('Aucun ID d\'élève fourni');
      setLoading(false);
      return;
    }
    
    try {
      console.log('loadData: Début du chargement, setLoading(true)');
      setLoading(true);
      setError(null);
      
      // Charger l'élève
      console.log('loadData: Appel de elevesAPI.getById avec:', eleveId);
      const eleveResponse = await elevesAPI.getById(eleveId);
      console.log('loadData: Réponse elevesAPI.getById:', eleveResponse);
      
      let eleveData = null;
      
      if (eleveResponse?.success === false) {
        throw new Error(eleveResponse.message || 'Élève non trouvé');
      } else if (eleveResponse?.data) {
        eleveData = eleveResponse.data;
      } else if (eleveResponse?.id) {
        eleveData = eleveResponse;
      } else if (eleveResponse) {
        eleveData = eleveResponse;
      }
      
      console.log('loadData: eleveData extrait:', eleveData);
      
      if (!eleveData || !eleveData.id) {
        throw new Error('Élève non trouvé dans la base de données');
      }
      
      console.log('loadData: setEleve avec:', eleveData);
      setEleve(eleveData);
      
      // Charger l'inscription pour obtenir le bus_id
      try {
        const inscriptionsRes = await inscriptionsAPI.getByEleve(eleveId);
        const inscriptionsData = Array.isArray(inscriptionsRes?.data) ? inscriptionsRes.data : (Array.isArray(inscriptionsRes) ? inscriptionsRes : []);
        const eleveInscription = inscriptionsData.find(i => i.eleve_id === eleveId && i.statut === 'Active');
        
        if (eleveInscription && eleveInscription.bus_id) {
          // Charger les informations du bus
          try {
            const busResponse = await busAPI.getById(eleveInscription.bus_id);
            const busData = busResponse?.data || busResponse;
            if (busData && busData.id) {
              setBus(busData);
              
              // Charger le chauffeur si disponible
              if (busData.chauffeur_id) {
                try {
                  const chauffeurResponse = await chauffeursAPI.getById(busData.chauffeur_id);
                  const chauffeurData = chauffeurResponse?.data || chauffeurResponse;
                  setChauffeur(chauffeurData);
                } catch (err) {
                  console.warn('Erreur chargement chauffeur:', err);
                }
              }
              
              // Charger le responsable si disponible
              if (busData.responsable_id) {
                try {
                  const responsableResponse = await responsablesAPI.getById(busData.responsable_id);
                  const responsableData = responsableResponse?.data || responsableResponse;
                  setResponsable(responsableData);
                } catch (err) {
                  console.warn('Erreur chargement responsable:', err);
                }
              }
              
              // Charger le trajet si disponible
              if (busData.trajet_id) {
                try {
                  const trajetResponse = await trajetsAPI.getById(busData.trajet_id);
                  const trajetData = trajetResponse?.data || trajetResponse;
                  setTrajet(trajetData);
                } catch (err) {
                  console.warn('Erreur chargement trajet:', err);
                }
              }
            }
          } catch (err) {
            console.warn('Erreur chargement bus:', err);
          }
        } else {
          // Pas d'inscription active, réinitialiser les données
          setBus(null);
          setChauffeur(null);
          setResponsable(null);
          setTrajet(null);
        }
      } catch (err) {
        console.warn('Erreur chargement inscription:', err);
      }
      
      // Charger les présences (30 derniers jours)
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        console.log('loadData: Chargement des présences de', startDate, 'à', endDate);
        const presencesResponse = await presencesAPI.getByEleve(eleveId, startDate, endDate);
        console.log('loadData: Réponse presencesAPI:', presencesResponse);
        
        const presencesData = presencesResponse?.data || presencesResponse || [];
        const sortedPresences = Array.isArray(presencesData)
          ? presencesData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
          : [];
        console.log('loadData: Présences triées:', sortedPresences.length);
        setAllPresences(sortedPresences);
        setPresences(sortedPresences.slice(0, 7));
      } catch (err) {
        console.warn('Erreur lors du chargement des présences:', err);
        setPresences([]);
        setAllPresences([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Erreur lors du chargement des données. Vérifiez votre connexion.');
    } finally {
      console.log('loadData: Fin du chargement, setLoading(false)');
      setLoading(false);
    }
  }, []);

  // Log pour débogage et gestion d'erreur globale
  useEffect(() => {
    try {
      console.log('TuteurEleveDetailsContent - Composant monté');
      console.log('URL:', window.location.href);
      console.log('Search:', window.location.search);
    } catch (err) {
      console.error('Erreur dans useEffect initial:', err);
      setError('Erreur lors de l\'initialisation: ' + err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('TuteurEleveDetailsContent - useEffect principal déclenché');
    
    // Vérifier la session
    const session = localStorage.getItem('tuteur_session');
    console.log('Session trouvée:', !!session);
    
    if (!session) {
      console.log('Pas de session, redirection vers login');
      navigate(createPageUrl('TuteurLogin'));
      return;
    }

    // Récupérer l'ID de l'élève depuis l'URL
    const params = new URLSearchParams(window.location.search);
    const eleveId = params.get('eleveId') || params.get('eleveld') || params.get('id');
    console.log('EleveId depuis URL:', eleveId);
    console.log('Tous les paramètres:', Object.fromEntries(params.entries()));
    
    if (!eleveId) {
      console.error('Aucun ID d\'élève trouvé dans l\'URL');
      setError('Aucun ID d\'élève fourni dans l\'URL');
      setLoading(false);
      return;
    }

    console.log('Appel de loadData avec eleveId:', eleveId);
    loadData(eleveId).catch(err => {
      console.error('Erreur dans loadData:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      setLoading(false);
    });
    
    // Recharger les données toutes les 30 secondes pour détecter les changements (bus affecté)
    const interval = setInterval(() => {
      const currentParams = new URLSearchParams(window.location.search);
      const currentEleveId = currentParams.get('eleveId') || currentParams.get('eleveld') || currentParams.get('id');
      if (currentEleveId) {
        console.log('Rechargement automatique des données');
        loadData(currentEleveId).catch(err => {
          console.error('Erreur lors du rechargement:', err);
        });
      }
    }, 30000);
    
    return () => {
      console.log('Nettoyage de l\'intervalle');
      clearInterval(interval);
    };
  }, [navigate, loadData]);

  // Filtrer les présences selon le type de filtre
  const filteredPresences = useMemo(() => {
    // Si pas de présences, retourner un tableau vide
    if (!allPresences || allPresences.length === 0) return [];
    
    const today = new Date();
    let startDate, endDate;
    
    switch (filterType) {
      case 'jour':
        const selected = new Date(selectedDate);
        startDate = startOfDay(selected);
        endDate = endOfDay(selected);
        return allPresences.filter(p => {
          const pDate = new Date(p.date);
          return pDate >= startDate && pDate <= endDate;
        });
      case 'semaine':
        startDate = subDays(today, 6);
        endDate = today;
        return allPresences.filter(p => {
          const pDate = new Date(p.date);
          return pDate >= startDate && pDate <= endDate;
        }).slice(0, 7);
      case 'mois':
        startDate = subDays(today, 29);
        endDate = today;
        return allPresences.filter(p => {
          const pDate = new Date(p.date);
          return pDate >= startDate && pDate <= endDate;
        });
      default:
        return allPresences.slice(0, 7);
    }
  }, [allPresences, filterType, selectedDate]);

  // Calculer les statistiques pour le graphique basé sur les présences marquées par le responsable bus
  // Les données proviennent directement de la base de données via presencesAPI.getByEleve()
  const chartData = useMemo(() => {
    if (!filteredPresences || filteredPresences.length === 0) return [];
    
    const grouped = {};
    
    // Grouper par date et compter les présences/absences selon le filtre période
    // Chaque présence a present_matin et present_soir (true/false) marqués par le responsable bus
    filteredPresences.forEach(presence => {
      const date = format(new Date(presence.date), 'dd/MM', { locale: fr });
      if (!grouped[date]) {
        grouped[date] = { date, absents: 0, presents: 0 };
      }
      
      // Filtrer selon la période sélectionnée
      if (periodeFilter === 'tous' || periodeFilter === 'matin') {
        // Compter matin : si présent (true/1) → +1 présent, si absent (false/0/null) → +1 absent
        const presentMatin = presence.present_matin === true || presence.present_matin === 1 || presence.present_matin === '1';
        if (presentMatin) {
          grouped[date].presents = (grouped[date].presents || 0) + 1;
        } else {
          // Absent ou non marqué = absent
          grouped[date].absents = (grouped[date].absents || 0) + 1;
        }
      }
      
      if (periodeFilter === 'tous' || periodeFilter === 'soir') {
        // Compter soir : si présent (true/1) → +1 présent, si absent (false/0/null) → +1 absent
        const presentSoir = presence.present_soir === true || presence.present_soir === 1 || presence.present_soir === '1';
        if (presentSoir) {
          grouped[date].presents = (grouped[date].presents || 0) + 1;
        } else {
          // Absent ou non marqué = absent
          grouped[date].absents = (grouped[date].absents || 0) + 1;
        }
      }
    });
    
    // S'assurer que les valeurs sont des entiers
    const result = Object.values(grouped).map(item => ({
      ...item,
      absents: Math.round(item.absents || 0),
      presents: Math.round(item.presents || 0)
    })).sort((a, b) => {
      try {
        const [dayA, monthA] = a.date.split('/');
        const [dayB, monthB] = b.date.split('/');
        const year = new Date().getFullYear();
        const dateA = new Date(year, parseInt(monthA) - 1, parseInt(dayA));
        const dateB = new Date(year, parseInt(monthB) - 1, parseInt(dayB));
        return dateA - dateB;
      } catch (e) {
        return 0;
      }
    });
    
    return result;
  }, [filteredPresences, periodeFilter]);

  // Mettre à jour les présences filtrées
  useEffect(() => {
    if (eleve && eleve.id) {
      setPresences(filteredPresences);
    }
  }, [filterType, selectedDate, filteredPresences, eleve]);

  // Vérifier si l'élève est absent à une date spécifique
  const getAbsenceForDate = useCallback((date) => {
    const dateStr = format(new Date(date), 'yyyy-MM-dd');
    const presence = allPresences.find(p => format(new Date(p.date), 'yyyy-MM-dd') === dateStr);
    
    if (!presence) return { absent: false, matin: false, soir: false };
    
    return {
      absent: !presence.present_matin || !presence.present_soir,
      matin: !presence.present_matin,
      soir: !presence.present_soir
    };
  }, [allPresences]);

  const selectedDateAbsence = useMemo(() => {
    return getAbsenceForDate(selectedDate);
  }, [selectedDate, getAbsenceForDate]);

  // Fonction helper pour le statut (doit être avant les returns)
  const getStatusColor = (statut) => {
    const colors = {
      'Actif': 'bg-green-100 text-green-700',
      'Inactif': 'bg-amber-100 text-amber-700',
      'Suspendu': 'bg-red-100 text-red-700'
    };
    return colors[statut] || 'bg-gray-100 text-gray-700';
  };

  // Gestion d'erreur de rendu
  if (renderError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de rendu</h2>
            <p className="text-red-600 mb-4 text-sm">{renderError}</p>
            <button
              onClick={() => {
                setRenderError(null);
                window.location.reload();
              }}
              className="w-full bg-lime-500 hover:bg-lime-600 text-white rounded-xl px-4 py-2 mt-4"
            >
              Recharger la page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Logs de l'état actuel
  try {
    console.log('TuteurEleveDetails - Rendu:', {
      loading,
      error,
      eleve: eleve ? { id: eleve.id, nom: eleve.nom, prenom: eleve.prenom } : null,
      bus: bus ? { id: bus.id, numero: bus.numero } : null,
      presencesCount: presences.length,
      allPresencesCount: allPresences.length
    });
  } catch (err) {
    console.error('Erreur dans les logs de débogage:', err);
  }

  // État de chargement
  if (loading) {
    console.log('TuteurEleveDetails - Affichage de l\'état de chargement');
    try {
      return (
        <TuteurLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Chargement des données...</p>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <p className="text-xs text-gray-400 mt-4">Vérifiez la console pour plus de détails</p>
            </div>
          </div>
        </TuteurLayout>
      );
    } catch (err) {
      console.error('Erreur dans le rendu de chargement:', err);
      setRenderError(err.message || 'Erreur lors du rendu');
      return null;
    }
  }

  // Rendu principal - on s'assure qu'on a toujours quelque chose à afficher
  // Erreur sans élève chargé
  if (error && !eleve) {
    return (
      <TuteurLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    const eleveId = params.get('eleveId') || params.get('eleveld') || params.get('id');
                    if (eleveId) {
                      setError(null);
                      setLoading(true);
                      loadData(eleveId);
                    }
                  }}
                  className="w-full bg-lime-500 hover:bg-lime-600 text-white rounded-xl"
                >
                  Réessayer
                </Button>
                <Button 
                  onClick={() => navigate(createPageUrl('TuteurDashboard'))}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-xl"
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </div>
          </div>
        </div>
      </TuteurLayout>
    );
  }

  // Pas d'élève chargé (sans erreur explicite)
  if (!eleve) {
    return (
      <TuteurLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-gray-50 border-2 border-gray-200 rounded-3xl p-8 shadow-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Aucune donnée disponible</h2>
              <p className="text-gray-500 mb-6">Impossible de charger les informations de l'élève.</p>
              <Button 
                onClick={() => navigate(createPageUrl('TuteurDashboard'))}
                className="w-full bg-lime-500 hover:bg-lime-600 text-white rounded-xl"
              >
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        </div>
      </TuteurLayout>
    );
  }


  try {
    console.log('TuteurEleveDetails - Rendu principal, eleve existe:', !!eleve);
  } catch (err) {
    console.error('Erreur dans le log de rendu principal:', err);
  }
  
  try {
    return (
      <TuteurLayout title={`Détails - ${eleve?.prenom || ''} ${eleve?.nom || ''}`}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
          <button
            onClick={() => navigate(createPageUrl('TuteurDashboard'))}
            className="flex items-center gap-2 text-gray-600 hover:text-lime-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                ×
              </button>
            </div>
          )}


          {/* Infos Élève */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-lime-500" />
              Informations personnelles
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Classe</span>
                <span className="font-medium text-gray-800">{eleve.classe || 'N/A'}</span>
              </div>

              {eleve.date_naissance && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Date de naissance</span>
                  <span className="font-medium text-gray-800">
                    {format(new Date(eleve.date_naissance), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              {eleve.adresse && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Adresse</span>
                  <span className="font-medium text-gray-800 text-right max-w-[200px]">{eleve.adresse}</span>
                </div>
              )}
            </div>
          </div>

          {/* Infos Bus */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Bus className="w-5 h-5 text-lime-500" />
              Informations de transport
            </h2>
            
            {bus ? (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Bus assigné</span>
                  <span className="font-medium text-gray-800">{bus.numero ? bus.numero.toString().replace(/^#\s*/, '') : 'N/A'}</span>
                </div>
                
                {bus.immatriculation && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Immatriculation</span>
                    <span className="font-medium text-gray-800">{bus.immatriculation}</span>
                  </div>
                )}
                
                {bus.capacite && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Capacité</span>
                    <span className="font-medium text-gray-800">{bus.capacite} places</span>
                  </div>
                )}
                
                {chauffeur && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Chauffeur</span>
                    <span className="font-medium text-gray-800">{chauffeur.prenom} {chauffeur.nom}</span>
                  </div>
                )}
                
                {trajet && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Trajet</span>
                    <span className="font-medium text-gray-800">{trajet.nom || 'N/A'}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2">
                <p className="text-gray-600">Aucun bus assigné pour le moment</p>
              </div>
            )}
          </div>

          {/* Historique des présences */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mt-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-lime-500" />
                Historique des absences
              </h2>
              
              {/* Filtres */}
              <div className="flex items-center gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 rounded-xl">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jour">Jour</SelectItem>
                    <SelectItem value="semaine">Semaine</SelectItem>
                    <SelectItem value="mois">Mois</SelectItem>
                  </SelectContent>
                </Select>
                
                {filterType === 'jour' && (
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40 rounded-xl"
                  />
                )}
                
                <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
                  <SelectTrigger className="w-40 rounded-xl">
                    <Clock className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous</SelectItem>
                    <SelectItem value="matin">Matin</SelectItem>
                    <SelectItem value="soir">Soir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Affichage pour un jour spécifique */}
            {filterType === 'jour' && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-lime-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      État pour le {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                    {selectedDateAbsence.absent ? (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-red-600 font-semibold">Absent</span>
                        {selectedDateAbsence.matin && <span className="text-sm text-red-600">Matin</span>}
                        {selectedDateAbsence.soir && <span className="text-sm text-red-600">Soir</span>}
                      </div>
                    ) : (
                      <span className="text-green-600 font-semibold">Présent (matin et soir)</span>
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold ${
                    selectedDateAbsence.absent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedDateAbsence.absent ? 'Absent' : 'Présent'}
                  </div>
                </div>
              </div>
            )}

            {/* Diagramme des absences */}
            {chartData.length > 0 ? (
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      domain={[0, 'auto']}
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => Math.round(value)}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="absents" fill="#EF4444" name="Absences" />
                    <Bar dataKey="presents" fill="#10B981" name="Présences" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 mb-6">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune donnée de présence disponible pour cette période</p>
              </div>
            )}

            {/* Liste détaillée des présences */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-semibold text-gray-700 mb-4">
                Détail des présences {filterType === 'jour' ? 'du jour' : filterType === 'semaine' ? 'de la semaine' : 'du mois'}
                {periodeFilter !== 'tous' && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({periodeFilter === 'matin' ? 'Matin' : 'Soir'})
                  </span>
                )}
              </h3>
              
              {presences.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun historique de présence</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {presences
                    .filter(presence => {
                      // Filtrer selon la période sélectionnée
                      if (periodeFilter === 'tous') return true;
                      if (periodeFilter === 'matin') {
                        // Afficher seulement si présent_matin est défini (true ou false)
                        return presence.present_matin !== null && presence.present_matin !== undefined;
                      }
                      if (periodeFilter === 'soir') {
                        // Afficher seulement si present_soir est défini (true ou false)
                        return presence.present_soir !== null && presence.present_soir !== undefined;
                      }
                      return true;
                    })
                    .map((presence, index) => {
                      const presenceDate = new Date(presence.date);
                      const isToday = format(presenceDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      const isSelected = filterType === 'jour' && format(presenceDate, 'yyyy-MM-dd') === selectedDate;
                      
                      // Déterminer si on doit afficher matin, soir ou les deux
                      const showMatin = periodeFilter === 'tous' || periodeFilter === 'matin';
                      const showSoir = periodeFilter === 'tous' || periodeFilter === 'soir';
                      
                      return (
                        <div 
                          key={presence.id || index}
                          className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                            isSelected 
                              ? 'bg-lime-100 border-2 border-lime-300' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <span className="font-medium text-gray-700">
                            {format(presenceDate, 'EEEE d MMMM', { locale: fr })}
                            {isToday && <span className="ml-2 text-xs text-lime-600">(Aujourd'hui)</span>}
                          </span>
                          <div className="flex items-center gap-4">
                            {showMatin && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Matin:</span>
                                <span className={`text-sm font-medium ${
                                  presence.present_matin ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {presence.present_matin ? 'Présent' : 'Absent'}
                                </span>
                              </div>
                            )}
                            {showSoir && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Soir:</span>
                                <span className={`text-sm font-medium ${
                                  presence.present_soir ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {presence.present_soir ? 'Présent' : 'Absent'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </TuteurLayout>
    );
  } catch (err) {
    console.error('Erreur dans le rendu principal:', err);
    setRenderError(err.message || 'Erreur lors du rendu de la page');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de rendu</h2>
            <p className="text-red-600 mb-4 text-sm">{err.message || 'Une erreur est survenue'}</p>
            <button
              onClick={() => {
                setRenderError(null);
                window.location.reload();
              }}
              className="w-full bg-lime-500 hover:bg-lime-600 text-white rounded-xl px-4 py-2 mt-4"
            >
              Recharger la page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// Composant principal avec gestion d'erreur
export default function TuteurEleveDetails() {
  console.log('TuteurEleveDetails - Composant monté (wrapper)');
  
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    console.log('TuteurEleveDetails - useEffect wrapper déclenché');
    
    // Capturer les erreurs non gérées
    const handleError = (event) => {
      console.error('Erreur non gérée:', event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || 'Une erreur est survenue');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Promesse rejetée non gérée:', event.reason);
      setHasError(true);
      setErrorMessage(event.reason?.message || 'Une erreur est survenue');
    });

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  console.log('TuteurEleveDetails - Rendu wrapper, hasError:', hasError);

  if (hasError) {
    console.log('TuteurEleveDetails - Affichage de l\'erreur');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
            <p className="text-red-600 mb-4 text-sm">{errorMessage}</p>
            <button
              onClick={() => {
                setHasError(false);
                setErrorMessage(null);
                window.location.reload();
              }}
              className="w-full bg-lime-500 hover:bg-lime-600 text-white rounded-xl px-4 py-2 mt-4"
            >
              Recharger la page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Toujours afficher quelque chose, même en cas d'erreur
  console.log('TuteurEleveDetails - Tentative de rendu du contenu');
  try {
    const content = <TuteurEleveDetailsContent />;
    console.log('TuteurEleveDetails - Contenu créé avec succès');
    return content;
  } catch (err) {
    console.error('TuteurEleveDetails - Erreur lors de la création du contenu:', err);
    console.error('Erreur dans TuteurEleveDetails:', err);
    console.error('Stack:', err.stack);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de rendu</h2>
            <p className="text-red-600 mb-4 text-sm">{err.message || 'Une erreur est survenue'}</p>
            <p className="text-xs text-gray-500 mb-4">Vérifiez la console pour plus de détails</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-lime-500 hover:bg-lime-600 text-white rounded-xl px-4 py-2 mt-4"
            >
              Recharger la page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// Fallback absolu - si tout échoue, on affiche au moins ça
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Erreur globale capturée:', event.error);
  });
}