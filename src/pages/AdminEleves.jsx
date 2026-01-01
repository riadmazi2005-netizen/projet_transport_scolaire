import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, tuteursAPI, inscriptionsAPI, busAPI, trajetsAPI, demandesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminLayout from '../components/AdminLayout';
import { 
  GraduationCap, Search, User, ArrowLeft, Filter, Bus, MapPin, Phone, Calendar, Key
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

export default function AdminEleves() {
  const navigate = useNavigate();
  const [eleves, setEleves] = useState([]);
  const [tuteurs, setTuteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Charger toutes les données nécessaires
      const results = await Promise.allSettled([
        elevesAPI.getAll(),
        tuteursAPI.getAll(),
        inscriptionsAPI.getAll(),
        busAPI.getAll(),
        trajetsAPI.getAll(),
        demandesAPI.getAll()
      ]);
      
      // Extraire les données avec gestion de différents formats
      const elevesArray = results[0].status === 'fulfilled'
        ? (Array.isArray(results[0].value?.data) ? results[0].value.data : (Array.isArray(results[0].value) ? results[0].value : []))
        : [];
      const tuteursArray = results[1].status === 'fulfilled'
        ? (Array.isArray(results[1].value?.data) ? results[1].value.data : (Array.isArray(results[1].value) ? results[1].value : []))
        : [];
      const inscriptionsArray = results[2].status === 'fulfilled'
        ? (Array.isArray(results[2].value?.data) ? results[2].value.data : (Array.isArray(results[2].value) ? results[2].value : []))
        : [];
      const busesArray = results[3].status === 'fulfilled'
        ? (Array.isArray(results[3].value?.data) ? results[3].value.data : (Array.isArray(results[3].value) ? results[3].value : []))
        : [];
      const trajetsArray = results[4].status === 'fulfilled'
        ? (Array.isArray(results[4].value?.data) ? results[4].value.data : (Array.isArray(results[4].value) ? results[4].value : []))
        : [];
      const demandesArray = results[5].status === 'fulfilled'
        ? (Array.isArray(results[5].value?.data) ? results[5].value.data : (Array.isArray(results[5].value) ? results[5].value : []))
        : [];
      
      // Filtrer uniquement les demandes d'inscription
      const demandesInscription = Array.isArray(demandesArray) ? demandesArray.filter(d => d.type_demande === 'inscription') : [];
      
      // Filtrer les élèves qui ont une inscription active OU une demande avec statut "Inscrit"
      const elevesInscrits = Array.isArray(elevesArray) ? elevesArray.filter(e => {
        const inscription = Array.isArray(inscriptionsArray) ? inscriptionsArray.find(i => i.eleve_id === e.id && i.statut === 'Active') : null;
        const demandeInscription = Array.isArray(demandesInscription) ? demandesInscription
          .filter(d => d.eleve_id === e.id)
          .sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0))[0] : null;
        // Inclure si inscription active OU demande avec statut "Inscrit"
        return inscription !== null || demandeInscription?.statut === 'Inscrit';
      }) : [];
      
      // Enrichir les élèves avec toutes les informations
      const elevesWithDetails = elevesInscrits.map(e => {
        const tuteur = Array.isArray(tuteursArray) ? tuteursArray.find(t => t.id === e.tuteur_id) : null;
        const inscription = Array.isArray(inscriptionsArray) ? inscriptionsArray.find(i => i.eleve_id === e.id && i.statut === 'Active') : null;
        const bus = inscription?.bus_id && Array.isArray(busesArray) ? busesArray.find(b => b.id === inscription.bus_id) : null;
        const trajet = bus?.trajet_id && Array.isArray(trajetsArray) ? trajetsArray.find(t => t.id === bus.trajet_id) : null;
        // Trouver la demande d'inscription pour obtenir type_transport, abonnement, groupe
        const demandeInscription = Array.isArray(demandesInscription) ? demandesInscription
          .filter(d => d.eleve_id === e.id)
          .sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0))[0] : null;
        
        // Déterminer le statut à afficher : "Inscrit" si la demande est "Inscrit", sinon utiliser le statut de l'inscription
        const statutAffiche = demandeInscription?.statut === 'Inscrit' ? 'Inscrit' : (inscription?.statut || e.statut);
        
        return {
          ...e,
          tuteur,
          inscription,
          bus,
          trajet,
          demande_inscription: demandeInscription,
          statut_affichage: statutAffiche,
          type_transport: demandeInscription?.type_transport || inscription?.type_transport || 'Non spécifié',
          type_abonnement: demandeInscription?.abonnement || inscription?.type_abonnement || 'Non spécifié',
          groupe: demandeInscription?.groupe || inscription?.groupe || e.groupe || 'Non spécifié'
        };
      });
      
      setEleves(elevesWithDetails);
      setTuteurs(tuteursArray);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données: ' + (err.message || 'Erreur de connexion au serveur'));
    } finally {
      setLoading(false);
    }
  };

  const filteredEleves = eleves.filter(e => {
    const matchSearch = 
      e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.classe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.adresse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.zone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tuteur?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tuteur?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tuteur?.telephone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || e.inscription?.statut === statusFilter || e.statut === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (statut) => {
    const styles = {
      'Active': 'bg-green-100 text-green-700',
      'Suspendue': 'bg-orange-100 text-orange-700',
      'Terminée': 'bg-gray-100 text-gray-700',
      'Actif': 'bg-green-100 text-green-700',
      'Inactif': 'bg-yellow-100 text-yellow-700',
      'Inscrit': 'bg-emerald-100 text-emerald-700'
    };
    return styles[statut] || 'bg-gray-100 text-gray-700';
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
    <AdminLayout title="Gestion des Élèves">
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
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6"
      >
        <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="w-7 h-7" />
            Liste des Élèves
          </h1>
          <p className="text-blue-100 mt-1">{eleves.length} élève(s) inscrit(s) au total</p>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, prénom, classe, adresse, zone, tuteur..."
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspendue">Suspendue</SelectItem>
                <SelectItem value="Terminée">Terminée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100">
          {filteredEleves.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun élève trouvé</p>
            </div>
          ) : (
            filteredEleves.map((eleve) => (
              <div key={eleve.id} className="p-6 hover:bg-blue-50/50 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {eleve.nom} {eleve.prenom}
                      </h3>
                      
                      {/* Informations principales */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        {/* Classe et Groupe */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Classe:</span>
                          <span>{eleve.classe || 'Non spécifié'}</span>
                          {eleve.groupe && eleve.groupe !== 'Non spécifié' && (
                            <>
                              <span>•</span>
                              <span className="font-medium">Groupe:</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">{eleve.groupe}</span>
                            </>
                          )}
                        </div>

                        {/* Adresse et Zone */}
                        {eleve.adresse && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span className="font-medium">Adresse:</span>
                            <span>{eleve.adresse}</span>
                          </div>
                        )}
                        {eleve.zone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">Zone:</span>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md">{eleve.zone}</span>
                          </div>
                        )}

                        {/* Tuteur - Nom et Téléphone */}
                        {eleve.tuteur && (
                          <>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4 text-purple-500" />
                              <span className="font-medium">Tuteur:</span>
                              <span>{eleve.tuteur.prenom} {eleve.tuteur.nom}</span>
                            </div>
                            {eleve.tuteur.telephone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-indigo-500" />
                                <span className="font-medium">Tél:</span>
                                <span>{eleve.tuteur.telephone}</span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Bus affecté */}
                        {eleve.bus && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Bus className="w-4 h-4 text-amber-500" />
                            <span className="font-medium">Bus:</span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md font-semibold">
                              {eleve.bus.numero || eleve.bus.immatriculation}
                            </span>
                          </div>
                        )}

                        {/* Type de transport */}
                        {eleve.type_transport && eleve.type_transport !== 'Non spécifié' && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">Transport:</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md">{eleve.type_transport}</span>
                          </div>
                        )}

                        {/* Type d'abonnement */}
                        {eleve.type_abonnement && eleve.type_abonnement !== 'Non spécifié' && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">Abonnement:</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">{eleve.type_abonnement}</span>
                          </div>
                        )}

                        {/* Date de début d'inscription */}
                        {eleve.inscription?.date_debut && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-red-500" />
                            <span className="font-medium">Inscription depuis:</span>
                            <span>{format(new Date(eleve.inscription.date_debut), 'dd/MM/yyyy')}</span>
                          </div>
                        )}

                        {/* Code de vérification */}
                        {eleve.demande_inscription?.code_verification && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Key className="w-4 h-4 text-teal-500" />
                            <span className="font-medium">Code de vérification:</span>
                            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-md font-mono font-semibold">
                              {eleve.demande_inscription.code_verification}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusBadge(eleve.statut_affichage || eleve.inscription?.statut || eleve.statut)}`}>
                      {eleve.statut_affichage || eleve.inscription?.statut || eleve.statut}
                    </span>
                    {eleve.inscription?.montant_mensuel && (
                      <span className="text-sm text-gray-600 font-semibold">
                        {eleve.inscription.montant_mensuel} DH/mois
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </AdminLayout>
  );
}

