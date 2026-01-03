import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, paiementsAPI, notificationsAPI, demandesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, ArrowLeft, CheckCircle, AlertCircle,
  GraduationCap, Bus, Calendar
} from 'lucide-react';

export default function TuteurPaiement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [demande, setDemande] = useState(null);
  const [eleve, setEleve] = useState(null);
  const [tuteur, setTuteur] = useState(null);
  const [codeValidation, setCodeValidation] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    const tuteurData = JSON.parse(session);
    setTuteur(tuteurData);
    
    const params = new URLSearchParams(window.location.search);
    const demandeId = params.get('demandeId');
    if (demandeId) {
      // Utiliser type_id qui est l'ID du tuteur dans la table tuteurs
      const tuteurId = tuteurData.type_id || tuteurData.id;
      loadDemande(demandeId, tuteurId);
    }
  }, [navigate]);

  const loadDemande = async (demandeId, tuteurId) => {
    try {
      // Charger toutes les demandes du tuteur
      const response = await demandesAPI.getByTuteur(tuteurId);
      const demandes = response?.data || [];
      const demandeData = demandes.find(d => d.id === parseInt(demandeId));
      
      if (!demandeData) {
        setError('Demande non trouvée');
        return;
      }
      
      // Vérifier que la demande est en attente de paiement (peut être "Validée" ou "En attente de paiement")
      if (demandeData.statut !== 'En attente de paiement' && demandeData.statut !== 'Validée') {
        setError('Cette demande n\'est pas en attente de paiement');
        return;
      }
      
      setDemande(demandeData);
      
      // Charger les informations de l'élève si disponible
      if (demandeData.eleve_id) {
        try {
          const eleveData = await elevesAPI.getById(demandeData.eleve_id);
          setEleve(eleveData);
        } catch (err) {
          console.warn('Impossible de charger l\'élève:', err);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la demande:', err);
      setError('Impossible de charger les informations de la demande');
    }
  };

  const calculateAmount = () => {
    if (demande?.montant_facture) {
      return parseFloat(demande.montant_facture);
    }
    // Calculer depuis la description si pas de montant facture
    if (demande) {
      const infosTransport = extraireInfosTransport(demande.description);
      return calculerMontantFacture(infosTransport.type_transport, infosTransport.abonnement);
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!codeValidation || codeValidation.length < 4) {
      setError('Veuillez saisir le code de vérification');
      return;
    }
    
    if (!demande) {
      setError('Demande non trouvée');
      return;
    }
    
    setLoading(true);
    
    try {
      // Vérifier le code de vérification via l'API
      const verifyResponse = await demandesAPI.verifierCode(demande.id, codeValidation);
      
      if (!verifyResponse.success) {
        setError(verifyResponse.message || 'Code de vérification incorrect');
        setLoading(false);
        return;
      }
      
      // Code correct - le backend a déjà mis à jour le statut et envoyé les notifications
      setSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl('TuteurDashboard'));
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      setError(err.message || 'Erreur lors de la vérification du code. Veuillez réessayer.');
    }
    setLoading(false);
  };

  if (!demande) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-lime-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-lime-500 to-lime-600">
            <button
              onClick={() => navigate(createPageUrl('TuteurDashboard'))}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <CreditCard className="w-7 h-7" />
              Paiement
            </h1>
          </div>

          {success ? (
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Paiement réussi !</h2>
              <p className="text-gray-500">Redirection vers le tableau de bord...</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Facture */}
              <div className="bg-lime-50 rounded-2xl p-6 mb-6 border border-lime-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-lime-500" />
                  Facture
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Élève:</span>
                    <span className="font-medium">{demande.eleve_prenom} {demande.eleve_nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Classe:</span>
                    <span className="font-medium">{demande.eleve_classe || 'Non spécifiée'}</span>
                  </div>
                  {demande.zone_geographique && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zone:</span>
                      <span className="font-medium">{demande.zone_geographique}</span>
                    </div>
                  )}
                  {(() => {
                    const desc = typeof demande.description === 'string' ? JSON.parse(demande.description) : demande.description;
                    return (
                      <>
                        {desc?.type_transport && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type de transport:</span>
                            <span className="font-medium">{desc.type_transport}</span>
                          </div>
                        )}
                        {desc?.abonnement && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Abonnement:</span>
                            <span className="font-medium">{desc.abonnement}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="border-t border-amber-200 pt-3 flex justify-between">
                    <span className="text-lg font-semibold text-gray-800">Montant total:</span>
                    <span className="text-2xl font-bold text-amber-600">{calculateAmount().toFixed(2)} DH</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong> Veuillez consulter l'école pour effectuer le paiement et récupérer le code de vérification à saisir ci-dessous.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className="text-gray-700 font-medium">
                    Code de validation (fourni par l'école)
                  </Label>
                  <Input
                    value={codeValidation}
                    onChange={(e) => setCodeValidation(e.target.value)}
                    placeholder="Entrez le code de validation"
                    className="mt-1 h-12 rounded-xl text-center text-2xl tracking-widest font-mono"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Ce code vous a été communiqué par l'administration de l'école
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white rounded-xl font-semibold text-lg shadow-lg"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Confirmer le paiement
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}