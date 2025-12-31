import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { demandesAPI, chauffeursAPI, responsablesAPI, notificationsAPI, elevesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, ArrowLeft, CheckCircle, XCircle, Calendar, User
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminDemandes() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [nouveauSalaire, setNouveauSalaire] = useState('');
  const [reponse, setReponse] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      navigate(createPageUrl('AdminLogin'));
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await demandesAPI.getAll();
      const data = response?.data || response || [];
      setDemandes(data.sort((a, b) => new Date(b.date_creation || b.date_demande || 0) - new Date(a.date_creation || a.date_demande || 0)));
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedDemande) return;
    setProcessing(true);
    setError(null);
    
    try {
      // Traiter la demande
      await demandesAPI.traiter(selectedDemande.id, 'Approuvée', reponse || 'Demande approuvée');
      
      // Si augmentation, mettre à jour le salaire
      if (selectedDemande.type_demande === 'Augmentation' && nouveauSalaire) {
        if (selectedDemande.demandeur_type === 'chauffeur') {
          await chauffeursAPI.update(selectedDemande.demandeur_id, {
            salaire: parseInt(nouveauSalaire)
          });
        } else if (selectedDemande.demandeur_type === 'responsable') {
          await responsablesAPI.update(selectedDemande.demandeur_id, {
            salaire: parseInt(nouveauSalaire)
          });
        }
      }
      
      // Si déménagement, mettre à jour l'adresse et la zone de l'élève
      if (selectedDemande.type_demande === 'Déménagement' && selectedDemande.eleve_id) {
        const updateData = {};
        if (selectedDemande.nouvelle_adresse) {
          updateData.adresse = selectedDemande.nouvelle_adresse;
        }
        // Note: La zone n'est pas dans la table eleves directement, elle est probablement dans inscriptions
        // Vous devrez peut-être ajuster cela selon votre structure
        if (updateData.adresse) {
          await elevesAPI.update(selectedDemande.eleve_id, updateData);
        }
      }
      
      // Envoyer notification
      await notificationsAPI.create({
        destinataire_id: selectedDemande.demandeur_id,
        destinataire_type: selectedDemande.demandeur_type,
        titre: 'Demande acceptée',
        message: `Votre demande de ${selectedDemande.type_demande.toLowerCase()} a été acceptée.${
          selectedDemande.type_demande === 'Augmentation' && nouveauSalaire 
            ? ` Nouveau salaire: ${nouveauSalaire} DH` 
            : ''
        }`,
        type: 'info'
      });
      
      setSelectedDemande(null);
      setNouveauSalaire('');
      setReponse('');
      await loadData();
    } catch (err) {
      console.error('Erreur lors du traitement:', err);
      setError('Erreur lors du traitement de la demande');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefuse = async () => {
    if (!selectedDemande || !reponse) return;
    setProcessing(true);
    setError(null);
    
    try {
      await demandesAPI.traiter(selectedDemande.id, 'Rejetée', reponse);
      
      // Envoyer notification
      await notificationsAPI.create({
        destinataire_id: selectedDemande.demandeur_id,
        destinataire_type: selectedDemande.demandeur_type,
        titre: 'Demande refusée',
        message: `Votre demande de ${selectedDemande.type_demande.toLowerCase()} a été refusée. Motif: ${reponse}`,
        type: 'alerte'
      });
      
      setSelectedDemande(null);
      setReponse('');
      await loadData();
    } catch (err) {
      console.error('Erreur lors du traitement:', err);
      setError('Erreur lors du traitement de la demande');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (statut) => {
    const styles = {
      'En attente': 'bg-yellow-100 text-yellow-700',
      'Approuvée': 'bg-green-100 text-green-700',
      'Rejetée': 'bg-red-100 text-red-700'
    };
    return styles[statut] || 'bg-gray-100 text-gray-700';
  };

  const getTypeBadge = (type) => {
    const styles = {
      'Augmentation': 'bg-purple-100 text-purple-700',
      'Congé': 'bg-blue-100 text-blue-700',
      'Déménagement': 'bg-amber-100 text-amber-700',
      'Autre': 'bg-gray-100 text-gray-700'
    };
    return styles[type] || 'bg-gray-100 text-gray-700';
  };

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
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-500 hover:text-amber-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Traitement des Demandes
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {demandes.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune demande</p>
              </div>
            ) : (
              demandes.map((demande) => (
                <div key={demande.id} className="p-6 hover:bg-orange-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{demande.demandeur_nom}</h3>
                          <p className="text-sm text-gray-500 capitalize">{demande.demandeur_type}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeBadge(demande.type_demande)}`}>
                          {demande.type_demande}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(demande.statut)}`}>
                          {demande.statut}
                        </span>
                      </div>

                      {demande.type_demande === 'Augmentation' && demande.salaire_actuel && (
                        <div className="flex gap-4 text-sm mb-2">
                          <div>
                            <span className="text-gray-500">Salaire actuel:</span>
                            <span className="ml-2 font-semibold">{demande.salaire_actuel} DH</span>
                          </div>
                          {demande.salaire_demande && (
                            <div>
                              <span className="text-gray-500">Salaire demandé:</span>
                              <span className="ml-2 font-semibold text-purple-600">{demande.salaire_demande} DH</span>
                            </div>
                          )}
                        </div>
                      )}

                      {demande.type_demande === 'Congé' && demande.date_debut_conge && (
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{demande.date_debut_conge} → {demande.date_fin_conge}</span>
                        </div>
                      )}

                      {demande.type_demande === 'Déménagement' && (
                        <div className="bg-amber-50 rounded-xl p-4 text-sm mb-2">
                          <div className="grid grid-cols-2 gap-2">
                            {demande.eleve_adresse && (
                              <div>
                                <span className="text-gray-600">Adresse actuelle:</span>
                                <p className="font-medium">{demande.eleve_adresse}</p>
                              </div>
                            )}
                            {demande.nouvelle_adresse && (
                              <div>
                                <span className="text-gray-600">Nouvelle adresse:</span>
                                <p className="font-medium text-amber-700">{demande.nouvelle_adresse}</p>
                              </div>
                            )}
                            {demande.nouvelle_zone && (
                              <div>
                                <span className="text-gray-600">Nouvelle zone:</span>
                                <p className="font-medium text-amber-700">{demande.nouvelle_zone}</p>
                              </div>
                            )}
                            {demande.date_demenagement && (
                              <div>
                                <span className="text-gray-600">Date de déménagement:</span>
                                <p className="font-medium">{demande.date_demenagement}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {demande.raisons && (
                        <p className="text-gray-600 text-sm bg-gray-50 rounded-xl p-3 mt-2">
                          <strong>Justification:</strong> {demande.raisons}
                        </p>
                      )}

                      {demande.description && !demande.raisons && (
                        <p className="text-gray-600 text-sm bg-gray-50 rounded-xl p-3 mt-2">
                          <strong>Description:</strong> {typeof demande.description === 'string' ? demande.description : JSON.stringify(demande.description)}
                        </p>
                      )}

                      {demande.commentaire && (
                        <p className={`text-sm rounded-xl p-3 mt-2 ${
                          demande.statut === 'Approuvée' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          <strong>Réponse:</strong> {demande.commentaire}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(demande.date_creation || demande.date_demande || Date.now()), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>

                    {demande.statut === 'En attente' && (
                      <div className="flex gap-2 lg:flex-col">
                        <Button
                          onClick={() => {
                            setSelectedDemande(demande);
                            setNouveauSalaire(demande.salaire_demande?.toString() || '');
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Traiter
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal for processing */}
      {selectedDemande && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                Traiter la demande de {selectedDemande.type_demande.toLowerCase()}
              </h2>
              <p className="text-gray-500">De: {selectedDemande.demandeur_nom}</p>
            </div>

            <div className="p-6 space-y-4">
              {selectedDemande.type_demande === 'Augmentation' && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-600">Salaire actuel</span>
                    <span className="font-bold">{selectedDemande.salaire_actuel} DH</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-600">Salaire demandé</span>
                    <span className="font-bold text-purple-600">{selectedDemande.salaire_demande} DH</span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Nouveau salaire accordé (DH)</label>
                    <Input
                      type="number"
                      value={nouveauSalaire}
                      onChange={(e) => setNouveauSalaire(e.target.value)}
                      className="rounded-xl"
                      placeholder="Saisir le nouveau salaire"
                    />
                  </div>
                </div>
              )}

              {selectedDemande.type_demande === 'Déménagement' && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="mb-3">
                    <span className="text-gray-600 text-sm">Élève concerné:</span>
                    <p className="font-medium">{selectedDemande.eleve_prenom} {selectedDemande.eleve_nom}</p>
                  </div>
                  {selectedDemande.eleve_adresse && (
                    <div className="mb-3">
                      <span className="text-gray-600 text-sm">Adresse actuelle:</span>
                      <p className="font-medium">{selectedDemande.eleve_adresse}</p>
                    </div>
                  )}
                  {selectedDemande.nouvelle_adresse && (
                    <div className="mb-3">
                      <span className="text-gray-600 text-sm">Nouvelle adresse:</span>
                      <p className="font-medium text-amber-700">{selectedDemande.nouvelle_adresse}</p>
                    </div>
                  )}
                  {selectedDemande.nouvelle_zone && (
                    <div className="mb-3">
                      <span className="text-gray-600 text-sm">Nouvelle zone:</span>
                      <p className="font-medium text-amber-700">{selectedDemande.nouvelle_zone}</p>
                    </div>
                  )}
                  {selectedDemande.date_demenagement && (
                    <div>
                      <span className="text-gray-600 text-sm">Date de déménagement:</span>
                      <p className="font-medium">{selectedDemande.date_demenagement}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Réponse / Message (obligatoire pour refus)
                </label>
                <Textarea
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  className="rounded-xl"
                  placeholder="Votre réponse..."
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDemande(null);
                  setNouveauSalaire('');
                  setReponse('');
                }}
                className="rounded-xl"
                disabled={processing}
              >
                Annuler
              </Button>
              <Button
                onClick={handleRefuse}
                disabled={processing || !reponse}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Refuser
              </Button>
              <Button
                onClick={handleAccept}
                disabled={processing || (selectedDemande.type_demande === 'Augmentation' && !nouveauSalaire)}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accepter
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}