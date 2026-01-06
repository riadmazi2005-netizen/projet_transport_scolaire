import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { demandesAPI, notificationsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  FileText,
  Edit,
  Trash2,
  MapPin,
  Bus,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AlertDialog from '../components/ui/AlertDialog';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { elevesAPI } from '../services/apiService';

export default function TuteurDemandes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState([]);
  const [tuteur, setTuteur] = useState(null);
  const [error, setError] = useState('');
  const [editingDemande, setEditingDemande] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, demandeId: null });
  const [alertDialog, setAlertDialog] = useState({ show: false, message: '', type: 'info' });
  const [editFormData, setEditFormData] = useState({});

  // Classes selon le niveau
  const classesParNiveau = {
    'Primaire': ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP'],
    'Collège': ['1AC', '2AC', '3AC'],
    'Lycée': ['TC', '1BAC', '2BAC']
  };

  // Récupérer les classes disponibles selon le niveau sélectionné
  const classesDisponibles = editFormData.niveau ? (classesParNiveau[editFormData.niveau] || []) : [];

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
    loadDemandes(tuteurId);
  }, [navigate]);
  
  // Ouvrir automatiquement le formulaire d'édition si un demandeId est dans l'URL
  useEffect(() => {
    if (demandes.length > 0 && !editingDemande) {
      const urlParams = new URLSearchParams(window.location.search);
      const demandeIdParam = urlParams.get('demandeId');
      if (demandeIdParam) {
        const demande = demandes.find(d => d.id === parseInt(demandeIdParam));
        if (demande) {
          console.log('Ouverture automatique du formulaire d\'édition pour la demande:', demandeIdParam);
          handleEdit(demande);
          // Nettoyer l'URL pour éviter de rouvrir à chaque rechargement
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [demandes, editingDemande]);

  const loadDemandes = async (tuteurId) => {
    try {
      setLoading(true);
      // tuteurId est maintenant l'ID du tuteur dans la table tuteurs
      const response = await demandesAPI.getByTuteur(tuteurId);
      if (response.success) {
        // Filtrer uniquement les demandes d'inscription
        const demandesInscription = (response.data || []).filter(d => d.type_demande === 'inscription');
        setDemandes(demandesInscription);
      } else {
        setError('Erreur lors du chargement des demandes');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (demandeId) => {
    setDeleteConfirm({ show: true, demandeId });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.demandeId) return;

    try {
      const response = await demandesAPI.delete(deleteConfirm.demandeId);
      if (response.success) {
        // Recharger les demandes
        await loadDemandes(tuteur.id);
        // Notification de succès
        await notificationsAPI.create({
          destinataire_id: tuteur.id,
          destinataire_type: 'tuteur',
          titre: 'Demande supprimée',
          message: 'Votre demande a été supprimée avec succès.',
          type: 'info'
        });
        setDeleteConfirm({ show: false, demandeId: null });
      } else {
        setAlertDialog({ show: true, message: response.message || 'Erreur lors de la suppression', type: 'error' });
        setDeleteConfirm({ show: false, demandeId: null });
      }
    } catch (err) {
      console.error('Erreur:', err);
      setAlertDialog({ show: true, message: 'Erreur lors de la suppression de la demande', type: 'error' });
      setDeleteConfirm({ show: false, demandeId: null });
    }
  };

  const handleEdit = async (demande) => {
    setEditingDemande(demande.id);
    
    // Charger les informations complètes de l'élève
    let eleveData = {};
    if (demande.eleve_id) {
      try {
        const eleveResponse = await elevesAPI.getById(demande.eleve_id);
        if (eleveResponse?.success && eleveResponse.data) {
          eleveData = eleveResponse.data;
        } else if (eleveResponse?.data) {
          eleveData = eleveResponse.data;
        }
      } catch (err) {
        console.error('Erreur lors du chargement de l\'élève:', err);
      }
    }
    
    // Extraire les données de la description JSON
    let descriptionData = {};
    if (demande.description) {
      try {
        descriptionData = typeof demande.description === 'string' 
          ? JSON.parse(demande.description) 
          : demande.description;
      } catch (err) {
        console.error('Erreur parsing description:', err);
      }
    }
    
    // Initialiser le formulaire avec toutes les données
    setEditFormData({
      nom: demande.eleve_nom || eleveData.nom || '',
      prenom: demande.eleve_prenom || eleveData.prenom || '',
      date_naissance: demande.eleve_date_naissance || eleveData.date_naissance || '',
      sexe: descriptionData.sexe || eleveData.sexe || '',
      classe: demande.eleve_classe || eleveData.classe || '',
      niveau: descriptionData.niveau || '',
      adresse: eleveData.adresse || '',
      zone_geographique: demande.zone_geographique || descriptionData.zone || '',
      type_transport: descriptionData.type_transport || '',
      abonnement: descriptionData.abonnement || '',
      groupe: descriptionData.groupe || ''
    });
  };

  const handleSaveEdit = async (demandeId, buttonElement) => {
    // Faire perdre le focus au bouton après le clic
    if (buttonElement) {
      setTimeout(() => buttonElement.blur(), 0);
    }
    
    try {
      // Trouver la demande pour obtenir l'eleve_id
      const demande = demandes.find(d => d.id === demandeId);
      if (!demande || !demande.eleve_id) {
        setAlertDialog({ show: true, message: 'Erreur: Élève introuvable', type: 'error' });
        return;
      }
      
      // Mettre à jour les informations de l'élève
      await elevesAPI.update(demande.eleve_id, {
        nom: editFormData.nom,
        prenom: editFormData.prenom,
        date_naissance: editFormData.date_naissance || null,
        classe: editFormData.classe,
        adresse: editFormData.adresse
      });
      
      // Préparer la description JSON avec les nouvelles données
      const descriptionData = {
        type_transport: editFormData.type_transport,
        abonnement: editFormData.abonnement,
        groupe: editFormData.groupe,
        zone: editFormData.zone_geographique,
        niveau: editFormData.niveau,
        sexe: editFormData.sexe
      };
      
      // Mettre à jour la demande
      const response = await demandesAPI.update(demandeId, {
        zone_geographique: editFormData.zone_geographique,
        description: JSON.stringify(descriptionData)
      });
      
      if (response.success) {
        setEditingDemande(null);
        await loadDemandes(tuteur.type_id || tuteur.id);
        // Notification de succès
        await notificationsAPI.create({
          destinataire_id: tuteur.id,
          destinataire_type: 'tuteur',
          titre: 'Demande modifiée',
          message: 'Votre demande a été modifiée avec succès.',
          type: 'info'
        });
      } else {
        setAlertDialog({ show: true, message: response.message || 'Erreur lors de la modification', type: 'error' });
      }
    } catch (err) {
      console.error('Erreur:', err);
      setAlertDialog({ show: true, message: 'Erreur lors de la modification de la demande: ' + (err.message || 'Erreur inconnue'), type: 'error' });
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'En attente':
        return <Clock className="w-5 h-5 text-lime-500" />;
      case 'En cours de traitement':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'En attente de paiement':
        return <CreditCard className="w-5 h-5 text-orange-500" />;
      case 'Validée':
      case 'Inscrit':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Refusée':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'En attente':
        return 'bg-lime-50 border-lime-200 text-lime-800';
      case 'En cours de traitement':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'En attente de paiement':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'Validée':
      case 'Inscrit':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'Refusée':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-lime-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-lime-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(createPageUrl('TuteurDashboard'))}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au tableau de bord
            </button>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FileText className="w-8 h-8 text-lime-500" />
              Mes Demandes d'Inscription
            </h1>
            <p className="text-gray-600 mt-2">
              Suivez l'état de vos demandes d'inscription et gérez vos demandes en attente
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {['En attente', 'En cours de traitement', 'En attente de paiement', 'Inscrit', 'Refusée'].map(statut => {
              const count = demandes.filter(d => d.statut === statut).length;
              return (
                <Card key={statut} className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-800">{count}</div>
                  <div className="text-xs text-gray-600 mt-1">{statut}</div>
                </Card>
              );
            })}
          </div>

          {/* Demandes List */}
          {demandes.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune demande</h3>
              <p className="text-gray-500 mb-6">Vous n'avez pas encore de demandes d'inscription.</p>
              <Button
                onClick={() => navigate(createPageUrl('TuteurInscription'))}
                className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white"
              >
                Créer une nouvelle demande
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {demandes.map((demande) => (
                <Card key={demande.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        {getStatutIcon(demande.statut)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {demande.eleve_prenom} {demande.eleve_nom}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {demande.type_demande === 'inscription' ? 'Demande d\'inscription' : demande.type_demande}
                          </p>
                        </div>
                      </div>

                      {/* Statut Badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${getStatutColor(demande.statut)}`}>
                        {getStatutIcon(demande.statut)}
                        {demande.statut}
                      </div>

                      {/* Informations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {demande.zone_geographique && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">Zone: {demande.zone_geographique}</span>
                          </div>
                        )}
                        {demande.eleve_classe && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span className="text-sm">Classe: {demande.eleve_classe}</span>
                          </div>
                        )}
                        {demande.bus_numero && (
                          <div className="flex items-center gap-2 text-green-600">
                            <Bus className="w-4 h-4" />
                            <span className="text-sm font-medium">Bus: {demande.bus_numero}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Créée le: {formatDate(demande.date_creation)}</span>
                        </div>
                      </div>

                      {/* Description details */}
                      {demande.type_transport && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Transport:</span> {demande.type_transport} | 
                            <span className="font-medium ml-2">Abonnement:</span> {demande.abonnement} | 
                            <span className="font-medium ml-2">Groupe:</span> {demande.groupe}
                          </p>
                        </div>
                      )}

                      {/* Actions pour les demandes en attente ou en cours de traitement */}
                      {(demande.statut === 'En attente' || demande.statut === 'En cours de traitement') && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(demande)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.currentTarget.blur();
                              handleDeleteClick(demande.id);
                            }}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </Button>
                        </div>
                      )}

                      {/* Bouton Payer pour les demandes en attente de paiement */}
                      {demande.statut === 'En attente de paiement' && (
                        <Button
                          onClick={() => navigate(createPageUrl(`TuteurPaiement?demandeId=${demande.id}`))}
                          className="mt-4 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payer
                        </Button>
                      )}

                    </div>
                  </div>

                  {/* Formulaire d'édition */}
                  {editingDemande === demande.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-4">Modifier les informations</h4>
                      <div className="space-y-4">
                        {/* Nom et Prénom */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">
                              Nom
                            </Label>
                            <Input
                              value={editFormData.nom || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                              className="rounded-xl"
                              placeholder="Nom de l'élève"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">
                              Prénom
                            </Label>
                            <Input
                              value={editFormData.prenom || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, prenom: e.target.value })}
                              className="rounded-xl"
                              placeholder="Prénom de l'élève"
                            />
                          </div>
                        </div>

                        {/* Date de naissance et Sexe */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">
                              Date de naissance
                            </Label>
                            <Input
                              type="date"
                              value={editFormData.date_naissance || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, date_naissance: e.target.value })}
                              className="rounded-xl"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">
                              Sexe
                            </Label>
                            <Select 
                              value={editFormData.sexe || ''} 
                              onValueChange={(v) => setEditFormData({ ...editFormData, sexe: v })}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Masculin">Masculin</SelectItem>
                                <SelectItem value="Féminin">Féminin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Niveau et Classe */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">
                              Niveau
                            </Label>
                            <Select 
                              value={editFormData.niveau || ''} 
                              onValueChange={(v) => {
                                setEditFormData({ ...editFormData, niveau: v, classe: '' });
                              }}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Primaire">Primaire</SelectItem>
                                <SelectItem value="Collège">Collège</SelectItem>
                                <SelectItem value="Lycée">Lycée</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">
                              Classe
                            </Label>
                            <Select 
                              value={editFormData.classe || ''} 
                              onValueChange={(v) => setEditFormData({ ...editFormData, classe: v })}
                              disabled={!editFormData.niveau}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder={editFormData.niveau ? "Sélectionnez" : "Sélectionnez d'abord le niveau"} />
                              </SelectTrigger>
                              <SelectContent>
                                {classesDisponibles.length > 0 ? (
                                  classesDisponibles.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="" disabled>Aucune classe disponible</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Adresse */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1 block">
                            Adresse
                          </Label>
                          <Input
                            value={editFormData.adresse || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })}
                            className="rounded-xl"
                            placeholder="Adresse complète"
                          />
                        </div>

                        {/* Zone */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1 block">
                            Zone géographique
                          </Label>
                          <Select 
                            value={editFormData.zone_geographique || ''} 
                            onValueChange={(v) => setEditFormData({ ...editFormData, zone_geographique: v })}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Sélectionnez une zone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Medina">Medina</SelectItem>
                              <SelectItem value="Hay Sinaï">Hay Sinaï</SelectItem>
                              <SelectItem value="Hay El Fath">Hay El Fath</SelectItem>
                              <SelectItem value="Souissi">Souissi</SelectItem>
                              <SelectItem value="Akkari">Akkari</SelectItem>
                              <SelectItem value="Manal">Manal</SelectItem>
                              <SelectItem value="Agdal">Agdal</SelectItem>
                              <SelectItem value="Nahda-Takkadoum">Nahda-Takkadoum</SelectItem>
                              <SelectItem value="Temara">Temara</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Type de transport, Abonnement, Groupe */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">
                              Type de transport
                            </Label>
                            <Select 
                              value={editFormData.type_transport || ''} 
                              onValueChange={(v) => setEditFormData({ ...editFormData, type_transport: v })}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Aller">Aller uniquement</SelectItem>
                                <SelectItem value="Retour">Retour uniquement</SelectItem>
                                <SelectItem value="Aller-Retour">Aller-Retour</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">
                              Type d'abonnement
                            </Label>
                            <Select 
                              value={editFormData.abonnement || ''} 
                              onValueChange={(v) => setEditFormData({ ...editFormData, abonnement: v })}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mensuel">Mensuel</SelectItem>
                                <SelectItem value="Annuel">Annuel</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1 block">
                              Groupe horaire
                            </Label>
                            <Select 
                              value={editFormData.groupe || ''} 
                              onValueChange={(v) => setEditFormData({ ...editFormData, groupe: v })}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Groupe A</SelectItem>
                                <SelectItem value="B">Groupe B</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={(e) => handleSaveEdit(demande.id, e.currentTarget)}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl"
                          >
                            Enregistrer
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingDemande(null)}
                            className="flex-1 rounded-xl"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Supprimer la demande"
        message="Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, demandeId: null })}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Dialog d'alerte */}
      <AlertDialog
        isOpen={alertDialog.show}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ show: false, message: '', type: 'info' })}
      />
    </div>
  );
}

