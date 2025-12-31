import React, { useState, useEffect } from 'react';
import { demandesAPI, chauffeursAPI, responsablesAPI, notificationsAPI, elevesAPI, busAPI, inscriptionsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from '../components/AdminLayout';
import { 
  FileText, CheckCircle, XCircle, Calendar, User, Bus
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
  const [availableBuses, setAvailableBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [codeVerification, setCodeVerification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await demandesAPI.getAll();
      const data = response?.data || response || [];
      // Filtrer pour exclure les demandes d'inscription (qui sont gérées dans AdminInscriptions)
      // Ne garder que les demandes de chauffeurs et responsables (Augmentation, Congé, Déménagement, Autre)
      const demandesFiltrees = data.filter(d => d.type_demande !== 'inscription');
      setDemandes(demandesFiltrees.sort((a, b) => new Date(b.date_creation || b.date_demande || 0) - new Date(a.date_creation || a.date_demande || 0)));
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
      // Pour les demandes d'inscription, passer en "En attente de paiement" pour générer le code
      // Pour les autres types, passer en "Approuvée" ou "En cours de traitement"
      let nouveauStatut = 'Approuvée';
      if (selectedDemande.type_demande === 'inscription') {
        nouveauStatut = 'En attente de paiement';
      } else if (selectedDemande.type_demande === 'modification' || selectedDemande.type_demande === 'desinscription') {
        nouveauStatut = 'En cours de traitement';
      }
      
      // Traiter la demande
      const result = await demandesAPI.traiter(selectedDemande.id, nouveauStatut, reponse || 'Demande approuvée');
      
      // Note: L'affectation du bus se fera APRÈS la validation du code de paiement
      // Ici on génère juste le code et on passe en "En attente de paiement"
      
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
      
      // Afficher le code de vérification si généré
      if (result?.data?.code_verification) {
        setCodeVerification(result.data.code_verification);
        // Ne pas fermer le modal, afficher le code
      } else {
        setSelectedDemande(null);
        setNouveauSalaire('');
        setReponse('');
        setSelectedBusId(null);
        setAvailableBuses([]);
      }
      
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
    if (!selectedDemande || !reponse) {
      setError('Veuillez renseigner la raison du refus');
      return;
    }
    setProcessing(true);
    setError(null);
    
    try {
      await demandesAPI.traiter(selectedDemande.id, 'Refusée', '', reponse);
      
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
      'inscription': 'bg-blue-100 text-blue-700',
      'modification': 'bg-amber-100 text-amber-700',
      'desinscription': 'bg-red-100 text-red-700',
      'Augmentation': 'bg-purple-100 text-purple-700',
      'Congé': 'bg-blue-100 text-blue-700',
      'Déménagement': 'bg-amber-100 text-amber-700',
      'Autre': 'bg-gray-100 text-gray-700'
    };
    return styles[type] || 'bg-gray-100 text-gray-700';
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
    <AdminLayout title="Traitement des Demandes">
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6"
      >
        <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Traitement des Demandes du Personnel
          </h2>
          <p className="text-orange-100 mt-1 text-sm">Chauffeurs et Responsables uniquement</p>
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

                      {demande.type_demande === 'inscription' && (
                        <div className="bg-blue-50 rounded-xl p-4 text-sm mb-2">
                          <div className="grid grid-cols-2 gap-2">
                            {demande.eleve_nom && (
                              <>
                                <div>
                                  <span className="text-gray-600">Élève:</span>
                                  <p className="font-medium">{demande.eleve_prenom} {demande.eleve_nom}</p>
                                </div>
                                {demande.eleve_classe && (
                                  <div>
                                    <span className="text-gray-600">Classe:</span>
                                    <p className="font-medium">{demande.eleve_classe}</p>
                                  </div>
                                )}
                                {demande.zone_geographique && (
                                  <div>
                                    <span className="text-gray-600">Zone géographique:</span>
                                    <p className="font-medium text-blue-700">{demande.zone_geographique}</p>
                                  </div>
                                )}
                                {demande.eleve_adresse && (
                                  <div>
                                    <span className="text-gray-600">Adresse:</span>
                                    <p className="font-medium">{demande.eleve_adresse}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
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

                      {demande.raison_refus && (
                        <p className="text-sm rounded-xl p-3 mt-2 bg-red-50 text-red-700">
                          <strong>Raison du refus:</strong> {demande.raison_refus}
                        </p>
                      )}

                      {demande.commentaire && !demande.raison_refus && (
                        <p className={`text-sm rounded-xl p-3 mt-2 ${
                          demande.statut === 'Approuvée' || demande.statut === 'Validée' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          <strong>Réponse:</strong> {demande.commentaire}
                        </p>
                      )}

                      {demande.code_verification && demande.statut === 'En attente de paiement' && (
                        <p className="text-sm rounded-xl p-3 mt-2 bg-blue-50 text-blue-700">
                          <strong>Code de vérification:</strong> <span className="font-mono font-bold">{demande.code_verification}</span>
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(demande.date_creation || demande.date_demande || Date.now()), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>

                    {(demande.statut === 'En attente' || demande.statut === 'En cours de traitement') && (
                      <div className="flex gap-2 lg:flex-col">
                        <Button
                          onClick={async () => {
                            setSelectedDemande(demande);
                            setNouveauSalaire(demande.salaire_demande?.toString() || '');
                            setCodeVerification(null);
                            setSelectedBusId(null);
                            
                            // Si c'est une demande d'inscription, charger les bus disponibles par zone
                            if (demande.type_demande === 'inscription' && demande.zone_geographique) {
                              try {
                                const busesResponse = await busAPI.getByZone(demande.zone_geographique);
                                if (busesResponse.success) {
                                  setAvailableBuses(busesResponse.data || []);
                                }
                              } catch (err) {
                                console.warn('Erreur lors du chargement des bus:', err);
                                // Charger tous les bus en fallback
                                try {
                                  const allBuses = await busAPI.getAll();
                                  setAvailableBuses(allBuses.filter(b => b.statut === 'Actif') || []);
                                } catch (e) {
                                  setAvailableBuses([]);
                                }
                              }
                            }
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Traiter
                        </Button>
                      </div>
                    )}

                    {/* Bouton pour affecter le bus aux demandes validées */}
                    {demande.statut === 'Validée' && demande.type_demande === 'inscription' && demande.eleve_id && !demande.bus_id && (
                      <div className="flex gap-2 lg:flex-col">
                        <Button
                          onClick={async () => {
                            setSelectedDemande(demande);
                            setCodeVerification(null);
                            setSelectedBusId(null);
                            
                            // Charger les bus disponibles par zone
                            if (demande.zone_geographique) {
                              try {
                                const busesResponse = await busAPI.getByZone(demande.zone_geographique);
                                if (busesResponse.success) {
                                  setAvailableBuses(busesResponse.data || []);
                                }
                              } catch (err) {
                                console.warn('Erreur lors du chargement des bus:', err);
                                try {
                                  const allBuses = await busAPI.getAll();
                                  setAvailableBuses(allBuses.filter(b => b.statut === 'Actif') || []);
                                } catch (e) {
                                  setAvailableBuses([]);
                                }
                              }
                            }
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                        >
                          <Bus className="w-4 h-4 mr-2" />
                          Affecter un bus
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
        </div>
      </motion.div>

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

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Affichage du code de vérification si généré */}
              {codeVerification && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                  <h3 className="font-bold text-green-800 mb-2">Code de vérification généré</h3>
                  <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                    <p className="text-3xl font-mono font-bold text-center text-green-700 tracking-widest">
                      {codeVerification}
                    </p>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Ce code a été envoyé au tuteur dans la notification avec la facture.
                  </p>
                </div>
              )}

              {/* Informations pour les demandes d'inscription */}
              {selectedDemande.type_demande === 'inscription' && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Informations de l'élève</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedDemande.eleve_nom && (
                      <>
                        <div>
                          <span className="text-gray-600">Nom complet:</span>
                          <p className="font-medium">{selectedDemande.eleve_prenom} {selectedDemande.eleve_nom}</p>
                        </div>
                        {selectedDemande.eleve_classe && (
                          <div>
                            <span className="text-gray-600">Classe:</span>
                            <p className="font-medium">{selectedDemande.eleve_classe}</p>
                          </div>
                        )}
                        {selectedDemande.zone_geographique && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Zone géographique:</span>
                            <p className="font-medium text-blue-700">{selectedDemande.zone_geographique}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Bus disponibles pour cette zone */}
                  {availableBuses.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        {selectedDemande.statut === 'Validée' 
                          ? 'Sélectionner un bus pour affecter l\'élève:' 
                          : 'Bus disponibles pour cette zone:'}
                      </h4>
                      {selectedDemande.statut !== 'Validée' && (
                        <p className="text-xs text-gray-500 mb-2">
                          L'affectation du bus se fera après la validation du paiement par le tuteur.
                        </p>
                      )}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableBuses.map((bus) => (
                          <div
                            key={bus.id}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedDemande.statut === 'Validée'
                                ? `cursor-pointer ${
                                    selectedBusId === bus.id
                                      ? 'border-blue-500 bg-blue-100'
                                      : 'border-gray-200 hover:border-blue-300 bg-white'
                                  }`
                                : 'border-gray-200 bg-gray-50'
                            }`}
                            onClick={() => {
                              if (selectedDemande.statut === 'Validée') {
                                setSelectedBusId(bus.id);
                              }
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-gray-800">{bus.numero}</p>
                                <p className="text-xs text-gray-500">{bus.marque} {bus.modele}</p>
                                {bus.trajet_nom && (
                                  <p className="text-xs text-gray-400">Trajet: {bus.trajet_nom}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-600">
                                  {bus.places_restantes} places
                                </p>
                                <p className="text-xs text-gray-400">
                                  {bus.eleves_inscrits}/{bus.capacite}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedBusId && selectedDemande.statut === 'Validée' && (
                        <p className="text-sm text-blue-600 mt-2">
                          ✓ Bus sélectionné: {availableBuses.find(b => b.id === selectedBusId)?.numero}
                        </p>
                      )}
                    </div>
                  )}
                  {availableBuses.length === 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-700">
                        {selectedDemande.statut === 'Validée'
                          ? 'Aucun bus disponible pour cette zone. Veuillez créer ou modifier un bus pour cette zone.'
                          : 'Aucun bus disponible pour cette zone. Vous pouvez valider la demande et affecter un bus après le paiement.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

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

              {/* Réponse/Message - seulement si pas une affectation de bus */}
              {selectedDemande.statut !== 'Validée' && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Réponse / Message {selectedDemande.type_demande === 'inscription' ? '(optionnel)' : '(obligatoire pour refus)'}
                  </label>
                  <Textarea
                    value={reponse}
                    onChange={(e) => setReponse(e.target.value)}
                    className="rounded-xl"
                    placeholder="Votre réponse..."
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              {codeVerification ? (
                <Button
                  onClick={() => {
                    setSelectedDemande(null);
                    setNouveauSalaire('');
                    setReponse('');
                    setCodeVerification(null);
                    setSelectedBusId(null);
                    setAvailableBuses([]);
                    loadData();
                  }}
                  className="rounded-xl bg-green-500 hover:bg-green-600 text-white"
                >
                  Fermer
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDemande(null);
                      setNouveauSalaire('');
                      setReponse('');
                      setSelectedBusId(null);
                      setAvailableBuses([]);
                    }}
                    className="rounded-xl"
                    disabled={processing}
                  >
                    Annuler
                  </Button>
                </>
              )}
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
    </AdminLayout>
  );
}