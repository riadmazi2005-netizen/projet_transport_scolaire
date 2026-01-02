import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { responsablesAPI, busAPI, chauffeursAPI, elevesAPI, presencesAPI, notificationsAPI, inscriptionsAPI, accidentsAPI, trajetsAPI, tuteursAPI, rapportsAPI } from '../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserCog, Bell, LogOut, Bus, Users, AlertCircle,
  DollarSign, User, Edit, CheckCircle, Plus, X, MessageSquare, Send, Navigation, MapPin, Image, Trash2, Phone, Check, Calendar, Mail
} from 'lucide-react';
import NotificationPanel from '../components/ui/NotificationPanel';
import StatCard from '../components/ui/StatCard';
import PresenceList from '../components/ui/PresenceList';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';

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
  
  // États pour les filtres de la liste des élèves
  const [elevesDateFilter, setElevesDateFilter] = useState('today');
  const [elevesCustomDate, setElevesCustomDate] = useState('');
  const [elevesGroupFilter, setElevesGroupFilter] = useState('all');
  const [elevesSearchTerm, setElevesSearchTerm] = useState('');
  const [elevesPeriodeFilter, setElevesPeriodeFilter] = useState(() => {
    // Détecter automatiquement la période selon l'heure actuelle
    const now = new Date();
    const hour = now.getHours();
    return hour < 13 ? 'matin' : 'soir';
  });
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
  const [accidentPhotos, setAccidentPhotos] = useState([]); // Array of File objects or base64 strings
  
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
  
  // État pour les messages envoyés
  const [sentMessages, setSentMessages] = useState([]);
  
  // État pour la confirmation de suppression
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, messageId: null });
  
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
      
      console.log('Responsable ID:', responsableId);
      console.log('Bus trouvé:', myBus);
      
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
        try {
          console.log('Chargement élèves pour bus_id:', myBus.id);
          const elevesResponse = await elevesAPI.getByBus(myBus.id);
          console.log('Réponse élèves:', elevesResponse);
          const elevesData = elevesResponse?.data || elevesResponse || [];
          console.log('Élèves chargés:', elevesData);
          setEleves(Array.isArray(elevesData) ? elevesData : []);
        } catch (err) {
          console.error('Erreur chargement élèves:', err);
          setEleves([]);
        }
      } else {
        console.warn('Aucun bus trouvé pour le responsable_id:', responsableId);
        setEleves([]);
      }
      
      // Charger les présences pour le bus du responsable
      try {
        // Filtrer les présences par bus_id si disponible
        const presencesResponse = await presencesAPI.getByDate(selectedDate, myBus?.id);
        const presencesData = presencesResponse?.data || presencesResponse || [];
        // Filtrer aussi par responsable_id côté client pour plus de sécurité
        const filteredPresences = presencesData.filter(p => 
          !p.bus_id || p.bus_id === myBus.id || 
          !p.responsable_id || p.responsable_id === responsableId
        );
        setPresences(filteredPresences);
      } catch (err) {
        console.warn('Présences non disponibles:', err);
        setPresences([]);
      }
      
      // Charger les notifications reçues
      const notificationsResponse = await notificationsAPI.getByUser(responsableId, 'responsable');
      const notificationsData = notificationsResponse?.data || notificationsResponse || [];
      setNotifications(notificationsData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
      
      // Charger les messages envoyés aux tuteurs
      try {
        const sentMessagesResponse = await notificationsAPI.getSentByResponsable(responsableId);
        const sentMessagesData = sentMessagesResponse?.data || sentMessagesResponse || [];
        setSentMessages(sentMessagesData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
      } catch (err) {
        console.warn('Erreur chargement messages envoyés:', err);
        setSentMessages([]);
      }
      
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

  // États pour les notifications toast
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // 'success', 'error', 'info'
  
  // Fonction pour afficher un toast
  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000); // Disparaît après 4 secondes
  };

  // Fonction pour compresser une image
  const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculer les nouvelles dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir en base64 avec compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve({
            data: compressedBase64,
            name: file.name,
            type: 'image/jpeg'
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Fonction pour calculer la date effective pour la liste des élèves
  const getElevesEffectiveDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (elevesDateFilter) {
      case 'yesterday':
        return format(subDays(today, 1), 'yyyy-MM-dd');
      case 'dayBefore':
        return format(subDays(today, 2), 'yyyy-MM-dd');
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return format(startOfMonth(lastMonth), 'yyyy-MM-dd');
      case 'custom':
        return elevesCustomDate || format(today, 'yyyy-MM-dd');
      default: // 'today'
        return format(today, 'yyyy-MM-dd');
    }
  };

  // Filtrer les élèves pour la liste (recalculé quand les filtres changent)
  const filteredElevesList = useMemo(() => {
    return eleves.filter(eleve => {
      const matchGroup = elevesGroupFilter === 'all' || eleve.groupe === elevesGroupFilter;
      const matchSearch = eleve.nom.toLowerCase().includes(elevesSearchTerm.toLowerCase()) ||
                         eleve.prenom.toLowerCase().includes(elevesSearchTerm.toLowerCase());
      
      return matchGroup && matchSearch;
    });
  }, [eleves, elevesGroupFilter, elevesSearchTerm]);

  // Recharger les présences quand le filtre de date change dans la partie Élèves
  useEffect(() => {
    if (activeTab === 'eleves' && bus && responsable) {
      const loadPresencesForDate = async () => {
        try {
          const effectiveDate = getElevesEffectiveDate();
          const responsableId = responsable?.type_id || responsable?.id;
          console.log('Chargement présences pour date:', effectiveDate, 'bus:', bus.id);
          const presencesResponse = await presencesAPI.getByDate(effectiveDate, bus?.id);
          const presencesData = presencesResponse?.data || presencesResponse || [];
          console.log('Présences reçues:', presencesData);
          // Filtrer aussi par responsable_id côté client pour plus de sécurité
          const filteredPresences = presencesData.filter(p => 
            !p.bus_id || p.bus_id === bus.id || 
            !p.responsable_id || p.responsable_id === responsableId
          );
          console.log('Présences filtrées:', filteredPresences);
          setPresences(filteredPresences);
        } catch (err) {
          console.error('Erreur chargement présences pour date filtrée:', err);
          setPresences([]);
        }
      };
      
      loadPresencesForDate();
    }
  }, [elevesDateFilter, elevesCustomDate, activeTab, bus?.id, responsable?.type_id, responsable?.id]);

  // Composant pour les filtres de la liste des élèves
  const ElevesListFilters = ({ dateFilter, setDateFilter, customDate, setCustomDate, groupFilter, setGroupFilter, searchTerm, setSearchTerm, periodeFilter, setPeriodeFilter }) => {
    // Détecter automatiquement la période actuelle
    const getCurrentPeriod = () => {
      const now = new Date();
      const hour = now.getHours();
      return hour < 13 ? 'matin' : 'soir';
    };
    
    return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      <Select value={dateFilter} onValueChange={setDateFilter}>
        <SelectTrigger className="bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500">
          <SelectValue placeholder="Date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Aujourd'hui</SelectItem>
          <SelectItem value="yesterday">Hier</SelectItem>
          <SelectItem value="dayBefore">Avant-hier</SelectItem>
          <SelectItem value="lastMonth">Mois dernier</SelectItem>
          <SelectItem value="custom">Jour spécifique</SelectItem>
        </SelectContent>
      </Select>

      {dateFilter === 'custom' && (
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
          <Input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="pl-10 bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      )}
      
      <Select value={groupFilter} onValueChange={setGroupFilter}>
        <SelectTrigger className="bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500">
          <SelectValue placeholder="Groupe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les groupes</SelectItem>
          <SelectItem value="A">Groupe A</SelectItem>
          <SelectItem value="B">Groupe B</SelectItem>
        </SelectContent>
      </Select>

      <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
        <SelectTrigger className="bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500">
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="matin">
            Matin {getCurrentPeriod() === 'matin' && '(Actuel)'}
          </SelectItem>
          <SelectItem value="soir">
            Soir {getCurrentPeriod() === 'soir' && '(Actuel)'}
          </SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="Rechercher un élève..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500"
      />
    </div>
    );
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
      
      let presenceData;
      
      if (existingPresence) {
        // Mettre à jour la présence existante
        const updateData = {
          ...existingPresence,
          [periode === 'matin' ? 'present_matin' : 'present_soir']: value
        };
        
        const response = await presencesAPI.marquer(updateData);
        presenceData = response?.data || response;
        
        setPresences(prev => prev.map(p => 
          p.id === existingPresence.id 
            ? { ...p, ...presenceData }
            : p
        ));
      } else {
        // Créer une nouvelle présence
        const newPresenceData = {
          eleve_id: eleveId,
          date: selectedDate,
          present_matin: periode === 'matin' ? value : false,
          present_soir: periode === 'soir' ? value : false,
          bus_id: bus?.id,
          responsable_id: responsable?.type_id || responsable?.id
        };
        
        const response = await presencesAPI.marquer(newPresenceData);
        presenceData = response?.data || response;
        
        setPresences(prev => [...prev, presenceData]);
      }
      
      // Recharger les présences pour mettre à jour l'affichage
      try {
        const presencesResponse = await presencesAPI.getByDate(selectedDate);
        const presencesData = presencesResponse?.data || presencesResponse || [];
        setPresences(presencesData);
      } catch (err) {
        console.warn('Erreur rechargement présences:', err);
      }
      
      // Si marqué comme absent, envoyer notification au tuteur
      if (!value) {
        const eleve = eleves.find(e => e.id === eleveId);
        if (eleve && eleve.tuteur_id) {
          try {
            await notificationsAPI.create({
              destinataire_id: eleve.tuteur_id,
              destinataire_type: 'tuteur',
              titre: 'Absence signalée',
              message: `${eleve.prenom} ${eleve.nom} a été marqué(e) absent(e) le ${format(new Date(selectedDate), 'dd/MM/yyyy')} (${periode}).`,
              type: 'alerte',
              date: new Date().toISOString()
            });
          } catch (notifErr) {
            console.warn('Erreur envoi notification:', notifErr);
          }
        }
      }
      } catch (err) {
        console.error('Erreur lors de la modification de présence:', err);
        showToast('Erreur lors de la modification de présence: ' + (err.message || 'Erreur inconnue'), 'error');
      }
  };

  const handleNotifyAbsence = async (eleve, periode = 'matin') => {
    try {
      if (!eleve.tuteur_id) {
        showToast('Aucun tuteur trouvé pour cet élève', 'error');
        return;
      }

      // Rediriger vers l'onglet Communication et pré-remplir le formulaire
      setActiveTab('communication');
      setShowCommunicationForm(true);
      
      // Pré-remplir le formulaire avec les informations de l'élève absent
      setCommunicationForm({
        destinataire: 'eleve',
        bus_id: bus?.id || null,
        eleve_id: eleve.id,
        titre: `Absence de ${eleve.prenom} ${eleve.nom}`,
        message: `Bonjour,\n\nJe vous informe que ${eleve.prenom} ${eleve.nom} a été marqué(e) absent(e) le ${format(new Date(selectedDate), 'dd/MM/yyyy')} (${periode === 'matin' ? 'matin' : 'soir'}).\n\nVeuillez nous contacter si vous avez des questions.\n\nCordialement.`,
        type: 'alerte'
      });
    } catch (err) {
      console.error('Erreur lors de la redirection:', err);
      showToast('Erreur lors de la redirection vers Communication', 'error');
    }
  };

  const unreadCount = notifications.filter(n => !n.lue).length;
  const totalAccidents = chauffeur?.nombre_accidents || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
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
                className="relative rounded-xl border-purple-500 text-purple-600 hover:bg-purple-50 focus:ring-purple-500"
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
            color="purple"
          />
          <StatCard 
            title="Élèves" 
            value={eleves.length} 
            icon={Users} 
            color="purple"
          />
          <StatCard 
            title="Accidents chauffeur" 
            value={totalAccidents} 
            icon={AlertCircle} 
            color={totalAccidents >= 3 ? 'red' : 'purple'}
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
              type="button"
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab(tab);
              }}
              className={`rounded-xl whitespace-nowrap ${
                tab === 'accidents'
                  ? activeTab === tab
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'border-red-500 text-red-600 hover:bg-red-50 focus:ring-red-500'
                  : activeTab === tab 
                    ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                    : 'border-purple-500 text-purple-600 hover:bg-purple-50 focus:ring-purple-500'
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
            onNotifyAbsence={handleNotifyAbsence}
          />
        )}

        {activeTab === 'eleves' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Liste des Élèves
              </h2>
              
              <ElevesListFilters 
                dateFilter={elevesDateFilter}
                setDateFilter={setElevesDateFilter}
                customDate={elevesCustomDate}
                setCustomDate={setElevesCustomDate}
                groupFilter={elevesGroupFilter}
                setGroupFilter={setElevesGroupFilter}
                searchTerm={elevesSearchTerm}
                setSearchTerm={setElevesSearchTerm}
                periodeFilter={elevesPeriodeFilter}
                setPeriodeFilter={setElevesPeriodeFilter}
              />
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredElevesList.map((eleve) => {
                // Calculer la date effective
                const effectiveDate = getElevesEffectiveDate();
                const elevePresence = presences.find(p => 
                  p.eleve_id === eleve.id && 
                  p.date === effectiveDate
                );
                
                // Déterminer le statut selon la période (matin ou soir)
                const isFiltered = elevesDateFilter !== 'today' || elevesCustomDate;
                let isPresent = false;
                let hasRecord = false;
                
                if (elevePresence) {
                  hasRecord = true;
                  // Vérifier la présence selon la période sélectionnée
                  // Convertir les valeurs booléennes si nécessaire
                  const presentMatin = elevePresence.present_matin === true || elevePresence.present_matin === 1 || elevePresence.present_matin === '1';
                  const presentSoir = elevePresence.present_soir === true || elevePresence.present_soir === 1 || elevePresence.present_soir === '1';
                  
                  isPresent = elevesPeriodeFilter === 'matin' ? presentMatin : presentSoir;
                }
                
                return (
                  <div key={eleve.id} className="p-4 hover:bg-purple-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{eleve.nom} {eleve.prenom}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <span>{eleve.classe || 'N/A'}</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              Groupe {eleve.groupe || 'N/A'}
                            </span>
                          </p>
                        </div>
                      </div>
                      {/* Indicateur de présence - cercle plus petit et joli */}
                      {isFiltered ? (
                        // Mode filtre : un seul cercle
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          !hasRecord ? 'bg-gray-200' : isPresent ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {!hasRecord ? (
                            <span className="text-gray-400 text-xs">-</span>
                          ) : isPresent ? (
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          ) : (
                            <X className="w-4 h-4 text-white" strokeWidth={3} />
                          )}
                        </div>
                      ) : (
                        // Mode normal : cercle avec indicateur
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          !hasRecord ? 'bg-gray-200' : isPresent ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {!hasRecord ? (
                            <span className="text-gray-400 text-xs">-</span>
                          ) : isPresent ? (
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          ) : (
                            <X className="w-4 h-4 text-white" strokeWidth={3} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredElevesList.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun élève trouvé</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bus' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-purple-500" />
                Mon Bus
              </h2>
              {bus ? (
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-2xl p-6 text-center">
                    <p className="text-5xl font-bold text-purple-600">{bus.numero}</p>
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
                        bus.statut === 'Actif' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
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
                <Navigation className="w-5 h-5 text-purple-500" />
                Mon Trajet
              </h2>
              {trajet ? (
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-2xl p-4">
                    <p className="text-sm text-purple-600 font-medium">Trajet</p>
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
                          <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                            {zone}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-xs text-purple-600 font-medium">Groupe A - Matin</p>
                      <p className="font-semibold text-gray-800">{trajet.heure_depart_matin_a} - {trajet.heure_arrivee_matin_a}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-xs text-purple-600 font-medium">Groupe A - Soir</p>
                      <p className="font-semibold text-gray-800">{trajet.heure_depart_soir_a} - {trajet.heure_arrivee_soir_a}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-xs text-purple-600 font-medium">Groupe B - Matin</p>
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
                  <User className="w-5 h-5 text-purple-500" />
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
                          chauffeur.nombre_accidents >= 3 ? 'text-red-500' : 'text-purple-500'
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
                <MessageSquare className="w-6 h-6 text-purple-500" />
                Communication avec les Parents
              </h2>
              <Button
                onClick={() => setShowCommunicationForm(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl"
              >
                <Send className="w-4 h-4 mr-2" />
                Nouveau message
              </Button>
            </div>
            
            <div className="p-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-purple-800">
                  <strong>💡 Astuce:</strong> Envoyez des notifications groupées pour informer tous les parents d'un bus, ou des messages personnalisés à un parent spécifique.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                    <p className="text-sm text-purple-600 font-medium">Messages envoyés</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {sentMessages.length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                    <p className="text-sm text-purple-600 font-medium">Parents notifiés</p>
                    <p className="text-2xl font-bold text-purple-800">{tuteurs.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                    <p className="text-sm text-purple-600 font-medium">Élèves concernés</p>
                    <p className="text-2xl font-bold text-purple-800">{eleves.length}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Historique des messages</h3>
                  <div className="space-y-3">
                    {sentMessages.length > 0 ? (
                      sentMessages.slice(0, 20).map((notif) => (
                        <div key={notif.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors relative">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 pr-12">
                              <h4 className="font-semibold text-gray-800">{notif.titre}</h4>
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{notif.message}</p>
                              
                              {/* Informations du destinataire */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-800 mb-2">Destinataire :</p>
                                {notif.tuteur_nom || notif.tuteur_prenom ? (
                                  <div className="bg-white rounded-lg p-3 space-y-2">
                                    {(notif.tuteur_prenom || notif.tuteur_nom) && (
                                      <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-medium text-gray-800">
                                          {notif.tuteur_prenom || ''} {notif.tuteur_nom || ''}
                                        </span>
                                      </div>
                                    )}
                                    {notif.tuteur_telephone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm text-gray-700">{notif.tuteur_telephone}</span>
                                      </div>
                                    )}
                                    {notif.tuteur_email && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm text-gray-700">{notif.tuteur_email}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-gray-100 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 italic">Informations du destinataire non disponibles</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => setDeleteConfirm({ show: true, messageId: notif.id })}
                              className="absolute top-4 right-4 p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 transition-colors"
                              title="Supprimer ce message"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {format(new Date(notif.date || new Date()), 'dd MMMM yyyy à HH:mm')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun message envoyé</p>
                        <p className="text-xs mt-1">Les messages que vous envoyez aux parents apparaîtront ici</p>
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
                <CheckCircle className="w-16 h-16 mx-auto text-purple-300 mb-4" />
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
                          accident.gravite === 'Moyenne' ? 'bg-purple-100 text-purple-700' :
                          'bg-purple-100 text-purple-700'
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
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Lieu:</span>
                        <span className="ml-2 font-medium">{accident.lieu || 'Non spécifié'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Dégâts:</span>
                        <span className="ml-2 font-medium">{accident.degats || 'Non spécifiés'}</span>
                      </div>
                    </div>
                    
                    {/* Affichage des photos si disponibles */}
                    {accident.photos && (() => {
                      try {
                        const photos = JSON.parse(accident.photos);
                        if (Array.isArray(photos) && photos.length > 0) {
                          return (
                            <div className="mt-4">
                              <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                                <Image className="w-4 h-4" />
                                Photos ({photos.length})
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {photos.map((photo, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={photo.data || photo}
                                      alt={`Photo accident ${index + 1}`}
                                      className="w-full h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => {
                                        // Ouvrir l'image en grand
                                        const newWindow = window.open();
                                        if (newWindow) {
                                          newWindow.document.write(`<img src="${photo.data || photo}" style="max-width:100%; height:auto;" />`);
                                        }
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        console.error('Erreur parsing photos:', e);
                      }
                      return null;
                    })()}
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
                  type="button"
                  onClick={() => {
                    // Nettoyer les URLs de prévisualisation
                    accidentPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
                    setAccidentPhotos([]);
                    setShowAccidentForm(false);
                  }}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // Vérifier la taille totale des fichiers
                const totalSize = accidentPhotos.reduce((sum, photo) => sum + photo.file.size, 0);
                const maxSize = 10 * 1024 * 1024; // 10 MB max
                
                if (totalSize > maxSize) {
                  showToast('La taille totale des photos dépasse 10 MB. Veuillez réduire le nombre ou la taille des images.', 'error');
                  return;
                }

                // Compresser et convertir les photos en base64
                const photosBase64 = await Promise.all(
                  accidentPhotos.map(photo => compressImage(photo.file))
                );
                
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
                  blesses: parseInt(accidentForm.nombre_blesses) > 0,
                  photos: photosBase64.length > 0 ? photosBase64 : null
                };

                await accidentsAPI.create(accidentData);
                
                // Nettoyer les URLs de prévisualisation
                accidentPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
                
                setShowAccidentForm(false);
                setAccidentPhotos([]);
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
                showToast('Accident déclaré avec succès', 'success');
              } catch (err) {
                console.error('Erreur déclaration accident:', err);
                showToast('Erreur lors de la déclaration: ' + (err.message || 'Erreur inconnue'), 'error');
              }
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={accidentForm.date}
                    onChange={(e) => setAccidentForm({...accidentForm, date: e.target.value})}
                    className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <Label>Heure *</Label>
                  <Input
                    type="time"
                    value={accidentForm.heure}
                    onChange={(e) => setAccidentForm({...accidentForm, heure: e.target.value})}
                    className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <Label>Lieu *</Label>
                  <Input
                    value={accidentForm.lieu}
                    onChange={(e) => setAccidentForm({...accidentForm, lieu: e.target.value})}
                    className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
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
                    <SelectTrigger className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500">
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
                    className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
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
                    className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
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
                  className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
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
                  className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                  rows={2}
                  placeholder="Décrivez les dégâts matériels..."
                />
              </div>
              
              {/* Upload Photos */}
              <div>
                <Label>Photos (optionnel - max 5 photos, 5 MB chacune)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      
                      // Limiter à 5 photos maximum
                      const remainingSlots = 5 - accidentPhotos.length;
                      if (remainingSlots <= 0) {
                        showToast('Vous ne pouvez ajouter que 5 photos maximum', 'error');
                        e.target.value = '';
                        return;
                      }
                      
                      const filesToAdd = files.slice(0, remainingSlots);
                      
                      // Vérifier la taille de chaque fichier (max 5 MB par fichier)
                      const maxFileSize = 5 * 1024 * 1024; // 5 MB
                      const validFiles = filesToAdd.filter(file => {
                        if (file.size > maxFileSize) {
                          showToast(`L'image ${file.name} est trop grande (max 5 MB)`, 'error');
                          return false;
                        }
                        return true;
                      });
                      
                      const newPhotos = validFiles.map(file => ({
                        file: file,
                        preview: URL.createObjectURL(file)
                      }));
                      setAccidentPhotos([...accidentPhotos, ...newPhotos]);
                      e.target.value = '';
                    }}
                    className="hidden"
                    id="accident-photos-upload"
                  />
                  <label
                    htmlFor="accident-photos-upload"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <Image className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Cliquez pour ajouter des photos</span>
                  </label>
                  
                  {/* Prévisualisation des photos */}
                  {accidentPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {accidentPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo.preview}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-xl border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(photo.preview);
                              setAccidentPhotos(accidentPhotos.filter((_, i) => i !== index));
                            }}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAccidentForm(false)}
                  className="rounded-xl border-purple-500 text-purple-600 hover:bg-purple-50 focus:ring-purple-500"
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
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-500 to-purple-600">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  Envoyer un Message aux Parents
                </h2>
                <button
                  onClick={() => setShowCommunicationForm(false)}
                  className="text-white hover:text-purple-100 transition-colors"
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
                
                showToast(`Message envoyé à ${destinataires.length} parent(s) avec succès !`, 'success');
                setShowCommunicationForm(false);
                setCommunicationForm({
                  destinataire: 'tous',
                  bus_id: null,
                  eleve_id: null,
                  titre: '',
                  message: '',
                  type: 'info'
                });
                
                // Recharger les notifications et les messages envoyés
                const responsableId = responsable?.type_id || responsable?.id;
                const notificationsResponse = await notificationsAPI.getByUser(responsableId, 'responsable');
                const notificationsData = notificationsResponse?.data || notificationsResponse || [];
                setNotifications(notificationsData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
                
                // Recharger les messages envoyés
                const sentMessagesResponse = await notificationsAPI.getSentByResponsable(responsableId);
                const sentMessagesData = sentMessagesResponse?.data || sentMessagesResponse || [];
                setSentMessages(sentMessagesData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
              } catch (err) {
                console.error('Erreur envoi message:', err);
                showToast('Erreur lors de l\'envoi: ' + (err.message || 'Erreur inconnue'), 'error');
              }
            }} className="p-6 space-y-4">
              <div>
                <Label>Destinataire *</Label>
                <Select 
                  value={communicationForm.destinataire} 
                  onValueChange={(v) => setCommunicationForm({...communicationForm, destinataire: v, bus_id: null, eleve_id: null})}
                >
                  <SelectTrigger className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500">
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
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <p className="text-sm text-purple-800">
                    <strong>Bus sélectionné:</strong> Bus {bus.numero}
                  </p>
                </div>
              )}
              
              {communicationForm.destinataire === 'eleve' && (
                <div className="space-y-3">
                  <div>
                    <Label>Sélectionner un élève *</Label>
                    <Select 
                      value={communicationForm.eleve_id?.toString() || ''} 
                      onValueChange={(v) => setCommunicationForm({...communicationForm, eleve_id: parseInt(v)})}
                    >
                      <SelectTrigger className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500">
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
                  
                  {/* Afficher les informations du tuteur si un élève est sélectionné */}
                  {communicationForm.eleve_id && (() => {
                    const selectedEleve = eleves.find(e => e.id === communicationForm.eleve_id);
                    if (!selectedEleve || !selectedEleve.tuteur_id) return null;
                    
                    // Trouver le tuteur correspondant
                    const tuteur = tuteurs.find(t => t.id === selectedEleve.tuteur_id);
                    const tuteurNom = tuteur ? `${tuteur.prenom || ''} ${tuteur.nom || ''}`.trim() : 'Non disponible';
                    const tuteurTelephone = tuteur?.telephone || selectedEleve.telephone_parent || 'Non disponible';
                    
                    return (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-purple-600 font-medium">Tuteur</p>
                            <p className="text-base font-semibold text-gray-800">{tuteurNom}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="w-4 h-4 text-purple-500" />
                              <p className="text-sm text-gray-600">{tuteurTelephone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              
              <div>
                <Label>Type de message *</Label>
                <Select 
                  value={communicationForm.type} 
                  onValueChange={(v) => setCommunicationForm({...communicationForm, type: v})}
                >
                  <SelectTrigger className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500">
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
                  className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ex: Retard du bus, Changement d'horaires..."
                  required
                />
              </div>
              
              <div>
                <Label>Message *</Label>
                <Textarea
                  value={communicationForm.message}
                  onChange={(e) => setCommunicationForm({...communicationForm, message: e.target.value})}
                  className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
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
                  className="rounded-xl border-purple-500 text-purple-600 hover:bg-purple-50 focus:ring-purple-500"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl"
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

      {/* Modal de confirmation de suppression */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Confirmer la suppression</h3>
                <p className="text-sm text-gray-600">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer ce message ?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setDeleteConfirm({ show: false, messageId: null })}
                variant="outline"
                className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await notificationsAPI.delete(deleteConfirm.messageId);
                    setSentMessages(prev => prev.filter(m => m.id !== deleteConfirm.messageId));
                    setDeleteConfirm({ show: false, messageId: null });
                    showToast('Message supprimé avec succès', 'success');
                  } catch (err) {
                    console.error('Erreur suppression message:', err);
                    showToast('Erreur lors de la suppression: ' + (err.message || 'Erreur inconnue'), 'error');
                    setDeleteConfirm({ show: false, messageId: null });
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] ${
              toastType === 'success' 
                ? 'bg-green-500' 
                : toastType === 'error' 
                ? 'bg-red-500' 
                : 'bg-purple-500'
            } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px]`}
          >
            {toastType === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : toastType === 'error' ? (
              <X className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Bell className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="flex-1 font-medium">{toastMessage}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}