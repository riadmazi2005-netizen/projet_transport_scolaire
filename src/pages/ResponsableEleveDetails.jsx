import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, busAPI, trajetsAPI, presencesAPI, inscriptionsAPI, chauffeursAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ResponsableLayout from '../components/ResponsableLayout';
import { 
  GraduationCap, ArrowLeft, Bus, Calendar,
  User, Clock, BarChart3, Filter
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ResponsableEleveDetails() {
  const navigate = useNavigate();
  const [eleve, setEleve] = useState(null);
  const [bus, setBus] = useState(null);
  const [trajet, setTrajet] = useState(null);
  const [chauffeur, setChauffeur] = useState(null);
  const [presences, setPresences] = useState([]);
  const [allPresences, setAllPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('semaine'); // jour, semaine, mois
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const loadData = async (eleveId) => {
    if (!eleveId) {
      console.error('Aucun ID d\'élève fourni');
      setError('Aucun ID d\'élève fourni dans l\'URL');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // Charger l'élève
      const eleveResponse = await elevesAPI.getById(eleveId);
      const eleveData = eleveResponse?.data || eleveResponse;
      
      if (!eleveData || !eleveData.id) {
        console.error('Élève non trouvé ou données invalides:', eleveResponse);
        setError('Élève non trouvé ou données invalides');
        setLoading(false);
        return;
      }
      
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
            
            // Charger le chauffeur
            if (busData && busData.chauffeur_id) {
              try {
                const chauffeurResponse = await chauffeursAPI.getById(busData.chauffeur_id);
                const chauffeurData = chauffeurResponse?.data || chauffeurResponse;
                setChauffeur(chauffeurData);
              } catch (err) {
                console.warn('Erreur lors du chargement du chauffeur:', err);
              }
            }
          }
        } catch (err) {
          console.warn('Erreur lors du chargement des inscriptions:', err);
        }
        
        // Charger les présences (30 derniers jours pour avoir assez de données)
        try {
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const presencesResponse = await presencesAPI.getByEleve(eleveId, startDate, endDate);
          const presencesData = presencesResponse?.data || presencesResponse || [];
          // Trier par date décroissante
          const sortedPresences = presencesData
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          setAllPresences(sortedPresences);
          // Par défaut, prendre les 7 derniers jours
          setPresences(sortedPresences.slice(0, 7));
        } catch (err) {
          console.warn('Présences non disponibles:', err);
          setPresences([]);
          setAllPresences([]);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données de l\'élève: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('responsable_session');
    if (!session) {
      navigate(createPageUrl('ResponsableLogin'));
      return;
    }
    
    const params = new URLSearchParams(window.location.search);
    // Vérifier les deux variantes possibles du paramètre (eleveId ou eleveld)
    const eleveId = params.get('eleveId') || params.get('eleveld');
    if (eleveId) {
      loadData(eleveId);
    } else {
      // Si pas d'ID, afficher une erreur
      setError('Aucun ID d\'élève fourni dans l\'URL');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  if (loading) {
    return (
      <ResponsableLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </ResponsableLayout>
    );
  }

  if (!loading && !eleve && !error) {
    return (
      <ResponsableLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Élève non trouvé ou ID invalide.</p>
            <Button 
              onClick={() => navigate(createPageUrl('ResponsableDashboard'))}
              className="mt-4 bg-purple-500 hover:bg-purple-600 rounded-xl"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </ResponsableLayout>
    );
  }

  if (!loading && error && !eleve) {
    return (
      <ResponsableLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <Button 
              onClick={() => navigate(createPageUrl('ResponsableDashboard'))}
              className="mt-4 bg-purple-500 hover:bg-purple-600 rounded-xl"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </ResponsableLayout>
    );
  }

  const filteredPresences = useMemo(() => {
    if (!allPresences || allPresences.length === 0) return [];
    
    const today = new Date();
    let startDate, endDate;
    
    switch (filterType) {
      case 'jour':
        const selected = new Date(selectedDate);
        startDate = startOfDay(selected);
        endDate = endOfDay(selected);
        return allPresences.filter(p => {
          const pDate = new Date(p.date);
          return pDate >= startDate && pDate <= endDate;
        });
      case 'semaine':
        startDate = subDays(today, 6);
        endDate = today;
        return allPresences.filter(p => {
          const pDate = new Date(p.date);
          return pDate >= startDate && pDate <= endDate;
        }).slice(0, 7);
      case 'mois':
        startDate = subDays(today, 29);
        endDate = today;
        return allPresences.filter(p => {
          const pDate = new Date(p.date);
          return pDate >= startDate && pDate <= endDate;
        });
      default:
        return allPresences.slice(0, 7);
    }
  }, [allPresences, filterType, selectedDate]);

  const chartData = useMemo(() => {
    if (!filteredPresences || filteredPresences.length === 0) return [];
    
    const grouped = {};
    
    filteredPresences.forEach(presence => {
      const date = format(new Date(presence.date), 'dd/MM', { locale: fr });
      if (!grouped[date]) {
        grouped[date] = { date, absents: 0, presents: 0 };
      }
      
      if (!presence.present_matin) grouped[date].absents++;
      else grouped[date].presents++;
      
      if (!presence.present_soir) grouped[date].absents++;
      else grouped[date].presents++;
    });
    
    return Object.values(grouped)
      .sort((a, b) => {
        try {
          const [dayA, monthA] = a.date.split('/');
          const dateA = new Date(new Date().getFullYear(), parseInt(monthA) - 1, parseInt(dayA));
          
          const [dayB, monthB] = b.date.split('/');
          const dateB = new Date(new Date().getFullYear(), parseInt(monthB) - 1, parseInt(dayB));
          
          return dateA - dateB;
        } catch (e) {
          console.error('Erreur lors du tri des dates:', e);
          return 0;
        }
      });
  }, [filteredPresences]);

  useEffect(() => {
    if (eleve && eleve.id) {
      setPresences(filteredPresences);
    }
  }, [filterType, selectedDate, filteredPresences, eleve]);

  const getAbsenceForDate = (date) => {
    const dateStr = format(new Date(date), 'yyyy-MM-dd');
    const presence = allPresences.find(p => format(new Date(p.date), 'yyyy-MM-dd') === dateStr);
    
    if (!presence) return { absent: false, matin: false, soir: false };
    
    return {
      absent: !presence.present_matin || !presence.present_soir,
      matin: !presence.present_matin,
      soir: !presence.present_soir
    };
  };

  const selectedDateAbsence = getAbsenceForDate(selectedDate);

  const getStatusColor = (statut) => {
    const colors = {
      'Actif': 'bg-green-100 text-green-700',
      'Inactif': 'bg-amber-100 text-amber-700',
      'Suspendu': 'bg-red-100 text-red-700'
    };
    return colors[statut] || 'bg-gray-100 text-gray-700';
  };

  if (!eleve) {
    return (
      <ResponsableLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Élève non trouvé ou ID invalide.</p>
            <Button 
              onClick={() => navigate(createPageUrl('ResponsableDashboard'))}
              className="mt-4 bg-purple-500 hover:bg-purple-600 rounded-xl"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </ResponsableLayout>
    );
  }

  return (
    <ResponsableLayout title={`Détails - ${eleve?.prenom || ''} ${eleve?.nom || ''}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate(createPageUrl('ResponsableDashboard'))}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                ×
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
            <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-white">
                  <h1 className="text-2xl font-bold">{eleve?.prenom || ''} {eleve?.nom || ''}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-lg opacity-90">{eleve?.classe || 'N/A'}</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(eleve?.statut || 'Inactif')}`}>
                      {eleve?.statut || 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                Informations personnelles
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Classe</span>
                  <span className="font-medium text-gray-800">{eleve?.classe || 'N/A'}</span>
                </div>
                {eleve?.date_naissance && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Date de naissance</span>
                    <span className="font-medium text-gray-800">
                      {format(new Date(eleve.date_naissance), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </div>
                )}
                {eleve?.adresse && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Adresse</span>
                    <span className="font-medium text-gray-800 text-right max-w-[200px]">{eleve.adresse}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-purple-500" />
                Informations de transport
              </h2>
              
              {(bus && eleve?.statut === 'Actif') ? (
                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-600 font-medium mb-1">Bus assigné</p>
                    <p className="text-2xl font-bold text-gray-800">{bus.numero ? bus.numero.toString().replace(/^#\s*/, '') : 'N/A'}</p>
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
                  
                  {chauffeur && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Chauffeur</p>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Nom</span>
                          <span className="font-medium text-gray-800">{chauffeur.prenom} {chauffeur.nom}</span>
                        </div>
                        {chauffeur.telephone && (
                          <div className="flex justify-between py-2">
                            <span className="text-gray-600">Téléphone</span>
                            <span className="font-medium text-gray-800">{chauffeur.telephone}</span>
                          </div>
                        )}
                      </div>
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

          <div className="bg-white rounded-3xl shadow-xl p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Historique des absences
              </h2>
              
              <div className="flex items-center gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 rounded-xl">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jour">Jour</SelectItem>
                    <SelectItem value="semaine">Semaine</SelectItem>
                    <SelectItem value="mois">Mois</SelectItem>
                  </SelectContent>
                </Select>
                
                {filterType === 'jour' && (
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40 rounded-xl"
                  />
                )}
              </div>
            </div>

            {filterType === 'jour' && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      État pour le {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                    {selectedDateAbsence.absent ? (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-red-600 font-semibold">Absent</span>
                        {selectedDateAbsence.matin && <span className="text-sm text-red-600">Matin</span>}
                        {selectedDateAbsence.soir && <span className="text-sm text-red-600">Soir</span>}
                      </div>
                    ) : (
                      <span className="text-green-600 font-semibold">Présent (matin et soir)</span>
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold ${
                    selectedDateAbsence.absent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedDateAbsence.absent ? 'Absent' : 'Présent'}
                  </div>
                </div>
              </div>
            )}

            {chartData.length > 0 ? (
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="absents" fill="#EF4444" name="Absences" />
                    <Bar dataKey="presents" fill="#10B981" name="Présences" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 mb-6">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune donnée de présence disponible pour cette période</p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-semibold text-gray-700 mb-4">
                Détail des présences {filterType === 'jour' ? 'du jour' : filterType === 'semaine' ? 'de la semaine' : 'du mois'}
              </h3>
              
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
                    const isSelected = filterType === 'jour' && format(presenceDate, 'yyyy-MM-dd') === selectedDate;
                    
                    return (
                      <div 
                        key={presence.id || index}
                        className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                          isSelected 
                            ? 'bg-purple-100 border-2 border-purple-300' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <span className="font-medium text-gray-700">
                          {format(presenceDate, 'EEEE d MMMM', { locale: fr })}
                          {isToday && <span className="ml-2 text-xs text-purple-600">(Aujourd'hui)</span>}
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
          </div>
        </motion.div>
      </div>
    </ResponsableLayout>
  );
}

