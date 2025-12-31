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

export default function TuteurDemandes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState([]);
  const [tuteur, setTuteur] = useState(null);
  const [error, setError] = useState('');
  const [editingDemande, setEditingDemande] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    const tuteurData = JSON.parse(session);
    setTuteur(tuteurData);
    loadDemandes(tuteurData.id);
  }, [navigate]);

  const loadDemandes = async (tuteurId) => {
    try {
      setLoading(true);
      const response = await demandesAPI.getByTuteur(tuteurId);
      if (response.success) {
        setDemandes(response.data || []);
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

  const handleDelete = async (demandeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      return;
    }

    try {
      const response = await demandesAPI.delete(demandeId);
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
      } else {
        alert(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la suppression de la demande');
    }
  };

  const handleEdit = (demande) => {
    setEditingDemande(demande.id);
    setEditFormData({
      zone_geographique: demande.zone_geographique || '',
      description: demande.description || ''
    });
  };

  const handleSaveEdit = async (demandeId) => {
    try {
      const response = await demandesAPI.update(demandeId, editFormData);
      if (response.success) {
        setEditingDemande(null);
        await loadDemandes(tuteur.id);
        // Notification de succès
        await notificationsAPI.create({
          destinataire_id: tuteur.id,
          destinataire_type: 'tuteur',
          titre: 'Demande modifiée',
          message: 'Votre demande a été modifiée avec succès.',
          type: 'info'
        });
      } else {
        alert(response.message || 'Erreur lors de la modification');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la modification de la demande');
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'En attente':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'En cours de traitement':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'En attente de paiement':
        return <CreditCard className="w-5 h-5 text-orange-500" />;
      case 'Validée':
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
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'En cours de traitement':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'En attente de paiement':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'Validée':
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
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
              <FileText className="w-8 h-8 text-amber-500" />
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
            {['En attente', 'En cours de traitement', 'En attente de paiement', 'Validée', 'Refusée'].map(statut => {
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
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
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

                      {/* Actions pour les demandes en attente */}
                      {demande.statut === 'En attente' && (
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
                            onClick={() => handleDelete(demande.id)}
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
                          className="mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payer
                        </Button>
                      )}

                      {/* Lien vers le suivi si validée */}
                      {demande.statut === 'Validée' && demande.eleve_id && (
                        <Button
                          onClick={() => navigate(createPageUrl('TuteurEleveDetails'), { state: { eleveId: demande.eleve_id } })}
                          className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                        >
                          Voir le suivi de l'élève
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Formulaire d'édition */}
                  {editingDemande === demande.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3">Modifier la demande</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Zone géographique
                          </label>
                          <select
                            value={editFormData.zone_geographique}
                            onChange={(e) => setEditFormData({ ...editFormData, zone_geographique: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="">Sélectionnez une zone</option>
                            {['Médina', 'Hay Sinaâi', 'Hay El Fath', 'Souissi', 'Akkari', 'Manal'].map(zone => (
                              <option key={zone} value={zone}>{zone}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveEdit(demande.id)}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                          >
                            Enregistrer
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingDemande(null)}
                            className="flex-1"
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
    </div>
  );
}

