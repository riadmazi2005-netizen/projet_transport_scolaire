import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { paiementsAPI, elevesAPI, tuteursAPI, inscriptionsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
import { 
  CreditCard, Search, Filter, CheckCircle, Calendar, User, ArrowLeft, Edit, Trash2, X
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminPaiements() {
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [tuteurs, setTuteurs] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    montant: '',
    mois: '',
    annee: '',
    date_paiement: '',
    mode_paiement: 'Espèces'
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [paiementsRes, elevesRes, tuteursRes, inscriptionsRes] = await Promise.all([
        paiementsAPI.getAll(),
        elevesAPI.getAll(),
        tuteursAPI.getAll(),
        inscriptionsAPI.getAll()
      ]);
      
      const paiementsData = paiementsRes?.data || paiementsRes || [];
      const elevesData = elevesRes?.data || elevesRes || [];
      const tuteursData = tuteursRes?.data || tuteursRes || [];
      const inscriptionsData = inscriptionsRes?.data || inscriptionsRes || [];
      
      // Seuls les paiements mensuels (modifiables/supprimables) sont affichés
      const paiementsMensuels = Array.isArray(paiementsData) ? paiementsData
        .filter(p => p.type_paiement === 'mensuel' || !p.type_paiement) // Exclure les paiements initiaux
        .map(p => {
          const inscription = Array.isArray(inscriptionsData) ? inscriptionsData.find(i => i.id === p.inscription_id) : null;
          const eleve = inscription && Array.isArray(elevesData) ? elevesData.find(e => e.id === inscription.eleve_id) : null;
          const tuteur = eleve && Array.isArray(tuteursData) ? tuteursData.find(t => t.id === eleve.tuteur_id) : null;
          
          return {
            ...p,
            montant: parseFloat(p.montant) || 0,
            eleve,
            tuteur,
            inscription,
            type_paiement: 'mensuel'
          };
        }) : [];
      
      // Trier par date de paiement (plus récent en premier)
      paiementsMensuels.sort((a, b) => {
        const dateA = new Date(a.date_paiement || 0);
        const dateB = new Date(b.date_paiement || 0);
        return dateB - dateA;
      });
      
      setPaiements(paiementsMensuels);
      setEleves(Array.isArray(elevesData) ? elevesData : []);
      setTuteurs(Array.isArray(tuteursData) ? tuteursData : []);
      setInscriptions(Array.isArray(inscriptionsData) ? inscriptionsData : []);
    } catch (err) {
      console.error('Erreur lors du chargement des paiements:', err);
      setError('Erreur lors du chargement des paiements. Veuillez réessayer.');
      setPaiements([]);
      setEleves([]);
      setTuteurs([]);
      setInscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPaiements = paiements.filter(p => {
    const matchSearch = searchTerm === '' ||
      p.eleve?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.eleve?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tuteur?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tuteur?.prenom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || p.statut === statusFilter;
    
    const matchDate = !dateFilter || p.date_paiement?.startsWith(dateFilter);
    
    return matchSearch && matchStatus && matchDate;
  });

  const totalMontant = filteredPaiements
    .filter(p => p.statut === 'Payé')
    .reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);

  const getStatusBadge = (statut) => {
    const styles = {
      'En attente': 'bg-yellow-100 text-yellow-700',
      'Payé': 'bg-green-100 text-green-700',
      'Échoué': 'bg-red-100 text-red-700'
    };
    return styles[statut] || 'bg-gray-100 text-gray-700';
  };

  const getModePaiementBadge = (mode) => {
    const styles = {
      'Espèces': 'bg-blue-100 text-blue-700',
      'Virement': 'bg-purple-100 text-purple-700',
      'Carte bancaire': 'bg-teal-100 text-teal-700',
      'Chèque': 'bg-orange-100 text-orange-700'
    };
    return styles[mode] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Si la date est invalide, retourner la string originale
      return format(date, 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return dateString; // En cas d'erreur, retourner la string originale
    }
  };

  const handleEdit = (paiement) => {
    setSelectedPaiement(paiement);
    setEditForm({
      montant: paiement.montant || '',
      mois: paiement.mois || '',
      annee: paiement.annee || '',
      date_paiement: paiement.date_paiement ? paiement.date_paiement.split('T')[0] : '',
      mode_paiement: paiement.mode_paiement || 'Espèces'
    });
    setShowEditModal(true);
  };

  const handleDelete = (paiement) => {
    setSelectedPaiement(paiement);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPaiement) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const response = await paiementsAPI.update(selectedPaiement.id, editForm);
      if (response.success) {
        setShowEditModal(false);
        setSelectedPaiement(null);
        await loadData();
      } else {
        setError(response.message || 'Erreur lors de la mise à jour du paiement');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError('Erreur lors de la mise à jour du paiement. Veuillez réessayer.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPaiement) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const response = await paiementsAPI.delete(selectedPaiement.id);
      if (response.success) {
        setShowDeleteModal(false);
        setSelectedPaiement(null);
        await loadData();
      } else {
        setError(response.message || 'Erreur lors de la suppression du paiement');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression du paiement. Veuillez réessayer.');
    } finally {
      setProcessing(false);
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
    <AdminLayout title="Gestion des Paiements">
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}
      
      {/* Summary Card */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl p-6 mb-6 text-white"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Total des paiements validés</h2>
              <p className="opacity-90">Période: {dateFilter || 'Tous'}</p>
            </div>
            <div className="text-4xl font-bold mt-4 md:mt-0">
              {totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <CreditCard className="w-6 h-6 text-teal-500" />
              Historique des Paiements
            </h2>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40 h-12 rounded-xl">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="Payé">Payés</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Échoué">Échoués</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full md:w-48 h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredPaiements.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun paiement trouvé</p>
              </div>
            ) : (
              filteredPaiements.map((paiement) => {
                return (
                  <div key={paiement.id} className="p-6 hover:bg-teal-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {paiement.eleve ? `${paiement.eleve.nom} ${paiement.eleve.prenom}` : 'Élève inconnu'}
                          </h3>
                          {paiement.tuteur && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Tuteur: {paiement.tuteur.prenom} {paiement.tuteur.nom}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2 text-sm">
                            <span className={`px-2 py-1 rounded-lg ${getModePaiementBadge(paiement.mode_paiement)}`}>
                              {paiement.mode_paiement}
                            </span>
                            {paiement.mois && paiement.annee && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">
                                {paiement.mois}/{paiement.annee}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                        <div className="text-right flex-1">
                          <p className="text-2xl font-bold text-gray-800">
                            {paiement.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                          </p>
                          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(paiement.statut)}`}>
                            {paiement.statut === 'Payé' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                            {paiement.statut}
                          </span>
                          <p className="text-xs text-gray-400 mt-2 flex items-center justify-end gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(paiement.date_paiement)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(paiement)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </Button>
                          <Button
                            onClick={() => handleDelete(paiement)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Modal de modification */}
        {showEditModal && selectedPaiement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Modifier le paiement</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPaiement(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Montant (DH)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.montant}
                    onChange={(e) => setEditForm({ ...editForm, montant: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mois</Label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={editForm.mois}
                      onChange={(e) => setEditForm({ ...editForm, mois: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Année</Label>
                    <Input
                      type="number"
                      min="2020"
                      max="2100"
                      value={editForm.annee}
                      onChange={(e) => setEditForm({ ...editForm, annee: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Date de paiement</Label>
                  <Input
                    type="date"
                    value={editForm.date_paiement}
                    onChange={(e) => setEditForm({ ...editForm, date_paiement: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Mode de paiement</Label>
                  <Select value={editForm.mode_paiement} onValueChange={(value) => setEditForm({ ...editForm, mode_paiement: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Espèces">Espèces</SelectItem>
                      <SelectItem value="Virement">Virement</SelectItem>
                      <SelectItem value="Carte bancaire">Carte bancaire</SelectItem>
                      <SelectItem value="Chèque">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPaiement(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
                  disabled={processing}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
                  disabled={processing}
                >
                  {processing ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && selectedPaiement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Confirmer la suppression</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPaiement(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={processing}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer ce paiement de {selectedPaiement.montant} DH ?
                Cette action est irréversible.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPaiement(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
                  disabled={processing}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  disabled={processing}
                >
                  {processing ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
    </AdminLayout>
  );
}