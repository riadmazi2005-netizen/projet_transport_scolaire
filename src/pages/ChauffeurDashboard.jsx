import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  chauffeursAPI, 
  busAPI, 
  trajetsAPI, 
  responsablesAPI, 
  elevesAPI, 
  presencesAPI, 
  accidentsAPI, 
  notificationsAPI,
  demandesAPI,
  essenceAPI,
  rapportsAPI,
  checklistAPI,
  signalementsAPI
} from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bus, Bell, LogOut, Users, AlertCircle, DollarSign,
  Navigation, User, CheckCircle, Calendar, MapPin, Plus, X, Search,
  Fuel, FileText, ClipboardCheck, Wrench, Clock, TrendingUp
} from 'lucide-react';
import NotificationPanel from '../components/ui/NotificationPanel';
import StatCard from '../components/ui/StatCard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ChauffeurDashboard() {
  const navigate = useNavigate();
  const [chauffeur, setChauffeur] = useState(null);
  const [bus, setBus] = useState(null);
  const [trajet, setTrajet] = useState(null);
  const [responsable, setResponsable] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [presences, setPresences] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bus');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAccidentForm, setShowAccidentForm] = useState(false);
  const [searchEleve, setSearchEleve] = useState('');
  const [filterGroupe, setFilterGroupe] = useState('tous');
  const [accidentForm, setAccidentForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    heure: format(new Date(), 'HH:mm'),
    lieu: '',
    description: '',
    degats: '',
    gravite: 'Légère',
    nombre_eleves: '',
    nombre_blesses: '0'
  });
  
  // États pour les nouvelles fonctionnalités
  const [showEssenceForm, setShowEssenceForm] = useState(false);
  const [showRapportForm, setShowRapportForm] = useState(false);
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [showSignalementForm, setShowSignalementForm] = useState(false);
  const [priseEssence, setPriseEssence] = useState([]);
  const [rapportsTrajet, setRapportsTrajet] = useState([]);
  const [signalements, setSignalements] = useState([]);
  
  // Formulaires
  const [essenceForm, setEssenceForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    heure: format(new Date(), 'HH:mm'),
    quantite_litres: '',
    prix_total: '',
    kilometrage_actuel: '',
    station_service: ''
  });
  
  const [rapportForm, setRapportForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    periode: 'matin',
    heure_depart_reelle: '',
    heure_arrivee_reelle: '',
    nombre_eleves: eleves.length,
    kilometres_parcourus: '',
    problemes: '',
    observations: ''
  });
  
  const [checklistForm, setChecklistForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    periode: 'matin',
    essence_verifiee: false,
    pneus_ok: false,
    portes_ok: false,
    eclairage_ok: false,
    nettoyage_fait: false,
    trousse_secours: false,
    autres_verifications: ''
  });
  
  const [signalementForm, setSignalementForm] = useState({
    type_probleme: 'mecanique',
    description: '',
    urgence: 'moyenne'
  });

  useEffect(() => {
    const session = localStorage.getItem('chauffeur_session');
    if (!session) {
      navigate(createPageUrl('ChauffeurLogin'));
      return;
    }
    
    const chauffeurData = JSON.parse(session);
    setChauffeur(chauffeurData);
    loadData(chauffeurData);
  }, [navigate]);

  const loadData = async (chauffeurData) => {
    try {
      // Charger les données complètes du chauffeur depuis l'API
      let chauffeurComplet = chauffeurData;
      if (chauffeurData.type_id) {
        try {
          const chauffeurResponse = await chauffeursAPI.getById(chauffeurData.type_id);
          chauffeurComplet = chauffeurResponse?.data || chauffeurResponse || chauffeurData;
          setChauffeur(chauffeurComplet);
        } catch (err) {
          console.warn('Erreur chargement données chauffeur:', err);
        }
      }
      
      // Récupérer tous les bus
      // Utiliser type_id (ID dans la table chauffeurs) au lieu de id (ID utilisateur)
      const allBusesResponse = await busAPI.getAll();
      const allBuses = allBusesResponse?.data || allBusesResponse || [];
      const chauffeurId = chauffeurData.type_id || chauffeurData.id;
      const chauffeurBus = allBuses.find(b => b.chauffeur_id === chauffeurId);
      
      if (chauffeurBus) {
        setBus(chauffeurBus);
        
        // Charger le trajet
        if (chauffeurBus.trajet_id) {
          try {
            const trajetResponse = await trajetsAPI.getById(chauffeurBus.trajet_id);
            const trajetData = trajetResponse?.data || trajetResponse;
            setTrajet(trajetData);
          } catch (err) {
            console.error('Erreur chargement trajet:', err);
          }
        }
        
        // Charger le responsable
        if (chauffeurBus.responsable_id) {
          try {
            const responsableResponse = await responsablesAPI.getById(chauffeurBus.responsable_id);
            const responsableData = responsableResponse?.data || responsableResponse;
            setResponsable(responsableData);
          } catch (err) {
            console.error('Erreur chargement responsable:', err);
          }
        }
        
        // Charger les élèves du bus
        try {
          const elevesResponse = await elevesAPI.getByBus(chauffeurBus.id);
          const elevesData = elevesResponse?.data || elevesResponse || [];
          setEleves(elevesData);
        } catch (err) {
          console.error('Erreur chargement élèves:', err);
        }
      }
      
      // Charger les accidents du chauffeur
      try {
        const accidentsData = await accidentsAPI.getByChauffeur(chauffeurId);
        setAccidents(accidentsData?.data || accidentsData || []);
      } catch (err) {
        console.error('Erreur chargement accidents:', err);
      }
      
      // Charger les présences (pour la date sélectionnée)
      try {
        const presencesData = await presencesAPI.getByDate(selectedDate);
        setPresences(presencesData?.data || presencesData || []);
      } catch (err) {
        console.error('Erreur chargement présences:', err);
      }
      
      // Charger les notifications
      try {
        const notificationsResponse = await notificationsAPI.getByUser(chauffeurId, 'chauffeur');
        const notificationsData = notificationsResponse?.data || notificationsResponse || [];
        setNotifications(notificationsData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
      } catch (err) {
        console.error('Erreur chargement notifications:', err);
      }
      
      // Charger les prises d'essence
      try {
        const essenceResponse = await essenceAPI.getByChauffeur(chauffeurId);
        const essenceData = essenceResponse?.data || essenceResponse || [];
        setPriseEssence(essenceData);
      } catch (err) {
        console.error('Erreur chargement essence:', err);
      }
      
      // Charger les rapports de trajet
      try {
        const rapportsResponse = await rapportsAPI.getByChauffeur(chauffeurId);
        const rapportsData = rapportsResponse?.data || rapportsResponse || [];
        setRapportsTrajet(rapportsData);
      } catch (err) {
        console.error('Erreur chargement rapports:', err);
      }
      
      // Charger les signalements
      try {
        const signalementsResponse = await signalementsAPI.getByChauffeur(chauffeurId);
        const signalementsData = signalementsResponse?.data || signalementsResponse || [];
        setSignalements(signalementsData);
      } catch (err) {
        console.error('Erreur chargement signalements:', err);
      }
    } catch (err) {
      console.error('Erreur générale:', err);
    }
    setLoading(false);
  };

  // Recharger les présences quand la date change
  useEffect(() => {
    if (!loading && chauffeur) {
      presencesAPI.getByDate(selectedDate)
        .then(data => setPresences(data))
        .catch(err => console.error('Erreur chargement présences:', err));
    }
  }, [selectedDate]);

  const handleLogout = () => {
    localStorage.removeItem('chauffeur_session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate(createPageUrl('Home'));
  };

  const markNotificationAsRead = async (notifId) => {
    try {
      await notificationsAPI.marquerLue(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, lue: true } : n));
    } catch (err) {
      console.error('Erreur marquage notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.lue).length;

  const getPresenceForDate = (eleveId, date) => {
    return presences.find(p => p.eleve_id === eleveId && p.date === date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Bus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {chauffeur?.prenom} {chauffeur?.nom}
                </h1>
                <p className="text-gray-500">Chauffeur</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNotifications(true)}
                className="relative rounded-xl"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Warning if 3 accidents */}
        {chauffeur?.nombre_accidents >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700"
          >
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Attention : Vous avez atteint 3 accidents</p>
              <p className="text-sm">Selon le règlement, cela entraîne un licenciement et une amende de 1000 DH</p>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Mon Bus" 
            value={bus?.numero || '-'} 
            icon={Bus} 
            color="amber"
          />
          {(() => {
            const essenceCeMois = priseEssence.filter(e => {
              const date = new Date(e.date);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            });
            const totalLitres = essenceCeMois.reduce((sum, e) => sum + parseFloat(e.quantite_litres || 0), 0);
            const totalCout = essenceCeMois.reduce((sum, e) => sum + parseFloat(e.prix_total || 0), 0);
            const nbPrises = essenceCeMois.length;
            
            return (
              <StatCard 
                title="Essence (ce mois)" 
                value={`${totalLitres.toFixed(1)} L`}
                subtitle={nbPrises > 0 ? `${nbPrises} prise${nbPrises > 1 ? 's' : ''} • ${totalCout.toFixed(2)} DH` : 'Aucune prise'}
                icon={Fuel} 
                color="green"
              />
            );
          })()}
          <StatCard 
            title="Mes Accidents" 
            value={`${chauffeur?.nombre_accidents || 0} / 3`} 
            icon={AlertCircle} 
            color={chauffeur?.nombre_accidents >= 2 ? 'red' : 'green'}
          />
          <StatCard 
            title="Mon Salaire" 
            value={`${chauffeur?.salaire || 0} DH`} 
            icon={DollarSign} 
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['bus', 'essence', 'signalements', 'accidents'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                  : ''
              }`}
            >
              {tab === 'bus' && 'Mon Bus & Trajet'}
              {tab === 'essence' && 'Essence'}
              {tab === 'signalements' && 'Problèmes'}
              {tab === 'accidents' && 'Mes Accidents'}
            </Button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'bus' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-500" />
                Mon Bus
              </h2>
              {bus ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 rounded-2xl p-6 text-center">
                    <p className="text-5xl font-bold text-amber-600">{bus.numero}</p>
                    <p className="text-gray-500 mt-2">{bus.marque} {bus.modele}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Capacité</span>
                      <span className="font-medium">{bus.capacite} places</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Places occupées</span>
                      <span className="font-medium">{eleves.length}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Statut</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        bus.statut === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {bus.statut}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">Aucun bus assigné</p>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-amber-500" />
                Mon Trajet
              </h2>
              {trajet ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-2xl p-4">
                    <p className="text-sm text-blue-600 font-medium">Trajet</p>
                    <p className="text-xl font-bold text-gray-800">{trajet.nom}</p>
                  </div>
                  
                  {trajet.zones && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Zones desservies
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(trajet.zones) ? trajet.zones : JSON.parse(trajet.zones || '[]')).map((zone, i) => (
                          <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                            {zone}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs text-green-600 font-medium">Groupe A - Matin</p>
                      <p className="font-semibold text-gray-800">{trajet.heure_depart_matin_a} - {trajet.heure_arrivee_matin_a}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3">
                      <p className="text-xs text-orange-600 font-medium">Groupe A - Soir</p>
                      <p className="font-semibold text-gray-800">{trajet.heure_depart_soir_a} - {trajet.heure_arrivee_soir_a}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-blue-600 font-medium">Groupe B - Matin</p>
                      <p className="font-semibold text-gray-800">{trajet.heure_depart_matin_b} - {trajet.heure_arrivee_matin_b}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-xs text-purple-600 font-medium">Groupe B - Soir</p>
                      <p className="font-semibold text-gray-800">{trajet.heure_depart_soir_b} - {trajet.heure_arrivee_soir_b}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">Aucun trajet assigné</p>
              )}
            </div>

            {/* Responsable */}
            <div className="bg-white rounded-3xl shadow-xl p-6 md:col-span-2">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Responsable Bus
              </h2>
              {responsable ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {responsable.prenom} {responsable.nom}
                    </h3>
                    <p className="text-gray-500">{responsable.telephone}</p>
                    <p className="text-gray-400 text-sm">{responsable.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">Aucun responsable assigné</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'accidents' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                Historique des Accidents
              </h2>
              <Button
                onClick={() => setShowAccidentForm(true)}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Déclarer un accident
              </Button>
            </div>
            {accidents.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-300 mb-4" />
                <p className="text-gray-500">Aucun accident enregistré</p>
                <p className="text-sm text-gray-400 mt-1">Continuez à conduire prudemment !</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {accidents.map((accident) => (
                  <div key={accident.id} className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          accident.gravite === 'Grave' ? 'bg-red-100 text-red-700' :
                          accident.gravite === 'Moyenne' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {accident.gravite}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(accident.date), 'dd MMMM yyyy', { locale: fr })}
                        {accident.heure && ` à ${accident.heure}`}
                      </p>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">{accident.description}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Lieu:</span>
                        <span className="ml-2 font-medium">{accident.lieu || 'Non spécifié'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Dégâts:</span>
                        <span className="ml-2 font-medium">{accident.degats}</span>
                      </div>
                    </div>
                    {accident.blesses && (
                      <div className="mt-3 p-3 bg-red-50 rounded-xl text-red-700 text-sm">
                        ⚠️ Des blessés ont été signalés
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Essence */}
        {activeTab === 'essence' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Fuel className="w-6 h-6 text-green-500" />
                Gestion de l'Essence
              </h2>
              <Button
                onClick={() => setShowEssenceForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle prise d'essence
              </Button>
            </div>
            
            {/* Statistiques */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-green-50">
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">Prises ce mois</p>
                <p className="text-2xl font-bold text-gray-800">{priseEssence.filter(e => {
                  const date = new Date(e.date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">Total litres</p>
                <p className="text-2xl font-bold text-gray-800">
                  {priseEssence.reduce((sum, e) => sum + parseFloat(e.quantite_litres || 0), 0).toFixed(1)} L
                </p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">Coût total</p>
                <p className="text-2xl font-bold text-gray-800">
                  {priseEssence.reduce((sum, e) => sum + parseFloat(e.prix_total || 0), 0).toFixed(2)} DH
                </p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">Moyenne/L</p>
                <p className="text-2xl font-bold text-gray-800">
                  {priseEssence.length > 0 
                    ? (priseEssence.reduce((sum, e) => sum + parseFloat(e.prix_total || 0), 0) / 
                       priseEssence.reduce((sum, e) => sum + parseFloat(e.quantite_litres || 0), 0)).toFixed(2)
                    : '0.00'} DH
                </p>
              </div>
            </div>

            {/* Historique */}
            <div className="divide-y divide-gray-100">
              {priseEssence.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Fuel className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune prise d'essence enregistrée</p>
                </div>
              ) : (
                priseEssence.sort((a, b) => new Date(b.date + ' ' + b.heure) - new Date(a.date + ' ' + a.heure)).map((essence) => (
                  <div key={essence.id} className="p-6 hover:bg-green-50/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Fuel className="w-5 h-5 text-green-500" />
                          <h3 className="font-semibold text-gray-800">
                            {format(new Date(essence.date), 'dd MMMM yyyy', { locale: fr })} à {essence.heure}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Quantité:</span>
                            <span className="ml-2 font-medium">{essence.quantite_litres} L</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Prix:</span>
                            <span className="ml-2 font-medium">{essence.prix_total} DH</span>
                          </div>
                          {essence.kilometrage_actuel && (
                            <div>
                              <span className="text-gray-500">Kilométrage:</span>
                              <span className="ml-2 font-medium">{essence.kilometrage_actuel} km</span>
                            </div>
                          )}
                          {essence.station_service && (
                            <div>
                              <span className="text-gray-500">Station:</span>
                              <span className="ml-2 font-medium">{essence.station_service}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Section Signalements */}
        {/* Section Signalements */}
        {activeTab === 'signalements' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-orange-500" />
                Signalements de Problèmes
              </h2>
              <Button
                onClick={() => setShowSignalementForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Signaler un problème
              </Button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {signalements.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun signalement enregistré</p>
                </div>
              ) : (
                signalements.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation)).map((signalement) => (
                  <div key={signalement.id} className="p-6 hover:bg-orange-50/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          signalement.type_probleme === 'mecanique' ? 'bg-red-100 text-red-700' :
                          signalement.type_probleme === 'eclairage' ? 'bg-yellow-100 text-yellow-700' :
                          signalement.type_probleme === 'portes' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {signalement.type_probleme === 'mecanique' ? 'Mécanique' :
                           signalement.type_probleme === 'eclairage' ? 'Éclairage' :
                           signalement.type_probleme === 'portes' ? 'Portes' :
                           signalement.type_probleme === 'climatisation' ? 'Climatisation' :
                           signalement.type_probleme === 'pneus' ? 'Pneus' : 'Autre'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          signalement.urgence === 'haute' ? 'bg-red-100 text-red-700' :
                          signalement.urgence === 'moyenne' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {signalement.urgence === 'haute' ? 'Haute' :
                           signalement.urgence === 'moyenne' ? 'Moyenne' : 'Faible'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          signalement.statut === 'resolu' ? 'bg-green-100 text-green-700' :
                          signalement.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {signalement.statut === 'resolu' ? 'Résolu' :
                           signalement.statut === 'en_cours' ? 'En cours' : 'En attente'}
                        </span>
                        <p className="text-sm text-gray-500">
                          {format(new Date(signalement.date_creation), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-800 mb-2">{signalement.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modal Déclaration Accident */}
      {showAccidentForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-500 to-rose-500">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Déclarer un Accident
                </h2>
                <button
                  onClick={() => setShowAccidentForm(false)}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const accidentData = {
                  date: accidentForm.date,
                  heure: accidentForm.heure,
                  bus_id: bus?.id || null,
                  chauffeur_id: chauffeur?.id || chauffeur?.type_id || null,
                  lieu: accidentForm.lieu,
                  description: accidentForm.description,
                  degats: accidentForm.degats || null,
                  gravite: accidentForm.gravite,
                  nombre_eleves: accidentForm.nombre_eleves ? parseInt(accidentForm.nombre_eleves) : null,
                  nombre_blesses: accidentForm.nombre_blesses ? parseInt(accidentForm.nombre_blesses) : 0,
                  blesses: parseInt(accidentForm.nombre_blesses) > 0
                };

                await accidentsAPI.create(accidentData);
                setShowAccidentForm(false);
                setAccidentForm({
                  date: format(new Date(), 'yyyy-MM-dd'),
                  heure: format(new Date(), 'HH:mm'),
                  lieu: '',
                  description: '',
                  degats: '',
                  gravite: 'Légère',
                  nombre_eleves: '',
                  nombre_blesses: '0'
                });
                await loadData(chauffeur);
                alert('Accident déclaré avec succès');
              } catch (err) {
                console.error('Erreur déclaration accident:', err);
                alert('Erreur lors de la déclaration: ' + (err.message || 'Erreur inconnue'));
              }
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={accidentForm.date}
                    onChange={(e) => setAccidentForm({...accidentForm, date: e.target.value})}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label>Heure *</Label>
                  <Input
                    type="time"
                    value={accidentForm.heure}
                    onChange={(e) => setAccidentForm({...accidentForm, heure: e.target.value})}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label>Lieu *</Label>
                  <Input
                    value={accidentForm.lieu}
                    onChange={(e) => setAccidentForm({...accidentForm, lieu: e.target.value})}
                    className="mt-1 rounded-xl"
                    placeholder="Adresse de l'accident"
                    required
                  />
                </div>
                <div>
                  <Label>Gravité *</Label>
                  <Select
                    value={accidentForm.gravite}
                    onValueChange={(v) => setAccidentForm({...accidentForm, gravite: v})}
                  >
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Légère">Légère</SelectItem>
                      <SelectItem value="Moyenne">Moyenne</SelectItem>
                      <SelectItem value="Grave">Grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nombre d'élèves dans le bus</Label>
                  <Input
                    type="number"
                    value={accidentForm.nombre_eleves}
                    onChange={(e) => setAccidentForm({...accidentForm, nombre_eleves: e.target.value})}
                    className="mt-1 rounded-xl"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Nombre de blessés</Label>
                  <Input
                    type="number"
                    value={accidentForm.nombre_blesses}
                    onChange={(e) => setAccidentForm({...accidentForm, nombre_blesses: e.target.value})}
                    className="mt-1 rounded-xl"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={accidentForm.description}
                  onChange={(e) => setAccidentForm({...accidentForm, description: e.target.value})}
                  className="mt-1 rounded-xl"
                  rows={4}
                  placeholder="Décrivez l'accident en détail..."
                  required
                />
              </div>
              <div>
                <Label>Dégâts</Label>
                <Textarea
                  value={accidentForm.degats}
                  onChange={(e) => setAccidentForm({...accidentForm, degats: e.target.value})}
                  className="mt-1 rounded-xl"
                  rows={2}
                  placeholder="Décrivez les dégâts matériels..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAccidentForm(false)}
                  className="rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Déclarer l'accident
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Prise d'Essence */}
      {showEssenceForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-500 to-emerald-500">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Fuel className="w-6 h-6" />
                  Prise d'Essence
                </h2>
                <button onClick={() => setShowEssenceForm(false)} className="text-white hover:text-green-100">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const essenceData = {
                  chauffeur_id: chauffeur?.id || chauffeur?.type_id,
                  bus_id: bus?.id,
                  date: essenceForm.date,
                  heure: essenceForm.heure,
                  quantite_litres: parseFloat(essenceForm.quantite_litres),
                  prix_total: parseFloat(essenceForm.prix_total),
                  kilometrage_actuel: essenceForm.kilometrage_actuel ? parseInt(essenceForm.kilometrage_actuel) : null,
                  station_service: essenceForm.station_service || null
                };
                
                const response = await essenceAPI.create(essenceData);
                if (response.success) {
                  // Recharger les données
                  const essenceResponse = await essenceAPI.getByChauffeur(chauffeur?.id || chauffeur?.type_id);
                  const essenceData = essenceResponse?.data || essenceResponse || [];
                  setPriseEssence(essenceData);
                  
                  alert('Prise d\'essence enregistrée avec succès ! Le responsable a été notifié.');
                  setShowEssenceForm(false);
                  setEssenceForm({
                    date: format(new Date(), 'yyyy-MM-dd'),
                    heure: format(new Date(), 'HH:mm'),
                    quantite_litres: '',
                    prix_total: '',
                    kilometrage_actuel: '',
                    station_service: ''
                  });
                }
              } catch (err) {
                alert('Erreur: ' + (err.message || 'Erreur inconnue'));
              }
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={essenceForm.date} onChange={(e) => setEssenceForm({...essenceForm, date: e.target.value})} className="mt-1 rounded-xl" required />
                </div>
                <div>
                  <Label>Heure *</Label>
                  <Input type="time" value={essenceForm.heure} onChange={(e) => setEssenceForm({...essenceForm, heure: e.target.value})} className="mt-1 rounded-xl" required />
                </div>
                <div>
                  <Label>Quantité (litres) *</Label>
                  <Input type="number" step="0.01" value={essenceForm.quantite_litres} onChange={(e) => setEssenceForm({...essenceForm, quantite_litres: e.target.value})} className="mt-1 rounded-xl" required />
                </div>
                <div>
                  <Label>Prix total (DH) *</Label>
                  <Input type="number" step="0.01" value={essenceForm.prix_total} onChange={(e) => setEssenceForm({...essenceForm, prix_total: e.target.value})} className="mt-1 rounded-xl" required />
                </div>
                <div>
                  <Label>Kilométrage actuel</Label>
                  <Input type="number" value={essenceForm.kilometrage_actuel} onChange={(e) => setEssenceForm({...essenceForm, kilometrage_actuel: e.target.value})} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label>Station-service</Label>
                  <Input value={essenceForm.station_service} onChange={(e) => setEssenceForm({...essenceForm, station_service: e.target.value})} className="mt-1 rounded-xl" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowEssenceForm(false)} className="rounded-xl">
                  <X className="w-4 h-4 mr-2" /> Annuler
                </Button>
                <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                  <Fuel className="w-4 h-4 mr-2" /> Enregistrer
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Signalement Problème */}
      {showSignalementForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-red-500">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wrench className="w-6 h-6" />
                  Signaler un Problème
                </h2>
                <button onClick={() => setShowSignalementForm(false)} className="text-white hover:text-orange-100">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const signalementData = {
                  chauffeur_id: chauffeur?.id || chauffeur?.type_id,
                  bus_id: bus?.id,
                  type_probleme: signalementForm.type_probleme,
                  description: signalementForm.description,
                  urgence: signalementForm.urgence
                };
                
                const response = await signalementsAPI.create(signalementData);
                if (response.success) {
                  // Recharger les données
                  const signalementsResponse = await signalementsAPI.getByChauffeur(chauffeur?.id || chauffeur?.type_id);
                  const signalementsData = signalementsResponse?.data || signalementsResponse || [];
                  setSignalements(signalementsData);
                  
                  alert('Problème signalé avec succès ! Le responsable a été notifié.');
                  setShowSignalementForm(false);
                  setSignalementForm({
                    type_probleme: 'mecanique',
                    description: '',
                    urgence: 'moyenne'
                  });
                }
              } catch (err) {
                alert('Erreur: ' + (err.message || 'Erreur inconnue'));
              }
            }} className="p-6 space-y-4">
              <div>
                <Label>Type de problème *</Label>
                <Select value={signalementForm.type_probleme} onValueChange={(v) => setSignalementForm({...signalementForm, type_probleme: v})}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mecanique">Mécanique</SelectItem>
                    <SelectItem value="eclairage">Éclairage</SelectItem>
                    <SelectItem value="portes">Portes</SelectItem>
                    <SelectItem value="climatisation">Climatisation</SelectItem>
                    <SelectItem value="pneus">Pneus</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Urgence *</Label>
                <Select value={signalementForm.urgence} onValueChange={(v) => setSignalementForm({...signalementForm, urgence: v})}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faible">Faible</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea value={signalementForm.description} onChange={(e) => setSignalementForm({...signalementForm, description: e.target.value})} className="mt-1 rounded-xl" rows={4} required placeholder="Décrivez le problème en détail..." />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowSignalementForm(false)} className="rounded-xl">
                  <X className="w-4 h-4 mr-2" /> Annuler
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                  <Wrench className="w-4 h-4 mr-2" /> Signaler
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onDelete={async (notifId) => {
          try {
            await notificationsAPI.delete(notifId);
            setNotifications(prev => prev.filter(n => n.id !== notifId));
          } catch (err) {
            console.error('Erreur lors de la suppression de la notification:', err);
          }
        }}
      />
    </div>
  );
}