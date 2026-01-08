import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, busAPI, trajetsAPI, tuteursAPI, inscriptionsAPI, notificationsAPI, demandesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
import {
  ClipboardList, Search, CheckCircle, XCircle, AlertCircle,
  Eye, User, Bus, MapPin, Filter, Calendar, ArrowLeft, FileText, Copy, Check, X
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { calculerMontantFacture, extraireInfosTransport } from '../utils/calculFacture';

export default function AdminInscriptions() {
  const navigate = useNavigate();
  const [eleves, setEleves] = useState([]);
  const [buses, setBuses] = useState([]);
  const [trajets, setTrajets] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [tuteurs, setTuteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showInscriptionModal, setShowInscriptionModal] = useState(false);
  const [availableBuses, setAvailableBuses] = useState([]);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [inscriptionForm, setInscriptionForm] = useState({
    date_debut: format(new Date(), 'yyyy-MM-dd'),
    date_fin: '2026-02-01' // Par défaut pour mensuel, sera recalculé selon l'abonnement
  });
  const [copiedCode, setCopiedCode] = useState(null);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refusalMotif, setRefusalMotif] = useState('');

  useEffect(() => {
    // Charger les données de l'admin depuis la session
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      try {
        const adminData = JSON.parse(adminSession);
        setAdminUser(adminData);
      } catch (err) {
        console.warn('Erreur parsing admin session:', err);
      }
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Charger toutes les données en parallèle, mais gérer les erreurs individuellement
      const results = await Promise.allSettled([
        elevesAPI.getAll(),
        busAPI.getAll(),
        trajetsAPI.getAll(),
        inscriptionsAPI.getAll(),
        tuteursAPI.getAll(),
        demandesAPI.getAll()
      ]);

      // Extraire les données avec gestion de différents formats de réponse
      const elevesArray = results[0].status === 'fulfilled'
        ? (Array.isArray(results[0].value?.data) ? results[0].value.data : (Array.isArray(results[0].value) ? results[0].value : []))
        : [];
      const busesArray = results[1].status === 'fulfilled'
        ? (Array.isArray(results[1].value?.data) ? results[1].value.data : (Array.isArray(results[1].value) ? results[1].value : []))
        : [];
      const trajetsArray = results[2].status === 'fulfilled'
        ? (Array.isArray(results[2].value?.data) ? results[2].value.data : (Array.isArray(results[2].value) ? results[2].value : []))
        : [];
      const inscriptionsArray = results[3].status === 'fulfilled'
        ? (Array.isArray(results[3].value?.data) ? results[3].value.data : (Array.isArray(results[3].value) ? results[3].value : []))
        : [];
      const tuteursArray = results[4].status === 'fulfilled'
        ? (Array.isArray(results[4].value?.data) ? results[4].value.data : (Array.isArray(results[4].value) ? results[4].value : []))
        : [];
      const demandesArray = results[5].status === 'fulfilled'
        ? (Array.isArray(results[5].value?.data) ? results[5].value.data : (Array.isArray(results[5].value) ? results[5].value : []))
        : [];

      // Filtrer uniquement les demandes d'inscription
      const demandesInscription = Array.isArray(demandesArray) ? demandesArray.filter(d => d.type_demande === 'inscription') : [];

      // Enrichir les élèves avec les infos du tuteur, de l'inscription et de la demande
      // Afficher TOUS les élèves qui ont une demande d'inscription, même s'ils n'ont pas encore d'inscription créée
      const elevesWithDetails = Array.isArray(elevesArray) ? elevesArray
        .filter(e => {
          // Filtrer uniquement les élèves qui ont une demande d'inscription
          return demandesInscription.some(d => d.eleve_id === e.id);
        })
        .map(e => {
          const tuteur = Array.isArray(tuteursArray) ? tuteursArray.find(t => t.id === e.tuteur_id) : null;
          const inscription = Array.isArray(inscriptionsArray) ? inscriptionsArray.find(i => i.eleve_id === e.id && i.statut !== 'Terminée') : null;
          const bus = inscription?.bus_id && Array.isArray(busesArray) ? busesArray.find(b => b.id === inscription.bus_id) : null;
          // Trouver la demande d'inscription pour cet élève (la plus récente)
          const demandeInscription = Array.isArray(demandesInscription) ? demandesInscription
            .filter(d => d.eleve_id === e.id)
            .sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0))[0] : null;

          return {
            ...e,
            tuteur,
            inscription,
            bus,
            demande_inscription: demandeInscription,
            // Utiliser le statut de la demande d'inscription au lieu de Actif/Inactif
            statut_demande: demandeInscription?.statut || 'En attente'
          };
        }) : [];

      setEleves(elevesWithDetails);
      setBuses(busesArray);
      setTrajets(trajetsArray);
      setInscriptions(inscriptionsArray);
      setTuteurs(tuteursArray);

      // Afficher un avertissement si certaines données n'ont pas pu être chargées
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        console.warn(`${failedCount} appel(s) API ont échoué`);
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données: ' + (err.message || 'Erreur de connexion au serveur'));
    } finally {
      setLoading(false);
    }
  };

  const calculateDates = (abonnement) => {
    const today = new Date();
    const dateDebut = format(today, 'yyyy-MM-dd');

    let dateFin;
    if (abonnement === 'Annuel') {
      // Pour abonnement annuel : date de fin fixée au 30/06/2026
      dateFin = '2026-06-30';
    } else {
      // Pour abonnement mensuel : date de fin = date de début + 1 mois
      const dateFinObj = new Date(today);
      dateFinObj.setMonth(dateFinObj.getMonth() + 1);
      dateFin = format(dateFinObj, 'yyyy-MM-dd');
    }

    return { dateDebut, dateFin };
  };

  const handleOpenModal = async (eleve) => {
    setSelectedEleve(eleve);
    setError(null);
    setAvailableBuses([]); // Réinitialiser avant chargement
    setDebugInfo(null);

    // Déterminer le type d'abonnement
    let abonnement = 'Mensuel';
    if (eleve.demande_inscription?.description) {
      try {
        const descriptionData = typeof eleve.demande_inscription.description === 'string'
          ? JSON.parse(eleve.demande_inscription.description)
          : eleve.demande_inscription.description;
        abonnement = descriptionData.abonnement || 'Mensuel';
      } catch (err) {
        console.warn('Erreur parsing description:', err);
      }
    }

    // Calculer les dates
    const { dateDebut, dateFin } = calculateDates(abonnement);
    setInscriptionForm({
      date_debut: dateDebut,
      date_fin: dateFin
    });

    // Charger les bus disponibles
    try {
      const zone = eleve.demande_inscription?.zone_geographique || eleve.zone;
      if (zone) {
        const busesResponse = await busAPI.getByZone(zone);
        if (busesResponse.debug) setDebugInfo(busesResponse.debug);

        if (busesResponse.success && busesResponse.data && busesResponse.data.length > 0) {
          const busesWithCapacity = busesResponse.data.map(bus => ({
            ...bus,
            trajet: trajets.find(t => t.id === bus.trajet_id),
            placesRestantes: bus.places_restantes || 0,
            elevesInscrits: bus.eleves_inscrits || 0
          }));
          setAvailableBuses(busesWithCapacity);
        } else {
          setError(busesResponse.message || `Aucun bus disponible pour la zone "${zone}"`);
        }
      }
    } catch (err) {
      console.error('Erreur chargement bus:', err);
      setError('Erreur lors du chargement des bus disponibles');
    }

    setShowInscriptionModal(true);
  };

  const handleValidate = (eleve) => {
    handleOpenModal(eleve);
  };

  const handleCreateInscription = async () => {
    if (!selectedEleve || !selectedEleve.demande_inscription?.id) {
      setError('Élève ou demande d\'inscription manquant.');
      return;
    }

    if (!adminUser?.type_id) {
      setError('Session administrateur invalide. Veuillez vous reconnecter.');
      return;
    }

    // Les dates sont calculées automatiquement, pas besoin de vérification supplémentaire
    setError(null);

    try {
      // Mettre à jour le statut de la demande en "En attente de paiement" via l'API traiter
      // Cela génère automatiquement le code de vérification et le montant de la facture
      const traiterResponse = await demandesAPI.traiter(
        selectedEleve.demande_inscription.id,
        'En attente de paiement',
        'Inscription validée par l\'administrateur',
        null,
        adminUser.type_id
      );

      if (!traiterResponse || !traiterResponse.success) {
        throw new Error(traiterResponse?.message || 'Erreur lors du traitement de la demande');
      }

      // Ne PAS créer l'inscription maintenant
      // L'inscription sera créée par l'administrateur APRÈS le paiement du tuteur et l'affectation du bus

      // Tout s'est bien passé, fermer le modal et recharger les données
      setShowInscriptionModal(false);
      setSelectedEleve(null);

      // Réinitialiser le formulaire avec des valeurs par défaut
      const today = new Date();
      const defaultDateFin = new Date(today);
      defaultDateFin.setMonth(defaultDateFin.getMonth() + 1);
      setInscriptionForm({
        date_debut: format(today, 'yyyy-MM-dd'),
        date_fin: format(defaultDateFin, 'yyyy-MM-dd')
      });

      await loadData();
    } catch (err) {
      console.error('Erreur lors de la validation:', err);
      setError('Erreur lors de la validation de l\'inscription: ' + (err.message || 'Erreur inconnue'));
    }
  };

  const handleRefuse = async (eleve, motif) => {
    if (!motif) return;

    if (!adminUser?.type_id) {
      setError('Session administrateur invalide. Veuillez vous reconnecter.');
      return;
    }

    setError(null);

    try {
      // Mettre à jour le statut de la demande en "Refusée" via l'API traiter
      if (eleve.demande_inscription?.id) {
        await demandesAPI.traiter(
          eleve.demande_inscription.id,
          'Refusée',
          `Inscription refusée: ${motif}`,
          motif,
          adminUser.type_id
        );
      }

      // Si une inscription existe, la marquer comme terminée
      if (eleve.inscription) {
        await inscriptionsAPI.update(eleve.inscription.id, {
          statut: 'Terminée'
        });
      }

      await loadData();
    } catch (err) {
      console.error('Erreur lors du refus:', err);
      setError('Erreur lors du refus de l\'inscription: ' + err.message);
    }
  };

  const handleVerifyZone = async (eleve) => {
    setSelectedEleve(eleve);
    setError(null);

    try {
      let busesWithCapacity = [];

      // Récupérer la zone géographique de l'élève depuis la demande d'inscription
      const zone = eleve.demande_inscription?.zone_geographique || eleve.zone;

      if (!zone) {
        setError('Aucune zone géographique définie pour cet élève');
        return;
      }

      // Charger uniquement les bus qui concernent la zone de l'élève
      try {
        const busesResponse = await busAPI.getByZone(zone);
        if (busesResponse.success && busesResponse.data && busesResponse.data.length > 0) {
          busesWithCapacity = busesResponse.data.map(bus => {
            const trajet = trajets.find(t => t.id === bus.trajet_id);
            return {
              ...bus,
              trajet,
              placesRestantes: bus.places_restantes || 0,
              elevesInscrits: bus.eleves_inscrits || 0
            };
          });
        }
      } catch (err) {
        console.error('Erreur lors du chargement des bus par zone:', err);
        setError('Erreur lors du chargement des bus disponibles pour cette zone');
        return;
      }

      if (busesWithCapacity.length === 0) {
        setError(`Aucun bus disponible pour la zone "${zone}"`);
        return;
      }

      setAvailableBuses(busesWithCapacity);
      setShowVerifyModal(true);
    } catch (err) {
      console.error('Erreur lors de la préparation de l\'affectation:', err);
      setError('Erreur lors du chargement des bus disponibles');
    }
  };

  const handleAffectBus = async (busId) => {
    if (!selectedEleve) return;

    setError(null);

    try {
      const bus = buses.find(b => b.id === busId);
      if (!bus) {
        setError('Bus non trouvé');
        return;
      }

      // Calculer le montant mensuel depuis la demande
      let montantMensuel = 500; // valeur par défaut
      if (selectedEleve.demande_inscription?.description) {
        const infosTransport = extraireInfosTransport(selectedEleve.demande_inscription.description);
        const montantFacture = calculerMontantFacture(infosTransport.type_transport, infosTransport.abonnement);
        montantMensuel = infosTransport.abonnement === 'Annuel' ? montantFacture / 10 : montantFacture;
      }

      // Calculer les dates selon le type d'abonnement
      let abonnement = 'Mensuel';
      if (selectedEleve.demande_inscription?.description) {
        const infosTransport = extraireInfosTransport(selectedEleve.demande_inscription.description);
        abonnement = infosTransport.abonnement || 'Mensuel';
      }
      const { dateDebut, dateFin } = calculateDates(abonnement);

      // Vérifier si une inscription existe déjà pour cet élève (créée lors du paiement)
      const existingInscription = inscriptions.find(i =>
        i.eleve_id === selectedEleve.id &&
        (i.statut === 'Active' || i.statut === 'active')
      );

      if (existingInscription) {
        // Mettre à jour l'inscription existante avec le bus
        const updateData = {
          bus_id: busId,
          date_debut: dateDebut,
          date_fin: dateFin,
          montant_mensuel: montantMensuel,
          statut: 'Active'
        };

        const updateResponse = await inscriptionsAPI.update(existingInscription.id, updateData);
        if (!updateResponse || !updateResponse.success) {
          throw new Error(updateResponse?.message || 'Erreur lors de la mise à jour de l\'inscription');
        }
      } else {
        // Créer une nouvelle inscription avec le bus affecté
        const inscriptionData = {
          eleve_id: selectedEleve.id,
          bus_id: busId,
          date_debut: dateDebut,
          date_fin: dateFin,
          montant_mensuel: montantMensuel,
          statut: 'Active'
        };

        const createResponse = await inscriptionsAPI.create(inscriptionData);
        if (!createResponse || !createResponse.success) {
          throw new Error(createResponse?.message || 'Erreur lors de la création de l\'inscription');
        }
      }

      // Mettre à jour le statut de la demande en "Inscrit" après l'affectation du bus
      if (selectedEleve.demande_inscription?.id) {
        try {
          await demandesAPI.traiter(
            selectedEleve.demande_inscription.id,
            'Inscrit',
            'Élève affecté à un bus',
            null,
            adminUser?.type_id
          );
        } catch (err) {
          console.warn('Erreur lors de la mise à jour du statut de la demande:', err);
          // On continue même si la mise à jour du statut échoue
        }
      }

      // Activer l'élève (mettre le statut à "Actif")
      try {
        await elevesAPI.update(selectedEleve.id, {
          statut: 'Actif'
        });
      } catch (err) {
        console.warn('Erreur lors de l\'activation de l\'élève:', err);
      }

      // Notifier le tuteur
      if (selectedEleve.tuteur_id) {
        try {
          await notificationsAPI.create({
            destinataire_id: selectedEleve.tuteur_id,
            destinataire_type: 'tuteur',
            titre: 'Affectation au bus',
            message: `${selectedEleve.prenom} ${selectedEleve.nom} a été affecté(e) au bus ${bus.numero}.`,
            type: 'info',
            date: new Date().toISOString()
          });
        } catch (notifError) {
          console.warn('Erreur lors de l\'envoi de la notification:', notifError);
          // On continue même si la notification échoue
        }
      }

      setShowVerifyModal(false);
      setSelectedEleve(null);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'affectation:', err);
      setError('Erreur lors de l\'affectation au bus: ' + (err.message || 'Erreur inconnue'));
    }
  };

  const filteredEleves = eleves.filter(e => {
    const matchSearch =
      e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.adresse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.classe?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrer par statut de la demande d'inscription
    const matchStatus = statusFilter === 'all' || e.statut_demande === statusFilter;

    return matchSearch && matchStatus;
  });

  const getStatusBadge = (statut) => {
    const styles = {
      'En attente': 'bg-yellow-100 text-yellow-700',
      'En cours de traitement': 'bg-blue-100 text-blue-700',
      'En attente de paiement': 'bg-orange-100 text-orange-700',
      'Payée': 'bg-amber-100 text-amber-700',
      'Validée': 'bg-green-100 text-green-700',
      'Inscrit': 'bg-emerald-100 text-emerald-700',
      'Refusée': 'bg-red-100 text-red-700',
      'Active': 'bg-emerald-100 text-emerald-700',
      'Suspendue': 'bg-orange-100 text-orange-700',
      'Terminée': 'bg-gray-100 text-gray-700'
    };
    return styles[statut] || 'bg-gray-100 text-gray-700';
  };

  const handleCopyCode = async (code, eleveId) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(eleveId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestion des Inscriptions">
      <div className="mb-4">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6"
      >
        <div className="p-6 bg-gradient-to-r from-blue-500 to-cyan-500">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="w-7 h-7" />
            Gestion des Inscriptions des Élèves
          </h1>
          <p className="text-blue-100 mt-1">Inscriptions envoyées par les tuteurs • {eleves.length} élève(s) • {inscriptions.filter(i => i.statut === 'Active').length} inscription(s) active(s)</p>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, prénom, adresse ou classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 h-12 rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="En cours de traitement">En cours de traitement</SelectItem>
                <SelectItem value="En attente de paiement">En attente de paiement</SelectItem>
                <SelectItem value="Payée">Payée</SelectItem>
                <SelectItem value="Validée">Validée</SelectItem>
                <SelectItem value="Inscrit">Inscrit</SelectItem>
                <SelectItem value="Refusée">Refusée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100">
          {filteredEleves.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune inscription trouvée</p>
            </div>
          ) : (
            filteredEleves.map((eleve) => (
              <div key={eleve.id} className="p-6 hover:bg-amber-50/50 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {eleve.nom} {eleve.prenom}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                        <span>{eleve.classe}</span>
                        {eleve.date_naissance && (
                          <>
                            <span>•</span>
                            <span>{format(new Date(eleve.date_naissance), 'dd/MM/yyyy')}</span>
                          </>
                        )}
                        {eleve.adresse && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {eleve.adresse}
                            </span>
                          </>
                        )}
                      </div>
                      {eleve.tuteur && (
                        <p className="text-sm text-gray-400 mt-1">
                          Tuteur: {eleve.tuteur.prenom} {eleve.tuteur.nom} • {eleve.tuteur.telephone || eleve.tuteur.email}
                        </p>
                      )}
                      {eleve.bus && (
                        <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                          <Bus className="w-3 h-3" />
                          Bus: {eleve.bus.numero}
                        </p>
                      )}
                      {eleve.inscription && (
                        <p className="text-xs text-gray-400 mt-1">
                          Inscription du {format(new Date(eleve.inscription.date_inscription), 'dd/MM/yyyy')} •
                          {eleve.inscription.montant_mensuel} DH/mois
                        </p>
                      )}
                      {/* Afficher les détails de réduction si disponible */}
                      {eleve.demande_inscription?.montant_facture && (() => {
                        try {
                          const desc = typeof eleve.demande_inscription.description === 'string'
                            ? JSON.parse(eleve.demande_inscription.description)
                            : eleve.demande_inscription.description || {};
                          const tauxReduction = desc.taux_reduction || 0;
                          const montantAvantReduction = desc.montant_avant_reduction;
                          const montantReduction = desc.montant_reduction || 0;

                          const rangEleve = desc.rang_eleve;
                          const rangTexte = desc.rang_eleve_texte || (rangEleve ? `${rangEleve}ème élève` : '');

                          if (tauxReduction > 0 && montantAvantReduction) {
                            return (
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                                    {rangTexte || 'Réduction familiale'}
                                  </span>
                                  <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                                    Réduction {Math.round(tauxReduction * 100)}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-gray-500 line-through">
                                    {parseFloat(montantAvantReduction).toFixed(2)} DH
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="font-bold text-amber-600">
                                    {parseFloat(eleve.demande_inscription.montant_facture).toFixed(2)} DH
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    (Économie: {parseFloat(desc.montant_reduction || 0).toFixed(2)} DH)
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        } catch (err) {
                          return null;
                        }
                      })()}
                      {/* Afficher le code de vérification pour les élèves validés */}
                      {eleve.demande_inscription?.code_verification &&
                        (eleve.statut_demande === 'En attente de paiement' ||
                          eleve.statut_demande === 'Payée' ||
                          eleve.statut_demande === 'Validée' ||
                          eleve.statut_demande === 'Inscrit') && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">Code de vérification:</span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
                              <span className="font-mono font-bold text-sm">{eleve.demande_inscription.code_verification}</span>
                              <button
                                onClick={() => handleCopyCode(eleve.demande_inscription.code_verification, eleve.id)}
                                className="p-1 hover:bg-amber-200 rounded transition-colors"
                                title="Copier le code"
                              >
                                {copiedCode === eleve.id ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-amber-700" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusBadge(eleve.statut_demande || 'En attente')}`}>
                      {eleve.statut_demande || 'En attente'}
                    </span>

                    {/* Bouton Détails - toujours visible */}
                    <Button
                      variant="outline"
                      onClick={() => handleOpenModal(eleve)}
                      className="rounded-xl"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Détails
                    </Button>

                    {(eleve.statut_demande === 'En attente' || eleve.statut_demande === 'En cours de traitement') && !eleve.inscription && (
                      <>
                        <Button
                          onClick={() => handleValidate(eleve)}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Valider
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedEleve(eleve);
                            setRefusalMotif('');
                            setShowRefuseModal(true);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Refuser
                        </Button>
                      </>
                    )}

                    {eleve.statut_demande === 'Payée' && !eleve.inscription?.bus_id && (
                      <Button
                        onClick={() => handleVerifyZone(eleve)}
                        className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                      >
                        <Bus className="w-4 h-4 mr-2" />
                        Affecter un bus
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {showInscriptionModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Détails de l'Inscription
                </h2>
                <p className="text-blue-100 mt-1">
                  Demande #{selectedEleve.demande_inscription?.id} • {selectedEleve.prenom} {selectedEleve.nom}
                </p>
              </div>
              <button
                onClick={() => setShowInscriptionModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Infos Tuteur avec Photo */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Informations du Tuteur
                </h3>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Photo si disponible */}
                  {selectedEleve.tuteur?.photo_identite && (
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-md bg-gray-200">
                        <img
                          src={`http://localhost${selectedEleve.tuteur.photo_identite}`}
                          alt={`Photo de ${selectedEleve.tuteur.prenom}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://ui-avatars.com/api/?name=' + selectedEleve.tuteur.prenom + '+' + selectedEleve.tuteur.nom + '&background=random';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 flex-grow">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Nom complet</span>
                      <p className="font-medium text-gray-900">{selectedEleve.tuteur?.nom} {selectedEleve.tuteur?.prenom}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Téléphone</span>
                      <p className="font-medium text-gray-900">{selectedEleve.tuteur?.telephone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Email</span>
                      <p className="font-medium text-gray-900 break-words">{selectedEleve.tuteur?.email}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Adresse</span>
                      <p className="font-medium text-gray-900">{selectedEleve.tuteur?.adresse || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations de l'élève */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Informations de l'élève
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nom</label>
                    <p className="text-gray-800">{selectedEleve.nom}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Prénom</label>
                    <p className="text-gray-800">{selectedEleve.prenom}</p>
                  </div>
                  {selectedEleve.date_naissance && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Date de naissance</label>
                      <p className="text-gray-800">{format(new Date(selectedEleve.date_naissance), 'dd/MM/yyyy', { locale: fr })}</p>
                    </div>
                  )}
                  {selectedEleve.classe && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Classe</label>
                      <p className="text-gray-800">{selectedEleve.classe}</p>
                    </div>
                  )}
                  {selectedEleve.adresse && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Adresse
                      </label>
                      <p className="text-gray-800">{selectedEleve.adresse}</p>
                    </div>
                  )}
                  {selectedEleve.demande_inscription?.zone_geographique && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Zone géographique</label>
                      <p className="text-gray-800">{selectedEleve.demande_inscription.zone_geographique}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations du tuteur */}
              {selectedEleve.tuteur && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-500" />
                    Informations du tuteur
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Nom</label>
                      <p className="text-gray-800">{selectedEleve.tuteur.nom}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Prénom</label>
                      <p className="text-gray-800">{selectedEleve.tuteur.prenom}</p>
                    </div>
                    {selectedEleve.tuteur.telephone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Téléphone</label>
                        <p className="text-gray-800">{selectedEleve.tuteur.telephone}</p>
                      </div>
                    )}
                    {selectedEleve.tuteur.email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                        <p className="text-gray-800">{selectedEleve.tuteur.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informations de la demande */}
              {selectedEleve.demande_inscription && (() => {
                let descriptionData = {};
                try {
                  descriptionData = typeof selectedEleve.demande_inscription.description === 'string'
                    ? JSON.parse(selectedEleve.demande_inscription.description)
                    : selectedEleve.demande_inscription.description || {};
                } catch (err) {
                  console.warn('Erreur parsing description:', err);
                }
                return (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-500" />
                      Informations de l'inscription
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {descriptionData.type_transport && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Type de transport</label>
                          <p className="text-gray-800">{descriptionData.type_transport}</p>
                        </div>
                      )}
                      {descriptionData.abonnement && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Type d'abonnement</label>
                          <p className="text-gray-800 font-semibold">{descriptionData.abonnement}</p>
                        </div>
                      )}
                      {descriptionData.groupe && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Groupe horaire</label>
                          <p className="text-gray-800">{descriptionData.groupe}</p>
                        </div>
                      )}
                      {descriptionData.niveau && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Niveau</label>
                          <p className="text-gray-800">{descriptionData.niveau}</p>
                        </div>
                      )}
                      {descriptionData.lien_parente && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Lien de parenté</label>
                          <p className="text-gray-800">{descriptionData.lien_parente}</p>
                        </div>
                      )}
                      {selectedEleve.demande_inscription.date_creation && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Date de la demande</label>
                          <p className="text-gray-800">{format(new Date(selectedEleve.demande_inscription.date_creation), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                        </div>
                      )}
                      {/* Afficher le code de vérification si disponible */}
                      {selectedEleve.demande_inscription.code_verification &&
                        (selectedEleve.statut_demande === 'En attente de paiement' ||
                          selectedEleve.statut_demande === 'Payée' ||
                          selectedEleve.statut_demande === 'Validée' ||
                          selectedEleve.statut_demande === 'Inscrit') && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Code de vérification du paiement</label>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 px-4 py-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                                <p className="text-xs text-gray-600 mb-1">Code à donner au tuteur pour valider le paiement:</p>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xl text-amber-800">{selectedEleve.demande_inscription.code_verification}</span>
                                  <button
                                    onClick={() => handleCopyCode(selectedEleve.demande_inscription.code_verification, selectedEleve.id)}
                                    className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                                    title="Copier le code"
                                  >
                                    {copiedCode === selectedEleve.id ? (
                                      <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Copy className="w-5 h-5 text-amber-700" />
                                    )}
                                  </button>
                                </div>
                                {copiedCode === selectedEleve.id && (
                                  <p className="text-xs text-green-600 mt-1">✓ Code copié dans le presse-papiers</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      {/* Afficher le montant de la facture avec détails de réduction si disponible */}
                      {selectedEleve.demande_inscription.montant_facture && (() => {
                        try {
                          const desc = typeof selectedEleve.demande_inscription.description === 'string'
                            ? JSON.parse(selectedEleve.demande_inscription.description)
                            : selectedEleve.demande_inscription.description || {};
                          const montantAvantReduction = desc.montant_avant_reduction;
                          const tauxReduction = desc.taux_reduction || 0;
                          const montantReduction = desc.montant_reduction || 0;
                          const montantFacture = parseFloat(selectedEleve.demande_inscription.montant_facture);

                          if (tauxReduction > 0 && montantAvantReduction) {
                            return (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-600 mb-2">Détails de la facture</label>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Prix initial:</span>
                                    <span className="text-sm text-gray-400 line-through">
                                      {parseFloat(montantAvantReduction).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-green-600">Réduction ({Math.round(tauxReduction * 100)}%):</span>
                                    <span className="text-sm font-medium text-green-600">
                                      -{parseFloat(montantReduction).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                                    </span>
                                  </div>
                                  <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                                    <span className="text-base font-semibold text-gray-800">Prix final à payer:</span>
                                    <span className="text-xl font-bold text-amber-600">
                                      {montantFacture.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">Montant de la facture</label>
                              <p className="text-gray-800 font-semibold text-lg">
                                {montantFacture.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                              </p>
                            </div>
                          );
                        } catch (err) {
                          return (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">Montant de la facture</label>
                              <p className="text-gray-800 font-semibold text-lg">
                                {parseFloat(selectedEleve.demande_inscription.montant_facture).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                );
              })()}

              {/* Bus disponibles pour la zone de l'élève */}
              {(selectedEleve.statut_demande === 'En attente' || selectedEleve.statut_demande === 'En cours de traitement') && !selectedEleve.inscription && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-blue-500" />
                    Bus disponibles pour cette zone
                  </h3>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  {availableBuses.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          ⚠️ Aucun bus disponible
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDebug(!showDebug)}
                          className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 h-8"
                        >
                          {showDebug ? 'Masquer' : 'Diagnostic'}
                        </Button>
                      </div>

                      {showDebug && debugInfo && (
                        <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="p-2 bg-white rounded border border-amber-100">
                              <span className="text-gray-400">Vérifiés:</span>
                              <p className="font-bold text-amber-700">{debugInfo.total_bus_actifs || 0}</p>
                            </div>
                            <div className="p-2 bg-white rounded border border-amber-100">
                              <span className="text-gray-400">Non match:</span>
                              <p className="font-bold text-amber-700">{debugInfo.bus_zones_non_match || 0}</p>
                            </div>
                          </div>

                          <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {debugInfo.exemples_trajets_zones && debugInfo.exemples_trajets_zones.length > 0 ? (
                              debugInfo.exemples_trajets_zones.map((ex, i) => (
                                <div key={i} className={`p-1.5 rounded border text-[10px] ${ex.zone_match ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                                  <div className="flex justify-between font-bold">
                                    <span>{ex.bus_numero}</span>
                                    {ex.zone_match ? <span className="text-green-600">Match!</span> : <span className="text-gray-300">No match</span>}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {ex.zones && ex.zones.map((z, j) => (
                                      <span key={j} className={`px-1 rounded ${ex.matched_zone === z ? 'bg-green-200 text-green-800' : 'bg-gray-100'}`}>
                                        {z}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6">
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">
                          Zone de l'élève: <span className="font-bold">{selectedEleve.demande_inscription?.zone_geographique || selectedEleve.zone || 'Non spécifiée'}</span>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {availableBuses.length} bus disponible(s) pour cette zone (données réelles de la base de données)
                        </p>
                      </div>
                      {availableBuses.map((bus) => {
                        // Extraire les zones du trajet pour affichage
                        let trajetZones = [];
                        if (bus.trajet_zones) {
                          try {
                            const decoded = JSON.parse(bus.trajet_zones);
                            trajetZones = Array.isArray(decoded) ? decoded : [bus.trajet_zones];
                          } catch {
                            trajetZones = typeof bus.trajet_zones === 'string' ? bus.trajet_zones.split(',').map(z => z.trim()) : [];
                          }
                        }

                        return (
                          <div
                            key={bus.id}
                            className="p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-colors bg-white"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-bold text-gray-800 text-lg">{bus.numero}</h4>
                                  {bus.statut === 'Actif' && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                                      Actif
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Marque/Modèle:</span> {bus.marque || 'N/A'} {bus.modele || ''}
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Plaque:</span> {bus.plaque || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Trajet:</span> {bus.trajet?.nom || bus.trajet_nom || 'Non assigné'}
                                </p>
                                {trajetZones.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    <span className="text-xs text-gray-500">Zones couvertes:</span>
                                    {trajetZones.map((zone, idx) => (
                                      <span
                                        key={idx}
                                        className={`text-xs px-2 py-1 rounded-lg ${zone.trim().toLowerCase() === (selectedEleve?.demande_inscription?.zone_geographique || selectedEleve?.zone || '').toLowerCase()
                                          ? 'bg-green-100 text-green-700 font-medium'
                                          : 'bg-gray-100 text-gray-600'
                                          }`}
                                      >
                                        {zone.trim()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-2 flex items-center gap-4 text-sm">
                                  <span className="text-gray-600">
                                    <span className="font-medium">Capacité:</span> {bus.capacite || 'N/A'} places
                                  </span>
                                  <span className="text-gray-600">
                                    <span className="font-medium">Élèves inscrits:</span> {bus.elevesInscrits || bus.eleves_inscrits || 0}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className={`text-3xl font-bold ${(bus.placesRestantes || bus.places_restantes || 0) > 5 ? 'text-green-600' :
                                  (bus.placesRestantes || bus.places_restantes || 0) > 0 ? 'text-orange-500' : 'text-red-500'
                                  }`}>
                                  {bus.placesRestantes || bus.places_restantes || 0}
                                </p>
                                <p className="text-xs text-gray-500">places restantes</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Formulaire de validation (seulement si pas encore validé) */}
              {(selectedEleve.statut_demande === 'En attente' || selectedEleve.statut_demande === 'En cours de traitement') && !selectedEleve.inscription && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Valider l'inscription
                  </h3>
                  {availableBuses.length === 0 && (
                    <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          ⚠️ Validation impossible : Aucun bus disponible
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDebug(!showDebug)}
                          className="text-orange-700 hover:text-orange-800 hover:bg-orange-100 h-8 font-bold"
                        >
                          {showDebug ? 'Masquer Diagnostic' : 'Diagnostic de recherche'}
                        </Button>
                      </div>

                      <p className="text-xs text-orange-700 mb-2">
                        Aucun bus actif avec des places disponibles n'a été trouvé pour la zone "{selectedEleve.demande_inscription?.zone_geographique || selectedEleve.zone || 'non spécifiée'}".
                      </p>

                      {showDebug && debugInfo && (
                        <div className="mt-4 pt-4 border-t border-orange-200 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
                            <div className="p-2 bg-white rounded border border-orange-100">
                              <span className="text-gray-500 uppercase font-bold">Total vérifiés:</span>
                              <p className="text-lg font-black text-orange-700">{debugInfo.total_bus_actifs || 0}</p>
                            </div>
                            <div className="p-2 bg-white rounded border border-orange-100">
                              <span className="text-gray-500 uppercase font-bold">Zones non match:</span>
                              <p className="text-lg font-black text-orange-700">{debugInfo.bus_zones_non_match || 0}</p>
                            </div>
                          </div>

                          <div className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
                            Analyse détaillée par bus :
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {debugInfo.exemples_trajets_zones && debugInfo.exemples_trajets_zones.length > 0 ? (
                              debugInfo.exemples_trajets_zones.map((ex, i) => (
                                <div key={i} className={`p-3 rounded-xl border text-xs ${ex.zone_match ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                  <div className="flex justify-between items-start mb-1">
                                    <span className={`font-bold ${ex.zone_match ? 'text-green-700' : 'text-gray-700'}`}>
                                      {ex.bus_numero}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ex.zone_match ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {ex.zone_match ? 'Zone Match ✅' : 'No Match ❌'}
                                    </span>
                                  </div>
                                  <p className="text-gray-500 mb-2">Route: <span className="text-gray-700 font-medium">{ex.trajet_nom || 'Non assigné'}</span></p>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {ex.zones && ex.zones.length > 0 ? ex.zones.map((z, j) => (
                                      <span key={j} className={`px-2 py-0.5 rounded-md text-[10px] ${ex.matched_zone === z ? 'bg-green-600 text-white font-bold' : 'bg-gray-100 text-gray-600'}`}>
                                        {z}
                                      </span>
                                    )) : <span className="italic text-gray-400">Aucune zone configurée</span>}
                                  </div>
                                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100">
                                    <span className="text-[10px] text-gray-400">Places: {ex.places_restantes}</span>
                                    {ex.zone_match && ex.places_restantes <= 0 && (
                                      <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded text-[10px]">BUS COMPLET</span>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-6 text-gray-400 italic text-xs">Aucun bus trouvé dans le système</p>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-3 italic text-center">
                            La recherche fusionne les zones proches et ignore les accents.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {availableBuses.length > 0 && (
                    <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ {availableBuses.length} bus disponible(s) pour cette zone. Vous pouvez valider l'inscription.
                      </p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date de début
                      </label>
                      <Input
                        type="date"
                        value={inscriptionForm.date_debut}
                        disabled
                        className="rounded-xl bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Date automatique (date courante)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date de fin
                      </label>
                      <Input
                        type="date"
                        value={inscriptionForm.date_fin}
                        disabled
                        className="rounded-xl bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {(() => {
                          let abonnement = 'Mensuel';
                          if (selectedEleve.demande_inscription?.description) {
                            try {
                              const desc = typeof selectedEleve.demande_inscription.description === 'string'
                                ? JSON.parse(selectedEleve.demande_inscription.description)
                                : selectedEleve.demande_inscription.description || {};
                              abonnement = desc.abonnement || 'Mensuel';
                            } catch (err) { }
                          }
                          return abonnement === 'Annuel'
                            ? 'Date automatique (30/06/2026 pour abonnement annuel)'
                            : 'Date automatique (date de début + 1 mois pour abonnement mensuel)';
                        })()}
                      </p>
                    </div>

                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInscriptionModal(false);
                  setSelectedEleve(null);
                }}
                className="rounded-xl"
              >
                Fermer
              </Button>
              {(selectedEleve.statut_demande === 'En attente' || selectedEleve.statut_demande === 'En cours de traitement') && !selectedEleve.inscription && (
                <Button
                  onClick={handleCreateInscription}
                  disabled={availableBuses.length === 0}
                  className={`rounded-xl ${availableBuses.length === 0
                    ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  title={availableBuses.length === 0 ? 'Aucun bus disponible pour cette zone. Impossible de valider l\'inscription.' : ''}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider l'inscription
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Affect Bus */}
      {showVerifyModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                Affectation de bus
              </h2>
              <div className="mt-2 space-y-1">
                <p className="text-gray-700">
                  <span className="font-medium">Nom:</span> {selectedEleve.nom}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Prénom:</span> {selectedEleve.prenom}
                </p>
                {selectedEleve.demande_inscription?.zone_geographique && (
                  <p className="text-gray-700">
                    <span className="font-medium">Zone:</span> {selectedEleve.demande_inscription.zone_geographique}
                  </p>
                )}
                {selectedEleve.adresse && (
                  <p className="text-gray-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Adresse:</span> {selectedEleve.adresse}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6">
              {availableBuses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-semibold text-gray-600">Aucun bus disponible</p>
                  <p className="text-sm mt-1">
                    Aucun bus avec des places disponibles n'est assigné à un trajet couvrant la zone "{selectedEleve?.demande_inscription?.zone_geographique || selectedEleve?.zone || 'inconnue'}"
                  </p>
                  <p className="text-xs mt-2 text-gray-500">
                    Vérifiez que des trajets couvrent cette zone et que des bus actifs y sont assignés
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 mb-4">
                    <p className="text-sm text-blue-800 font-medium">
                      Zone de l'élève: <span className="font-bold">{selectedEleve?.demande_inscription?.zone_geographique || selectedEleve?.zone || 'Non spécifiée'}</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Seuls les bus dont le trajet couvre cette zone sont affichés
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {availableBuses.length} bus disponible(s) pour cette zone:
                  </p>
                  {availableBuses.map((bus) => {
                    // Extraire les zones du trajet pour affichage
                    let trajetZones = [];
                    if (bus.trajet_zones) {
                      try {
                        const decoded = JSON.parse(bus.trajet_zones);
                        trajetZones = Array.isArray(decoded) ? decoded : [bus.trajet_zones];
                      } catch {
                        trajetZones = bus.trajet_zones.split(',').map(z => z.trim());
                      }
                    }

                    return (
                      <div
                        key={bus.id}
                        className="p-4 rounded-2xl border-2 border-gray-100 hover:border-amber-200 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-lg">{bus.numero}</h3>
                            <p className="text-sm text-gray-400">Trajet: {bus.trajet?.nom || bus.trajet_nom || 'Non assigné'}</p>
                            {trajetZones.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                <span className="text-xs text-gray-500">Zones couvertes:</span>
                                {trajetZones.map((zone, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-xs px-2 py-1 rounded-lg ${zone.trim().toLowerCase() === (selectedEleve?.demande_inscription?.zone_geographique || selectedEleve?.zone || '').toLowerCase()
                                      ? 'bg-green-100 text-green-700 font-medium'
                                      : 'bg-gray-100 text-gray-600'
                                      }`}
                                  >
                                    {zone.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Capacité: {bus.elevesInscrits || bus.eleves_inscrits || 0}/{bus.capacite}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${(bus.placesRestantes || bus.places_restantes || 0) > 5 ? 'text-green-500' : 'text-orange-500'
                              }`}>
                              {bus.placesRestantes || bus.places_restantes || 0}
                            </p>
                            <p className="text-xs text-gray-400">places restantes</p>
                            <Button
                              onClick={() => handleAffectBus(bus.id)}
                              className="mt-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                              size="sm"
                            >
                              Affecter
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedEleve(null);
                }}
                className="rounded-xl"
              >
                Fermer
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Refus */}
      {showRefuseModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                Refuser l'inscription
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedEleve.prenom} {selectedEleve.nom}
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif du refus *
              </label>
              <textarea
                value={refusalMotif}
                onChange={(e) => setRefusalMotif(e.target.value)}
                placeholder="Veuillez indiquer la raison du refus..."
                className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 resize-none"
                autoFocus
              />
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefuseModal(false);
                  setRefusalMotif('');
                  setSelectedEleve(null);
                }}
                className="rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (refusalMotif.trim()) {
                    handleRefuse(selectedEleve, refusalMotif);
                    setShowRefuseModal(false);
                    setRefusalMotif('');
                  }
                }}
                disabled={!refusalMotif.trim()}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Confirmer le refus
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}