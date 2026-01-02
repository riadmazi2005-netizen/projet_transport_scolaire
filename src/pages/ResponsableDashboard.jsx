import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { responsablesAPI, busAPI, chauffeursAPI, elevesAPI, presencesAPI, notificationsAPI, inscriptionsAPI, accidentsAPI, trajetsAPI, tuteursAPI, rapportsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserCog, Bell, LogOut, Bus, Users, AlertCircle,
  DollarSign, User, Edit, CheckCircle, Plus, X, MessageSquare, Send, Navigation, MapPin
} from 'lucide-react';
import NotificationPanel from '../components/ui/NotificationPanel';
import StatCard from '../components/ui/StatCard';
import PresenceList from '../components/ui/PresenceList';
import { format } from 'date-fns';

export default function ResponsableDashboard() {
  const navigate = useNavigate();
  const [responsable, setResponsable] = useState(null);
  const [bus, setBus] = useState(null);
  const [chauffeur, setChauffeur] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [presences, setPresences] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('presence');
  const [accidents, setAccidents] = useState([]);
  const [showAccidentForm, setShowAccidentForm] = useState(false);
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
  
  // États pour Communication avec parents
  const [showCommunicationForm, setShowCommunicationForm] = useState(false);
  const [communicationForm, setCommunicationForm] = useState({
    destinataire: 'tous', // tous, bus, eleve
    bus_id: null,
    eleve_id: null,
    titre: '',
    message: '',
    type: 'info' // info, alerte, urgence
  });
  const [tuteurs, setTuteurs] = useState([]);
  
  // États pour trajets
  const [trajet, setTrajet] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('responsable_session');
    if (!session) {
      navigate(createPageUrl('ResponsableLogin'));
      return;
    }
    
    const responsableData = JSON.parse(session);
    setResponsable(responsableData);
    loadData(responsableData);
  }, [navigate]);
  
  // Vérification automatique des retards toutes les 5 minutes
  useEffect(() => {
    if (!bus || !trajet) return;
    
    const checkRetards = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const statusMap = {};
        const retardsDetectes = [];
        
        if (bus) {
          if (bus.chauffeur_id) {
            try {
              const rapportsResponse = await rapportsAPI.getByChauffeur(bus.chauffeur_id);
              const rapportsData = rapportsResponse?.data || rapportsResponse || [];
              const rapportAujourdhui = rapportsData.find(r => r.date === today);
              
              if (rapportAujourdhui && rapportAujourdhui.heure_depart_reelle) {
                if (trajet && trajet.id === bus.trajet_id) {
                  const periode = rapportAujourdhui.periode;
                  const heurePrevue = periode === 'matin' 
                    ? trajet.heure_depart_matin_a 
                    : trajet.heure_depart_soir_a;
                  
                  if (heurePrevue) {
                    const [hPrev, mPrev] = heurePrevue.split(':').map(Number);
                    const [hReel, mReel] = rapportAujourdhui.heure_depart_reelle.split(':').map(Number);
                    const retard = (hReel * 60 + mReel) - (hPrev * 60 + mPrev);
                    
                    if (retard > 10) { // Retard de plus de 10 minutes
                      retardsDetectes.push({
                        bus: bus,
                        retard: retard,
                        periode: periode
                      });
                    }
                  }
                }
              }
            } catch (err) {
              console.warn('Erreur vérification retard bus', bus.id, err);
            }
          }
        }
        
        // Envoyer des notifications automatiques pour les retards importants
        if (retardsDetectes.length > 0 && responsable) {
          for (const retard of retardsDetectes) {
            // Vérifier si on a déjà envoyé une notification pour ce retard aujourd'hui
            const notificationExiste = notifications.some(n => 
              n.titre?.includes(`Retard Bus ${retard.bus.numero}`) &&
              n.date?.startsWith(today)
            );
            
            if (!notificationExiste) {
              // Envoyer notification aux parents des élèves du bus
              try {
                const allInscriptions = await inscriptionsAPI.getAll();
                const inscriptions = (allInscriptions?.data || allInscriptions || []).filter(i => 
                  i.bus_id === retard.bus.id && i.statut === 'Active'
                );
                const eleveIds = inscriptions.map(i => i.eleve_id);
                const allEleves = await elevesAPI.getAll();
                const myEleves = (allEleves?.data || allEleves || []).filter(e => 
                  eleveIds.includes(e.id) && e.tuteur_id
                );
                
                const promises = myEleves.map(eleve => 
                  notificationsAPI.create({
                    destinataire_id: eleve.tuteur_id,
                    destinataire_type: 'tuteur',
                    titre: `Retard Bus ${retard.bus.numero}`,
                    message: `Le bus ${retard.bus.numero} a un retard de ${retard.retard} minutes pour le trajet ${retard.periode === 'matin' ? 'du matin' : 'du soir'}.`,
                    type: 'alerte',
                    date: new Date().toISOString()
                  })
                );
                
                await Promise.all(promises);
              } catch (err) {
                console.error('Erreur envoi notification retard:', err);
              }
            }
          }
        }
      } catch (err) {
        console.error('Erreur vérification retards:', err);
      }
    };
    
    // Vérifier immédiatement puis toutes les 5 minutes
    checkRetards();
    const interval = setInterval(checkRetards, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [bus, trajet, responsable]);

  const loadData = async (responsableData) => {
    try {
      // Charger les données complètes du responsable depuis l'API
      let responsableComplet = responsableData;
      if (responsableData.type_id) {
        try {
          const responsableResponse = await responsablesAPI.getById(responsableData.type_id);
          responsableComplet = responsableResponse?.data || responsableResponse || responsableData;
          setResponsable(responsableComplet);
        } catch (err) {
          console.warn('Erreur chargement données responsable:', err);
        }
      }
      
      // Charger le bus assigné à ce responsable (un seul bus)
      // Utiliser type_id (ID dans la table responsables_bus) au lieu de id (ID utilisateur)
      const allBusesResponse = await busAPI.getAll();
      const allBuses = allBusesResponse?.data || allBusesResponse || [];
      const responsableId = responsableData.type_id || responsableData.id;
      const myBus = allBuses.find(b => b.responsable_id === responsableId);
      setBus(myBus || null);
      
      // Si le responsable a un bus
      if (myBus) {
        // Charger le chauffeur du bus
        if (myBus.chauffeur_id) {
          try {
            const chauffeurResponse = await chauffeursAPI.getById(myBus.chauffeur_id);
            const chauffeurData = chauffeurResponse?.data || chauffeurResponse;
            setChauffeur(chauffeurData);
          } catch (err) {
            console.warn('Chauffeur non trouvé:', err);
          }
        }
        
        // Charger tous les élèves assignés au bus du responsable
        const allInscriptionsResponse = await inscriptionsAPI.getAll();
        const allInscriptions = allInscriptionsResponse?.data || allInscriptionsResponse || [];
        const myInscriptions = allInscriptions.filter(i => i.bus_id === myBus.id);
        
        const allElevesResponse = await elevesAPI.getAll();
        const allEleves = allElevesResponse?.data || allElevesResponse || [];
        const myEleves = allEleves.filter(e => 
          myInscriptions.some(i => i.eleve_id === e.id)
        );
        setEleves(myEleves);
      }
      
      // Charger les présences
      try {
        const presencesResponse = await presencesAPI.getByDate(selectedDate);
        const presencesData = presencesResponse?.data || presencesResponse || [];
        setPresences(presencesData);
      } catch (err) {
        console.warn('Présences non disponibles:', err);
        setPresences([]);
      }
      
      // Charger les notifications
      const notificationsResponse = await notificationsAPI.getByUser(responsableId, 'responsable');
      const notificationsData = notificationsResponse?.data || notificationsResponse || [];
      setNotifications(notificationsData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
      
      // Charger les accidents déclarés par ce responsable
      try {
        const accidentsResponse = await accidentsAPI.getByResponsable(responsableId);
        const accidentsData = accidentsResponse?.data || accidentsResponse || [];
        setAccidents(Array.isArray(accidentsData) ? accidentsData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)) : []);
      } catch (err) {
        console.warn('Erreur chargement accidents:', err);
        setAccidents([]);
      }
      
      // Charger le trajet du bus
      if (myBus && myBus.trajet_id) {
        try {
          const trajetResponse = await trajetsAPI.getById(myBus.trajet_id);
          const trajetData = trajetResponse?.data || trajetResponse;
          setTrajet(trajetData);
        } catch (err) {
          console.warn('Erreur chargement trajet:', err);
        }
      }
      
      // Charger les tuteurs pour la communication
      try {
        const tuteursResponse = await tuteursAPI.getAll();
        const tuteursData = tuteursResponse?.data || tuteursResponse || [];
        setTuteurs(tuteursData);
      } catch (err) {
        console.warn('Erreur chargement tuteurs:', err);
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('responsable_session');
    navigate(createPageUrl('Home'));
  };

  const markNotificationAsRead = async (notifId) => {
    try {
      await notificationsAPI.marquerLue(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, lue: true } : n));
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  const handleTogglePresence = async (eleveId, periode, value) => {
    try {
      const existingPresence = presences.find(p => 
        p.eleve_id === eleveId && p.date === selectedDate
      );
      
      if (existingPresence) {
        const updateData = periode === 'matin' 
          ? { present_matin: value }
          : { present_soir: value };
        
        await presencesAPI.marquer({
          ...existingPresence,
          ...updateData
        });
        
        setPresences(prev => prev.map(p => 
          p.id === existingPresence.id 
            ? { ...p, ...updateData }
            : p
        ));
      } else {
        const newPresence = await presencesAPI.marquer({
          eleve_id: eleveId,
          date: selectedDate,
          present_matin: periode === 'matin' ? value : false,
          present_soir: periode === 'soir' ? value : false,
          bus_id: buses[0]?.id,
          responsable_id: responsable.id
        });
        
        setPresences(prev => [...prev, newPresence]);
      }
      
      // Si marqué comme absent, envoyer notification au tuteur
      if (!value) {
        const eleve = eleves.find(e => e.id === eleveId);
        if (eleve && eleve.tuteur_id) {
          await notificationsAPI.create({
            destinataire_id: eleve.tuteur_id,
            destinataire_type: 'tuteur',
            titre: 'Absence signalée',
            message: `${eleve.prenom} ${eleve.nom} a été marqué(e) absent(e) le ${selectedDate} (${periode}).`,
            type: 'alerte',
            date: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('Erreur lors de la modification de présence:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.lue).length;
  const totalAccidents = chauffeur?.nombre_accidents || 0;

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
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <UserCog className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {responsable?.prenom} {responsable?.nom}
                </h1>
                <p className="text-gray-500">Responsable Bus</p>
                {responsable?.zone_responsabilite && (
                  <p className="text-sm text-gray-400">{responsable.zone_responsabilite}</p>
                )}
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Mon Bus" 
            value={bus?.numero || '-'} 
            icon={Bus} 
            color="amber"
          />
          <StatCard 
            title="Élèves" 
            value={eleves.length} 
            icon={Users} 
            color="blue"
          />
          <StatCard 
            title="Accidents chauffeur" 
            value={totalAccidents} 
            icon={AlertCircle} 
            color={totalAccidents >= 3 ? 'red' : 'green'}
          />
          <StatCard 
            title="Mon Salaire" 
            value={`${responsable?.salaire || 0} DH`} 
            icon={DollarSign} 
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['presence', 'eleves', 'bus', 'communication', 'accidents'].map((tab) => (
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
              {tab === 'presence' && 'Présences'}
              {tab === 'eleves' && 'Élèves'}
              {tab === 'bus' && 'Mon Bus'}
              {tab === 'communication' && 'Communication'}
              {tab === 'accidents' && 'Accidents'}
            </Button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'presence' && (
          <PresenceList
            eleves={eleves}
            presences={presences}
            onTogglePresence={handleTogglePresence}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}

        {activeTab === 'eleves' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-500" />
                Liste des Élèves
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {eleves.map((eleve) => (
                <div key={eleve.id} className="p-4 hover:bg-amber-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{eleve.nom} {eleve.prenom}</h3>
                        <p className="text-sm text-gray-500">
                          {eleve.classe}
                          {eleve.telephone_parent && ` • ${eleve.telephone_parent}`}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      eleve.statut === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {eleve.statut}
                    </span>
                  </div>
                </div>
              ))}
              {eleves.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun élève affecté à vos bus</p>
                </div>
              )}
            </div>
          </div>
        )}

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

            {/* Chauffeur */}
            {bus && (
              <div className="bg-white rounded-3xl shadow-xl p-6 md:col-span-2">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-500" />
                  Chauffeur
                </h2>
                {chauffeur ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {chauffeur.prenom} {chauffeur.nom}
                      </h3>
                      <p className="text-gray-500">{chauffeur.telephone}</p>
                      <p className="text-gray-400 text-sm">{chauffeur.email}</p>
                    </div>
                    <div className="ml-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Accidents:</span>
                        <span className={`font-bold ${
                          chauffeur.nombre_accidents >= 3 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {chauffeur.nombre_accidents} / 3
                        </span>
                      </div>
                      {chauffeur.nombre_accidents >= 3 && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-2 text-red-700 text-xs">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          Attention: 3 accidents = licenciement + amende 1000 DH
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-4">Aucun chauffeur assigné</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section Communication avec Parents */}
        {activeTab === 'communication' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-500" />
                Communication avec les Parents
              </h2>
              <Button
                onClick={() => setShowCommunicationForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
              >
                <Send className="w-4 h-4 mr-2" />
                Nouveau message
              </Button>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>💡 Astuce:</strong> Envoyez des notifications groupées pour informer tous les parents d'un bus, ou des messages personnalisés à un parent spécifique.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                    <p className="text-sm text-blue-600 font-medium">Messages envoyés</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {notifications.filter(n => n.destinataire_type === 'tuteur').length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                    <p className="text-sm text-green-600 font-medium">Parents notifiés</p>
                    <p className="text-2xl font-bold text-green-800">{tuteurs.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                    <p className="text-sm text-amber-600 font-medium">Élèves concernés</p>
                    <p className="text-2xl font-bold text-amber-800">{eleves.length}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Historique des messages</h3>
                  <div className="space-y-3">
                    {notifications
                      .filter(n => n.destinataire_type === 'tuteur')
                      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                      .slice(0, 10)
                      .map((notif) => (
                        <div key={notif.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-800">{notif.titre}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              notif.type === 'urgence' ? 'bg-red-100 text-red-700' :
                              notif.type === 'alerte' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {notif.type === 'urgence' ? 'Urgence' : notif.type === 'alerte' ? 'Alerte' : 'Info'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {format(new Date(notif.date || new Date()), 'dd MMMM yyyy à HH:mm')}
                          </p>
                        </div>
                      ))}
                    {notifications.filter(n => n.destinataire_type === 'tuteur').length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun message envoyé</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                <p className="text-sm text-gray-400 mt-1">Continuez à être vigilant !</p>
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
                        {format(new Date(accident.date), 'dd MMMM yyyy')}
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
                        <span className="ml-2 font-medium">{accident.degats || 'Non spécifiés'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  responsable_id: responsable?.id || responsable?.type_id || null,
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
                await loadData(responsable);
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

      {/* Modal Communication avec Parents */}
      {showCommunicationForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-cyan-500">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  Envoyer un Message aux Parents
                </h2>
                <button
                  onClick={() => setShowCommunicationForm(false)}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                let destinataires = [];
                
                if (communicationForm.destinataire === 'tous') {
                  // Envoyer à tous les tuteurs des élèves du bus du responsable
                  const allInscriptions = await inscriptionsAPI.getAll();
                  const inscriptions = (allInscriptions?.data || allInscriptions || []).filter(i => 
                    i.bus_id === bus?.id && i.statut === 'Active'
                  );
                  const eleveIds = inscriptions.map(i => i.eleve_id);
                  const allEleves = await elevesAPI.getAll();
                  const myEleves = (allEleves?.data || allEleves || []).filter(e => 
                    eleveIds.includes(e.id) && e.tuteur_id
                  );
                  destinataires = myEleves.map(e => e.tuteur_id);
                } else if (communicationForm.destinataire === 'bus' && bus) {
                  // Envoyer aux tuteurs des élèves du bus
                  const allInscriptions = await inscriptionsAPI.getAll();
                  const inscriptions = (allInscriptions?.data || allInscriptions || []).filter(i => 
                    i.bus_id === bus.id && i.statut === 'Active'
                  );
                  const eleveIds = inscriptions.map(i => i.eleve_id);
                  const allEleves = await elevesAPI.getAll();
                  const myEleves = (allEleves?.data || allEleves || []).filter(e => 
                    eleveIds.includes(e.id) && e.tuteur_id
                  );
                  destinataires = myEleves.map(e => e.tuteur_id);
                } else if (communicationForm.destinataire === 'eleve' && communicationForm.eleve_id) {
                  // Envoyer à un tuteur spécifique
                  const eleve = eleves.find(e => e.id === parseInt(communicationForm.eleve_id));
                  if (eleve && eleve.tuteur_id) {
                    destinataires = [eleve.tuteur_id];
                  }
                }
                
                // Envoyer les notifications
                const promises = destinataires.map(tuteurId => 
                  notificationsAPI.create({
                    destinataire_id: tuteurId,
                    destinataire_type: 'tuteur',
                    titre: communicationForm.titre,
                    message: communicationForm.message,
                    type: communicationForm.type,
                    date: new Date().toISOString()
                  })
                );
                
                await Promise.all(promises);
                
                alert(`Message envoyé à ${destinataires.length} parent(s) avec succès !`);
                setShowCommunicationForm(false);
                setCommunicationForm({
                  destinataire: 'tous',
                  bus_id: null,
                  eleve_id: null,
                  titre: '',
                  message: '',
                  type: 'info'
                });
                
                // Recharger les notifications
                const responsableId = responsable?.type_id || responsable?.id;
                const notificationsResponse = await notificationsAPI.getByUser(responsableId, 'responsable');
                const notificationsData = notificationsResponse?.data || notificationsResponse || [];
                setNotifications(notificationsData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
              } catch (err) {
                console.error('Erreur envoi message:', err);
                alert('Erreur lors de l\'envoi: ' + (err.message || 'Erreur inconnue'));
              }
            }} className="p-6 space-y-4">
              <div>
                <Label>Destinataire *</Label>
                <Select 
                  value={communicationForm.destinataire} 
                  onValueChange={(v) => setCommunicationForm({...communicationForm, destinataire: v, bus_id: null, eleve_id: null})}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les parents du bus</SelectItem>
                    <SelectItem value="bus">Parents du bus</SelectItem>
                    <SelectItem value="eleve">Parent d'un élève spécifique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {communicationForm.destinataire === 'bus' && bus && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Bus sélectionné:</strong> Bus {bus.numero}
                  </p>
                </div>
              )}
              
              {communicationForm.destinataire === 'eleve' && (
                <div>
                  <Label>Sélectionner un élève *</Label>
                  <Select 
                    value={communicationForm.eleve_id?.toString() || ''} 
                    onValueChange={(v) => setCommunicationForm({...communicationForm, eleve_id: parseInt(v)})}
                  >
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue placeholder="Choisir un élève" />
                    </SelectTrigger>
                    <SelectContent>
                      {eleves.map(eleve => (
                        <SelectItem key={eleve.id} value={eleve.id.toString()}>
                          {eleve.nom} {eleve.prenom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label>Type de message *</Label>
                <Select 
                  value={communicationForm.type} 
                  onValueChange={(v) => setCommunicationForm({...communicationForm, type: v})}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="alerte">Alerte</SelectItem>
                    <SelectItem value="urgence">Urgence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Titre *</Label>
                <Input
                  value={communicationForm.titre}
                  onChange={(e) => setCommunicationForm({...communicationForm, titre: e.target.value})}
                  className="mt-1 rounded-xl"
                  placeholder="Ex: Retard du bus, Changement d'horaires..."
                  required
                />
              </div>
              
              <div>
                <Label>Message *</Label>
                <Textarea
                  value={communicationForm.message}
                  onChange={(e) => setCommunicationForm({...communicationForm, message: e.target.value})}
                  className="mt-1 rounded-xl"
                  rows={6}
                  placeholder="Rédigez votre message aux parents..."
                  required
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCommunicationForm(false)}
                  className="rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
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