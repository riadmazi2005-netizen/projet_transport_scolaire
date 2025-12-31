import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, busAPI, trajetsAPI, presencesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, ArrowLeft, Bus, MapPin, Calendar,
  User, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TuteurEleveDetails() {
  const navigate = useNavigate();
  const [eleve, setEleve] = useState(null);
  const [bus, setBus] = useState(null);
  const [trajet, setTrajet] = useState(null);
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const eleveId = params.get('eleveId');
    if (eleveId) {
      loadData(eleveId);
    }
  }, [navigate]);

  const loadData = async (eleveId) => {
    try {
      // Charger l'élève
      const eleveResponse = await elevesAPI.getById(eleveId);
      const eleveData = eleveResponse?.data || eleveResponse;
      setEleve(eleveData);
      
      // Charger le bus via les inscriptions
      if (eleveData) {
        // Récupérer toutes les inscriptions pour trouver le bus_id
        const inscriptionsAPI = await import('../services/apiService').then(m => m.inscriptionsAPI);
        const allInscriptionsRes = await inscriptionsAPI.getAll();
        const allInscriptions = allInscriptionsRes?.data || allInscriptionsRes || [];
        const eleveInscription = allInscriptions.find(i => i.eleve_id === parseInt(eleveId) && i.statut === 'Active');
        
        if (eleveInscription && eleveInscription.bus_id) {
          const busResponse = await busAPI.getById(eleveInscription.bus_id);
          const busData = busResponse?.data || busResponse;
          setBus(busData);
          
          // Charger le trajet
          if (busData && busData.trajet_id) {
            const trajetResponse = await trajetsAPI.getById(busData.trajet_id);
            const trajetData = trajetResponse?.data || trajetResponse;
            setTrajet(trajetData);
          }
        }
        
        // Charger les présences
        try {
          // Calculer les dates (30 derniers jours)
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const presencesResponse = await presencesAPI.getByEleve(eleveId, startDate, endDate);
          const presencesData = presencesResponse?.data || presencesResponse || [];
          setPresences(presencesData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
        } catch (err) {
          console.warn('Présences non disponibles:', err);
          setPresences([]);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!eleve) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Élève non trouvé</p>
          <Button 
            onClick={() => navigate(createPageUrl('TuteurDashboard'))}
            className="mt-4 bg-amber-500 hover:bg-amber-600 rounded-xl"
          >
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (statut) => {
    const colors = {
      'Actif': 'bg-green-100 text-green-700',
      'Inactif': 'bg-yellow-100 text-yellow-700',
      'Suspendu': 'bg-red-100 text-red-700'
    };
    return colors[statut] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate(createPageUrl('TuteurDashboard'))}
            className="flex items-center gap-2 text-gray-500 hover:text-amber-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>

          {/* Header Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 bg-gradient-to-r from-amber-500 to-yellow-500">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{eleve.nom} {eleve.prenom}</h1>
                  <p className="opacity-90">{eleve.classe}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(eleve.statut)}`}>
                    {eleve.statut}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Infos Élève */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Informations personnelles
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Classe</span>
                  <span className="font-medium">{eleve.classe}</span>
                </div>
                {eleve.date_naissance && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Date de naissance</span>
                    <span className="font-medium">
                      {format(new Date(eleve.date_naissance), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
                {eleve.adresse && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Adresse</span>
                    <span className="font-medium text-right max-w-[200px]">{eleve.adresse}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Infos Bus */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-500" />
                Informations de transport
              </h2>
              
              {bus ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-sm text-amber-600 font-medium">Bus assigné</p>
                    <p className="text-2xl font-bold text-gray-800">{bus.numero}</p>
                    <p className="text-sm text-gray-500">{bus.immatriculation}</p>
                  </div>
                  
                  {bus.marque && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Marque</span>
                      <span className="font-medium">{bus.marque} {bus.modele}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Capacité</span>
                    <span className="font-medium">{bus.capacite} places</span>
                  </div>
                  
                  {trajet && (
                    <div className="mt-4">
                      <div className="flex justify-between py-2 border-b border-gray-100 mb-3">
                        <span className="text-gray-500">Trajet</span>
                        <span className="font-medium">{trajet.nom}</span>
                      </div>
                      
                      {trajet.heure_depart_matin_a && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Horaires:</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-xs text-blue-600">Matin</p>
                              <p className="font-semibold text-gray-800 text-sm">
                                {trajet.heure_depart_matin_a}
                              </p>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-3">
                              <p className="text-xs text-orange-600">Soir</p>
                              <p className="font-semibold text-gray-800 text-sm">
                                {trajet.heure_depart_soir_a}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun bus affecté</p>
                  <p className="text-sm mt-1">L'affectation sera faite après validation</p>
                </div>
              )}
            </div>
          </div>

          {/* Historique des présences */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Historique des présences (7 derniers jours)
            </h2>
            
            {presences.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun historique de présence</p>
              </div>
            ) : (
              <div className="space-y-2">
                {presences.slice(0, 7).map((presence) => (
                  <div 
                    key={presence.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-700">
                      {format(new Date(presence.date), 'EEEE d MMMM', { locale: fr })}
                    </span>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Matin:</span>
                        {presence.present_matin ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Soir:</span>
                        {presence.present_soir ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}