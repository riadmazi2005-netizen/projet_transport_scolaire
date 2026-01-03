import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { paiementsAPI, elevesAPI, tuteursAPI, inscriptionsAPI, demandesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
import { 
  CreditCard, Search, Filter, CheckCircle, Calendar, User, ArrowLeft, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminPaiements() {
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [tuteurs, setTuteurs] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadData();
    
    // Rafraîchir les données toutes les 30 secondes pour avoir des paiements à jour
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [paiementsRes, elevesRes, tuteursRes, inscriptionsRes, demandesRes] = await Promise.all([
        paiementsAPI.getAll(),
        elevesAPI.getAll(),
        tuteursAPI.getAll(),
        inscriptionsAPI.getAll(),
        demandesAPI.getAll()
      ]);
      
      const paiementsData = paiementsRes?.data || paiementsRes || [];
      const elevesData = elevesRes?.data || elevesRes || [];
      const tuteursData = tuteursRes?.data || tuteursRes || [];
      const inscriptionsData = inscriptionsRes?.data || inscriptionsRes || [];
      const demandesData = demandesRes?.data || demandesRes || [];
      
      // Créer une liste combinée des paiements :
      // 1. Paiements de la table paiements (paiements mensuels récurrents)
      const paiementsMensuels = Array.isArray(paiementsData) ? paiementsData.map(p => {
        const inscription = Array.isArray(inscriptionsData) ? inscriptionsData.find(i => i.id === p.inscription_id) : null;
        const eleve = inscription && Array.isArray(elevesData) ? elevesData.find(e => e.id === inscription.eleve_id) : null;
        const tuteur = eleve && Array.isArray(tuteursData) ? tuteursData.find(t => t.id === eleve.tuteur_id) : null;
        
        return {
          ...p,
          montant: parseFloat(p.montant) || 0,
          eleve,
          tuteur,
          inscription,
          type_paiement: 'mensuel' // Paiement mensuel récurrent
        };
      }) : [];
      
      // 2. Demandes payées (paiements initiaux d'inscription)
      const demandesPayees = Array.isArray(demandesData) ? demandesData
        .filter(d => d.type_demande === 'inscription' && d.statut === 'Payée' && d.montant_facture)
        .map(d => {
          const eleve = Array.isArray(elevesData) ? elevesData.find(e => e.id === d.eleve_id) : null;
          const tuteur = eleve && Array.isArray(tuteursData) ? tuteursData.find(t => t.id === eleve.tuteur_id) : null;
          const inscription = Array.isArray(inscriptionsData) ? inscriptionsData.find(i => i.eleve_id === eleve?.id) : null;
          
          // Extraire la date de traitement comme date de paiement (TIMESTAMP -> DATE)
          let datePaiementStr = d.date_traitement || d.date_creation;
          if (datePaiementStr) {
            // Si c'est un TIMESTAMP (format: "YYYY-MM-DD HH:MM:SS"), prendre seulement la date
            if (typeof datePaiementStr === 'string' && datePaiementStr.includes(' ')) {
              datePaiementStr = datePaiementStr.split(' ')[0];
            }
            // Si c'est déjà une date, utiliser directement
          } else {
            // Par défaut, utiliser aujourd'hui
            datePaiementStr = new Date().toISOString().split('T')[0];
          }
          
          const datePaiement = new Date(datePaiementStr);
          
          return {
            id: `demande_${d.id}`, // ID unique pour éviter les conflits
            inscription_id: inscription?.id || null,
            montant: parseFloat(d.montant_facture) || 0,
            mois: datePaiement.getMonth() + 1,
            annee: datePaiement.getFullYear(),
            date_paiement: datePaiementStr, // Date au format YYYY-MM-DD
            mode_paiement: 'Espèces', // Par défaut, car non spécifié dans la demande
            statut: 'Payé',
            date_creation: d.date_traitement || d.date_creation,
            eleve,
            tuteur,
            inscription,
            demande: d,
            type_paiement: 'initial' // Paiement initial d'inscription
          };
        }) : [];
      
      // Combiner les deux listes
      const tousLesPaiements = [...paiementsMensuels, ...demandesPayees];
      
      // Trier par date de paiement (plus récent en premier)
      tousLesPaiements.sort((a, b) => {
        const dateA = new Date(a.date_paiement || 0);
        const dateB = new Date(b.date_paiement || 0);
        return dateB - dateA;
      });
      
      setPaiements(tousLesPaiements);
      setEleves(Array.isArray(elevesData) ? elevesData : []);
      setTuteurs(Array.isArray(tuteursData) ? tuteursData : []);
      setInscriptions(Array.isArray(inscriptionsData) ? inscriptionsData : []);
    } catch (err) {
      console.error('Erreur lors du chargement des paiements:', err);
      setError('Erreur lors du chargement des paiements. Veuillez réessayer.');
      setPaiements([]);
      setEleves([]);
      setTuteurs([]);
      setInscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPaiements = paiements.filter(p => {
    const matchSearch = searchTerm === '' ||
      p.eleve?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.eleve?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tuteur?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tuteur?.prenom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || p.statut === statusFilter;
    
    const matchDate = !dateFilter || p.date_paiement?.startsWith(dateFilter);
    
    return matchSearch && matchStatus && matchDate;
  });

  const totalMontant = filteredPaiements
    .filter(p => p.statut === 'Payé')
    .reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);

  const getStatusBadge = (statut) => {
    const styles = {
      'En attente': 'bg-yellow-100 text-yellow-700',
      'Payé': 'bg-green-100 text-green-700',
      'Échoué': 'bg-red-100 text-red-700'
    };
    return styles[statut] || 'bg-gray-100 text-gray-700';
  };

  const getModePaiementBadge = (mode) => {
    const styles = {
      'Espèces': 'bg-blue-100 text-blue-700',
      'Virement': 'bg-purple-100 text-purple-700',
      'Carte bancaire': 'bg-teal-100 text-teal-700',
      'Chèque': 'bg-orange-100 text-orange-700'
    };
    return styles[mode] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Si la date est invalide, retourner la string originale
      return format(date, 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return dateString; // En cas d'erreur, retourner la string originale
    }
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
    <AdminLayout title="Gestion des Paiements">
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>
        <Button
          onClick={() => loadData()}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}
      
      {/* Summary Card */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl p-6 mb-6 text-white"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Total des paiements validés</h2>
              <p className="opacity-90">Période: {dateFilter || 'Tous'}</p>
            </div>
            <div className="text-4xl font-bold mt-4 md:mt-0">
              {totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <CreditCard className="w-6 h-6 text-teal-500" />
              Historique des Paiements
            </h2>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40 h-12 rounded-xl">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="Payé">Payés</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Échoué">Échoués</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full md:w-48 h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredPaiements.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun paiement trouvé</p>
              </div>
            ) : (
              filteredPaiements.map((paiement) => {
                return (
                  <div key={paiement.id} className="p-6 hover:bg-teal-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {paiement.eleve ? `${paiement.eleve.nom} ${paiement.eleve.prenom}` : 'Élève inconnu'}
                          </h3>
                          {paiement.tuteur && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Tuteur: {paiement.tuteur.prenom} {paiement.tuteur.nom}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2 text-sm">
                            <span className={`px-2 py-1 rounded-lg ${getModePaiementBadge(paiement.mode_paiement)}`}>
                              {paiement.mode_paiement}
                            </span>
                            {paiement.mois && paiement.annee && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">
                                {paiement.mois}/{paiement.annee}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">
                          {(typeof paiement.montant === 'number' ? paiement.montant : parseFloat(paiement.montant || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                        </p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(paiement.statut)}`}>
                          {paiement.statut === 'Payé' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                          {paiement.statut}
                        </span>
                        <p className="text-xs text-gray-400 mt-2 flex items-center justify-end gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(paiement.date_paiement)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
    </AdminLayout>
  );
}