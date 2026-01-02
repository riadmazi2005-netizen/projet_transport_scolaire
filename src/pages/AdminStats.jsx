import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, presencesAPI, paiementsAPI, accidentsAPI, busAPI, inscriptionsAPI, demandesAPI, tuteursAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
import { 
  BarChart3, Calendar, Users, Bus, CreditCard, 
  AlertCircle, TrendingUp, Filter, ArrowLeft, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminStats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [dateFin, setDateFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [periodePreset, setPeriodePreset] = useState('mois');
  const [busFilter, setBusFilter] = useState('all');
  const [groupeFilter, setGroupeFilter] = useState('all');
  const [classeFilter, setClasseFilter] = useState('all');
  const [niveauFilter, setNiveauFilter] = useState('all');
  
  const [data, setData] = useState({
    eleves: [],
    presences: [],
    paiements: [],
    accidents: [],
    inscriptions: [],
    buses: [],
    demandes: []
  });

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Set dates based on preset
    const today = new Date();
    switch (periodePreset) {
      case 'aujourdhui':
        setDateDebut(format(today, 'yyyy-MM-dd'));
        setDateFin(format(today, 'yyyy-MM-dd'));
        break;
      case 'hier':
        setDateDebut(format(subDays(today, 1), 'yyyy-MM-dd'));
        setDateFin(format(subDays(today, 1), 'yyyy-MM-dd'));
        break;
      case 'semaine':
        setDateDebut(format(subWeeks(today, 1), 'yyyy-MM-dd'));
        setDateFin(format(today, 'yyyy-MM-dd'));
        break;
      case 'mois':
        setDateDebut(format(subMonths(today, 1), 'yyyy-MM-dd'));
        setDateFin(format(today, 'yyyy-MM-dd'));
        break;
      case 'annee':
        setDateDebut(format(subYears(today, 1), 'yyyy-MM-dd'));
        setDateFin(format(today, 'yyyy-MM-dd'));
        break;
    }
  }, [periodePreset]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [elevesRes, paiementsRes, accidentsRes, busesRes, inscriptionsRes, demandesRes, tuteursRes] = await Promise.all([
        elevesAPI.getAll(),
        paiementsAPI.getAll(),
        accidentsAPI.getAll(),
        busAPI.getAll(),
        inscriptionsAPI.getAll(),
        demandesAPI.getAll(),
        tuteursAPI.getAll()
      ]);
      
      // Extraire les données avec gestion de différents formats de réponse
      const elevesArray = elevesRes?.data || elevesRes || [];
      const paiementsArray = paiementsRes?.data || paiementsRes || [];
      const accidents = accidentsRes?.data || accidentsRes || [];
      const buses = busesRes?.data || busesRes || [];
      const inscriptions = inscriptionsRes?.data || inscriptionsRes || [];
      const demandesArray = demandesRes?.data || demandesRes || [];
      const tuteursArray = tuteursRes?.data || tuteursRes || [];
      
      // Filtrer uniquement les demandes d'inscription
      const demandesInscription = Array.isArray(demandesArray) ? demandesArray.filter(d => d.type_demande === 'inscription') : [];
      
      // Filtrer les élèves pour exclure ceux avec des demandes refusées (comme dans AdminEleves)
      const eleves = Array.isArray(elevesArray) ? elevesArray.filter(e => {
        const demandeInscription = Array.isArray(demandesInscription) ? demandesInscription
          .filter(d => d.eleve_id === e.id)
          .sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0))[0] : null;
        
        // Exclure si la demande la plus récente est refusée
        if (demandeInscription?.statut === 'Refusée') {
          return false;
        }
        
        // Inclure si inscription active OU demande avec statut valide
        const inscription = Array.isArray(inscriptions) ? inscriptions.find(i => i.eleve_id === e.id && i.statut === 'Active') : null;
        const statutsValides = ['Inscrit', 'Validée', 'Payée', 'En attente de paiement', 'En cours de traitement'];
        return inscription !== null || (demandeInscription && statutsValides.includes(demandeInscription.statut));
      }) : [];
      
      // Combiner les paiements (mensuels + demandes payées) comme dans AdminPaiements
      const paiementsMensuels = Array.isArray(paiementsArray) ? paiementsArray : [];
      const demandesPayees = Array.isArray(demandesInscription) ? demandesInscription
        .filter(d => d.statut === 'Payée' && d.montant_facture)
        .map(d => {
          let datePaiementStr = d.date_traitement || d.date_creation;
          if (datePaiementStr) {
            if (typeof datePaiementStr === 'string' && datePaiementStr.includes(' ')) {
              datePaiementStr = datePaiementStr.split(' ')[0];
            }
          } else {
            datePaiementStr = new Date().toISOString().split('T')[0];
          }
          
          return {
            id: `demande_${d.id}`,
            montant: parseFloat(d.montant_facture) || 0,
            date_paiement: datePaiementStr,
            statut: 'Payé',
            type_paiement: 'initial'
          };
        }) : [];
      
      const paiements = [...paiementsMensuels, ...demandesPayees];
      
      // Note: presencesAPI n'est pas dans le SQL d'origine, 
      // vous devrez peut-être créer une table presences ou utiliser une autre logique
      let presences = [];
      try {
        const presencesRes = await presencesAPI.getByDate(new Date().toISOString().split('T')[0]);
        presences = presencesRes?.data || presencesRes || [];
      } catch (err) {
        console.warn('Présences non disponibles:', err);
      }
      
      setData({ eleves, presences, paiements, accidents, inscriptions, buses, demandes: demandesArray, tuteurs: tuteursArray });
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (items, dateField = 'date') => {
    return items.filter(item => {
      const itemDate = item[dateField] || item.date_creation;
      if (!itemDate) return false;
      const date = new Date(itemDate);
      return date >= new Date(dateDebut) && date <= new Date(dateFin + 'T23:59:59');
    });
  };

  // Définir les classes disponibles
  const classesDisponibles = ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP', '1AC', '2AC', '3AC', 'TC', '1BAC', '2BAC'];
  const niveauxDisponibles = ['Primaire', 'Collège', 'Lycée'];
  
  // Fonction pour déterminer le niveau d'une classe
  const getNiveauFromClasse = (classe) => {
    const classeUpper = (classe || '').toUpperCase();
    if (['1AP', '2AP', '3AP', '4AP', '5AP', '6AP'].includes(classeUpper)) return 'Primaire';
    if (['1AC', '2AC', '3AC'].includes(classeUpper)) return 'Collège';
    if (['TC', '1BAC', '2BAC'].includes(classeUpper)) return 'Lycée';
    return null;
  };

  // Filtrer les élèves pour les statistiques
  const filteredEleves = data.eleves.filter(eleve => {
    const inscription = data.inscriptions.find(i => i.eleve_id === eleve.id);
    const matchBus = busFilter === 'all' || inscription?.bus_id?.toString() === busFilter;
    const matchGroupe = groupeFilter === 'all' || eleve.groupe === groupeFilter;
    const matchClasse = classeFilter === 'all' || (eleve.classe && eleve.classe.toUpperCase() === classeFilter.toUpperCase());
    const eleveNiveau = getNiveauFromClasse(eleve.classe);
    const matchNiveau = niveauFilter === 'all' || eleveNiveau === niveauFilter;
    return matchBus && matchGroupe && matchClasse && matchNiveau;
  });

  const filterByBusAndGroupe = (items) => {
    return items.filter(item => {
      const eleve = data.eleves.find(e => e.id === item.eleve_id);
      if (!eleve) return true;
      
      const inscription = data.inscriptions.find(i => i.eleve_id === eleve.id);
      const matchBus = busFilter === 'all' || inscription?.bus_id?.toString() === busFilter;
      
      // Note: Le champ 'groupe' n'existe pas dans le SQL original
      // Vous devrez peut-être l'ajouter à la table eleves
      const matchGroupe = groupeFilter === 'all' || eleve.groupe === groupeFilter;
      
      // Filtre par classe
      const matchClasse = classeFilter === 'all' || (eleve.classe && eleve.classe.toUpperCase() === classeFilter.toUpperCase());
      
      // Filtre par niveau
      const eleveNiveau = getNiveauFromClasse(eleve.classe);
      const matchNiveau = niveauFilter === 'all' || eleveNiveau === niveauFilter;
      
      return matchBus && matchGroupe && matchClasse && matchNiveau;
    });
  };

  // Stats calculations
  const filteredPresences = filterByBusAndGroupe(filterByDate(data.presences));
  const filteredPaiements = filterByDate(data.paiements, 'date_paiement');
  const filteredAccidents = filterByDate(data.accidents, 'date');
  const filteredInscriptions = filterByDate(data.inscriptions, 'date_inscription');
  
  // Calculer le montant total des paiements validés
  const totalMontantPaiements = filteredPaiements
    .filter(p => p.statut === 'Payé')
    .reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);

  // Absences stats - adapter selon votre structure de données
  const absencesMatin = filteredPresences.filter(p => !p.present_matin).length;
  const absencesSoir = filteredPresences.filter(p => !p.present_soir).length;
  const presencesMatin = filteredPresences.filter(p => p.present_matin).length;
  const presencesSoir = filteredPresences.filter(p => p.present_soir).length;

  // Gender distribution - adapter selon votre structure (utiliser filteredEleves)
  const garcons = filteredEleves.filter(e => e.sexe === 'Masculin' || e.sexe === 'M').length;
  const filles = filteredEleves.filter(e => e.sexe === 'Féminin' || e.sexe === 'F').length;

  // Level distribution - Utiliser les vraies classes du système (avec toUpperCase pour normaliser) (utiliser filteredEleves)
  const primaire = filteredEleves.filter(e => {
    const classe = (e.classe || '').toUpperCase();
    return ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP'].includes(classe);
  }).length;
  
  const college = filteredEleves.filter(e => {
    const classe = (e.classe || '').toUpperCase();
    return ['1AC', '2AC', '3AC'].includes(classe);
  }).length;
  
  const lycee = filteredEleves.filter(e => {
    const classe = (e.classe || '').toUpperCase();
    return ['TC', '1BAC', '2BAC'].includes(classe);
  }).length;

  // Most absent students
  const absencesByEleve = {};
  filteredPresences.forEach(p => {
    if (!p.present_matin || !p.present_soir) {
      absencesByEleve[p.eleve_id] = (absencesByEleve[p.eleve_id] || 0) + 
        (!p.present_matin ? 1 : 0) + (!p.present_soir ? 1 : 0);
    }
  });
  
  const mostAbsent = Object.entries(absencesByEleve)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([eleveId, count]) => {
      const eleve = data.eleves.find(e => e.id === parseInt(eleveId));
      return { name: eleve ? `${eleve.prenom} ${eleve.nom}` : 'Inconnu', absences: count };
    });

  // Most present students
  const presencesByEleve = {};
  filteredPresences.forEach(p => {
    if (p.present_matin || p.present_soir) {
      presencesByEleve[p.eleve_id] = (presencesByEleve[p.eleve_id] || 0) + 
        (p.present_matin ? 1 : 0) + (p.present_soir ? 1 : 0);
    }
  });
  
  const mostPresent = Object.entries(presencesByEleve)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([eleveId, count]) => {
      const eleve = filteredEleves.find(e => e.id === parseInt(eleveId));
      return { name: eleve ? `${eleve.prenom} ${eleve.nom}` : 'Inconnu', presences: count };
    });

  const genderData = [
    { name: 'Garçons', value: garcons },
    { name: 'Filles', value: filles }
  ];

  const levelData = [
    { name: 'Primaire', value: primaire },
    { name: 'Collège', value: college },
    { name: 'Lycée', value: lycee }
  ];

  const presenceData = [
    { name: 'Matin', Présents: presencesMatin, Absents: absencesMatin },
    { name: 'Soir', Présents: presencesSoir, Absents: absencesSoir }
  ];

  // Statistiques avancées : Famille avec le plus d'inscriptions (utiliser filteredEleves)
  const inscriptionsParTuteur = {};
  filteredEleves.forEach(eleve => {
    if (eleve.tuteur_id) {
      const tuteurId = eleve.tuteur_id;
      inscriptionsParTuteur[tuteurId] = (inscriptionsParTuteur[tuteurId] || 0) + 1;
    }
  });
  
  const famillesTopInscriptions = Object.entries(inscriptionsParTuteur)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tuteurId, count]) => {
      const tuteur = Array.isArray(data.tuteurs) ? data.tuteurs.find(t => t.id === parseInt(tuteurId)) : null;
      return {
        name: tuteur ? `${tuteur.prenom || ''} ${tuteur.nom || ''}`.trim() || 'Inconnu' : 'Inconnu',
        inscriptions: count
      };
    });

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
    <AdminLayout title="Statistiques">
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
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header with filters */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              <BarChart3 className="w-7 h-7 text-indigo-500" />
              Statistiques & Historiques
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Select value={periodePreset} onValueChange={setPeriodePreset}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aujourdhui">Aujourd'hui</SelectItem>
                  <SelectItem value="hier">Hier</SelectItem>
                  <SelectItem value="semaine">Semaine dernière</SelectItem>
                  <SelectItem value="mois">Mois dernier</SelectItem>
                  <SelectItem value="annee">Année dernière</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => {
                    setDateDebut(e.target.value);
                    setPeriodePreset('custom');
                  }}
                  className="rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400">→</span>
                <Input
                  type="date"
                  value={dateFin}
                  onChange={(e) => {
                    setDateFin(e.target.value);
                    setPeriodePreset('custom');
                  }}
                  className="rounded-xl"
                />
              </div>

              <Select value={busFilter} onValueChange={setBusFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Bus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les bus</SelectItem>
                  {data.buses.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.numero}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={groupeFilter} onValueChange={setGroupeFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Groupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  <SelectItem value="A">Groupe A</SelectItem>
                  <SelectItem value="B">Groupe B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nouvelle ligne de filtres */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4">
              <Select value={niveauFilter} onValueChange={setNiveauFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  {niveauxDisponibles.map(niveau => (
                    <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={classeFilter} onValueChange={setClasseFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classesDisponibles.map(classe => (
                    <SelectItem key={classe} value={classe}>{classe}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Élèves</p>
                  <p className="text-2xl font-bold text-gray-800">{filteredEleves.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paiements</p>
                  <p className="text-2xl font-bold text-gray-800">{filteredPaiements.filter(p => p.statut === 'Payé').length}</p>
                  <p className="text-xs text-gray-400 mt-1">{totalMontantPaiements.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Accidents</p>
                  <p className="text-2xl font-bold text-gray-800">{filteredAccidents.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Inscriptions</p>
                  <p className="text-2xl font-bold text-gray-800">{filteredInscriptions.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Presence Chart */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Présences vs Absences</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={presenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Présents" fill="#10B981" />
                    <Bar dataKey="Absents" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gender Distribution */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition Filles / Garçons</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#EC4899'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Level Distribution */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition par Niveau</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {levelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Most Absent */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Élèves les plus absents</h3>
              {mostAbsent.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Aucune absence enregistrée</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mostAbsent} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="absences" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Most Present */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Élèves les plus présents</h3>
            {mostPresent.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Aucune présence enregistrée</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mostPresent} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="presences" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>
    </AdminLayout>
  );
}