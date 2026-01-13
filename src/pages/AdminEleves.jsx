import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, tuteursAPI, inscriptionsAPI, busAPI, trajetsAPI, demandesAPI, zonesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminLayout from '../components/AdminLayout';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  GraduationCap, Search, User, ArrowLeft, Filter, Bus, MapPin, Phone, Calendar, Key, Edit, Trash2, XCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

export default function AdminEleves() {
  const navigate = useNavigate();
  const [eleves, setEleves] = useState([]);
  const [tuteurs, setTuteurs] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [classeFilter, setClasseFilter] = useState('all');
  const [groupeFilter, setGroupeFilter] = useState('all');
  const [typeTransportFilter, setTypeTransportFilter] = useState('all');
  const [typeAbonnementFilter, setTypeAbonnementFilter] = useState('all');
  const [error, setError] = useState(null);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, eleve: null });
  const [editForm, setEditForm] = useState({
    nom: '',
    prenom: '',
    classe: '',
    adresse: '',
    zone: ''
  });

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
        demandesAPI.getAll(),
        zonesAPI.getAll()
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
      const zonesArray = results[6].status === 'fulfilled'
        ? (Array.isArray(results[6].value?.data) ? results[6].value.data : (Array.isArray(results[6].value) ? results[6].value : []))
        : [];

      // Filtrer uniquement les demandes d'inscription
      const demandesInscription = Array.isArray(demandesArray) ? demandesArray.filter(d => d.type_demande === 'inscription') : [];

      // Filtrer les élèves qui ont une inscription active OU une demande avec statut "Inscrit", "Validée", "Payée" ou "En attente de paiement"
      // Exclure explicitement les élèves avec des demandes refusées
      const elevesInscrits = Array.isArray(elevesArray) ? elevesArray.filter(e => {
        const inscription = Array.isArray(inscriptionsArray) ? inscriptionsArray.find(i => i.eleve_id === e.id && i.statut === 'Active') : null;
        const demandeInscription = Array.isArray(demandesInscription) ? demandesInscription
          .filter(d => d.eleve_id === e.id)
          .sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0))[0] : null;

        // Exclure si la demande la plus récente est refusée
        if (demandeInscription?.statut === 'Refusée') {
          return false;
        }

        // Inclure si inscription active OU demande avec statut valide (Inscrit, Validée, Payée, En attente de paiement, etc.)
        const statutsValides = ['Inscrit', 'Validée', 'Payée', 'En attente de paiement', 'En cours de traitement'];
        return inscription !== null || (demandeInscription && statutsValides.includes(demandeInscription.statut));
      }) : [];

      // Enrichir les élèves avec toutes les informations
      const elevesWithDetails = elevesInscrits.map(e => {
        const tuteur = Array.isArray(tuteursArray) ? tuteursArray.find(t => t.id == e.tuteur_id) : null;
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
          groupe: demandeInscription?.groupe || inscription?.groupe || e.groupe || 'Non spécifié',
          zone: demandeInscription?.zone_geographique || null
        };
      });

      setEleves(elevesWithDetails);
      setTuteurs(tuteursArray);
      setZones(zonesArray.filter(z => z.actif !== false));
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données: ' + (err.message || 'Erreur de connexion au serveur'));
    } finally {
      setLoading(false);
    }
  };

  const filteredEleves = eleves.filter(e => {
    // Recherche globale (nom, prénom, ID)
    const matchSearch = searchTerm === '' ||
      e.id?.toString().includes(searchTerm) ||
      e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.classe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.adresse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.zone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tuteur?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tuteur?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tuteur?.telephone?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtre par statut
    const matchStatus = statusFilter === 'all' || e.inscription?.statut === statusFilter || e.statut_affichage === statusFilter;

    // Filtre par zone
    const matchZone = zoneFilter === 'all' || e.zone === zoneFilter || e.demande_inscription?.zone_geographique === zoneFilter;

    // Filtre par classe
    const matchClasse = classeFilter === 'all' || e.classe === classeFilter;

    // Filtre par groupe
    const matchGroupe = groupeFilter === 'all' || e.groupe === groupeFilter || e.demande_inscription?.groupe === groupeFilter;

    // Filtre par type de transport
    const matchTypeTransport = typeTransportFilter === 'all' ||
      e.type_transport === typeTransportFilter ||
      e.demande_inscription?.type_transport === typeTransportFilter;

    // Filtre par type d'abonnement
    const matchTypeAbonnement = typeAbonnementFilter === 'all' ||
      e.type_abonnement === typeAbonnementFilter ||
      e.demande_inscription?.abonnement === typeAbonnementFilter;

    return matchSearch && matchStatus && matchZone && matchClasse && matchGroupe && matchTypeTransport && matchTypeAbonnement;
  });

  // Extraire les valeurs uniques pour les filtres
  const classesUniques = [...new Set(eleves.map(e => e.classe).filter(Boolean))].sort();
  const groupesUniques = [...new Set(eleves.map(e => e.groupe || e.demande_inscription?.groupe).filter(Boolean))].sort();
  const typesTransportUniques = [...new Set(eleves.map(e => e.type_transport || e.demande_inscription?.type_transport).filter(Boolean))].sort();
  const typesAbonnementUniques = [...new Set(eleves.map(e => e.type_abonnement || e.demande_inscription?.abonnement).filter(Boolean))].sort();

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

  const handleEdit = (eleve) => {
    setSelectedEleve(eleve);
    setEditForm({
      nom: eleve.nom || '',
      prenom: eleve.prenom || '',
      classe: eleve.classe || '',
      adresse: eleve.adresse || '',
      zone: eleve.zone || eleve.demande_inscription?.zone_geographique || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEleve) return;

    setError(null);
    try {
      await elevesAPI.update(selectedEleve.id, {
        nom: editForm.nom,
        prenom: editForm.prenom,
        classe: editForm.classe,
        adresse: editForm.adresse
      });

      setShowEditModal(false);
      setSelectedEleve(null);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
      setError('Erreur lors de la modification de l\'élève: ' + (err.message || 'Erreur inconnue'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.eleve) return;

    setError(null);
    try {
      await elevesAPI.delete(deleteConfirm.eleve.id);
      setDeleteConfirm({ show: false, eleve: null });
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression de l\'élève: ' + (err.message || 'Erreur inconnue'));
      setDeleteConfirm({ show: false, eleve: null });
    }
  };

  const handleDeleteClick = (eleve) => {
    setDeleteConfirm({ show: true, eleve });
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
          <div className="space-y-4">
            {/* Recherche globale */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher par ID, nom, prénom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>

            {/* Filtres avancés */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspendue">Suspendue</SelectItem>
                  <SelectItem value="Terminée">Terminée</SelectItem>
                  <SelectItem value="Inscrit">Inscrit</SelectItem>
                </SelectContent>
              </Select>

              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="h-12 rounded-xl">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les zones</SelectItem>
                  {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.nom}>{zone.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={classeFilter} onValueChange={setClasseFilter}>
                <SelectTrigger className="h-12 rounded-xl">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classesUniques.map(classe => (
                    <SelectItem key={classe} value={classe}>{classe}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={groupeFilter} onValueChange={setGroupeFilter}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Groupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  {groupesUniques.map(groupe => (
                    <SelectItem key={groupe} value={groupe}>{groupe}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeTransportFilter} onValueChange={setTypeTransportFilter}>
                <SelectTrigger className="h-12 rounded-xl">
                  <Bus className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Transport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {typesTransportUniques.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeAbonnementFilter} onValueChange={setTypeAbonnementFilter}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Abonnement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les abonnements</SelectItem>
                  {typesAbonnementUniques.map(abonnement => (
                    <SelectItem key={abonnement} value={abonnement}>{abonnement}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusBadge(eleve.statut_affichage || eleve.inscription?.statut || eleve.statut)}`}>
                      {eleve.statut_affichage || eleve.inscription?.statut || eleve.statut}
                    </span>
                    {eleve.inscription?.montant_mensuel && (
                      <span className="text-sm text-gray-600 font-semibold">
                        {eleve.inscription.montant_mensuel} DH/mois
                      </span>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(eleve)}
                        className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(eleve)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Modal de modification */}
      {showEditModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-yellow-500">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit className="w-6 h-6" />
                  Modifier l'élève
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEleve(null);
                  }}
                  className="text-white hover:text-amber-100 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">Nom</Label>
                  <Input
                    value={editForm.nom}
                    onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                    className="rounded-xl border-2 border-gray-200 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">Prénom</Label>
                  <Input
                    value={editForm.prenom}
                    onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                    className="rounded-xl border-2 border-gray-200 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">Classe</Label>
                  <Input
                    value={editForm.classe}
                    onChange={(e) => setEditForm({ ...editForm, classe: e.target.value })}
                    className="rounded-xl border-2 border-gray-200 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">Adresse</Label>
                  <Input
                    value={editForm.adresse}
                    onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })}
                    className="rounded-xl border-2 border-gray-200 focus:border-amber-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">Zone géographique</Label>
                  <Select
                    value={editForm.zone}
                    onValueChange={(value) => setEditForm({ ...editForm, zone: value })}
                  >
                    <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-amber-500">
                      <SelectValue placeholder="Sélectionner une zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune zone</SelectItem>
                      {zones.map(zone => (
                        <SelectItem key={zone.id} value={zone.nom}>{zone.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEleve(null);
                  }}
                  variant="outline"
                  className="rounded-xl"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Supprimer l'élève"
        message={deleteConfirm.eleve ? `Êtes-vous sûr de vouloir supprimer l'élève ${deleteConfirm.eleve.prenom} ${deleteConfirm.eleve.nom} ?` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, eleve: null })}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </AdminLayout>
  );
}

