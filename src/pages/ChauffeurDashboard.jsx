import React, { useState, useEffect, useMemo } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bus, Bell, LogOut, Users, AlertCircle, DollarSign,
  Navigation, User, CheckCircle, Calendar, MapPin, Plus, X, Search,
  Fuel, FileText, ClipboardCheck, Wrench, Clock, TrendingUp, Building2, AlertTriangle, Image as ImageIcon, Trash2, ZoomIn, UserCircle, Save, Edit
} from 'lucide-react';
import NotificationPanel from '../components/ui/NotificationPanel';
import StatCard from '../components/ui/StatCard';
import { format, startOfMonth, subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import ChauffeurSidebar from '../components/ChauffeurSidebar';
import ChauffeurLayout from '../components/ChauffeurLayout';
import ConfirmDialog from '../components/ui/ConfirmDialog';

function ChauffeurDashboardContent({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const [chauffeur, setChauffeur] = useState(null);
  const [bus, setBus] = useState(null);
  const [trajet, setTrajet] = useState(null);
  const [responsable, setResponsable] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [presences, setPresences] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAccidentForm, setShowAccidentForm] = useState(false);
  const [editingAccident, setEditingAccident] = useState(null);
  const [deleteAccidentConfirm, setDeleteAccidentConfirm] = useState({ show: false, id: null });
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
  const [accidentPhotos, setAccidentPhotos] = useState([]);
  
  // États pour les nouvelles fonctionnalités
  const [showEssenceForm, setShowEssenceForm] = useState(false);
  const [showRapportForm, setShowRapportForm] = useState(false);
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [showSignalementForm, setShowSignalementForm] = useState(false);
  const [priseEssence, setPriseEssence] = useState([]);
  const [essenceDateFilter, setEssenceDateFilter] = useState('all');
  const [essenceSearchTerm, setEssenceSearchTerm] = useState('');
  const [rapportsTrajet, setRapportsTrajet] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [signalementFilter, setSignalementFilter] = useState('all');
  const [signalementUrgenceFilter, setSignalementUrgenceFilter] = useState('all');
  const [signalementPhotos, setSignalementPhotos] = useState([]);
  const [selectedSignalementPhoto, setSelectedSignalementPhoto] = useState(null);
  const [essenceTicketPhoto, setEssenceTicketPhoto] = useState(null);
  const [selectedEssenceTicketPhoto, setSelectedEssenceTicketPhoto] = useState(null);
  const [signalementToDelete, setSignalementToDelete] = useState(null);
  
  // État pour le formulaire de profil
  const [profileForm, setProfileForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: ''
  });
  
  // Initialiser le formulaire de profil quand chauffeur est chargé
  useEffect(() => {
    if (chauffeur) {
      setProfileForm({
        nom: chauffeur.nom || '',
        prenom: chauffeur.prenom || '',
        email: chauffeur.email || '',
        telephone: chauffeur.telephone || ''
      });
    }
  }, [chauffeur]);
  
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
  
  // Formulaires
  const [essenceForm, setEssenceForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    heure: format(new Date(), 'HH:mm'),
    quantite_litres: '',
    prix_total: '',
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
  
  // Vérifier si le chauffeur est licencié (3 accidents ou plus)
  const isLicencie = chauffeur?.nombre_accidents >= 3 || accidents.length >= 3;

  // handleLogout est maintenant géré par ChauffeurLayout

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
        const accidentsList = accidentsData?.data || accidentsData || [];
        setAccidents(accidentsList);
        
        // Vérifier si le chauffeur a 3 accidents ou plus et bloquer l'accès
        if (accidentsList.length >= 3) {
          // Le chauffeur est licencié, on ne fait rien de plus ici car l'alerte sera affichée
        }
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
        console.log('Signalements chargés:', signalementsData);
        // Log pour déboguer les photos
        signalementsData.forEach((sig, idx) => {
          if (sig.photos) {
            console.log(`Signalement ${idx} a des photos:`, typeof sig.photos, Array.isArray(sig.photos) ? sig.photos.length : 'non-array');
          }
        });
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

  // Les notifications sont maintenant gérées par ChauffeurLayout

  const getPresenceForDate = (eleveId, date) => {
    return presences.find(p => p.eleve_id === eleveId && p.date === date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .chauffeur-dashboard [role="option"]:hover,
        .chauffeur-dashboard [role="option"][data-highlighted],
        .chauffeur-dashboard [role="option"][data-state="checked"] {
          background-color: rgb(220 252 231) !important;
          color: rgb(22 101 52) !important;
        }
        .chauffeur-dashboard [role="option"][data-state="checked"] {
          background-color: rgb(220 252 231) !important;
          color: rgb(22 101 52) !important;
        }
      `}</style>
    <div className="chauffeur-dashboard">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Bienvenue, {chauffeur?.prenom} {chauffeur?.nom}
              </h1>
              <p className="text-gray-500">{chauffeur?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Content - Dashboard par défaut (stats seulement) */}
        {activeTab === null && (
          <>
            {/* Alerte de licenciement si 3 accidents */}
            {isLicencie && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-6 bg-red-50 border-2 border-red-500 rounded-xl text-red-700"
              >
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 flex-shrink-0 text-red-600" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Tu es licencié</h3>
                    <p className="text-base mb-2">
                      Tu as atteint 3 accidents. Selon le règlement, tu es licencié et tu dois payer une amende de 1000 DH à l'école.
                    </p>
                    <p className="text-base font-semibold text-red-800">
                      Sinon l'école va te poursuivre.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="Mon Bus" 
                value={bus?.numero || '-'} 
                icon={Bus} 
                color="green"
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
                color="green"
              />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Bus className="w-6 h-6 text-green-500" />
              Vue d'ensemble
            </h2>
            {bus && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Informations du Bus</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 mb-1">Numéro</span>
                      <span className="text-2xl font-bold text-green-700">{bus.numero}</span>
                    </div>
                    {trajet && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600 mb-1">Trajet</span>
                        <span className="text-lg font-semibold text-gray-800">{trajet.nom || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Informations Personnelles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 mb-1">Nom complet</span>
                      <span className="font-semibold text-gray-800">{chauffeur?.prenom} {chauffeur?.nom}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 mb-1">Email</span>
                      <span className="font-semibold text-gray-800">{chauffeur?.email}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 mb-1">Téléphone</span>
                      <span className="font-semibold text-gray-800">{chauffeur?.telephone}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 mb-1">Salaire</span>
                      <span className="font-semibold text-green-600 text-lg">{chauffeur?.salaire || 0} DH</span>
                    </div>
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
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Mon Profil</h2>
              <p className="text-gray-500">Modifiez vos informations personnelles</p>
            </div>

            {/* Formulaire */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (!chauffeur?.id && !chauffeur?.type_id) {
                  showToast('Erreur: ID chauffeur non trouvé', 'error');
                  return;
                }
                
                const chauffeurId = chauffeur?.id || chauffeur?.type_id;
                const updateData = {
                  nom: profileForm.nom,
                  prenom: profileForm.prenom,
                  email: profileForm.email,
                  telephone: profileForm.telephone
                };
                
                await chauffeursAPI.update(chauffeurId, updateData);
                
                // Recharger les données
                const session = localStorage.getItem('chauffeur_session');
                if (session) {
                  const chauffeurData = JSON.parse(session);
                  await loadData(chauffeurData);
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
                  className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={profileForm.prenom}
                  onChange={(e) => setProfileForm({...profileForm, prenom: e.target.value})}
                  className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500"
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
                  className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={profileForm.telephone}
                  onChange={(e) => setProfileForm({...profileForm, telephone: e.target.value})}
                  className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl py-6 text-lg font-semibold shadow-lg flex items-center justify-center gap-3"
              >
                <Save className="w-5 h-5" />
                Enregistrer les modifications
              </Button>
            </form>
          </motion.div>
        )}

        {/* Content */}
        {activeTab === 'bus' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-green-500" />
                Mon Bus
              </h2>
              {bus ? (
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-2xl p-6 text-center">
                    <p className="text-5xl font-bold text-green-600">{bus.numero}</p>
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
                <Navigation className="w-5 h-5 text-green-500" />
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
                          <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
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
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs text-green-600 font-medium">Groupe A - Soir</p>
                      <p className="font-semibold text-gray-800">{trajet.heure_depart_soir_a} - {trajet.heure_arrivee_soir_a}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-blue-600 font-medium">Groupe B - Matin</p>
                      <p className="font-semibold text-gray-800">{trajet.heure_depart_matin_b} - {trajet.heure_arrivee_matin_b}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs text-green-600 font-medium">Groupe B - Soir</p>
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
                <User className="w-5 h-5 text-green-500" />
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
              {!isLicencie && (
                <Button
                  onClick={() => setShowAccidentForm(true)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Déclarer un accident
                </Button>
              )}
            </div>
            
            {/* Alerte de licenciement dans la section accidents */}
            {isLicencie && (
              <div className="p-6 bg-red-50 border-b-2 border-red-500">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 flex-shrink-0 text-red-600" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-red-800">Tu es licencié</h3>
                    <p className="text-base mb-2 text-red-700">
                      Tu as atteint 3 accidents. Selon le règlement, tu es licencié et tu dois payer une amende de 1000 DH à l'école.
                    </p>
                    <p className="text-base font-semibold text-red-900">
                      Sinon l'école va te poursuivre.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {accidents.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-300 mb-4" />
                <p className="text-gray-500">Aucun accident enregistré</p>
                <p className="text-sm text-gray-400 mt-1">Continuez à conduire prudemment !</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {accidents.map((accident) => {
                  // Parser les photos si présentes
                  let photos = [];
                  try {
                    if (accident.photos) {
                      if (Array.isArray(accident.photos)) {
                        photos = accident.photos;
                      } else if (typeof accident.photos === 'string' && accident.photos.trim() !== '') {
                        // Si c'est une chaîne JSON
                        if (accident.photos.trim().startsWith('[') || accident.photos.trim().startsWith('{')) {
                          const parsed = JSON.parse(accident.photos);
                          if (Array.isArray(parsed)) {
                            photos = parsed;
                          } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.photos)) {
                            photos = parsed.photos;
                          }
                        } else if (accident.photos.startsWith('data:image')) {
                          // Si c'est une seule photo en base64 directe
                          photos = [accident.photos];
                        }
                      }
                    }
                    // Filtrer et normaliser les photos valides
                    const validPhotos = photos
                      .map(photo => {
                        if (typeof photo === 'string') {
                          return photo.startsWith('data:image') || photo.startsWith('http') ? photo : null;
                        } else if (photo && typeof photo === 'object') {
                          return photo.data || photo.src || photo.url || photo.base64 || null;
                        }
                        return null;
                      })
                      .filter(photo => photo && photo.trim() !== '');
                    
                    // Utiliser validPhotos au lieu de photos
                    var validPhotosForDisplay = validPhotos;
                  } catch (e) {
                    console.error('Erreur parsing photos accident:', e);
                    var validPhotosForDisplay = [];
                  }
                  
                  return (
                    <div key={accident.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            accident.gravite === 'Grave' ? 'bg-red-100 text-red-700 border border-red-300' :
                            accident.gravite === 'Moyenne' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                            'bg-green-100 text-green-700 border border-green-300'
                          }`}>
                            {accident.gravite}
                          </span>
                          {accident.statut && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              accident.statut === 'Validé' ? 'bg-green-100 text-green-700' :
                              accident.statut === 'En attente' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {accident.statut}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(accident.date), 'dd MMMM yyyy', { locale: fr })}
                          {accident.heure && ` à ${accident.heure}`}
                        </p>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-3">{accident.description}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                        {accident.lieu && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Lieu:</span>
                            <span className="ml-1 font-medium text-gray-800">{accident.lieu}</span>
                          </div>
                        )}
                        {accident.degats && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Dégâts:</span>
                            <span className="ml-1 font-medium text-gray-800">{accident.degats}</span>
                          </div>
                        )}
                        {accident.nombre_eleves !== null && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Élèves dans le bus:</span>
                            <span className="ml-1 font-medium text-gray-800">{accident.nombre_eleves}</span>
                          </div>
                        )}
                        {accident.nombre_blesses > 0 && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Blessés: {accident.nombre_blesses}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Photos si disponibles */}
                      {validPhotosForDisplay.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 mb-3">
                            <ImageIcon className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-semibold text-gray-700">Photos ({validPhotosForDisplay.length})</span>
                          </div>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {validPhotosForDisplay.map((photoSrc, photoIndex) => (
                              <motion.div
                                key={photoIndex}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative group cursor-pointer"
                                onClick={() => setSelectedSignalementPhoto(photoSrc)}
                              >
                                <div className="relative overflow-hidden rounded-lg border-2 border-red-300 group-hover:border-red-500 transition-colors bg-white">
                                  <img
                                    src={photoSrc}
                                    alt={`Photo accident ${photoIndex + 1}`}
                                    className="w-full h-20 object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {accident.blesses && (
                        <div className="mt-3 p-3 bg-red-50 rounded-xl text-red-700 text-sm border border-red-200">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          Des blessés ont été signalés
                        </div>
                      )}
                      
                      {/* Boutons Modifier et Supprimer */}
                      <div className="mt-4 flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Charger les données de l'accident dans le formulaire
                            setEditingAccident(accident);
                            setAccidentForm({
                              date: accident.date ? format(new Date(accident.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                              heure: accident.heure || format(new Date(), 'HH:mm'),
                              lieu: accident.lieu || '',
                              description: accident.description || '',
                              degats: accident.degats || '',
                              gravite: accident.gravite || 'Légère',
                              nombre_eleves: accident.nombre_eleves?.toString() || '',
                              nombre_blesses: accident.nombre_blesses?.toString() || '0'
                            });
                            
                            // Charger les photos existantes
                            if (validPhotosForDisplay.length > 0) {
                              setAccidentPhotos(validPhotosForDisplay.map((photoSrc, index) => ({
                                preview: photoSrc,
                                file: null,
                                id: `existing-${index}`
                              })));
                            } else {
                              setAccidentPhotos([]);
                            }
                            
                            setShowAccidentForm(true);
                          }}
                          className="rounded-xl text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteAccidentConfirm({ show: true, id: accident.id })}
                          className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section Essence */}
        {activeTab === 'essence' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Fuel className="w-6 h-6 text-green-500" />
                Gestion de l'Essence
                <span className="ml-3 text-sm font-normal text-gray-500">({priseEssence.length} prises)</span>
              </h2>
              <Button
                onClick={() => setShowEssenceForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle prise d'essence
              </Button>
            </div>
            
            {/* Statistiques améliorées */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500 font-medium">Prises ce mois</p>
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {priseEssence.filter(e => {
                    const date = new Date(e.date);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border-l-4 border-emerald-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500 font-medium">Total litres</p>
                  <Fuel className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {priseEssence.reduce((sum, e) => sum + parseFloat(e.quantite_litres || 0), 0).toFixed(1)} <span className="text-lg text-gray-500">L</span>
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500 font-medium">Coût total</p>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {priseEssence.reduce((sum, e) => sum + parseFloat(e.prix_total || 0), 0).toFixed(2)} <span className="text-lg text-gray-500">DH</span>
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border-l-4 border-emerald-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500 font-medium">Prix moyen/L</p>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {priseEssence.length > 0 
                    ? (priseEssence.reduce((sum, e) => sum + parseFloat(e.prix_total || 0), 0) / 
                       priseEssence.reduce((sum, e) => sum + parseFloat(e.quantite_litres || 0), 0)).toFixed(2)
                    : '0.00'} <span className="text-lg text-gray-500">DH</span>
                </p>
              </motion.div>
            </div>

            {/* Historique amélioré avec filtres */}
            <div className="p-6">
              {/* Filtres */}
              {priseEssence.length > 0 && (
                <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-green-100">
                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Input
                      type="text"
                      placeholder="Rechercher par station..."
                      value={essenceSearchTerm}
                      onChange={(e) => setEssenceSearchTerm(e.target.value)}
                      className="rounded-xl border-green-200 focus:ring-green-500 focus:border-green-500"
                    />
                    <Select value={essenceDateFilter} onValueChange={setEssenceDateFilter}>
                      <SelectTrigger className="w-full md:w-[200px] rounded-xl border-green-200 focus:ring-green-500 focus:border-green-500">
                        <SelectValue placeholder="Filtrer par date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les prises</SelectItem>
                        <SelectItem value="thisMonth">Ce mois</SelectItem>
                        <SelectItem value="lastMonth">Mois dernier</SelectItem>
                        <SelectItem value="last3Months">3 derniers mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {essenceSearchTerm || essenceDateFilter !== 'all' ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEssenceSearchTerm('');
                        setEssenceDateFilter('all');
                      }}
                      className="rounded-xl border-green-200 text-green-600 hover:bg-green-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Réinitialiser
                    </Button>
                  ) : null}
                </div>
              )}

              {/* Liste filtrée */}
              {(() => {
                // Filtrer les prises d'essence
                let filteredEssence = [...priseEssence];

                // Filtre par date
                if (essenceDateFilter !== 'all') {
                  const now = new Date();
                  const filterDate = (() => {
                    switch (essenceDateFilter) {
                      case 'thisMonth':
                        return { start: startOfMonth(now), end: now };
                      case 'lastMonth':
                        const lastMonth = subMonths(now, 1);
                        return { start: startOfMonth(lastMonth), end: endOfDay(subMonths(startOfMonth(now), 1)) };
                      case 'last3Months':
                        return { start: subMonths(now, 3), end: now };
                      default:
                        return null;
                    }
                  })();

                  if (filterDate) {
                    filteredEssence = filteredEssence.filter(e => {
                      const date = new Date(e.date);
                      return isWithinInterval(date, filterDate);
                    });
                  }
                }

                // Filtre par recherche (station)
                if (essenceSearchTerm) {
                  filteredEssence = filteredEssence.filter(e =>
                    e.station_service?.toLowerCase().includes(essenceSearchTerm.toLowerCase())
                  );
                }

                // Trier par date
                filteredEssence.sort((a, b) => new Date(b.date + ' ' + b.heure) - new Date(a.date + ' ' + a.heure));

                if (filteredEssence.length === 0) {
                  return (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-12 text-center"
                    >
                      <Fuel className="w-16 h-16 mx-auto text-green-300 mb-4" />
                      <p className="text-gray-500 font-medium">Aucune prise d'essence trouvée</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {essenceSearchTerm || essenceDateFilter !== 'all' 
                          ? 'Essayez de modifier vos filtres' 
                          : 'Commencez par enregistrer votre première prise d\'essence'}
                      </p>
                    </motion.div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-500 mb-2">
                      {filteredEssence.length} prise{filteredEssence.length > 1 ? 's' : ''} trouvée{filteredEssence.length > 1 ? 's' : ''}
                    </div>
                    <AnimatePresence>
                      {filteredEssence.map((essence, index) => {
                      const prixParLitre = parseFloat(essence.prix_total) / parseFloat(essence.quantite_litres);
                      const isThisMonth = (() => {
                        const date = new Date(essence.date);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      })();
                      
                      return (
                        <motion.div
                          key={essence.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden"
                        >
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                  <Fuel className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-800 text-lg">
                                      {format(new Date(essence.date), 'dd MMMM yyyy', { locale: fr })}
                                    </h3>
                                    {isThisMonth && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        Ce mois
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{essence.heure}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Informations principales */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="bg-white rounded-lg p-3 border border-green-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <Fuel className="w-4 h-4 text-green-500" />
                                  <span className="text-xs text-gray-500 font-medium">Quantité</span>
                                </div>
                                <p className="text-xl font-bold text-gray-800">
                                  {parseFloat(essence.quantite_litres).toFixed(1)} <span className="text-sm text-gray-500">L</span>
                                </p>
                              </div>
                              
                              <div className="bg-white rounded-lg p-3 border border-green-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-gray-500 font-medium">Prix total</span>
                                </div>
                                <p className="text-xl font-bold text-gray-800">
                                  {parseFloat(essence.prix_total).toFixed(2)} <span className="text-sm text-gray-500">DH</span>
                                </p>
                              </div>
                              
                              <div className="bg-white rounded-lg p-3 border border-green-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                                  <span className="text-xs text-gray-500 font-medium">Prix/L</span>
                                </div>
                                <p className="text-xl font-bold text-gray-800">
                                  {prixParLitre.toFixed(2)} <span className="text-sm text-gray-500">DH</span>
                                </p>
                              </div>
                              
                              {essence.station_service && (
                                <div className="bg-white rounded-lg p-3 border border-green-100">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Building2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs text-gray-500 font-medium">Station</span>
                                  </div>
                                  <p className="text-sm font-semibold text-gray-800 truncate">
                                    {essence.station_service}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Photo du ticket */}
                            {essence.photo_ticket && (() => {
                              let photoSrc = essence.photo_ticket;
                              try {
                                // Essayer de parser si c'est du JSON
                                if (photoSrc.trim().startsWith('[') || photoSrc.trim().startsWith('{')) {
                                  const parsed = JSON.parse(photoSrc);
                                  if (Array.isArray(parsed) && parsed.length > 0) {
                                    photoSrc = parsed[0];
                                  } else if (parsed && typeof parsed === 'object' && parsed.data) {
                                    photoSrc = parsed.data;
                                  }
                                }
                              } catch (e) {
                                // Si le parsing échoue, utiliser tel quel
                              }
                              
                              if (photoSrc && photoSrc.startsWith('data:image')) {
                                return (
                                  <div className="mt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <ImageIcon className="w-4 h-4 text-green-600" />
                                      <span className="text-sm font-medium text-gray-700">Photo du ticket</span>
                                    </div>
                                    <div className="relative group cursor-pointer" onClick={() => setSelectedEssenceTicketPhoto(photoSrc)}>
                                      <img
                                        src={photoSrc}
                                        alt="Ticket essence"
                                        className="w-full h-32 object-contain rounded-lg border-2 border-green-200 bg-gray-50 hover:border-green-400 transition-colors"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center rounded-lg">
                                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Section Signalements */}
        {activeTab === 'signalements' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Wrench className="w-6 h-6 text-green-500" />
                  Signalements de Problèmes
                </h2>
              <Button
                onClick={() => setShowSignalementForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Signaler un problème
              </Button>
            </div>

            {/* Filtres */}
            {signalements.length > 0 && (
              <div className="p-6 bg-white border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  <Select value={signalementFilter} onValueChange={setSignalementFilter}>
                    <SelectTrigger className="w-full md:w-[200px] rounded-xl border-green-200 focus:ring-green-500 focus:border-green-500">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="resolu">Résolu</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={signalementUrgenceFilter} onValueChange={setSignalementUrgenceFilter}>
                    <SelectTrigger className="w-full md:w-[200px] rounded-xl border-green-200 focus:ring-green-500 focus:border-green-500">
                      <SelectValue placeholder="Filtrer par urgence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les urgences</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="faible">Faible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(signalementFilter !== 'all' || signalementUrgenceFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSignalementFilter('all');
                      setSignalementUrgenceFilter('all');
                    }}
                    className="rounded-xl border-green-200 text-green-600 hover:bg-green-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            )}
            
            {/* Liste des signalements */}
            <div className="p-6">
              {(() => {
                let filteredSignalements = [...signalements];

                // Filtre par statut
                if (signalementFilter !== 'all') {
                  filteredSignalements = filteredSignalements.filter(s => s.statut === signalementFilter);
                }

                // Filtre par urgence
                if (signalementUrgenceFilter !== 'all') {
                  filteredSignalements = filteredSignalements.filter(s => s.urgence === signalementUrgenceFilter);
                }

                // Trier par date
                filteredSignalements.sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0));

                if (filteredSignalements.length === 0) {
                  return (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-12 text-center"
                    >
                      <Wrench className="w-16 h-16 mx-auto text-green-300 mb-4" />
                      <p className="text-gray-500 font-medium">Aucun signalement trouvé</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {signalementFilter !== 'all' || signalementUrgenceFilter !== 'all'
                          ? 'Essayez de modifier vos filtres'
                          : 'Commencez par signaler votre premier problème'}
                      </p>
                    </motion.div>
                  );
                }

                const getTypeColor = (type) => {
                  switch (type) {
                    case 'mecanique': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' };
                    case 'eclairage': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700' };
                    case 'portes': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' };
                    case 'climatisation': return { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'text-cyan-500', badge: 'bg-cyan-100 text-cyan-700' };
                    case 'pneus': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' };
                    default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-500', badge: 'bg-gray-100 text-gray-700' };
                  }
                };

                const getUrgenceColor = (urgence) => {
                  switch (urgence) {
                    case 'haute': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: 'text-red-500' };
                    case 'moyenne': return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', icon: 'text-yellow-500' };
                    default: return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', icon: 'text-green-500' };
                  }
                };

                const getStatutColor = (statut) => {
                  switch (statut) {
                    case 'resolu': return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
                    case 'en_cours': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
                    default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
                  }
                };

                const getTypeLabel = (type) => {
                  const labels = {
                    'mecanique': 'Mécanique',
                    'eclairage': 'Éclairage',
                    'portes': 'Portes',
                    'climatisation': 'Climatisation',
                    'pneus': 'Pneus',
                    'autre': 'Autre'
                  };
                  return labels[type] || type;
                };

                return (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredSignalements.map((signalement, index) => {
                        const typeColors = getTypeColor(signalement.type_probleme);
                        const urgenceColors = getUrgenceColor(signalement.urgence);
                        const statutColors = getStatutColor(signalement.statut);

                        return (
                          <motion.div
                            key={signalement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className={`${typeColors.bg} ${typeColors.border} border-2 rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden`}
                          >
                            <div className="p-5">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`p-2 rounded-lg ${typeColors.bg} ${typeColors.icon}`}>
                                    <Wrench className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <h3 className="font-semibold text-gray-800 text-lg">
                                        {getTypeLabel(signalement.type_probleme)}
                                      </h3>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors.badge} border ${typeColors.border}`}>
                                        {getTypeLabel(signalement.type_probleme)}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgenceColors.bg} ${urgenceColors.text} border ${urgenceColors.border} flex items-center gap-1`}>
                                        {signalement.urgence === 'haute' && <AlertTriangle className="w-3 h-3" />}
                                        {signalement.urgence === 'haute' ? 'URGENT' : signalement.urgence === 'moyenne' ? 'Moyenne' : 'Faible'}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statutColors.bg} ${statutColors.text} border ${statutColors.border}`}>
                                        {signalement.statut === 'resolu' ? 'Résolu' : signalement.statut === 'en_cours' ? 'En cours' : 'En attente'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {signalement.date_creation ? format(new Date(signalement.date_creation), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Date inconnue'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSignalementToDelete(signalement)}
                                  className="ml-4 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 rounded-xl"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Description */}
                              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                                <p className="text-gray-800 leading-relaxed">{signalement.description}</p>
                              </div>

                              {/* Photos si disponibles */}
                              {(() => {
                                try {
                                  // Vérifier si signalement.photos existe et n'est pas null/undefined
                                  if (!signalement.photos || signalement.photos === null || signalement.photos === 'null' || signalement.photos === '') {
                                    return null;
                                  }
                                  
                                  let photos = [];
                                  
                                  // Si c'est déjà un tableau
                                  if (Array.isArray(signalement.photos)) {
                                    photos = signalement.photos;
                                  } 
                                  // Si c'est une chaîne JSON
                                  else if (typeof signalement.photos === 'string' && signalement.photos.trim() !== '') {
                                    try {
                                      // Essayer de parser la chaîne JSON
                                      let parsed = signalement.photos;
                                      
                                      // Si la chaîne commence par "[" ou "{", c'est du JSON
                                      if (parsed.trim().startsWith('[') || parsed.trim().startsWith('{')) {
                                        parsed = JSON.parse(parsed);
                                      }
                                      
                                      // Si le résultat est un tableau, on l'utilise
                                      if (Array.isArray(parsed)) {
                                        photos = parsed;
                                      } 
                                      // Si c'est un objet avec une propriété qui est un tableau
                                      else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.photos)) {
                                        photos = parsed.photos;
                                      }
                                      // Si c'est une chaîne simple (une seule photo)
                                      else if (typeof parsed === 'string' && parsed.startsWith('data:image')) {
                                        photos = [parsed];
                                      }
                                    } catch (parseError) {
                                      // Si le parsing échoue, essayer de traiter comme une chaîne simple
                                      if (signalement.photos.startsWith('data:image')) {
                                        photos = [signalement.photos];
                                      } else {
                                        console.error('Erreur parsing photos:', parseError);
                                        return null;
                                      }
                                    }
                                  } else {
                                    return null;
                                  }
                                  
                                  // Vérifier que photos est un tableau non vide
                                  if (!Array.isArray(photos) || photos.length === 0) {
                                    return null;
                                  }
                                  
                                  // Filtrer et normaliser les photos valides
                                  const validPhotos = photos
                                    .map(photo => {
                                      // Extraire la source de la photo
                                      if (typeof photo === 'string') {
                                        return photo;
                                      } else if (photo && typeof photo === 'object') {
                                        return photo.data || photo.src || photo.url || null;
                                      }
                                      return null;
                                    })
                                    .filter(photoSrc => {
                                      // Vérifier que c'est une chaîne valide qui commence par data:image
                                      return photoSrc && 
                                             typeof photoSrc === 'string' && 
                                             photoSrc.trim() !== '' && 
                                             photoSrc.startsWith('data:image');
                                    });
                                  
                                  if (validPhotos.length === 0) {
                                    return null;
                                  }
                                  
                                  return (
                                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                      <div className="flex items-center gap-2 mb-3">
                                        <ImageIcon className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-semibold text-gray-700">Photos ({validPhotos.length})</span>
                                      </div>
                                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                        {validPhotos.map((photoSrc, photoIndex) => (
                                          <motion.div
                                            key={photoIndex}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="relative group cursor-pointer"
                                            onClick={() => setSelectedSignalementPhoto(photoSrc)}
                                          >
                                            <div className="relative overflow-hidden rounded-lg border-2 border-green-300 group-hover:border-green-500 transition-colors bg-white shadow-md">
                                              <img
                                                src={photoSrc}
                                                alt={`Photo problème ${photoIndex + 1}`}
                                                className="w-full h-24 object-cover"
                                                onError={(e) => {
                                                  console.error('Erreur chargement image:', photoIndex);
                                                  e.target.style.display = 'none';
                                                }}
                                              />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                              </div>
                                            </div>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                } catch (e) {
                                  console.error('Erreur parsing photos:', e, signalement);
                                  return null;
                                }
                              })()}

                              {/* Informations supplémentaires */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {signalement.bus_numero && (
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Bus className="w-4 h-4 text-gray-400" />
                                      <span className="text-xs text-gray-500 font-medium">Bus</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800">{signalement.bus_numero}</p>
                                  </div>
                                )}
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className={`w-4 h-4 ${urgenceColors.icon}`} />
                                    <span className="text-xs text-gray-500 font-medium">Urgence</span>
                                  </div>
                                  <p className={`text-sm font-semibold ${urgenceColors.text}`}>
                                    {signalement.urgence === 'haute' ? 'Haute' : signalement.urgence === 'moyenne' ? 'Moyenne' : 'Faible'}
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className={`w-4 h-4 ${statutColors.text}`} />
                                    <span className="text-xs text-gray-500 font-medium">Statut</span>
                                  </div>
                                  <p className={`text-sm font-semibold ${statutColors.text}`}>
                                    {signalement.statut === 'resolu' ? 'Résolu' : signalement.statut === 'en_cours' ? 'En cours' : 'En attente'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                );
              })()}
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
                  {editingAccident ? 'Modifier un Accident' : 'Déclarer un Accident'}
                </h2>
                <button
                  onClick={() => {
                    // Nettoyer les URLs des prévisualisations
                    accidentPhotos.forEach(photo => {
                      if (photo.preview && photo.preview.startsWith('blob:')) {
                        URL.revokeObjectURL(photo.preview);
                      }
                    });
                    setAccidentPhotos([]);
                    setShowAccidentForm(false);
                    setEditingAccident(null);
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
                // Vérifier le nombre d'accidents avant de permettre la déclaration
                const currentAccidentsCount = accidents.length;
                if (currentAccidentsCount >= 3) {
                  showToast('Vous avez atteint 3 accidents. Vous êtes licencié et devez payer une amende de 1000 DH à l\'école. Sinon l\'école va vous poursuivre.', 'error');
                  // Fermer le formulaire et bloquer l'accès
                  setShowAccidentForm(false);
                  return;
                }
                
                // Vérifier la taille totale des fichiers
                const totalSize = accidentPhotos.reduce((sum, photo) => sum + photo.file.size, 0);
                const maxSize = 10 * 1024 * 1024; // 10 MB max
                
                if (totalSize > maxSize) {
                  showToast('La taille totale des photos dépasse 10 MB. Veuillez réduire le nombre ou la taille des images.', 'error');
                  return;
                }

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
                  blesses: parseInt(accidentForm.nombre_blesses) > 0,
                  photos: allPhotos.length > 0 ? allPhotos : null
                };

                if (editingAccident) {
                  // Mode modification
                  await accidentsAPI.update(editingAccident.id, accidentData);
                  showToast('Accident modifié avec succès !', 'success');
                } else {
                  // Mode création
                  await accidentsAPI.create(accidentData);
                  // Vérifier si c'est le 3ème accident
                  const newAccidentsCount = (chauffeur?.nombre_accidents || accidents.length) + 1;
                  if (newAccidentsCount >= 3) {
                    showToast('Tu es licencié et tu dois payer une amende de 1000 DH à l\'école. Sinon l\'école va te poursuivre.', 'error');
                  } else {
                    showToast('Accident déclaré avec succès ! L\'administrateur a été notifié.', 'success');
                  }
                }
                
                setShowAccidentForm(false);
                setEditingAccident(null);
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
                // Nettoyer les URLs des prévisualisations
                accidentPhotos.forEach(photo => {
                  if (photo.preview && photo.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(photo.preview);
                  }
                });
                setAccidentPhotos([]);
                await loadData(chauffeur);
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
                    className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <Label>Heure *</Label>
                  <Input
                    type="time"
                    value={accidentForm.heure}
                    onChange={(e) => setAccidentForm({...accidentForm, heure: e.target.value})}
                    className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <Label>Lieu *</Label>
                  <Input
                    value={accidentForm.lieu}
                    onChange={(e) => setAccidentForm({...accidentForm, lieu: e.target.value})}
                    className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500"
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
                    <SelectTrigger className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500">
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
                    className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500"
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
                    className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500"
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
                  className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500"
                  rows={2}
                  placeholder="Décrivez les dégâts matériels..."
                />
              </div>
              
              {/* Upload de photos */}
              <div>
                <Label>Photos (optionnel) - Max 5 photos, 5 MB par photo, 10 MB total</Label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const remainingSlots = 5 - accidentPhotos.length;
                    
                    if (files.length > remainingSlots) {
                      showToast(`Vous ne pouvez ajouter que ${remainingSlots} photo(s) supplémentaire(s)`, 'error');
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
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Cliquez pour ajouter des photos</span>
                </label>
                
                {/* Prévisualisation des photos */}
                {accidentPhotos.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        {accidentPhotos.length} photo{accidentPhotos.length > 1 ? 's' : ''} sélectionnée{accidentPhotos.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                      {accidentPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo.preview}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-16 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(photo.preview);
                              setAccidentPhotos(accidentPhotos.filter((_, i) => i !== index));
                            }}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 shadow-md hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Nettoyer les URLs des prévisualisations
                    accidentPhotos.forEach(photo => {
                      if (photo.preview && photo.preview.startsWith('blob:')) {
                        URL.revokeObjectURL(photo.preview);
                      }
                    });
                    setAccidentPhotos([]);
                    setShowAccidentForm(false);
                    setEditingAccident(null);
                  }}
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
                  {editingAccident ? 'Modifier l\'accident' : 'Déclarer l\'accident'}
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
                // Compresser la photo si elle existe
                let photoTicketBase64 = null;
                if (essenceTicketPhoto) {
                  try {
                    const compressed = await compressImage(essenceTicketPhoto.file);
                    photoTicketBase64 = compressed.data;
                  } catch (photoErr) {
                    showToast('Erreur lors de la compression de la photo', 'error');
                    return;
                  }
                }
                
                const essenceData = {
                  chauffeur_id: chauffeur?.id || chauffeur?.type_id,
                  bus_id: bus?.id,
                  date: essenceForm.date,
                  heure: essenceForm.heure,
                  quantite_litres: parseFloat(essenceForm.quantite_litres),
                  prix_total: parseFloat(essenceForm.prix_total),
                  station_service: essenceForm.station_service || null,
                  photo_ticket: photoTicketBase64
                };
                
                const response = await essenceAPI.create(essenceData);
                if (response.success) {
                  // Nettoyer la photo
                  if (essenceTicketPhoto) {
                    URL.revokeObjectURL(essenceTicketPhoto.preview);
                    setEssenceTicketPhoto(null);
                  }
                  
                  // Recharger les données
                  const essenceResponse = await essenceAPI.getByChauffeur(chauffeur?.id || chauffeur?.type_id);
                  const essenceData = essenceResponse?.data || essenceResponse || [];
                  setPriseEssence(essenceData);
                  
                  showToast('Prise d\'essence enregistrée avec succès ! L\'administrateur a été notifié.', 'success');
                  setShowEssenceForm(false);
                  setEssenceForm({
                    date: format(new Date(), 'yyyy-MM-dd'),
                    heure: format(new Date(), 'HH:mm'),
                    quantite_litres: '',
                    prix_total: '',
                    station_service: ''
                  });
                }
              } catch (err) {
                showToast('Erreur: ' + (err.message || 'Erreur inconnue'), 'error');
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
                  <Label>Station-service</Label>
                  <Input value={essenceForm.station_service} onChange={(e) => setEssenceForm({...essenceForm, station_service: e.target.value})} className="mt-1 rounded-xl" />
                </div>
              </div>
              
              {/* Upload Photo Ticket */}
              <div>
                <Label>Photo du ticket/reçu</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Vérifier la taille (max 5 MB)
                      const maxFileSize = 5 * 1024 * 1024; // 5 MB
                      if (file.size > maxFileSize) {
                        showToast('L\'image est trop grande (max 5 MB)', 'error');
                        return;
                      }
                      
                      setEssenceTicketPhoto({
                        file: file,
                        preview: URL.createObjectURL(file)
                      });
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                  id="essence-ticket-photo-upload"
                />
                <label
                  htmlFor="essence-ticket-photo-upload"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors mt-1"
                >
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {essenceTicketPhoto ? 'Photo sélectionnée' : 'Cliquez pour ajouter une photo du ticket'}
                  </span>
                </label>
                
                {/* Prévisualisation de la photo */}
                {essenceTicketPhoto && (
                  <div className="mt-4 relative">
                    <div className="relative group">
                      <img
                        src={essenceTicketPhoto.preview}
                        alt="Ticket essence"
                        className="w-full h-48 object-contain rounded-lg border-2 border-green-200 bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(essenceTicketPhoto.preview);
                          setEssenceTicketPhoto(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-90 hover:opacity-100 shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedEssenceTicketPhoto(essenceTicketPhoto.preview)}
                        className="absolute top-2 left-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center opacity-90 hover:opacity-100 shadow-md hover:bg-green-600 transition-colors"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => {
                  if (essenceTicketPhoto) {
                    URL.revokeObjectURL(essenceTicketPhoto.preview);
                    setEssenceTicketPhoto(null);
                  }
                  setShowEssenceForm(false);
                }} className="rounded-xl">
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
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-500 to-emerald-600 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wrench className="w-6 h-6" />
                  Signaler un Problème
                </h2>
                <button 
                  onClick={() => {
                    // Nettoyer les URLs des prévisualisations
                    signalementPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
                    setSignalementPhotos([]);
                    setShowSignalementForm(false);
                  }} 
                  className="text-white hover:text-green-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // Vérifier la taille totale des fichiers
                const totalSize = signalementPhotos.reduce((sum, photo) => sum + photo.file.size, 0);
                const maxSize = 10 * 1024 * 1024; // 10 MB max
                
                if (totalSize > maxSize) {
                  showToast('La taille totale des photos dépasse 10 MB. Veuillez réduire le nombre ou la taille des images.', 'error');
                  return;
                }

                // Compresser et convertir les photos en base64
                const photosBase64 = await Promise.all(
                  signalementPhotos.map(photo => compressImage(photo.file))
                );

                const signalementData = {
                  chauffeur_id: chauffeur?.id || chauffeur?.type_id,
                  bus_id: bus?.id,
                  type_probleme: signalementForm.type_probleme,
                  description: signalementForm.description,
                  urgence: signalementForm.urgence,
                  photos: photosBase64.length > 0 ? photosBase64.map(p => p.data) : null
                };
                
                const response = await signalementsAPI.create(signalementData);
                if (response.success) {
                  // Recharger les données
                  const signalementsResponse = await signalementsAPI.getByChauffeur(chauffeur?.id || chauffeur?.type_id);
                  const signalementsData = signalementsResponse?.data || signalementsResponse || [];
                  setSignalements(signalementsData);
                  
                  showToast('Problème signalé avec succès ! L\'administrateur a été notifié.', 'success');
                  setShowSignalementForm(false);
                  setSignalementForm({
                    type_probleme: 'mecanique',
                    description: '',
                    urgence: 'moyenne'
                  });
                  // Nettoyer les URLs des prévisualisations
                  signalementPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
                  setSignalementPhotos([]);
                }
              } catch (err) {
                showToast('Erreur: ' + (err.message || 'Erreur inconnue'), 'error');
              }
            }} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 pb-2">
                <div>
                  <Label>Type de problème *</Label>
                  <Select value={signalementForm.type_probleme} onValueChange={(v) => setSignalementForm({...signalementForm, type_probleme: v})}>
                    <SelectTrigger className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500">
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
                    <SelectTrigger className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500">
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
                  <Textarea value={signalementForm.description} onChange={(e) => setSignalementForm({...signalementForm, description: e.target.value})} className="mt-1 rounded-xl focus:ring-green-500 focus:border-green-500" rows={4} required placeholder="Décrivez le problème en détail..." />
                </div>
                
                {/* Upload de photos */}
                <div>
                <Label>Photos (optionnel) - Max 5 photos, 5 MB par photo, 10 MB total</Label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const remainingSlots = 5 - signalementPhotos.length;
                    
                    if (files.length > remainingSlots) {
                      showToast(`Vous ne pouvez ajouter que ${remainingSlots} photo(s) supplémentaire(s)`, 'error');
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
                    setSignalementPhotos([...signalementPhotos, ...newPhotos]);
                    e.target.value = '';
                  }}
                  className="hidden"
                  id="signalement-photos-upload"
                />
                <label
                  htmlFor="signalement-photos-upload"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Cliquez pour ajouter des photos</span>
                </label>
                
                {/* Prévisualisation des photos */}
                {signalementPhotos.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        {signalementPhotos.length} photo{signalementPhotos.length > 1 ? 's' : ''} sélectionnée{signalementPhotos.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                      {signalementPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo.preview}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-16 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(photo.preview);
                              setSignalementPhotos(signalementPhotos.filter((_, i) => i !== index));
                            }}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 shadow-md hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
              
              {/* Boutons fixes en bas - toujours visibles */}
              <div className="p-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-b-3xl flex gap-3 justify-end flex-shrink-0 sticky bottom-0 z-10 shadow-lg">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    // Nettoyer les URLs des prévisualisations
                    signalementPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
                    setSignalementPhotos([]);
                    setShowSignalementForm(false);
                  }} 
                  className="rounded-xl border-2 border-gray-300 hover:border-gray-400 px-6 py-2.5 font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  <X className="w-4 h-4 mr-2" /> Annuler
                </Button>
                <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-6 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all">
                  <Wrench className="w-4 h-4 mr-2" /> Signaler
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ConfirmDialog pour la suppression d'accident */}
      <ConfirmDialog
        isOpen={deleteAccidentConfirm.show}
        title="Supprimer l'accident"
        message="Êtes-vous sûr de vouloir supprimer cet accident ? Cette action est irréversible."
        onConfirm={async () => {
          try {
            await accidentsAPI.delete(deleteAccidentConfirm.id);
            setDeleteAccidentConfirm({ show: false, id: null });
            await loadData(chauffeur);
            showToast('Accident supprimé avec succès', 'success');
          } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            showToast('Erreur lors de la suppression: ' + (err.message || 'Erreur inconnue'), 'error');
            setDeleteAccidentConfirm({ show: false, id: null });
          }
        }}
        onCancel={() => setDeleteAccidentConfirm({ show: false, id: null })}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Modal pour voir les photos en grand */}
      {selectedSignalementPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSignalementPhoto(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedSignalementPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedSignalementPhoto}
              alt="Photo problème"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </motion.div>
        </div>
      )}

      {/* Modal pour voir la photo du ticket d'essence en grand */}
      {selectedEssenceTicketPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEssenceTicketPhoto(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedEssenceTicketPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedEssenceTicketPhoto}
              alt="Photo ticket essence"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </motion.div>
        </div>
      )}

      {/* Modal de confirmation de suppression de signalement */}
      {signalementToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Supprimer le signalement</h2>
                  <p className="text-sm text-gray-500 mt-1">Cette action est irréversible</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Êtes-vous sûr de vouloir supprimer ce signalement de problème ? Cette action ne peut pas être annulée.
              </p>
              {signalementToDelete && (() => {
                const getTypeLabel = (type) => {
                  const labels = {
                    'mecanique': 'Mécanique',
                    'eclairage': 'Éclairage',
                    'portes': 'Portes',
                    'climatisation': 'Climatisation',
                    'pneus': 'Pneus',
                    'autre': 'Autre'
                  };
                  return labels[type] || type;
                };
                return (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-gray-800">
                      Type: {getTypeLabel(signalementToDelete.type_probleme)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {signalementToDelete.description}
                    </p>
                  </div>
                );
              })()}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSignalementToDelete(null)}
                  className="rounded-xl"
                >
                  Annuler
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const response = await signalementsAPI.delete(signalementToDelete.id);
                      if (response.success) {
                        // Recharger les signalements
                        const chauffeurId = chauffeur?.id || chauffeur?.type_id;
                        const signalementsResponse = await signalementsAPI.getByChauffeur(chauffeurId);
                        const signalementsData = signalementsResponse?.data || signalementsResponse || [];
                        setSignalements(signalementsData);
                        
                        showToast('Signalement supprimé avec succès', 'success');
                        setSignalementToDelete(null);
                      } else {
                        showToast('Erreur lors de la suppression: ' + (response.message || 'Erreur inconnue'), 'error');
                      }
                    } catch (err) {
                      console.error('Erreur suppression signalement:', err);
                      showToast('Erreur lors de la suppression: ' + (err.message || 'Erreur inconnue'), 'error');
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 max-w-md w-full shadow-2xl rounded-xl overflow-hidden ${
              toastType === 'success' 
                ? 'bg-green-500' 
                : toastType === 'error' 
                ? 'bg-red-500' 
                : 'bg-blue-500'
            }`}
          >
            <div className="p-4 flex items-center gap-3">
              {toastType === 'success' && <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />}
              {toastType === 'error' && <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />}
              {toastType === 'info' && <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />}
              <p className="text-white font-medium flex-1">{toastMessage}</p>
              <button
                onClick={() => setToastMessage(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function ChauffeurDashboard() {
  const [activeTab, setActiveTab] = React.useState(null); // null = dashboard avec stats seulement
  
  return (
    <ChauffeurLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ChauffeurDashboardContent activeTab={activeTab} setActiveTab={setActiveTab} />
    </ChauffeurLayout>
  );
}