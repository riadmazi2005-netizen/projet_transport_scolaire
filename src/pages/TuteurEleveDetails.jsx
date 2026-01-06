import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, busAPI, trajetsAPI, presencesAPI, inscriptionsAPI, chauffeursAPI, responsablesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TuteurLayout from '../components/TuteurLayout';
import { 
  GraduationCap, ArrowLeft, Bus, Calendar,
  User, Clock, BarChart3, Filter, AlertCircle
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

export default function TuteurEleveDetails() {
  const navigate = useNavigate();
  const [eleve, setEleve] = useState(null);
  const [bus, setBus] = useState(null);
  const [trajet, setTrajet] = useState(null);
  const [chauffeur, setChauffeur] = useState(null);
  const [responsable, setResponsable] = useState(null);
  const [presences, setPresences] = useState([]);
  const [allPresences, setAllPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('semaine'); // jour, semaine, mois
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Log pour débogage et gestion d'erreur globale
  useEffect(() => {
    try {
      console.log('TuteurEleveDetails - Composant monté');
      console.log('URL:', window.location.href);
      console.log('Search:', window.location.search);
    } catch (err) {
      console.error('Erreur dans useEffect initial:', err);
      setError('Erreur lors de l\'initialisation: ' + err.message);
      setLoading(false);
    }
  }, []);

  // S'assurer qu'on initialise le loading à false après un court délai pour éviter les pages blanches
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !eleve && !error) {
        console.warn('Timeout: La page prend trop de temps à charger');
        setError('Le chargement prend plus de temps que prévu. Vérifiez votre connexion.');
        setLoading(false);
      }
    }, 10000); // 10 secondes de timeout
    
    return () => clearTimeout(timer);
  }, [loading, eleve, error]);

  const loadData = useCallback(async (eleveId) => {
    if (!eleveId) {
      console.error('Aucun ID d\'élève fourni');
      setError('Aucun ID d\'élève fourni dans l\'URL');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('Chargement des données pour l\'élève ID:', eleveId);
      
      // Charger l'élève
      let eleveResponse;
      try {
        eleveResponse = await elevesAPI.getById(eleveId);
      } catch (apiError) {
        console.error('Erreur API lors du chargement de l\'élève:', apiError);
        throw new Error('Impossible de charger les données de l\'élève. Vérifiez votre connexion.');
      }
      
      // Gérer différentes structures de réponse
      let eleveData;
      if (eleveResponse && eleveResponse.success === false) {
        throw new Error(eleveResponse.message || 'Élève non trouvé');
      } else if (eleveResponse && eleveResponse.data) {
        eleveData = eleveResponse.data;
      } else if (eleveResponse && eleveResponse.id) {
        eleveData = eleveResponse;
      } else if (eleveResponse) {
        eleveData = eleveResponse;
      } else {
        throw new Error('Réponse invalide du serveur');
      }
      
      console.log('Réponse élève:', eleveResponse);
      console.log('Données élève:', eleveData);
      
      if (!eleveData || (!eleveData.id && eleveData.id !== 0)) {
        console.error('Élève non trouvé ou données invalides:', eleveResponse);
        setError('Élève non trouvé ou données invalides');
        setLoading(false);
        return;
      }
      
      setEleve(eleveData);
      
      // Charger le bus via les inscriptions
      if (eleveData) {
        try {
          const inscriptionsRes = await inscriptionsAPI.getByEleve(eleveId);
          console.log('📋 Réponse inscriptions:', inscriptionsRes);
          const inscriptionsData = inscriptionsRes?.data || inscriptionsRes || [];
          console.log('📋 Données inscriptions:', inscriptionsData);
          
          // Chercher une inscription active
          const eleveInscription = Array.isArray(inscriptionsData) 
            ? inscriptionsData.find(i => i.statut === 'Active' || i.statut === 'active')
            : (inscriptionsData && (inscriptionsData.statut === 'Active' || inscriptionsData.statut === 'active') ? inscriptionsData : null);
          
          console.log('📋 Inscription trouvée:', eleveInscription);
          
          if (eleveInscription && eleveInscription.bus_id) {
            console.log('🚌 Bus ID trouvé:', eleveInscription.bus_id);
            
            // L'API getByEleve retourne déjà les données du bus via JOIN
            // Si on a déjà les données du bus dans l'inscription, on les utilise
            if (eleveInscription.bus_numero) {
              console.log('✅ Données bus trouvées dans l\'inscription');
              // Construire l'objet bus à partir des données de l'inscription
              const busDataFromInscription = {
                id: eleveInscription.bus_id,
                numero: eleveInscription.bus_numero,
                marque: eleveInscription.bus_marque,
                modele: eleveInscription.bus_modele,
                capacite: eleveInscription.bus_capacite,
                trajet_id: null, // On devra le charger séparément
                chauffeur_id: null, // On devra le charger séparément
                responsable_id: null // On devra le charger séparément
              };
              
              // Charger les données complètes du bus pour avoir trajet_id, chauffeur_id, responsable_id
              try {
                const busResponse = await busAPI.getById(eleveInscription.bus_id);
                console.log('🚌 Réponse bus complète:', busResponse);
                const busData = busResponse?.data || busResponse;
                console.log('🚌 Données bus complètes:', busData);
                
                if (busData && busData.id) {
                  // Fusionner les données (priorité aux données complètes du bus)
                  const finalBusData = {
                    ...busDataFromInscription,
                    ...busData,
                    numero: busData.numero || busDataFromInscription.numero,
                    marque: busData.marque || busDataFromInscription.marque,
                    modele: busData.modele || busDataFromInscription.modele,
                    capacite: busData.capacite || busDataFromInscription.capacite
                  };
                  
                  setBus(finalBusData);
                  console.log('✅ Bus défini dans le state:', finalBusData);
                  
                  // Charger le trajet
                  if (finalBusData.trajet_id) {
                    try {
                      const trajetResponse = await trajetsAPI.getById(finalBusData.trajet_id);
                      const trajetData = trajetResponse?.data || trajetResponse;
                      if (trajetData) {
                        setTrajet(trajetData);
                        console.log('✅ Trajet défini:', trajetData);
                      }
                    } catch (err) {
                      console.warn('Erreur lors du chargement du trajet:', err);
                    }
                  } else if (eleveInscription.trajet_nom) {
                    // Si on a le nom du trajet mais pas l'ID, créer un objet minimal
                    setTrajet({ nom: eleveInscription.trajet_nom });
                  }
                  
                  // Charger le chauffeur
                  if (finalBusData.chauffeur_id) {
                    try {
                      const chauffeurResponse = await chauffeursAPI.getById(finalBusData.chauffeur_id);
                      const chauffeurData = chauffeurResponse?.data || chauffeurResponse;
                      if (chauffeurData) {
                        setChauffeur(chauffeurData);
                        console.log('✅ Chauffeur défini:', chauffeurData);
                      }
                    } catch (err) {
                      console.warn('Erreur lors du chargement du chauffeur:', err);
                    }
                  }
                  
                  // Charger le responsable bus
                  if (finalBusData.responsable_id) {
                    try {
                      const responsableResponse = await responsablesAPI.getById(finalBusData.responsable_id);
                      const responsableData = responsableResponse?.data || responsableResponse;
                      if (responsableData) {
                        setResponsable(responsableData);
                        console.log('✅ Responsable défini:', responsableData);
                      }
                    } catch (err) {
                      console.warn('Erreur lors du chargement du responsable:', err);
                    }
                  }
                } else {
                  // Si l'appel API échoue, utiliser au moins les données de l'inscription
                  console.warn('⚠️ Impossible de charger les données complètes du bus, utilisation des données de l\'inscription');
                  setBus(busDataFromInscription);
                  if (eleveInscription.trajet_nom) {
                    setTrajet({ nom: eleveInscription.trajet_nom });
                  }
                }
              } catch (err) {
                console.error('❌ Erreur lors du chargement du bus complet:', err);
                // En cas d'erreur, utiliser au moins les données de l'inscription
                console.log('⚠️ Utilisation des données bus de l\'inscription');
                setBus(busDataFromInscription);
                if (eleveInscription.trajet_nom) {
                  setTrajet({ nom: eleveInscription.trajet_nom });
                }
              }
            } else {
              // Si pas de données bus dans l'inscription, charger via API
              try {
                const busResponse = await busAPI.getById(eleveInscription.bus_id);
                console.log('🚌 Réponse bus:', busResponse);
                const busData = busResponse?.data || busResponse;
                console.log('🚌 Données bus:', busData);
                
                if (busData && busData.id) {
                  setBus(busData);
                  console.log('✅ Bus défini dans le state:', busData);
                  
                  // Charger le trajet
                  if (busData.trajet_id) {
                    try {
                      const trajetResponse = await trajetsAPI.getById(busData.trajet_id);
                      const trajetData = trajetResponse?.data || trajetResponse;
                      if (trajetData) {
                        setTrajet(trajetData);
                        console.log('✅ Trajet défini:', trajetData);
                      }
                    } catch (err) {
                      console.warn('Erreur lors du chargement du trajet:', err);
                    }
                  }
                  
                  // Charger le chauffeur
                  if (busData.chauffeur_id) {
                    try {
                      const chauffeurResponse = await chauffeursAPI.getById(busData.chauffeur_id);
                      const chauffeurData = chauffeurResponse?.data || chauffeurResponse;
                      if (chauffeurData) {
                        setChauffeur(chauffeurData);
                        console.log('✅ Chauffeur défini:', chauffeurData);
                      }
                    } catch (err) {
                      console.warn('Erreur lors du chargement du chauffeur:', err);
                    }
                  }
                  
                  // Charger le responsable bus
                  if (busData.responsable_id) {
                    try {
                      const responsableResponse = await responsablesAPI.getById(busData.responsable_id);
                      const responsableData = responsableResponse?.data || responsableResponse;
                      if (responsableData) {
                        setResponsable(responsableData);
                        console.log('✅ Responsable défini:', responsableData);
                      }
                    } catch (err) {
                      console.warn('Erreur lors du chargement du responsable:', err);
                    }
                  }
                } else {
                  console.warn('⚠️ Bus data invalide:', busData);
                }
              } catch (err) {
                console.error('❌ Erreur lors du chargement du bus:', err);
              }
            }
          } else {
            console.warn('⚠️ Aucune inscription active avec bus_id trouvée pour l\'élève');
            if (eleveInscription) {
              console.warn('📋 Inscription trouvée mais sans bus_id:', eleveInscription);
            }
          }
        } catch (err) {
          console.error('❌ Erreur lors du chargement des inscriptions:', err);
        }
        
        // Charger les présences (30 derniers jours pour avoir assez de données)
        try {
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const presencesResponse = await presencesAPI.getByEleve(eleveId, startDate, endDate);
          const presencesData = presencesResponse?.data || presencesResponse || [];
          // Trier par date décroissante
          const sortedPresences = Array.isArray(presencesData)
            ? presencesData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            : [];
          setAllPresences(sortedPresences);
          // Par défaut, prendre les 7 derniers jours
          setPresences(sortedPresences.slice(0, 7));
        } catch (err) {
          console.warn('Présences non disponibles:', err);
          setPresences([]);
          setAllPresences([]);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      const errorMessage = err.message || 'Erreur inconnue lors du chargement des données';
      setError(errorMessage);
      // Ne pas bloquer l'affichage si on a au moins l'élève de base
      if (!eleve) {
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const session = localStorage.getItem('tuteur_session');
      if (!session) {
        navigate(createPageUrl('TuteurLogin'));
        return;
      }
      
      const params = new URLSearchParams(window.location.search);
      // Vérifier les deux variantes possibles du paramètre (eleveId ou eleveld)
      const eleveId = params.get('eleveId') || params.get('eleveld') || params.get('id');
      console.log('TuteurEleveDetails - Paramètres URL:', { 
        eleveId, 
        search: window.location.search,
        eleveIdParam: params.get('eleveId'),
        eleveldParam: params.get('eleveld'),
        idParam: params.get('id'),
        allParams: Object.fromEntries(params.entries()),
        fullUrl: window.location.href
      });
      
      if (eleveId) {
        console.log('TuteurEleveDetails - Appel de loadData avec eleveId:', eleveId);
        loadData(eleveId).catch(err => {
          console.error('TuteurEleveDetails - Erreur dans loadData:', err);
          setError(err.message || 'Erreur lors du chargement des données');
          setLoading(false);
        });
      } else {
        // Si pas d'ID, afficher une erreur
        console.error('TuteurEleveDetails - Aucun ID d\'élève trouvé dans l\'URL');
        setError('Aucun ID d\'élève fourni dans l\'URL. Veuillez sélectionner un élève depuis le tableau de bord.');
        setLoading(false);
      }
    } catch (err) {
      console.error('TuteurEleveDetails - Erreur dans useEffect:', err);
      setError('Erreur lors de l\'initialisation: ' + (err.message || 'Erreur inconnue'));
      setLoading(false);
    }
  }, [navigate, loadData]);

  // Tous les hooks doivent être appelés AVANT les returns conditionnels
  // Filtrer les présences selon le type de filtre
  const filteredPresences = useMemo(() => {
    // Si pas de présences, retourner un tableau vide
    if (!allPresences || allPresences.length === 0) return [];
    
    const today = new Date();
    let startDate, endDate;
    
    switch (filterType) {
      case 'jour':
        // Un seul jour sélectionné
        const selected = new Date(selectedDate);
        startDate = startOfDay(selected);
        endDate = endOfDay(selected);
        return allPresences.filter(p => {
          const pDate = new Date(p.date);
          return pDate >= startDate && pDate <= endDate;
        });
      case 'semaine':
        // 7 derniers jours
        startDate = subDays(today, 6);
        endDate = today;
        return allPresences.filter(p => {
          const pDate = new Date(p.date);
          return pDate >= startDate && pDate <= endDate;
        }).slice(0, 7);
      case 'mois':
        // 30 derniers jours
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

  // Calculer les statistiques d'absence pour le graphique
  const chartData = useMemo(() => {
    if (!filteredPresences || filteredPresences.length === 0) return [];
    
    // Grouper par date et calculer les absences
    const grouped = {};
    
    filteredPresences.forEach(presence => {
      const date = format(new Date(presence.date), 'dd/MM', { locale: fr });
      if (!grouped[date]) {
        grouped[date] = { date, absents: 0, presents: 0 };
      }
      
      // Compter les absences (matin et soir)
      if (!presence.present_matin) grouped[date].absents++;
      else grouped[date].presents++;
      
      if (!presence.present_soir) grouped[date].absents++;
      else grouped[date].presents++;
    });
    
    // Convertir en tableau et trier par date
    return Object.values(grouped)
      .sort((a, b) => {
        try {
          // Convertir "dd/MM" en date (on utilise l'année actuelle)
          const [dayA, monthA] = a.date.split('/');
          const [dayB, monthB] = b.date.split('/');
          const year = new Date().getFullYear();
          const dateA = new Date(year, parseInt(monthA) - 1, parseInt(dayA));
          const dateB = new Date(year, parseInt(monthB) - 1, parseInt(dayB));
          return dateA - dateB;
        } catch (e) {
          console.error('Erreur lors du tri des dates:', e);
          return 0;
        }
      });
  }, [filteredPresences]);

  // Charger les présences quand le filtre change
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

  // S'assurer qu'on a au moins l'élève avant de rendre le contenu principal
  // Mais toujours afficher quelque chose pour éviter la page blanche
  if (!eleve && !loading) {
    // Si on n'a pas d'élève et qu'on n'est plus en chargement, afficher un message
    return (
      <TuteurLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            {error ? (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
                <p className="text-red-600 mb-4">{error}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Aucune donnée disponible</h2>
                <p className="text-gray-500 mb-4">Impossible de charger les informations de l'élève.</p>
              </>
            )}
            <Button 
              onClick={() => navigate(createPageUrl('TuteurDashboard'))}
              className="bg-lime-500 hover:bg-lime-600 text-white rounded-xl px-6 py-2"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </TuteurLayout>
    );
  }

  // Si on a l'élève, afficher le contenu principal
  // Cette condition est redondante mais on la garde pour sécurité

  // S'assurer qu'on a toujours quelque chose à afficher
  // Si on arrive ici sans élève, c'est une erreur
  if (!eleve) {
    return (
      <TuteurLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
            <p className="text-red-600 mb-4">{error || 'Impossible de charger les données de l\'élève.'}</p>
            <Button 
              onClick={() => navigate(createPageUrl('TuteurDashboard'))}
              className="bg-lime-500 hover:bg-lime-600 text-white rounded-xl px-6 py-2"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </TuteurLayout>
    );
  }

  // Rendu principal - on s'assure qu'on a toujours quelque chose à afficher
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
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                ×
              </button>
            </div>
          )}

          {/* Header Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 bg-gradient-to-r from-lime-500 to-lime-600">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-white">
                  <h1 className="text-2xl font-bold">{eleve?.prenom || ''} {eleve?.nom || ''}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-lg opacity-90">{eleve?.classe || 'N/A'}</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(eleve?.statut || 'Inactif')}`}>
                      {eleve?.statut || 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Infos Élève */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-lime-500" />
                Informations personnelles
              </h2>
              <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Classe</span>
                      <span className="font-medium text-gray-800">{eleve?.classe || 'N/A'}</span>
                    </div>
                    {eleve?.date_naissance && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Date de naissance</span>
                        <span className="font-medium text-gray-800">
                          {format(new Date(eleve.date_naissance), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                    )}
                    {eleve?.adresse && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Adresse</span>
                        <span className="font-medium text-gray-800 text-right max-w-[200px]">{eleve.adresse}</span>
                      </div>
                    )}
              </div>
            </div>

            {/* Infos Bus */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-lime-500" />
                Informations de transport
              </h2>
              
              {bus ? (
                <div className="space-y-3">
                  <div className="bg-lime-50 rounded-2xl p-4 border border-lime-100">
                    <p className="text-sm text-lime-600 font-medium mb-1">Bus assigné</p>
                    <p className="text-2xl font-bold text-gray-800">{bus.numero ? bus.numero.toString().replace(/^#\s*/, '') : 'N/A'}</p>
                    {bus.immatriculation && (
                      <p className="text-sm text-gray-500 mt-1">{bus.immatriculation}</p>
                    )}
                  </div>
                  
                  {bus.capacite && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Capacité</span>
                      <span className="font-medium text-gray-800">{bus.capacite} places</span>
                    </div>
                  )}
                  
                  {bus.plaque && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Plaque d'immatriculation</span>
                      <span className="font-medium text-gray-800">{bus.plaque}</span>
                    </div>
                  )}
                  
                  {chauffeur && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Chauffeur</p>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Nom</span>
                          <span className="font-medium text-gray-800">{chauffeur.prenom} {chauffeur.nom}</span>
                        </div>
                        {chauffeur.telephone && (
                          <div className="flex justify-between py-2">
                            <span className="text-gray-600">Téléphone</span>
                            <span className="font-medium text-gray-800">{chauffeur.telephone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {responsable && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Responsable bus</p>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Nom</span>
                          <span className="font-medium text-gray-800">{responsable.prenom} {responsable.nom}</span>
                        </div>
                        {responsable.telephone && (
                          <div className="flex justify-between py-2">
                            <span className="text-gray-600">Téléphone</span>
                            <span className="font-medium text-gray-800">{responsable.telephone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {trajet && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between py-2 mb-3">
                        <span className="text-gray-600">Trajet</span>
                        <span className="font-medium text-gray-800">{trajet.nom || 'N/A'}</span>
                      </div>
                      
                      {trajet.heure_depart_matin_a && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Horaires:</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-xs text-blue-600 mb-1">Matin</p>
                              <p className="font-semibold text-gray-800 text-sm">
                                {trajet.heure_depart_matin_a} - {trajet.heure_arrivee_matin_a}
                              </p>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-3">
                              <p className="text-xs text-orange-600 mb-1">Soir</p>
                              <p className="font-semibold text-gray-800 text-sm">
                                {trajet.heure_depart_soir_a} - {trajet.heure_arrivee_soir_a}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Aucun bus affecté</p>
                  <p className="text-sm mt-1">L'affectation sera faite après validation</p>
                </div>
              )}
            </div>
          </div>

          {/* Historique des présences */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mt-6">
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
                    <YAxis />
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
              </h3>
              
              {presences.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun historique de présence</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {presences.map((presence, index) => {
                    const presenceDate = new Date(presence.date);
                    const isToday = format(presenceDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    const isSelected = filterType === 'jour' && format(presenceDate, 'yyyy-MM-dd') === selectedDate;
                    
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Matin:</span>
                            <span className={`text-sm font-medium ${
                              presence.present_matin ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {presence.present_matin ? 'Présent' : 'Absent'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Soir:</span>
                            <span className={`text-sm font-medium ${
                              presence.present_soir ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {presence.present_soir ? 'Présent' : 'Absent'}
                            </span>
                          </div>
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
}