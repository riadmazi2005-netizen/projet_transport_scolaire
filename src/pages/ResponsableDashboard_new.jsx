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

  // États pour les filtres de présence
  const [presencePeriodFilter, setPresencePeriodFilter] = useState('auto'); // 'auto', 'matin', 'soir'
  const [processedStudents, setProcessedStudents] = useState(new Set()); // Élèves dont la présence a été enregistrée
  const [showNotificationButtons, setShowNotificationButtons] = useState(new Set()); // Élèves avec bouton notification visible

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

  // Fonctions pour gérer les présences avec effets visuels
  const handleMarkPresent = async (eleveId, periode) => {
    try {
      const existingPresence = presences.find(p =>
        p.eleve_id === eleveId && p.date === selectedDate
      );

      let presenceData;

      if (existingPresence) {
        const updateData = {
          ...existingPresence,
          [periode === 'matin' ? 'present_matin' : 'present_soir']: true
        };

        const response = await presencesAPI.marquer(updateData);
        presenceData = response?.data || response;

        setPresences(prev => prev.map(p =>
          p.id === existingPresence.id
            ? { ...p, ...presenceData }
            : p
        ));
      } else {
        const newPresenceData = {
          eleve_id: eleveId,
          date: selectedDate,
          present_matin: periode === 'matin' ? true : false,
          present_soir: periode === 'soir' ? true : false,
          bus_id: bus?.id,
          responsable_id: responsable?.type_id || responsable?.id
        };

        const response = await presencesAPI.marquer(newPresenceData);
        presenceData = response?.data || response;

        setPresences(prev => [...prev, presenceData]);
      }

      // Ajouter l'élève à la liste des traités et masquer notification
      setProcessedStudents(prev => new Set([...prev, `${eleveId}_${periode}`]));
      setShowNotificationButtons(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${eleveId}_${periode}`);
        return newSet;
      });

      showToast('Présence enregistrée avec succès', 'success');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la présence:', err);
      showToast('Erreur lors de l\'enregistrement de la présence', 'error');
    }
  };

  const handleMarkAbsent = async (eleveId, periode) => {
    try {
      const existingPresence = presences.find(p =>
        p.eleve_id === eleveId && p.date === selectedDate
      );

      let presenceData;

      if (existingPresence) {
        const updateData = {
          ...existingPresence,
          [periode === 'matin' ? 'present_matin' : 'present_soir']: false
        };

        const response = await presencesAPI.marquer(updateData);
        presenceData = response?.data || response;

        setPresences(prev => prev.map(p =>
          p.id === existingPresence.id
            ? { ...p, ...presenceData }
            : p
        ));
      } else {
        const newPresenceData = {
          eleve_id: eleveId,
          date: selectedDate,
          present_matin: periode === 'matin' ? false : false,
          present_soir: periode === 'soir' ? false : false,
          bus_id: bus?.id,
          responsable_id: responsable?.type_id || responsable?.id
        };

        const response = await presencesAPI.marquer(newPresenceData);
        presenceData = response?.data || response;

        setPresences(prev => [...prev, presenceData]);
      }

      // Ajouter l'élève à la liste des traités et afficher notification
      setProcessedStudents(prev => new Set([...prev, `${eleveId}_${periode}`]));
      setShowNotificationButtons(prev => new Set([...prev, `${eleveId}_${periode}`]));

      // Envoyer notification automatique au tuteur
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

      showToast('Absence enregistrée avec succès', 'success');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de l\'absence:', err);
      showToast('Erreur lors de l\'enregistrement de l\'absence', 'error');
    }
  };

  const handleNotifyAbsence = async (eleve, periode = 'matin') => {
    try {
      if (!eleve.tuteur_id) {
        showToast('Aucun tuteur trouvé pour cet élève', 'error');
        return;
      }

      setActiveTab('communication');
      setShowCommunicationForm(true);

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

  const handleTogglePresence = async (eleveId, periode, value) => {
    if (value) {
      await handleMarkPresent(eleveId, periode);
    } else {
      await handleMarkAbsent(eleveId, periode);
    }
  };

  // Fonctions utilitaires
  const handleLogout = () => {
    localStorage.removeItem('responsable_session');
    navigate(createPageUrl('Home'));
  };

  const loadData = async (responsableData) => {
    try {
      // Charger le bus assigné à ce responsable (un seul bus)
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
        try {
          const elevesResponse = await elevesAPI.getByBus(myBus.id);
          const elevesData = elevesResponse?.data || elevesResponse || [];
          setEleves(Array.isArray(elevesData) ? elevesData : []);
        } catch (err) {
          console.error('Erreur chargement élèves:', err);
          setEleves([]);
        }
      }

      // Charger les présences pour le bus du responsable
      try {
        const presencesResponse = await presencesAPI.getByDate(selectedDate, myBus?.id);
        const presencesData = presencesResponse?.data || presencesResponse || [];
        setPresences(presencesData);
      } catch (err) {
        console.warn('Présences non disponibles:', err);
        setPresences([]);
      }

      // Charger les notifications reçues
      const notificationsResponse = await notificationsAPI.getByUser(responsableId, 'responsable');
      const notificationsData = notificationsResponse?.data || notificationsResponse || [];
      setNotifications(notificationsData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));

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

      <main className={`min-h-screen p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'
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
                          <span className="text-gray-600">Capacité:</span>
                          <span className="font-semibold">{bus.capacite} places</span>
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

          {/* Content - Présence */}
          {activeTab === 'presence' && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Gestion des Présences
                </h2>

                {/* Filtres */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white text-sm mb-2 block">Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <Label className="text-white text-sm mb-2 block">Période</Label>
                    <Select
                      value={presencePeriodFilter}
                      onValueChange={setPresencePeriodFilter}
                    >
                      <SelectTrigger className="bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatique</SelectItem>
                        <SelectItem value="matin">Matin uniquement</SelectItem>
                        <SelectItem value="soir">Soir uniquement</SelectItem>
                        <SelectItem value="tous">Matin et Soir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Liste des élèves avec présence */}
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {eleves
                  .filter(eleve => !processedStudents.has(`${eleve.id}_matin`) && !processedStudents.has(`${eleve.id}_soir`))
                  .map((eleve) => {
                    const presence = presences.find(p => p.eleve_id === eleve.id && p.date === selectedDate);
                    const presentMatin = presence?.present_matin === true || presence?.present_matin === 1 || presence?.present_matin === '1';
                    const presentSoir = presence?.present_soir === true || presence?.present_soir === 1 || presence?.present_soir === '1';
                    const hasRecord = !!presence;

                    const currentPeriod = presencePeriodFilter === 'auto'
                      ? (new Date().getHours() < 13 ? 'matin' : 'soir')
                      : presencePeriodFilter;

                    return (
                      <motion.div
                        key={eleve.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 hover:bg-purple-50/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-sm">
                              <User className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{eleve.nom} {eleve.prenom}</h3>
                              <p className="text-sm text-gray-600">{eleve.classe || 'N/A'} • Groupe {eleve.groupe || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Boutons pour Matin */}
                            {(currentPeriod === 'matin' || currentPeriod === 'tous') && (
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">Matin</span>
                                <div className="flex gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMarkPresent(eleve.id, 'matin')}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${hasRecord && presentMatin
                                        ? 'bg-green-500'
                                        : 'bg-gray-200 hover:bg-green-500 hover:text-white'
                                      }`}
                                    title="Marquer présent"
                                  >
                                    <Check className="w-5 h-5" strokeWidth={3} />
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMarkAbsent(eleve.id, 'matin')}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${hasRecord && !presentMatin
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-200 hover:bg-red-500 hover:text-white'
                                      }`}
                                    title="Marquer absent"
                                  >
                                    <X className="w-5 h-5" strokeWidth={3} />
                                  </motion.button>
                                </div>

                                {/* Bouton notification qui apparaît après avoir cliqué sur X */}
                                <AnimatePresence>
                                  {showNotificationButtons.has(`${eleve.id}_matin`) && (
                                    <motion.button
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      onClick={() => handleNotifyAbsence(eleve, 'matin')}
                                      className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                      title="Notifier l'absence"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </motion.button>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}

                            {/* Boutons pour Soir */}
                            {(currentPeriod === 'soir' || currentPeriod === 'tous') && (
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">Soir</span>
                                <div className="flex gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMarkPresent(eleve.id, 'soir')}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${hasRecord && presentSoir
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 hover:bg-green-500 hover:text-white'
                                      }`}
                                    title="Marquer présent"
                                  >
                                    <Check className="w-5 h-5" strokeWidth={3} />
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMarkAbsent(eleve.id, 'soir')}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${hasRecord && !presentSoir
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-200 hover:bg-red-500 hover:text-white'
                                      }`}
                                    title="Marquer absent"
                                  >
                                    <X className="w-5 h-5" strokeWidth={3} />
                                  </motion.button>
                                </div>

                                {/* Bouton notification qui apparaît après avoir cliqué sur X */}
                                <AnimatePresence>
                                  {showNotificationButtons.has(`${eleve.id}_soir`) && (
                                    <motion.button
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      onClick={() => handleNotifyAbsence(eleve, 'soir')}
                                      className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                      title="Notifier l'absence"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </motion.button>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                {eleves.filter(eleve => !processedStudents.has(`${eleve.id}_matin`) && !processedStudents.has(`${eleve.id}_soir`)).length === 0 && (
                  <div className="p-12 text-center text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Tous les élèves ont été traités</p>
                    <p className="text-sm mt-2">Toutes les présences ont été enregistrées pour cette période</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${toastType === 'success' ? 'bg-green-500' :
                toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
