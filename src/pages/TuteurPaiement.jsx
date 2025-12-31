import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, paiementsAPI, notificationsAPI } from '../services/apiService';
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
  const [eleve, setEleve] = useState(null);
  const [tuteur, setTuteur] = useState(null);
  const [codeValidation, setCodeValidation] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    setTuteur(JSON.parse(session));
    
    const params = new URLSearchParams(window.location.search);
    const eleveId = params.get('eleveId');
    if (eleveId) {
      loadEleve(eleveId);
    }
  }, [navigate]);

  const loadEleve = async (eleveId) => {
    try {
      const eleveData = await elevesAPI.getById(eleveId);
      setEleve(eleveData);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'élève:', err);
      setError('Impossible de charger les informations de l\'élève');
    }
  };

  const calculateAmount = () => {
    if (!eleve) return 0;
    const basePrice = eleve.type_transport === 'Aller-Retour' ? 400 : 250;
    return eleve.abonnement === 'Annuel' ? basePrice * 10 : basePrice;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Simple code validation (in real app, this would be server-side)
    if (codeValidation.length < 4) {
      setError('Code de validation invalide');
      return;
    }
    
    setLoading(true);
    
    try {
      const currentDate = new Date();
      const mois = currentDate.getMonth() + 1;
      const annee = currentDate.getFullYear();
      
      // Create payment record
      await paiementsAPI.create({
        eleve_id: eleve.id,
        tuteur_id: tuteur.id,
        montant: calculateAmount(),
        mois: mois,
        annee: annee,
        date_paiement: currentDate.toISOString().split('T')[0],
        mode_paiement: 'Virement',
        statut: 'Payé'
      });
      
      // Update eleve status
      await elevesAPI.update(eleve.id, {
        statut: 'Actif'
      });
      
      // Notify tuteur
      await notificationsAPI.create({
        destinataire_id: tuteur.id,
        destinataire_type: 'tuteur',
        titre: 'Paiement confirmé',
        message: `Votre paiement de ${calculateAmount()} DH pour ${eleve.prenom} a été confirmé. L'affectation au bus sera effectuée par l'administration.`,
        type: 'info',
        date: new Date().toISOString()
      });
      
      // Notify admin (assuming admin has ID 1 or fetch from users table with role='admin')
      await notificationsAPI.create({
        destinataire_id: 1, // You may need to fetch actual admin ID
        destinataire_type: 'admin',
        titre: 'Paiement reçu',
        message: `Le paiement pour ${eleve.prenom} ${eleve.nom} a été validé. Montant: ${calculateAmount()} DH`,
        type: 'info',
        date: new Date().toISOString()
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl('TuteurDashboard'));
      }, 2000);
    } catch (err) {
      console.error('Erreur lors du paiement:', err);
      setError('Erreur lors du paiement. Veuillez réessayer.');
    }
    setLoading(false);
  };

  if (!eleve) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-500">
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
              {/* Eleve Info */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-500" />
                  Informations de l'élève
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nom complet:</span>
                    <p className="font-medium">{eleve.nom} {eleve.prenom}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Classe:</span>
                    <p className="font-medium">{eleve.classe}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Zone:</span>
                    <p className="font-medium">{eleve.zone || 'Non définie'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Statut:</span>
                    <p className="font-medium">{eleve.statut}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-amber-50 rounded-2xl p-6 mb-6 border border-amber-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-amber-500" />
                  Détails du paiement
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type de transport:</span>
                    <span className="font-medium">{eleve.type_transport || 'Aller-Retour'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Abonnement:</span>
                    <span className="font-medium">{eleve.abonnement || 'Mensuel'}</span>
                  </div>
                  <div className="border-t border-amber-200 pt-3 flex justify-between">
                    <span className="text-lg font-semibold text-gray-800">Total à payer:</span>
                    <span className="text-2xl font-bold text-amber-600">{calculateAmount()} DH</span>
                  </div>
                </div>
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
                  className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold text-lg shadow-lg"
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