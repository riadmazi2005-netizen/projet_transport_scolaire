import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, notificationsAPI, presencesAPI, demandesAPI, inscriptionsAPI, paiementsAPI, zonesAPI, busAPI, trajetsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  Users, Bell, UserPlus, Edit, LogOut, GraduationCap, 
  Bus, CreditCard, Clock, CheckCircle, AlertCircle, Eye, XCircle,
  TrendingUp, MapPin, Calendar, FileText, History, Trash2, RotateCcw, Repeat
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import NotificationPanel from '../components/ui/NotificationPanel';
import StatCard from '../components/ui/StatCard';
import TuteurLayout from '../components/TuteurLayout';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

function TuteurDashboardContent() {
  const navigate = useNavigate();
  const [tuteur, setTuteur] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inscriptionFilter, setInscriptionFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('eleves');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEleveForPayment, setSelectedEleveForPayment] = useState(null);
  const [paymentCode, setPaymentCode] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paiements, setPaiements] = useState([]);
  const [paiementsLoading, setPaiementsLoading] = useState(false);
  const [showDesabonnementModal, setShowDesabonnementModal] = useState(false);
  const [showChangementModal, setShowChangementModal] = useState(false);
  const [selectedEleveForDesabonnement, setSelectedEleveForDesabonnement] = useState(null);
  const [selectedEleveForChangement, setSelectedEleveForChangement] = useState(null);
  const [desabonnementRaison, setDesabonnementRaison] = useState('');
  const [changementForm, setChangementForm] = useState({
    zone: '',
    type_transport: '',
    abonnement: ''
  });
  const [zones, setZones] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, eleve: null, type: null });
  const [cancelConfirm, setCancelConfirm] = useState({ show: false, eleve: null });
  const [alertDialog, setAlertDialog] = useState({ show: false, message: '', type: 'info' });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEleveForDetails, setSelectedEleveForDetails] = useState(null);
  const [eleveBusInfo, setEleveBusInfo] = useState(null);
  const [eleveTrajetInfo, setEleveTrajetInfo] = useState(null);
  const [eleveAbsences, setEleveAbsences] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    
    const tuteurData = JSON.parse(session);
    setTuteur(tuteurData);
    // Utiliser type_id qui est l'ID du tuteur dans la table tuteurs
    const tuteurId = tuteurData.type_id || tuteurData.id;
    loadData(tuteurId, tuteurData.id); // Passer aussi l'ID utilisateur
    loadZones();
  }, [navigate]);
  
  // Ne plus charger les notifications ici - elles sont gérées par TuteurLayout
  // Mais on garde la logique pour setNotifications si besoin pour les afficher dans le panel

  const loadZones = async () => {
    try {
      const zonesRes = await zonesAPI.getAll();
      const zonesData = zonesRes?.data || zonesRes || [];
      setZones(Array.isArray(zonesData) ? zonesData : []);
    } catch (err) {
      console.error('Erreur lors du chargement des zones:', err);
    }
  };

  const loadData = async (tuteurId, userId) => {
    setLoading(true);
    try {
      // Charger toutes les données nécessaires
      const [elevesRes, notificationsRes, demandesRes, inscriptionsRes, paiementsRes] = await Promise.allSettled([
        elevesAPI.getAll(),
        notificationsAPI.getByUser(userId, 'tuteur'),
        demandesAPI.getAll(),
        inscriptionsAPI.getAll(),
        paiementsAPI.getByTuteur(tuteurId)
      ]);
      
      const allEleves = elevesRes.status === 'fulfilled'
        ? (Array.isArray(elevesRes.value?.data) ? elevesRes.value.data : (Array.isArray(elevesRes.value) ? elevesRes.value : []))
        : [];
      const notificationsData = notificationsRes.status === 'fulfilled'
        ? (Array.isArray(notificationsRes.value?.data) ? notificationsRes.value.data : (Array.isArray(notificationsRes.value) ? notificationsRes.value : []))
        : [];
      const allDemandes = demandesRes.status === 'fulfilled'
        ? (Array.isArray(demandesRes.value?.data) ? demandesRes.value.data : (Array.isArray(demandesRes.value) ? demandesRes.value : []))
        : [];
      const allInscriptions = inscriptionsRes.status === 'fulfilled'
        ? (Array.isArray(inscriptionsRes.value?.data) ? inscriptionsRes.value.data : (Array.isArray(inscriptionsRes.value) ? inscriptionsRes.value : []))
        : [];
      const paiementsData = paiementsRes.status === 'fulfilled'
        ? (Array.isArray(paiementsRes.value?.data) ? paiementsRes.value.data : (Array.isArray(paiementsRes.value) ? paiementsRes.value : []))
        : [];
      
      // Filtrer les élèves du tuteur
      const elevesData = Array.isArray(allEleves) ? allEleves.filter(e => e.tuteur_id === tuteurId) : [];
      
      // Sauvegarder les paiements
      setPaiements(Array.isArray(paiementsData) ? paiementsData : []);
      
      // Filtrer uniquement les demandes d'inscription
      const demandesInscription = Array.isArray(allDemandes) 
        ? allDemandes.filter(d => d.type_demande === 'inscription' && d.tuteur_id === tuteurId)
        : [];
      
      // Enrichir les élèves avec les informations de demande et d'inscription
      const elevesEnriched = elevesData.map(eleve => {
        // Trouver la demande d'inscription la plus récente pour cet élève
        const demandeInscription = demandesInscription
          .filter(d => d.eleve_id === eleve.id)
          .sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0))[0];
        
        // Trouver l'inscription pour cet élève (active ou désabonnée)
        const inscription = Array.isArray(allInscriptions) 
          ? allInscriptions.find(i => i.eleve_id === eleve.id && (i.statut === 'Active' || i.statut === 'Désabonné'))
          : null;
        
        // Calculer le montant total payé pour cet élève
        // Les paiements incluent déjà les paiements initiaux et mensuels avec eleve_id
        const paiementsEleve = Array.isArray(paiementsData)
          ? paiementsData.filter(p => p.eleve_id === eleve.id && p.statut === 'Payé')
          : [];
        const montantTotalPaye = paiementsEleve.reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);
        
        // Extraire les informations de réduction depuis la demande d'inscription
        let montantAvantReduction = null;
        let tauxReduction = 0;
        let montantReduction = 0;
        if (demandeInscription?.description) {
          try {
            const desc = typeof demandeInscription.description === 'string'
              ? JSON.parse(demandeInscription.description)
              : demandeInscription.description;
            if (desc?.taux_reduction && desc.taux_reduction > 0) {
              montantAvantReduction = desc?.montant_avant_reduction;
              tauxReduction = desc?.taux_reduction;
              montantReduction = desc?.montant_reduction || 0;
            }
          } catch (err) {
            // Ignorer les erreurs de parsing
          }
        }
        
        // Déterminer le statut à afficher
        let statutDemande = null;
        if (inscription) {
          // Vérifier si l'inscription est désabonnée
          if (inscription.statut === 'Désabonné') {
            statutDemande = 'Désabonné';
          } else {
            // L'élève a une inscription active, donc il est inscrit
            statutDemande = 'Inscrit';
          }
        } else if (demandeInscription) {
          // Utiliser le statut de la demande et mapper selon les besoins
          const statut = demandeInscription.statut || 'En attente';
          if (statut === 'En attente') {
            statutDemande = 'En cours de traitement';
          } else if (statut === 'Validée' || statut === 'En attente de paiement') {
            // Quand l'admin valide, on affiche "En attente de paiement"
            statutDemande = 'En attente de paiement';
          } else if (statut === 'Refusée') {
            statutDemande = 'Refusée';
          } else {
            statutDemande = statut;
          }
        } else {
          // Pas de demande ni d'inscription - par défaut "En cours de traitement"
          statutDemande = 'En cours de traitement';
        }
        
        return {
          ...eleve,
          demande_inscription: demandeInscription,
          inscription: inscription,
          statut_demande: statutDemande,
          montant_total_paye: montantTotalPaye,
          montant_avant_reduction: montantAvantReduction,
          taux_reduction: tauxReduction,
          montant_reduction: montantReduction
        };
      });
      
      setEleves(elevesEnriched);
      setNotifications(notificationsData.sort((a, b) => new Date(b.date || b.date_creation || 0) - new Date(a.date || a.date_creation || 0)));
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
    } finally {
      setLoading(false);
      setPaiementsLoading(false);
    }
  };

  // handleLogout est maintenant géré par TuteurLayout

  const markNotificationAsRead = async (notifId) => {
    try {
      await notificationsAPI.marquerLue(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, lue: true } : n));
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  const getStatusBadge = (statut) => {
    const baseStyle = 'px-4 py-2 rounded-xl text-sm font-medium border';
    
    if (statut === 'En cours de traitement') {
      return `${baseStyle} bg-[#64B5F6] text-white border-[#64B5F6]`;
    } else if (statut === 'Inscrit') {
      return `${baseStyle} bg-[#A5D6A7] text-[#1B5E20] border-[#A5D6A7]`;
    } else if (statut === 'Désabonné') {
      return `${baseStyle} bg-[#E57373] text-white border-[#E57373]`;
    } else if (statut === 'En attente de paiement') {
      return `${baseStyle} bg-orange-100 text-orange-700 border-orange-200`;
    } else if (statut === 'Payée') {
      return `${baseStyle} bg-amber-100 text-amber-700 border-amber-200`;
    } else if (statut === 'Refusée') {
      return `${baseStyle} bg-red-100 text-red-700 border-red-200`;
    } else if (statut === 'En attente') {
      return `${baseStyle} bg-yellow-100 text-yellow-700 border-yellow-200`;
    }
    return `${baseStyle} bg-gray-100 text-gray-700 border-gray-200`;
  };

  const handleCancelDemande = async () => {
    if (!cancelConfirm.eleve) return;
    const eleve = cancelConfirm.eleve;
    
    try {
      // Si une demande existe, mettre à jour son statut
      if (eleve.demande_inscription?.id) {
        // Note: Il faudrait peut-être créer une API pour mettre à jour le statut de la demande
        // Pour l'instant, on peut supprimer l'élève si la demande n'est pas encore traitée
        if (eleve.statut_demande === 'En cours de traitement') {
          await elevesAPI.delete(eleve.id);
        }
      } else {
        // Supprimer l'élève s'il n'y a pas de demande
        await elevesAPI.delete(eleve.id);
      }
      
      // Recharger les données
      if (!tuteur) return;
      const tuteurId = tuteur.type_id || tuteur.id;
      loadData(tuteurId, tuteur.id);
      setCancelConfirm({ show: false, eleve: null });
      setSuccessMessage('Demande annulée avec succès');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
      setCancelConfirm({ show: false, eleve: null });
      setErrorMessage('Erreur lors de l\'annulation de la demande');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleCancelDemandeClick = (eleve) => {
    setCancelConfirm({ show: true, eleve });
  };

  const handleDeleteEleve = async () => {
    if (!deleteConfirm.eleve || !tuteur) return;
    const eleve = deleteConfirm.eleve;
    
    try {
      await elevesAPI.delete(eleve.id);
      const tuteurId = tuteur.type_id || tuteur.id;
      await loadData(tuteurId, tuteur.id);
      setDeleteConfirm({ show: false, eleve: null, type: null });
      setSuccessMessage('Inscription supprimée avec succès');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setDeleteConfirm({ show: false, eleve: null, type: null });
      setErrorMessage('Erreur lors de la suppression de l\'inscription');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleDeleteEleveClick = (eleve) => {
    setDeleteConfirm({ show: true, eleve, type: 'delete' });
  };

  const handleShowDetails = async (eleve) => {
    setSelectedEleveForDetails(eleve);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    setEleveBusInfo(null);
    setEleveTrajetInfo(null);
    setEleveAbsences([]);

    try {
      // Charger les informations du bus si l'élève est inscrit
      if (eleve.inscription && eleve.inscription.bus_id) {
        try {
          const busResponse = await busAPI.getById(eleve.inscription.bus_id);
          const busData = busResponse?.data || busResponse;
          setEleveBusInfo(busData);

          // Charger le trajet si disponible
          if (busData && busData.trajet_id) {
            const trajetResponse = await trajetsAPI.getById(busData.trajet_id);
            const trajetData = trajetResponse?.data || trajetResponse;
            setEleveTrajetInfo(trajetData);
          }
        } catch (err) {
          console.warn('Erreur lors du chargement du bus:', err);
        }
      }

      // Charger les absences (30 derniers jours)
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const presencesResponse = await presencesAPI.getByEleve(eleve.id, startDate, endDate);
        const presencesData = presencesResponse?.data || presencesResponse || [];
        
        // Filtrer les absences (présences avec statut "Absent")
        const absences = presencesData
          .filter(p => p.statut === 'Absent' || p.statut === 'absent')
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        
        setEleveAbsences(absences);
      } catch (err) {
        console.warn('Erreur lors du chargement des absences:', err);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDesabonnement = async () => {
    if (!selectedEleveForDesabonnement || !desabonnementRaison.trim()) {
      setErrorMessage('Veuillez saisir la raison du désabonnement');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    try {
      setErrorMessage('');
      const tuteurId = tuteur.type_id || tuteur.id;
      
      // Créer la demande de désinscription avec statut "Validée" pour trace
      await demandesAPI.create({
        eleve_id: selectedEleveForDesabonnement.id,
        tuteur_id: tuteurId,
        type_demande: 'desinscription',
        description: JSON.stringify({
          raison: desabonnementRaison
        }),
        statut: 'Validée'
      });

      // Supprimer complètement l'élève de la base de données
      await elevesAPI.delete(selectedEleveForDesabonnement.id);

      setSuccessMessage('Désabonnement effectué avec succès. L\'élève a été supprimé.');
      setShowDesabonnementModal(false);
      setSelectedEleveForDesabonnement(null);
      setDesabonnementRaison('');
      await loadData(tuteurId, tuteur.id);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Erreur lors du désabonnement:', err);
      setErrorMessage('Erreur lors du désabonnement');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleChangementDemande = async () => {
    if (!selectedEleveForChangement) {
      return;
    }

    if (!changementForm.zone && !changementForm.type_transport && !changementForm.abonnement) {
      setErrorMessage('Veuillez sélectionner au moins un élément à modifier');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    try {
      const tuteurId = tuteur.type_id || tuteur.id;
      
      // Récupérer les données actuelles de l'élève
      const demandeActuelle = selectedEleveForChangement.demande_inscription;
      let descriptionData = {};
      if (demandeActuelle?.description) {
        try {
          descriptionData = typeof demandeActuelle.description === 'string'
            ? JSON.parse(demandeActuelle.description)
            : demandeActuelle.description;
        } catch (err) {
          console.warn('Erreur parsing description:', err);
        }
      }

      // Mettre à jour seulement les champs modifiés
      const nouvelleDescription = {
        ...descriptionData,
        type_transport: changementForm.type_transport || descriptionData.type_transport,
        abonnement: changementForm.abonnement || descriptionData.abonnement,
        zone: changementForm.zone || descriptionData.zone
      };

      await demandesAPI.create({
        eleve_id: selectedEleveForChangement.id,
        tuteur_id: tuteurId,
        type_demande: 'modification',
        zone_geographique: changementForm.zone || demandeActuelle?.zone_geographique,
        description: JSON.stringify(nouvelleDescription),
        statut: 'En attente'
      });

      setSuccessMessage('Demande de modification envoyée avec succès');
      setShowChangementModal(false);
      setSelectedEleveForChangement(null);
      setChangementForm({ zone: '', type_transport: '', abonnement: '' });
      await loadData(tuteurId, tuteur.id);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Erreur lors de la demande de changement:', err);
      setErrorMessage('Erreur lors de l\'envoi de la demande de modification');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Filtrer les élèves : exclure les refusées de la liste principale
  const elevesActifs = eleves.filter(e => e.statut_demande !== 'Refusée');
  const elevesRefuses = eleves.filter(e => e.statut_demande === 'Refusée');
  
  const filteredEleves = elevesActifs.filter(e => {
    if (inscriptionFilter === 'all') return true;
    if (inscriptionFilter === 'inscrit') return e.statut_demande === 'Inscrit';
    if (inscriptionFilter === 'en_attente') return e.statut_demande === 'En attente de paiement';
    if (inscriptionFilter === 'en_traitement') return e.statut_demande === 'En cours de traitement';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.lue).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
        {/* Messages de succès et d'erreur */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-2 text-green-700 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-2 text-red-600 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-lime-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Bienvenue, {tuteur?.prenom} {tuteur?.nom}
                </h1>
                <p className="text-gray-500">{tuteur?.email}</p>
              </div>
            </div>
            
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Mes Enfants" 
            value={eleves.length} 
            icon={GraduationCap} 
            color="lime"
          />
          <StatCard 
            title="En attente" 
            value={eleves.filter(e => e.statut_demande === 'En cours de traitement' || e.statut_demande === 'En attente').length} 
            icon={Clock} 
            color="orange"
          />
          <StatCard 
            title="Inscrits" 
            value={eleves.filter(e => e.statut_demande === 'Inscrit' || e.statut_demande === 'En attente de paiement').length} 
            icon={CheckCircle} 
            color="green"
          />
        </div>

        {/* Onglets de navigation internes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2 flex-wrap">
            <Button
              onClick={() => setActiveTab('eleves')}
              className={`rounded-xl px-6 py-3 transition-all font-semibold ${
                activeTab === 'eleves'
                  ? 'bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600 shadow-md'
                  : 'bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600 opacity-75 hover:opacity-100'
              }`}
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Mes Enfants
            </Button>
            <Button
              onClick={() => setActiveTab('historique')}
              className={`rounded-xl px-6 py-3 transition-all font-semibold ${
                activeTab === 'historique'
                  ? 'bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600 shadow-md'
                  : 'bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600 opacity-75 hover:opacity-100'
              }`}
            >
              <XCircle className="w-5 h-5 mr-2" />
              Demandes refusées ({elevesRefuses.length})
            </Button>
            <Button
              onClick={() => setActiveTab('paiements')}
              className={`rounded-xl px-6 py-3 transition-all font-semibold ${
                activeTab === 'paiements'
                  ? 'bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600 shadow-md'
                  : 'bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600 opacity-75 hover:opacity-100'
              }`}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Paiements
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        {activeTab === 'eleves' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-lime-500" />
                Mes Enfants
              </h2>
              <Select value={inscriptionFilter} onValueChange={setInscriptionFilter}>
                <SelectTrigger className="w-48 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les élèves</SelectItem>
                  <SelectItem value="inscrit">Inscrits</SelectItem>
                  <SelectItem value="en_attente">En attente de paiement</SelectItem>
                  <SelectItem value="en_traitement">En cours de traitement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredEleves.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun élève inscrit pour le moment</p>
              <Link to={createPageUrl('TuteurInscription')}>
                <Button className="mt-4 bg-lime-500 hover:bg-lime-600 text-white rounded-xl">
                  Inscrire un élève
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEleves.map((eleve, index) => (
                <motion.div
                  key={eleve.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-6 hover:bg-lime-50/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <GraduationCap className="w-7 h-7 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {eleve.nom} {eleve.prenom}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                          <span>{eleve.classe}</span>
                          {eleve.adresse && (
                            <>
                              <span>•</span>
                              <span>{eleve.adresse.substring(0, 30)}...</span>
                            </>
                          )}
                        </div>
                        {eleve.montant_total_paye > 0 && (
                          <div className="mt-2 space-y-1">
                            {eleve.taux_reduction > 0 && eleve.montant_avant_reduction ? (
                              <>
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-700 flex-wrap">
                                  <CreditCard className="w-4 h-4" />
                                  <span className="line-through text-gray-500">{parseFloat(eleve.montant_avant_reduction).toFixed(2)} DH</span>
                                  <span>→</span>
                                  <span className="font-bold">Total payé: {eleve.montant_total_paye.toFixed(2)} DH</span>
                                  <span className="text-xs bg-green-200 px-2 py-0.5 rounded">-{Math.round(eleve.taux_reduction * 100)}%</span>
                                </div>
                                <div className="text-xs text-green-600 ml-3">
                                  Réduction: {eleve.montant_reduction.toFixed(2)} DH
                                </div>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-700">
                                <CreditCard className="w-4 h-4" />
                                Total payé: {eleve.montant_total_paye.toFixed(2)} DH
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={getStatusBadge(eleve.statut_demande)}>
                        {eleve.statut_demande}
                      </span>
                      
                      {/* Bouton Détails - redirige vers la page de détails */}
                      <Button 
                        onClick={() => navigate(createPageUrl(`TuteurEleveDetails?eleveId=${eleve.id}`))}
                        className="rounded-xl bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                      </Button>
                      
                      {/* Boutons selon le statut */}
                      {(eleve.statut_demande === 'En cours de traitement' || eleve.statut_demande === 'En attente') && (
                        <>
                          <Link to={createPageUrl(`TuteurDemandes`)}>
                            <Button className="rounded-xl bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600">
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </Button>
                          </Link>
                          <Button
                            onClick={() => handleCancelDemandeClick(eleve)}
                            className="rounded-xl bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Annuler
                          </Button>
                        </>
                      )}
                      
                      {eleve.statut_demande === 'En attente de paiement' && eleve.demande_inscription?.id && (
                        <Button 
                          onClick={() => {
                            setSelectedEleveForPayment(eleve);
                            setShowPaymentModal(true);
                            setPaymentCode('');
                            setPaymentError('');
                          }}
                          className="bg-gradient-to-r from-lime-600 to-lime-600 hover:from-lime-700 hover:to-lime-700 text-white rounded-xl font-semibold shadow-md"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payer
                        </Button>
                      )}
                      
                      
                      {eleve.statut_demande === 'Inscrit' && (
                        <>
                          <Button
                            onClick={() => {
                              setSelectedEleveForDesabonnement(eleve);
                              setShowDesabonnementModal(true);
                              setDesabonnementRaison('');
                            }}
                            className="rounded-xl text-white border-2"
                            style={{ backgroundColor: '#E57373', borderColor: '#E57373' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#EF5350'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#E57373'}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Désabonnement
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        )}

        {/* Content - Historique */}
        {activeTab === 'historique' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-lime-500" />
                Demandes Refusées
              </h2>
              <p className="text-gray-500 mt-1">{elevesRefuses.length} demande(s) refusée(s)</p>
            </div>
            
            {elevesRefuses.length === 0 ? (
              <div className="p-12 text-center">
                <XCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucune demande refusée</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {elevesRefuses.map((eleve, index) => (
                  <motion.div
                    key={eleve.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-6 hover:bg-red-50/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                          <XCircle className="w-7 h-7 text-red-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {eleve.nom} {eleve.prenom}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                            <span>{eleve.classe}</span>
                            {eleve.adresse && (
                              <>
                                <span>•</span>
                                <span>{eleve.adresse.substring(0, 30)}...</span>
                              </>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className="px-3 py-1 rounded-xl text-sm font-medium border border-red-300 bg-red-50 text-red-700">
                              Refusée
                            </span>
                            {eleve.demande_inscription?.date_creation && (
                              <span className="ml-3 text-xs text-gray-500">
                                Le {new Date(eleve.demande_inscription.date_creation).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <Button 
                          onClick={() => navigate(createPageUrl(`TuteurEleveDetails?eleveId=${eleve.id}`))}
                          className="rounded-xl bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </Button>
                        <Button
                          onClick={() => handleDeleteEleveClick(eleve)}
                          className="rounded-xl bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'demandes' && (
          <DemandeFormTuteur tuteur={tuteur} eleves={eleves} />
        )}

        {/* Content - Paiements */}
        {activeTab === 'paiements' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-lime-500" />
                Mes Paiements
              </h2>
              <p className="text-gray-500 mt-1">
                Total: {paiements.filter(p => p.statut === 'Payé').reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0).toFixed(2)} DH
              </p>
            </div>
            
            {paiements.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucun paiement enregistré</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {paiements.map((paiement, index) => (
                  <motion.div
                    key={paiement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-6 hover:bg-lime-50/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                          paiement.type_paiement === 'initial' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <CreditCard className={`w-7 h-7 ${
                            paiement.type_paiement === 'initial' ? 'text-blue-500' : 'text-green-500'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {paiement.eleve_prenom} {paiement.eleve_nom}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                            <span>{paiement.eleve_classe || 'N/A'}</span>
                            {paiement.bus_numero && (
                              <>
                                <span>•</span>
                                <span>Bus {paiement.bus_numero}</span>
                              </>
                            )}
                            {paiement.date_paiement && (
                              <>
                                <span>•</span>
                                <span>{new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</span>
                              </>
                            )}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <span className={`px-3 py-1 rounded-xl text-xs font-medium ${
                              paiement.type_paiement === 'initial' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {paiement.type_paiement === 'initial' ? 'Paiement initial' : `Mois ${paiement.mois}/${paiement.annee}`}
                            </span>
                            <span className={`px-3 py-1 rounded-xl text-xs font-medium border ${
                              paiement.statut === 'Payé' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`}>
                              {paiement.statut}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-lime-600">
                          {parseFloat(paiement.montant || 0).toFixed(2)} DH
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      {/* NotificationPanel retiré - les notifications sont gérées par le sidebar */}

      {/* Modal de détails de l'élève */}
      {showDetailsModal && selectedEleveForDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 bg-gradient-to-r from-lime-500 to-lime-600">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Eye className="w-6 h-6" />
                  Détails de {selectedEleveForDetails.prenom} {selectedEleveForDetails.nom}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEleveForDetails(null);
                    setEleveBusInfo(null);
                    setEleveTrajetInfo(null);
                    setEleveAbsences([]);
                  }}
                  className="text-white hover:text-lime-100 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Informations générales */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-lime-500" />
                      Informations générales
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Classe:</span>
                        <span className="ml-2 font-medium">{selectedEleveForDetails.classe || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Statut:</span>
                        <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadge(selectedEleveForDetails.statut_demande)}`}>
                          {selectedEleveForDetails.statut_demande}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informations du bus (si inscrit) */}
                  {selectedEleveForDetails.inscription && selectedEleveForDetails.inscription.bus_id ? (
                    <div className="bg-lime-50 rounded-2xl p-4 border border-lime-200">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Bus className="w-5 h-5 text-lime-500" />
                        Informations du bus
                      </h3>
                      {eleveBusInfo ? (
                        <div className="space-y-3">
                          <div className="bg-white rounded-xl p-4 border border-lime-200">
                            <p className="text-sm text-lime-600 font-medium mb-1">Bus assigné</p>
                            <p className="text-2xl font-bold text-gray-800">{eleveBusInfo.numero}</p>
                            {eleveBusInfo.immatriculation && (
                              <p className="text-sm text-gray-500">{eleveBusInfo.immatriculation}</p>
                            )}
                          </div>
                          
                          {eleveBusInfo.marque && (
                            <div className="flex justify-between py-2 border-b border-gray-200">
                              <span className="text-gray-600">Marque/Modèle</span>
                              <span className="font-medium">{eleveBusInfo.marque} {eleveBusInfo.modele || ''}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Capacité</span>
                            <span className="font-medium">{eleveBusInfo.capacite} places</span>
                          </div>

                          {eleveTrajetInfo && (
                            <>
                              <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-600">Trajet</span>
                                <span className="font-medium">{eleveTrajetInfo.nom}</span>
                              </div>
                              
                              {eleveTrajetInfo.heure_depart_matin_a && (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-600 mb-2">Horaires:</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                                      <p className="text-xs text-blue-600 font-medium">Matin</p>
                                      <p className="font-semibold text-gray-800 text-sm">
                                        {eleveTrajetInfo.heure_depart_matin_a}
                                      </p>
                                    </div>
                                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                                      <p className="text-xs text-orange-600 font-medium">Soir</p>
                                      <p className="font-semibold text-gray-800 text-sm">
                                        {eleveTrajetInfo.heure_depart_soir_a}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Chargement des informations du bus...</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <p className="text-gray-500 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        L'élève n'est pas encore assigné à un bus
                      </p>
                    </div>
                  )}

                  {/* Absences */}
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      Absences (30 derniers jours)
                    </h3>
                    {eleveAbsences.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {eleveAbsences.map((absence, index) => (
                          <div key={index} className="bg-white rounded-xl p-3 border border-red-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-red-500" />
                              <span className="font-medium text-gray-800">
                                {absence.date ? new Date(absence.date).toLocaleDateString('fr-FR', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                }) : 'Date inconnue'}
                              </span>
                            </div>
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                              Absent
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-4 border border-green-200">
                        <p className="text-green-700 text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Aucune absence enregistrée sur les 30 derniers jours
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de paiement */}
      {showPaymentModal && selectedEleveForPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-r from-lime-600 to-lime-600">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <CreditCard className="w-6 h-6" />
                  Paiement
                </h2>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedEleveForPayment(null);
                    setPaymentCode('');
                    setPaymentError('');
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Informations de la demande */}
              <div className="bg-lime-50 rounded-xl p-4 mb-6 border border-lime-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Élève:</span>
                    <span className="font-semibold">{selectedEleveForPayment.prenom} {selectedEleveForPayment.nom}</span>
                  </div>
                  {selectedEleveForPayment.demande_inscription?.montant_facture && (
                    <div className="flex justify-between pt-2 border-t border-lime-200">
                      <span className="text-gray-700 font-medium">Montant:</span>
                      <span className="text-lg font-bold text-lime-700">
                        {parseFloat(selectedEleveForPayment.demande_inscription.montant_facture).toFixed(2)} DH
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong> Veuillez consulter l'école pour effectuer le paiement et récupérer le code de vérification à saisir ci-dessous.
                </p>
              </div>

              {paymentError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  {paymentError}
                </div>
              )}

              {/* Formulaire de code */}
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">
                    Code de vérification (fourni par l'école)
                  </Label>
                  <Input
                    value={paymentCode}
                    onChange={(e) => setPaymentCode(e.target.value.toUpperCase())}
                    placeholder="Entrez le code de vérification"
                    className="h-12 rounded-xl text-center text-xl tracking-widest font-mono uppercase"
                    maxLength={10}
                    disabled={paymentLoading}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedEleveForPayment(null);
                      setPaymentCode('');
                      setPaymentError('');
                    }}
                    className="flex-1 rounded-xl bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600"
                    disabled={paymentLoading}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!paymentCode || paymentCode.length < 4) {
                        setPaymentError('Veuillez saisir le code de vérification');
                        return;
                      }

                      setPaymentLoading(true);
                      setPaymentError('');

                      try {
                        const response = await demandesAPI.verifierCode(
                          selectedEleveForPayment.demande_inscription.id,
                          paymentCode
                        );

                        if (!response.success) {
                          setPaymentError(response.message || 'Code de vérification incorrect');
                          setPaymentLoading(false);
                          return;
                        }

                        // Succès - fermer la modal et recharger les données
                        setShowPaymentModal(false);
                        setSelectedEleveForPayment(null);
                        setPaymentCode('');
                        
                        // Recharger les données
                        const tuteurId = tuteur.type_id || tuteur.id;
                        await loadData(tuteurId, tuteur.id);
                      } catch (err) {
                        console.error('Erreur lors de la vérification:', err);
                        setPaymentError(err.message || 'Erreur lors de la vérification du code. Veuillez réessayer.');
                      }
                      setPaymentLoading(false);
                    }}
                    disabled={paymentLoading}
                    className="flex-1 bg-gradient-to-r from-lime-600 to-lime-600 hover:from-lime-700 hover:to-lime-700 text-white rounded-xl font-semibold"
                  >
                    {paymentLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirmer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de désabonnement */}
      {showDesabonnementModal && selectedEleveForDesabonnement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-r from-red-500 to-red-600">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <LogOut className="w-6 h-6" />
                  Désabonnement
                </h2>
                <button
                  onClick={() => {
                    setShowDesabonnementModal(false);
                    setSelectedEleveForDesabonnement(null);
                    setDesabonnementRaison('');
                  }}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleDesabonnement(); }} className="p-6 space-y-4">
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Attention :</strong> Vous êtes sur le point de désabonner <strong>{selectedEleveForDesabonnement.prenom} {selectedEleveForDesabonnement.nom}</strong>. Cette action est irréversible et supprimera définitivement toutes les données de l'élève.
                </p>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-600 mb-1">Raison du désabonnement *</Label>
                <Textarea
                  value={desabonnementRaison}
                  onChange={(e) => setDesabonnementRaison(e.target.value)}
                  className="rounded-xl border-2 border-gray-200 focus:border-red-500 min-h-[100px]"
                  placeholder="Veuillez indiquer la raison du désabonnement..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setShowDesabonnementModal(false);
                    setSelectedEleveForDesabonnement(null);
                    setDesabonnementRaison('');
                  }}
                  className="rounded-xl bg-gray-500 hover:bg-gray-600 text-white border-2 border-gray-600"
                >
                  Annuler
                </Button>
                <Button type="submit" className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-2 border-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Confirmer le désabonnement
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal de changement */}
      {showChangementModal && selectedEleveForChangement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 bg-gradient-to-r from-lime-500 to-lime-600">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Repeat className="w-6 h-6" />
                  Demande de changement
                </h2>
                <button
                  onClick={() => {
                    setShowChangementModal(false);
                    setSelectedEleveForChangement(null);
                    setChangementForm({ zone: '', type_transport: '', abonnement: '' });
                  }}
                  className="text-white hover:text-lime-100 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleChangementDemande(); }} className="p-6 space-y-4">
              <div className="bg-lime-50 rounded-xl p-4 border border-lime-200">
                <p className="text-sm text-lime-800">
                  Demande de changement pour <strong>{selectedEleveForChangement.prenom} {selectedEleveForChangement.nom}</strong>.
                </p>
                <p className="text-xs text-lime-700 mt-2">Sélectionnez uniquement les éléments que vous souhaitez modifier.</p>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-600 mb-1">Zone géographique</Label>
                <Select
                  value={changementForm.zone}
                  onValueChange={(value) => setChangementForm({ ...changementForm, zone: value })}
                >
                  <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-lime-500">
                    <SelectValue placeholder="Sélectionnez une nouvelle zone (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.filter(z => z.actif !== false).map((zone) => (
                      <SelectItem key={zone.id} value={zone.nom}>{zone.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-600 mb-1">Type de transport</Label>
                <Select
                  value={changementForm.type_transport}
                  onValueChange={(value) => setChangementForm({ ...changementForm, type_transport: value })}
                >
                  <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-lime-500">
                    <SelectValue placeholder="Sélectionnez un nouveau type (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aller-Retour">Aller-Retour</SelectItem>
                    <SelectItem value="Aller">Aller uniquement</SelectItem>
                    <SelectItem value="Retour">Retour uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-600 mb-1">Type d'abonnement</Label>
                <Select
                  value={changementForm.abonnement}
                  onValueChange={(value) => setChangementForm({ ...changementForm, abonnement: value })}
                >
                  <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-lime-500">
                    <SelectValue placeholder="Sélectionnez un nouveau type d'abonnement (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensuel">Mensuel</SelectItem>
                    <SelectItem value="Annuel">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setShowChangementModal(false);
                    setSelectedEleveForChangement(null);
                    setChangementForm({ zone: '', type_transport: '', abonnement: '' });
                  }}
                  className="rounded-xl bg-gray-500 hover:bg-gray-600 text-white border-2 border-gray-600"
                >
                  Annuler
                </Button>
                <Button type="submit" className="rounded-xl bg-lime-500 hover:bg-lime-600 text-white border-2 border-lime-600">
                  <Repeat className="w-4 h-4 mr-2" />
                  Envoyer la demande
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Supprimer l'inscription"
        message={deleteConfirm.eleve ? `Êtes-vous sûr de vouloir supprimer définitivement l'inscription de ${deleteConfirm.eleve.prenom} ${deleteConfirm.eleve.nom} ?` : ''}
        onConfirm={handleDeleteEleve}
        onCancel={() => setDeleteConfirm({ show: false, eleve: null, type: null })}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Dialog de confirmation d'annulation */}
      <ConfirmDialog
        isOpen={cancelConfirm.show}
        title="Annuler la demande"
        message={cancelConfirm.eleve ? `Êtes-vous sûr de vouloir annuler la demande d'inscription de ${cancelConfirm.eleve.prenom} ${cancelConfirm.eleve.nom} ?` : ''}
        onConfirm={handleCancelDemande}
        onCancel={() => setCancelConfirm({ show: false, eleve: null })}
        confirmText="Annuler la demande"
        cancelText="Non"
        variant="default"
      />

      {/* Dialog d'alerte */}
      <AlertDialog
        isOpen={alertDialog.show}
        title="Information"
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ show: false, message: '', type: 'info' })}
      />
    </>
  );
}

function DemandeFormTuteur({ tuteur, eleves }) {
  const zones = ['agdal', '(takaddoum-haynahda)', 'hay riad', 'temara', 'medina', 'hay el fath', 'hay lmohit', 'yaakoub al mansour'];
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    eleve_id: '',
    nouvelle_adresse: '',
    nouvelle_zone: '',
    date_demenagement: '',
    raisons: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await demandesAPI.create({
        eleve_id: parseInt(formData.eleve_id),
        tuteur_id: tuteur.id,
        type_demande: 'Déménagement',
        nouvelle_adresse: formData.nouvelle_adresse,
        nouvelle_zone: formData.nouvelle_zone,
        date_demenagement: formData.date_demenagement,
        raisons: formData.raisons,
        statut: 'En attente'
      });
      
      // Notifier l'admin
      await notificationsAPI.create({
        destinataire_id: 1, // ID admin par défaut
        destinataire_type: 'admin',
        titre: 'Nouvelle demande de changement d\'adresse/zone',
        message: `${tuteur.prenom} ${tuteur.nom} a fait une demande de changement d'adresse/zone pour un élève.`,
        type: 'info'
      });
      
      setSuccess(true);
      setFormData({
        eleve_id: '',
        nouvelle_adresse: '',
        nouvelle_zone: '',
        date_demenagement: '',
        raisons: ''
      });
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la demande:', err);
      setAlertDialog({ show: true, message: 'Erreur lors de l\'envoi de la demande', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const selectedEleve = eleves.find(e => e.id === parseInt(formData.eleve_id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl p-6"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-lime-500" />
        Demande de changement d'adresse / Zone (Déménagement)
      </h2>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700"
        >
          <CheckCircle className="w-5 h-5" />
          Demande envoyée avec succès !
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label className="text-gray-700 font-medium mb-2">Sélectionner l'élève</Label>
          <Select
            value={formData.eleve_id}
            onValueChange={(v) => setFormData({ ...formData, eleve_id: v })}
          >
            <SelectTrigger className="mt-1 h-12 rounded-xl">
              <SelectValue placeholder="Sélectionnez un élève" />
            </SelectTrigger>
            <SelectContent>
              {eleves.map(eleve => (
                <SelectItem key={eleve.id} value={eleve.id.toString()}>
                  {eleve.prenom} {eleve.nom} - {eleve.classe}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEleve && (
          <div className="bg-lime-50 rounded-xl p-4 border border-lime-100">
            <p className="text-sm text-gray-600 mb-2">Informations actuelles</p>
            <p className="font-medium">Adresse actuelle: <span className="text-gray-700">{selectedEleve.adresse || 'Non renseignée'}</span></p>
          </div>
        )}

        <div>
          <Label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-lime-500" />
            Nouvelle adresse
          </Label>
          <Input
            value={formData.nouvelle_adresse}
            onChange={(e) => setFormData({ ...formData, nouvelle_adresse: e.target.value })}
            className="mt-1 h-12 rounded-xl"
            placeholder="Nouvelle adresse complète"
            required
          />
        </div>

        <div>
          <Label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-lime-500" />
            Nouvelle zone
          </Label>
          <Select
            value={formData.nouvelle_zone}
            onValueChange={(v) => setFormData({ ...formData, nouvelle_zone: v })}
          >
            <SelectTrigger className="mt-1 h-12 rounded-xl">
              <SelectValue placeholder="Sélectionnez la nouvelle zone" />
            </SelectTrigger>
            <SelectContent>
              {zones.map(zone => (
                <SelectItem key={zone} value={zone}>{zone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-lime-500" />
            Date de déménagement
          </Label>
          <Input
            type="date"
            value={formData.date_demenagement}
            onChange={(e) => setFormData({ ...formData, date_demenagement: e.target.value })}
            className="mt-1 h-12 rounded-xl"
            required
          />
        </div>

        <div>
          <Label className="text-gray-700 font-medium mb-2">Raisons / Justification</Label>
          <Textarea
            value={formData.raisons}
            onChange={(e) => setFormData({ ...formData, raisons: e.target.value })}
            className="mt-1 rounded-xl min-h-[120px]"
            placeholder="Expliquez les raisons du déménagement..."
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !formData.eleve_id}
          className="w-full h-12 bg-gradient-to-r from-lime-500 to-lime-500 hover:from-lime-600 hover:to-lime-600 text-white rounded-xl"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Envoyer la demande'
          )}
        </Button>
      </form>
    </motion.div>
  );
}

export default function TuteurDashboard() {
  return (
    <TuteurLayout>
      <TuteurDashboardContent />
    </TuteurLayout>
  );
}