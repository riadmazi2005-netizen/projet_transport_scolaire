import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, busAPI, trajetsAPI, tuteursAPI, inscriptionsAPI, notificationsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ClipboardList, ArrowLeft, Search, CheckCircle, XCircle, 
  Eye, User, Bus, MapPin, Filter, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminInscriptions() {
  const navigate = useNavigate();
  const [eleves, setEleves] = useState([]);
  const [buses, setBuses] = useState([]);
  const [trajets, setTrajets] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [tuteurs, setTuteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showInscriptionModal, setShowInscriptionModal] = useState(false);
  const [availableBuses, setAvailableBuses] = useState([]);
  const [error, setError] = useState(null);
  const [inscriptionForm, setInscriptionForm] = useState({
    montant_mensuel: 500,
    date_debut: format(new Date(), 'yyyy-MM-dd'),
    date_fin: format(new Date(new Date().setMonth(new Date().getMonth() + 10)), 'yyyy-MM-dd')
  });

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
      const [elevesRes, busesRes, trajetsRes, inscriptionsRes, tuteursRes] = await Promise.all([
        elevesAPI.getAll(),
        busAPI.getAll(),
        trajetsAPI.getAll(),
        inscriptionsAPI.getAll(),
        tuteursAPI.getAll()
      ]);
      
      // Extraire les données avec gestion de différents formats de réponse
      const elevesArray = elevesRes?.data || elevesRes || [];
      const busesArray = busesRes?.data || busesRes || [];
      const trajetsArray = trajetsRes?.data || trajetsRes || [];
      const inscriptionsArray = inscriptionsRes?.data || inscriptionsRes || [];
      const tuteursArray = tuteursRes?.data || tuteursRes || [];
      
      // Enrichir les élèves avec les infos du tuteur et de l'inscription
      const elevesWithDetails = elevesArray.map(e => {
        const tuteur = tuteursArray.find(t => t.id === e.tuteur_id);
        const inscription = inscriptionsArray.find(i => i.eleve_id === e.id && i.statut !== 'Terminée');
        const bus = inscription?.bus_id ? busesArray.find(b => b.id === inscription.bus_id) : null;
        
        return {
          ...e,
          tuteur,
          inscription,
          bus,
          statut_inscription: inscription?.statut || 'En attente'
        };
      });
      
      setEleves(elevesWithDetails);
      setBuses(busesArray);
      setTrajets(trajetsArray);
      setInscriptions(inscriptionsArray);
      setTuteurs(tuteursArray);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (eleve) => {
    setSelectedEleve(eleve);
    setShowInscriptionModal(true);
  };

  const handleCreateInscription = async () => {
    if (!selectedEleve) return;
    
    setError(null);
    
    try {
      // Créer l'inscription avec tous les champs requis
      const inscriptionData = {
        eleve_id: selectedEleve.id,
        bus_id: selectedEleve.bus?.id || null,
        date_debut: inscriptionForm.date_debut,
        date_fin: inscriptionForm.date_fin,
        montant_mensuel: parseFloat(inscriptionForm.montant_mensuel),
        statut: 'Active'
      };
      
      const response = await inscriptionsAPI.create(inscriptionData);
      
      if (response.success) {
        // Mettre à jour le statut de l'élève
        await elevesAPI.update(selectedEleve.id, {
          statut: 'Actif'
        });
        
        // Envoyer notification au tuteur
        if (selectedEleve.tuteur_id) {
          await notificationsAPI.create({
            destinataire_id: selectedEleve.tuteur_id,
            destinataire_type: 'tuteur',
            titre: 'Inscription validée',
            message: `L'inscription de ${selectedEleve.prenom} ${selectedEleve.nom} a été validée. Montant mensuel: ${inscriptionForm.montant_mensuel} DH.`,
            type: 'info',
            date: new Date().toISOString()
          });
        }
        
        setShowInscriptionModal(false);
        setSelectedEleve(null);
        await loadData();
      }
    } catch (err) {
      console.error('Erreur lors de la validation:', err);
      setError('Erreur lors de la validation de l\'inscription: ' + err.message);
    }
  };

  const handleRefuse = async (eleve, motif) => {
    if (!motif) return;
    
    setError(null);
    
    try {
      // Si une inscription existe, la marquer comme terminée
      if (eleve.inscription) {
        await inscriptionsAPI.update(eleve.inscription.id, {
          statut: 'Terminée'
        });
      }
      
      // Mettre à jour le statut de l'élève
      await elevesAPI.update(eleve.id, {
        statut: 'Inactif'
      });
      
      // Envoyer notification au tuteur
      if (eleve.tuteur_id) {
        await notificationsAPI.create({
          destinataire_id: eleve.tuteur_id,
          destinataire_type: 'tuteur',
          titre: 'Inscription refusée',
          message: `L'inscription de ${eleve.prenom} ${eleve.nom} a été refusée. Motif: ${motif}`,
          type: 'alerte',
          date: new Date().toISOString()
        });
      }
      
      await loadData();
    } catch (err) {
      console.error('Erreur lors du refus:', err);
      setError('Erreur lors du refus de l\'inscription: ' + err.message);
    }
  };

  const handleVerifyZone = (eleve) => {
    setSelectedEleve(eleve);
    
    // Calculer les places restantes pour chaque bus
    const busesWithCapacity = buses.map(bus => {
      // Compter les inscriptions actives pour ce bus
      const elevesInBus = inscriptions.filter(i => 
        i.bus_id === bus.id && (i.statut === 'Active' || i.statut === 'Suspendue')
      ).length;
      
      const trajet = trajets.find(t => t.id === bus.trajet_id);
      
      return {
        ...bus,
        trajet,
        placesRestantes: bus.capacite - elevesInBus,
        elevesInscrits: elevesInBus
      };
    }).filter(bus => 
      bus.statut === 'Actif' && bus.placesRestantes > 0
    );
    
    setAvailableBuses(busesWithCapacity);
    setShowVerifyModal(true);
  };

  const handleAffectBus = async (busId) => {
    if (!selectedEleve) return;
    
    setError(null);
    
    try {
      const bus = buses.find(b => b.id === busId);
      
      if (selectedEleve.inscription) {
        // Mettre à jour l'inscription existante
        await inscriptionsAPI.update(selectedEleve.inscription.id, {
          bus_id: busId,
          statut: 'Active'
        });
      } else {
        // Créer une nouvelle inscription
        const inscriptionData = {
          eleve_id: selectedEleve.id,
          bus_id: busId,
          date_debut: format(new Date(), 'yyyy-MM-dd'),
          date_fin: format(new Date(new Date().setMonth(new Date().getMonth() + 10)), 'yyyy-MM-dd'),
          montant_mensuel: 500
        };
        
        await inscriptionsAPI.create(inscriptionData);
      }
      
      // Notifier le tuteur
      if (selectedEleve.tuteur_id) {
        await notificationsAPI.create({
          destinataire_id: selectedEleve.tuteur_id,
          destinataire_type: 'tuteur',
          titre: 'Affectation au bus',
          message: `${selectedEleve.prenom} ${selectedEleve.nom} a été affecté(e) au bus ${bus.numero}.`,
          type: 'info',
          date: new Date().toISOString()
        });
      }
      
      setShowVerifyModal(false);
      setSelectedEleve(null);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'affectation:', err);
      setError('Erreur lors de l\'affectation au bus: ' + err.message);
    }
  };

  const filteredEleves = eleves.filter(e => {
    const matchSearch = 
      e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.adresse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.classe?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || e.statut === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (statut) => {
    const styles = {
      'Actif': 'bg-green-100 text-green-700',
      'Inactif': 'bg-yellow-100 text-yellow-700',
      'Active': 'bg-emerald-100 text-emerald-700',
      'Suspendue': 'bg-orange-100 text-orange-700',
      'Terminée': 'bg-gray-100 text-gray-700'
    };
    return styles[statut] || 'bg-gray-100 text-gray-700';
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
          Retour au tableau de bord
        </button>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-blue-500 to-cyan-500">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ClipboardList className="w-7 h-7" />
              Gestion des Inscriptions
            </h1>
            <p className="text-blue-100 mt-1">{eleves.length} élève(s) • {inscriptions.filter(i => i.statut === 'Active').length} inscription(s) active(s)</p>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, prénom, adresse ou classe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 h-12 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-gray-100">
            {filteredEleves.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune inscription trouvée</p>
              </div>
            ) : (
              filteredEleves.map((eleve) => (
                <div key={eleve.id} className="p-6 hover:bg-amber-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-7 h-7 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {eleve.nom} {eleve.prenom}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                          <span>{eleve.classe}</span>
                          {eleve.date_naissance && (
                            <>
                              <span>•</span>
                              <span>{format(new Date(eleve.date_naissance), 'dd/MM/yyyy')}</span>
                            </>
                          )}
                          {eleve.adresse && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {eleve.adresse}
                              </span>
                            </>
                          )}
                        </div>
                        {eleve.tuteur && (
                          <p className="text-sm text-gray-400 mt-1">
                            Tuteur: {eleve.tuteur.prenom} {eleve.tuteur.nom} • {eleve.tuteur.telephone || eleve.tuteur.email}
                          </p>
                        )}
                        {eleve.bus && (
                          <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                            <Bus className="w-3 h-3" />
                            Bus: {eleve.bus.numero}
                          </p>
                        )}
                        {eleve.inscription && (
                          <p className="text-xs text-gray-400 mt-1">
                            Inscription du {format(new Date(eleve.inscription.date_inscription), 'dd/MM/yyyy')} • 
                            {eleve.inscription.montant_mensuel} DH/mois
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusBadge(eleve.statut)}`}>
                        {eleve.statut}
                      </span>

                      {eleve.statut === 'Inactif' && !eleve.inscription && (
                        <>
                          <Button
                            onClick={() => handleValidate(eleve)}
                            className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Valider
                          </Button>
                          <Button
                            onClick={() => {
                              const motif = prompt('Motif du refus:');
                              if (motif) handleRefuse(eleve, motif);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Refuser
                          </Button>
                        </>
                      )}

                      {eleve.statut === 'Actif' && eleve.inscription && !eleve.inscription.bus_id && (
                        <Button
                          onClick={() => handleVerifyZone(eleve)}
                          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                        >
                          <Bus className="w-4 h-4 mr-2" />
                          Affecter un bus
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal Inscription Details */}
      {showInscriptionModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                Valider l'inscription
              </h2>
              <p className="text-gray-500">
                {selectedEleve.prenom} {selectedEleve.nom}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de début
                </label>
                <Input
                  type="date"
                  value={inscriptionForm.date_debut}
                  onChange={(e) => setInscriptionForm({...inscriptionForm, date_debut: e.target.value})}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de fin
                </label>
                <Input
                  type="date"
                  value={inscriptionForm.date_fin}
                  onChange={(e) => setInscriptionForm({...inscriptionForm, date_fin: e.target.value})}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant mensuel (DH)
                </label>
                <Input
                  type="number"
                  value={inscriptionForm.montant_mensuel}
                  onChange={(e) => setInscriptionForm({...inscriptionForm, montant_mensuel: e.target.value})}
                  className="rounded-xl"
                  min="0"
                  step="50"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInscriptionModal(false);
                  setSelectedEleve(null);
                }}
                className="rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateInscription}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider l'inscription
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Affect Bus */}
      {showVerifyModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                Affectation de bus
              </h2>
              <p className="text-gray-500">
                Élève: {selectedEleve.prenom} {selectedEleve.nom}
              </p>
              {selectedEleve.adresse && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {selectedEleve.adresse}
                </p>
              )}
            </div>

            <div className="p-6">
              {availableBuses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun bus disponible</p>
                  <p className="text-sm mt-1">Tous les bus sont pleins ou inactifs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    {availableBuses.length} bus disponible(s):
                  </p>
                  {availableBuses.map((bus) => (
                    <div 
                      key={bus.id}
                      className="p-4 rounded-2xl border-2 border-gray-100 hover:border-amber-200 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg">{bus.numero}</h3>
                          <p className="text-sm text-gray-500">{bus.marque} {bus.modele}</p>
                          <p className="text-sm text-gray-400">Trajet: {bus.trajet?.nom || 'Non assigné'}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Capacité: {bus.elevesInscrits}/{bus.capacite}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            bus.placesRestantes > 5 ? 'text-green-500' : 'text-orange-500'
                          }`}>
                            {bus.placesRestantes}
                          </p>
                          <p className="text-xs text-gray-400">places restantes</p>
                          <Button
                            onClick={() => handleAffectBus(bus.id)}
                            className="mt-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                            size="sm"
                          >
                            Affecter
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedEleve(null);
                }}
                className="rounded-xl"
              >
                Fermer
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}