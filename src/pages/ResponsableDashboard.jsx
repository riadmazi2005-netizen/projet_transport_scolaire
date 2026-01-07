import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  DollarSign, User, Edit, CheckCircle, Plus, X, MessageSquare, Send, Navigation, MapPin, Image as ImageIcon, Trash2, Phone, Check, Calendar, Mail, Clock, Users as UsersIcon, AlertTriangle, FileText, ZoomIn, UserCircle, Save
} from 'lucide-react';
import ResponsableSidebar from '../components/ResponsableSidebar';
import NotificationPanel from '../components/ui/NotificationPanel';
import StatCard from '../components/ui/StatCard';
import PresenceList from '../components/ui/PresenceList';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const [activeTab, setActiveTab] = useState(null); // null = dashboard avec stats seulement
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // États pour les filtres de la liste des élèves
  const [elevesDateFilter, setElevesDateFilter] = useState('today');
  const [elevesCustomDate, setElevesCustomDate] = useState('');
  const [elevesGroupFilter, setElevesGroupFilter] = useState('all');
  const [elevesSearchTerm, setElevesSearchTerm] = useState('');
  const [accidents, setAccidents] = useState([]);
  const [showAccidentForm, setShowAccidentForm] = useState(false);
  const [editingAccident, setEditingAccident] = useState(null);
  const [deleteAccidentConfirm, setDeleteAccidentConfirm] = useState({ show: false, id: null });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [expandedAccident, setExpandedAccident] = useState(null);
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
  
  // État pour le formulaire de profil
  const [profileForm, setProfileForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: ''
  });
  
  // Initialiser le formulaire de profil quand responsable est chargé
  useEffect(() => {
    if (responsable) {
      setProfileForm({
        nom: responsable.nom || '',
        prenom: responsable.prenom || '',
        email: responsable.email || '',
        telephone: responsable.telephone || ''
      });
    }
  }, [responsable]);
  
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
              n.titre?.includes(`Retard Bus ${retard.bus.numero.toString().replace(/^#\s*/, '')}`) &&
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
                    titre: `Retard Bus ${retard.bus.numero.toString().replace(/^#\s*/, '')}`,
                    message: `Le bus ${retard.bus.numero.toString().replace(/^#\s*/, '')} a un retard de ${retard.retard} minutes pour le trajet ${retard.periode === 'matin' ? 'du matin' : 'du soir'}.`,
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
        console.log('Chargement accidents pour responsable_id:', responsableId);
        const accidentsResponse = await accidentsAPI.getByResponsable(responsableId);
        console.log('Réponse accidents:', accidentsResponse);
        const accidentsData = accidentsResponse?.data || accidentsResponse || [];
        console.log('Accidents chargés:', accidentsData);
        setAccidents(Array.isArray(accidentsData) ? accidentsData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)) : []);
      } catch (err) {
        console.error('Erreur chargement accidents:', err);
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

  // Fonction pour normaliser les dates
  const normalizeDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return format(date, 'yyyy-MM-dd');
    } catch (e) {
      // Si c'est déjà au format yyyy-MM-dd ou yyyy-MM-dd HH:mm:ss
      const datePart = dateStr.split('T')[0] || dateStr.split(' ')[0];
      return datePart;
    }
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
    if (!eleves || eleves.length === 0) return [];
    
    return eleves.filter(eleve => {
      // Filtre par groupe
      const matchGroup = elevesGroupFilter === 'all' || 
                        elevesGroupFilter === '' || 
                        (eleve.groupe && eleve.groupe.toString().toUpperCase() === elevesGroupFilter.toString().toUpperCase());
      
      // Filtre par recherche (nom ou prénom)
      const searchLower = elevesSearchTerm.toLowerCase().trim();
      const matchSearch = searchLower === '' || 
                         (eleve.nom && eleve.nom.toLowerCase().includes(searchLower)) ||
                         (eleve.prenom && eleve.prenom.toLowerCase().includes(searchLower)) ||
                         (eleve.nom && eleve.prenom && `${eleve.prenom} ${eleve.nom}`.toLowerCase().includes(searchLower));
      
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
          console.log('🔄 Chargement présences pour date:', effectiveDate, 'bus:', bus.id, 'filtre:', elevesDateFilter);
          
          // Appeler l'API avec la date effective
          const presencesResponse = await presencesAPI.getByDate(effectiveDate, bus?.id);
          const presencesData = presencesResponse?.data || presencesResponse || [];
          console.log('📥 Présences reçues pour date', effectiveDate, ':', presencesData.length, 'présences');
          
          // Normaliser les dates dans les présences pour faciliter la comparaison
          // Filtrer aussi par responsable_id et bus_id côté client pour plus de sécurité
          const filteredPresences = presencesData
            .map(p => {
              const normalizedDate = normalizeDate(p.date);
              return {
                ...p,
                date_normalized: normalizedDate,
                // Garder la date originale aussi
                date: p.date
              };
            })
            .filter(p => {
              const matchesBus = !p.bus_id || p.bus_id === bus.id;
              const matchesResponsable = !p.responsable_id || p.responsable_id === responsableId;
              const normalizedPresenceDate = p.date_normalized || normalizeDate(p.date);
              const matchesDate = normalizedPresenceDate === effectiveDate;
              
              if (!matchesDate) {
                console.log('❌ Date ne correspond pas:', {
                  presenceDate: p.date,
                  normalized: normalizedPresenceDate,
                  effectiveDate: effectiveDate,
                  eleve_id: p.eleve_id
                });
              }
              
              return matchesBus && matchesResponsable && matchesDate;
            });
          
          console.log('✅ Présences filtrées pour date', effectiveDate, ':', filteredPresences.length, 'présences');
          setPresences(filteredPresences);
        } catch (err) {
          console.error('❌ Erreur chargement présences pour date filtrée:', err);
          setPresences([]);
        }
      };
      
      loadPresencesForDate();
    } else if (activeTab === 'eleves' && !bus) {
      // Si l'onglet est actif mais qu'il n'y a pas de bus, vider les présences
      setPresences([]);
    }
  }, [elevesDateFilter, elevesCustomDate, activeTab, bus?.id, responsable?.type_id, responsable?.id, getElevesEffectiveDate, normalizeDate]);

  // Composant pour les filtres de la liste des élèves
  const ElevesListFilters = ({ dateFilter, setDateFilter, customDate, setCustomDate, groupFilter, setGroupFilter, searchTerm, setSearchTerm }) => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Rechercher un élève..."
            value={searchTerm || ''}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            className="bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500"
          />

          <Select 
            value={dateFilter} 
            onValueChange={(value) => {
              setDateFilter(value);
              if (value !== 'custom') {
                setCustomDate('');
              }
            }}
          >
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
          
          <Select 
            value={groupFilter} 
            onValueChange={(value) => {
              setGroupFilter(value);
            }}
          >
            <SelectTrigger className="bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500">
              <SelectValue placeholder="Groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              <SelectItem value="A">Groupe A</SelectItem>
              <SelectItem value="B">Groupe B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateFilter === 'custom' && (
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600 z-10" />
            <Input
              type="date"
              value={customDate || ''}
              onChange={(e) => {
                setCustomDate(e.target.value);
              }}
              className="pl-10 bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        )}
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

  const deleteAllNotifications = async () => {
    if (!responsable) return;
    
    const responsableId = responsable.id || responsable.type_id;
    if (!responsableId) return;

    try {
      await notificationsAPI.deleteAll(responsableId, 'responsable');
      setNotifications([]);
      console.log('Toutes les notifications ont été supprimées avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression de toutes les notifications:', err);
    }
  };

  const handleTogglePresence = async (eleveId, periode, value) => {
    try {
      const existingPresence = presences.find(p => 
        p.eleve_id === eleveId && p.date === selectedDate
      );
      
      if (existingPresence) {
        // Mettre à jour la présence existante
        const updateData = {
          ...existingPresence,
          [periode === 'matin' ? 'present_matin' : 'present_soir']: value
        };
        
        const response = await presencesAPI.marquer(updateData);
        const presenceData = response?.data || response;
        
        // Mettre à jour l'état local directement
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
        const presenceData = response?.data || response;
        
        // Ajouter la nouvelle présence à l'état local
        setPresences(prev => [...prev, presenceData]);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <ResponsableSidebar
        responsable={responsable}
        notifications={notifications}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCollapseChange={setSidebarCollapsed}
      />
      
      <main className={`min-h-screen p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'
      }`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-6 mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Bienvenue, {responsable?.prenom} {responsable?.nom}
                </h1>
                <p className="text-gray-500">{responsable?.email}</p>
              </div>
            </div>
          </motion.div>

        {/* Content - Dashboard par défaut (stats seulement) */}
        {activeTab === null && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="Mon Bus" 
                value={bus?.numero ? bus.numero.toString().replace(/^#\s*/, '') : '-'} 
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Bus className="w-6 h-6 text-purple-500" />
                Vue d'ensemble
              </h2>
            {bus && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4">Informations du Bus</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Numéro:</span>
                      <span className="font-bold text-purple-700">{bus.numero.toString().replace(/^#\s*/, '')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marque:</span>
                      <span className="font-semibold">{bus.marque}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modèle:</span>
                      <span className="font-semibold">{bus.modele}</span>
                    </div>
                    {chauffeur && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chauffeur:</span>
                        <span className="font-semibold">{chauffeur.prenom} {chauffeur.nom}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4">Informations Personnelles</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nom complet:</span>
                      <span className="font-semibold">{responsable?.prenom} {responsable?.nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold">{responsable?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Téléphone:</span>
                      <span className="font-semibold">{responsable?.telephone}</span>
                    </div>
                    {responsable?.zone_responsabilite && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Zone:</span>
                        <span className="font-semibold">{responsable.zone_responsabilite}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          </>
        )}

        {/* Content - Profil */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Mon Profil</h2>
              <p className="text-gray-500">Modifiez vos informations personnelles</p>
            </div>

            {/* Formulaire */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (!responsable?.id && !responsable?.type_id) {
                  showToast('Erreur: ID responsable non trouvé', 'error');
                  return;
                }
                
                const responsableId = responsable?.id || responsable?.type_id;
                const updateData = {
                  nom: profileForm.nom,
                  prenom: profileForm.prenom,
                  email: profileForm.email,
                  telephone: profileForm.telephone
                };
                
                await responsablesAPI.update(responsableId, updateData);
                
                // Recharger les données
                const session = localStorage.getItem('responsable_session');
                if (session) {
                  const responsableData = JSON.parse(session);
                  await loadData(responsableData);
                }
                
                showToast('Profil mis à jour avec succès', 'success');
              } catch (err) {
                console.error('Erreur mise à jour profil:', err);
                showToast('Erreur lors de la mise à jour: ' + (err.message || 'Erreur inconnue'), 'error');
              }
            }} className="space-y-6">
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={profileForm.nom}
                  onChange={(e) => setProfileForm({...profileForm, nom: e.target.value})}
                  className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={profileForm.prenom}
                  onChange={(e) => setProfileForm({...profileForm, prenom: e.target.value})}
                  className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={profileForm.telephone}
                  onChange={(e) => setProfileForm({...profileForm, telephone: e.target.value})}
                  className="mt-1 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl py-6 text-lg font-semibold shadow-lg flex items-center justify-center gap-3"
              >
                <Save className="w-5 h-5" />
                Enregistrer les modifications
              </Button>
            </form>
          </motion.div>
        )}

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
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Liste des Élèves
              </h2>
              
              {/* Filtres */}
              <ElevesListFilters 
                dateFilter={elevesDateFilter}
                setDateFilter={setElevesDateFilter}
                customDate={elevesCustomDate}
                setCustomDate={setElevesCustomDate}
                groupFilter={elevesGroupFilter}
                setGroupFilter={setElevesGroupFilter}
                searchTerm={elevesSearchTerm}
                setSearchTerm={setElevesSearchTerm}
              />
            </div>
            
            {/* Statistiques */}
            {(() => {
              const effectiveDate = getElevesEffectiveDate();
              const getCurrentPeriod = () => {
                const now = new Date();
                const hour = now.getHours();
                return hour < 13 ? 'matin' : 'soir';
              };
              const currentPeriod = getCurrentPeriod();
              
              const normalizedEffectiveDate = normalizeDate(effectiveDate);
              
              const elevesWithPresence = filteredElevesList.filter(eleve => {
                const presence = presences.find(p => {
                  const normalizedPresenceDate = normalizeDate(p.date);
                  return p.eleve_id === eleve.id && normalizedPresenceDate === normalizedEffectiveDate;
                });
                if (!presence) return false;
                const presentMatin = presence.present_matin === true || presence.present_matin === 1 || presence.present_matin === '1';
                const presentSoir = presence.present_soir === true || presence.present_soir === 1 || presence.present_soir === '1';
                return currentPeriod === 'matin' ? presentMatin : presentSoir;
              });
              
              const elevesAbsents = filteredElevesList.filter(eleve => {
                const presence = presences.find(p => {
                  const normalizedPresenceDate = normalizeDate(p.date);
                  return p.eleve_id === eleve.id && normalizedPresenceDate === normalizedEffectiveDate;
                });
                if (!presence) return false;
                const presentMatin = presence.present_matin === true || presence.present_matin === 1 || presence.present_matin === '1';
                const presentSoir = presence.present_soir === true || presence.present_soir === 1 || presence.present_soir === '1';
                const isPresent = currentPeriod === 'matin' ? presentMatin : presentSoir;
                return !isPresent;
              });
              
              return (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{filteredElevesList.length}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <div className="w-px h-8 bg-gray-300" />
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{elevesWithPresence.length}</p>
                        <p className="text-xs text-gray-500">Présents</p>
                      </div>
                      <div className="w-px h-8 bg-gray-300" />
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{elevesAbsents.length}</p>
                        <p className="text-xs text-gray-500">Absents</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(effectiveDate), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {/* Liste des élèves */}
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {filteredElevesList.map((eleve) => {
                // Calculer la date effective
                const effectiveDate = getElevesEffectiveDate();
                const normalizedEffectiveDate = normalizeDate(effectiveDate);
                
                const elevePresence = presences.find(p => {
                  const normalizedPresenceDate = normalizeDate(p.date);
                  return p.eleve_id === eleve.id && normalizedPresenceDate === normalizedEffectiveDate;
                });
                
                // Déterminer le statut selon la période (matin ou soir) - détection automatique
                const getCurrentPeriod = () => {
                  const now = new Date();
                  const hour = now.getHours();
                  return hour < 13 ? 'matin' : 'soir';
                };
                const currentPeriod = getCurrentPeriod();
                
                const isFiltered = elevesDateFilter !== 'today' || elevesCustomDate;
                let isPresent = false;
                let hasRecord = false;
                
                if (elevePresence) {
                  hasRecord = true;
                  // Vérifier la présence selon la période actuelle détectée automatiquement
                  // Convertir les valeurs booléennes si nécessaire
                  const presentMatin = elevePresence.present_matin === true || elevePresence.present_matin === 1 || elevePresence.present_matin === '1';
                  const presentSoir = elevePresence.present_soir === true || elevePresence.present_soir === 1 || elevePresence.present_soir === '1';
                  
                  isPresent = currentPeriod === 'matin' ? presentMatin : presentSoir;
                }
                
                return (
                  <motion.div
                    key={eleve.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-purple-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(createPageUrl(`ResponsableEleveDetails?eleveId=${eleve.id}`))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-sm">
                          <User className="w-7 h-7 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">{eleve.nom} {eleve.prenom}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-600">{eleve.classe || 'N/A'}</span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              Groupe {eleve.groupe || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Indicateur de présence */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
                          !hasRecord ? 'bg-gray-200' : isPresent ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {!hasRecord ? (
                            <span className="text-gray-400 text-sm font-semibold">-</span>
                          ) : isPresent ? (
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          ) : (
                            <X className="w-5 h-5 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {filteredElevesList.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Aucun élève trouvé</p>
                  <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default ResponsableDashboard;

                // Compresser et convertir les photos en base64 (seulement les nouvelles photos)
                const newPhotos = accidentPhotos.filter(photo => photo.file);
                const existingPhotos = accidentPhotos.filter(photo => !photo.file && photo.preview);
                
                let photosBase64 = [];
                if (newPhotos.length > 0) {
                  photosBase64 = await Promise.all(
                    newPhotos.map(photo => compressImage(photo.file))
                  );
                }
                
                // Combiner les nouvelles photos avec les existantes
                const allPhotos = [
                  ...existingPhotos.map(photo => photo.preview),
                  ...photosBase64.map(p => p.data)
                ].filter(Boolean);
                
                // Calculer le responsable_id de la même manière que dans loadData
                const responsableSession = localStorage.getItem('responsable_session');
                const responsableDataForId = responsableSession ? JSON.parse(responsableSession) : responsable;
                const responsableId = responsableDataForId?.type_id || responsableDataForId?.id || responsable?.type_id || responsable?.id || null;
                
                const accidentData = {
                  date: accidentForm.date,
                  heure: accidentForm.heure,
                  bus_id: bus?.id || null,
                  responsable_id: responsableId,
                  lieu: accidentForm.lieu,
                  description: accidentForm.description,
                  degats: accidentForm.degats || null,
                  gravite: accidentForm.gravite,
                  nombre_eleves: accidentForm.nombre_eleves ? parseInt(accidentForm.nombre_eleves) : null,
                  nombre_blesses: accidentForm.nombre_blesses ? parseInt(accidentForm.nombre_blesses) : 0,
                  blesses: parseInt(accidentForm.nombre_blesses) > 0,
                  photos: allPhotos.length > 0 ? allPhotos : null
                };

                if (editingAccident) {
                  // Mode modification
                  await accidentsAPI.update(editingAccident.id, accidentData);
                  showToast('Accident modifié avec succès', 'success');
                } else {
                  // Mode création
                  await accidentsAPI.create(accidentData);
                  showToast('Accident déclaré avec succès', 'success');
                }
                
                // Nettoyer les URLs de prévisualisation
                accidentPhotos.forEach(photo => {
                  if (photo.preview && photo.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(photo.preview);
                  }
                });
                
                setShowAccidentForm(false);
                setEditingAccident(null);
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
                // Recharger les données, en utilisant responsableData pour avoir le bon type_id
                const responsableSessionReload = localStorage.getItem('responsable_session');
                if (responsableSessionReload) {
                  const responsableDataReload = JSON.parse(responsableSessionReload);
                  await loadData(responsableDataReload);
                } else {
                  await loadData(responsable);
                }
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
                    <ImageIcon className="w-5 h-5 text-gray-400" />
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
                  onClick={() => {
                    accidentPhotos.forEach(photo => {
                      if (photo.preview && photo.preview.startsWith('blob:')) {
                        URL.revokeObjectURL(photo.preview);
                      }
                    });
                    setAccidentPhotos([]);
                    setShowAccidentForm(false);
                    setEditingAccident(null);
                  }}
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
                  {editingAccident ? 'Modifier l\'accident' : 'Déclarer l\'accident'}
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
                    <strong>Bus sélectionné:</strong> Bus {bus.numero.toString().replace(/^#\s*/, '')}
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

        </div>
      </main>

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
        onDeleteAll={deleteAllNotifications}
      />

      {/* Modal de confirmation de suppression */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
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