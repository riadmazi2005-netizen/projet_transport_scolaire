import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, busAPI, trajetsAPI, presencesAPI, inscriptionsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import TuteurLayout from '../components/TuteurLayout';
import { 
  GraduationCap, ArrowLeft, Bus, Calendar,
  User, Clock
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
      setLoading(true);
      // Charger l'élève
      const eleveResponse = await elevesAPI.getById(eleveId);
      const eleveData = eleveResponse?.data || eleveResponse;
      setEleve(eleveData);
      
      // Charger le bus via les inscriptions
      if (eleveData) {
        try {
          const inscriptionsRes = await inscriptionsAPI.getByEleve(eleveId);
          const inscriptionsData = inscriptionsRes?.data || inscriptionsRes || [];
          const eleveInscription = Array.isArray(inscriptionsData) 
            ? inscriptionsData.find(i => i.statut === 'Active')
            : inscriptionsData;
          
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
        } catch (err) {
          console.warn('Erreur lors du chargement des inscriptions:', err);
        }
        
        // Charger les présences (7 derniers jours)
        try {
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const presencesResponse = await presencesAPI.getByEleve(eleveId, startDate, endDate);
          const presencesData = presencesResponse?.data || presencesResponse || [];
          // Trier par date décroissante et prendre les 7 derniers jours
          const sortedPresences = presencesData
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 7);
          setPresences(sortedPresences);
        } catch (err) {
          console.warn('Présences non disponibles:', err);
          setPresences([]);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TuteurLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </TuteurLayout>
    );
  }

  if (!eleve) {
    return (
      <TuteurLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Élève non trouvé</p>
            <Button 
              onClick={() => navigate(createPageUrl('TuteurDashboard'))}
              className="mt-4 bg-lime-500 hover:bg-lime-600 rounded-xl"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </TuteurLayout>
    );
  }

  const getStatusColor = (statut) => {
    const colors = {
      'Actif': 'bg-green-100 text-green-700',
      'Inactif': 'bg-amber-100 text-amber-700',
      'Suspendu': 'bg-red-100 text-red-700'
    };
    return colors[statut] || 'bg-gray-100 text-gray-700';
  };

  return (
    <TuteurLayout title={`Détails - ${eleve.prenom} ${eleve.nom}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate(createPageUrl('TuteurDashboard'))}
            className="flex items-center gap-2 text-gray-600 hover:text-lime-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>

          {/* Header Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 bg-gradient-to-r from-lime-500 to-lime-600">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-white">
                  <h1 className="text-2xl font-bold">{eleve.prenom} {eleve.nom}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-lg opacity-90">{eleve.classe || 'N/A'}</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(eleve.statut || 'Inactif')}`}>
                      {eleve.statut || 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Infos Élève */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-lime-500" />
                Informations personnelles
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Classe</span>
                  <span className="font-medium text-gray-800">{eleve.classe || 'N/A'}</span>
                </div>
                {eleve.date_naissance && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Date de naissance</span>
                    <span className="font-medium text-gray-800">
                      {format(new Date(eleve.date_naissance), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </div>
                )}
                {eleve.adresse && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Adresse</span>
                    <span className="font-medium text-gray-800 text-right max-w-[200px]">{eleve.adresse}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Infos Bus */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-lime-500" />
                Informations de transport
              </h2>
              
              {bus ? (
                <div className="space-y-3">
                  <div className="bg-lime-50 rounded-2xl p-4 border border-lime-100">
                    <p className="text-sm text-lime-600 font-medium mb-1">Bus assigné</p>
                    <p className="text-2xl font-bold text-gray-800">{bus.numero || 'N/A'}</p>
                    {bus.immatriculation && (
                      <p className="text-sm text-gray-500 mt-1">{bus.immatriculation}</p>
                    )}
                  </div>
                  
                  {bus.marque && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Marque/Modèle</span>
                      <span className="font-medium text-gray-800">{bus.marque} {bus.modele || ''}</span>
                    </div>
                  )}
                  
                  {bus.capacite && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Capacité</span>
                      <span className="font-medium text-gray-800">{bus.capacite} places</span>
                    </div>
                  )}
                  
                  {trajet && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between py-2 mb-3">
                        <span className="text-gray-600">Trajet</span>
                        <span className="font-medium text-gray-800">{trajet.nom || 'N/A'}</span>
                      </div>
                      
                      {trajet.heure_depart_matin_a && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Horaires:</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-xs text-blue-600 mb-1">Matin</p>
                              <p className="font-semibold text-gray-800 text-sm">
                                {trajet.heure_depart_matin_a} - {trajet.heure_arrivee_matin_a}
                              </p>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-3">
                              <p className="text-xs text-orange-600 mb-1">Soir</p>
                              <p className="font-semibold text-gray-800 text-sm">
                                {trajet.heure_depart_soir_a} - {trajet.heure_arrivee_soir_a}
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
                  <p className="font-medium">Aucun bus affecté</p>
                  <p className="text-sm mt-1">L'affectation sera faite après validation</p>
                </div>
              )}
            </div>
          </div>

          {/* Historique des présences */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-lime-500" />
              Historique des présences (7 derniers jours)
            </h2>
            
            {presences.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun historique de présence</p>
              </div>
            ) : (
              <div className="space-y-2">
                {presences.map((presence, index) => {
                  const presenceDate = new Date(presence.date);
                  const isToday = format(presenceDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  
                  return (
                    <div 
                      key={presence.id || index}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-gray-700">
                        {format(presenceDate, 'EEEE d MMMM', { locale: fr })}
                        {isToday && <span className="ml-2 text-xs text-lime-600">(Aujourd'hui)</span>}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Matin:</span>
                          <span className={`text-sm font-medium ${
                            presence.present_matin ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {presence.present_matin ? 'Présent' : 'Absent'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Soir:</span>
                          <span className={`text-sm font-medium ${
                            presence.present_soir ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {presence.present_soir ? 'Présent' : 'Absent'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </TuteurLayout>
  );
}