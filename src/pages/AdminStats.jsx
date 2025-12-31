import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, presencesAPI, paiementsAPI, accidentsAPI, busAPI, inscriptionsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
import { 
  BarChart3, Calendar, Users, Bus, CreditCard, 
  AlertCircle, TrendingUp, Filter, ArrowLeft
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
  
  const [data, setData] = useState({
    eleves: [],
    presences: [],
    paiements: [],
    accidents: [],
    inscriptions: [],
    buses: []
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
    try {
      const [elevesRes, paiementsRes, accidentsRes, busesRes, inscriptionsRes] = await Promise.all([
        elevesAPI.getAll(),
        paiementsAPI.getAll(),
        accidentsAPI.getAll(),
        busAPI.getAll(),
        inscriptionsAPI.getAll()
      ]);
      
      // Extraire les données avec gestion de différents formats de réponse
      const eleves = elevesRes?.data || elevesRes || [];
      const paiements = paiementsRes?.data || paiementsRes || [];
      const accidents = accidentsRes?.data || accidentsRes || [];
      const buses = busesRes?.data || busesRes || [];
      const inscriptions = inscriptionsRes?.data || inscriptionsRes || [];
      
      // Note: presencesAPI n'est pas dans le SQL d'origine, 
      // vous devrez peut-être créer une table presences ou utiliser une autre logique
      let presences = [];
      try {
        const presencesRes = await presencesAPI.getByDate(new Date().toISOString().split('T')[0]);
        presences = presencesRes?.data || presencesRes || [];
      } catch (err) {
        console.warn('Présences non disponibles:', err);
      }
      
      setData({ eleves, presences, paiements, accidents, inscriptions, buses });
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
    setLoading(false);
  };

  const filterByDate = (items, dateField = 'date') => {
    return items.filter(item => {
      const itemDate = item[dateField] || item.date_creation;
      if (!itemDate) return false;
      const date = new Date(itemDate);
      return date >= new Date(dateDebut) && date <= new Date(dateFin + 'T23:59:59');
    });
  };

  const filterByBusAndGroupe = (items) => {
    return items.filter(item => {
      const eleve = data.eleves.find(e => e.id === item.eleve_id);
      if (!eleve) return true;
      
      const inscription = data.inscriptions.find(i => i.eleve_id === eleve.id);
      const matchBus = busFilter === 'all' || inscription?.bus_id?.toString() === busFilter;
      
      // Note: Le champ 'groupe' n'existe pas dans le SQL original
      // Vous devrez peut-être l'ajouter à la table eleves
      const matchGroupe = groupeFilter === 'all' || eleve.groupe === groupeFilter;
      return matchBus && matchGroupe;
    });
  };

  // Stats calculations
  const filteredPresences = filterByBusAndGroupe(filterByDate(data.presences));
  const filteredPaiements = filterByDate(data.paiements, 'date_paiement');
  const filteredAccidents = filterByDate(data.accidents, 'date');
  const filteredInscriptions = filterByDate(data.inscriptions, 'date_inscription');

  // Absences stats - adapter selon votre structure de données
  const absencesMatin = filteredPresences.filter(p => !p.present_matin).length;
  const absencesSoir = filteredPresences.filter(p => !p.present_soir).length;
  const presencesMatin = filteredPresences.filter(p => p.present_matin).length;
  const presencesSoir = filteredPresences.filter(p => p.present_soir).length;

  // Gender distribution - adapter selon votre structure
  const garcons = data.eleves.filter(e => e.sexe === 'Masculin' || e.sexe === 'M').length;
  const filles = data.eleves.filter(e => e.sexe === 'Féminin' || e.sexe === 'F').length;

  // Level distribution - Le champ 'niveau' n'existe pas dans le SQL
  // Vous pouvez l'extraire de 'classe' ou ajouter un champ 'niveau'
  const primaire = data.eleves.filter(e => {
    const classe = e.classe?.toLowerCase() || '';
    return classe.includes('cp') || classe.includes('ce') || classe.includes('cm');
  }).length;
  
  const college = data.eleves.filter(e => {
    const classe = e.classe?.toLowerCase() || '';
    return classe.includes('6') || classe.includes('5') || classe.includes('4') || classe.includes('3');
  }).length;
  
  const lycee = data.eleves.filter(e => {
    const classe = e.classe?.toLowerCase() || '';
    return classe.includes('2nd') || classe.includes('1ère') || classe.includes('terminale');
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
      const eleve = data.eleves.find(e => e.id === parseInt(eleveId));
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
      <div className="mb-4">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>
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

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <p className="text-2xl font-bold text-gray-800">{data.eleves.length}</p>
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
                  <p className="text-2xl font-bold text-gray-800">{filteredPaiements.length}</p>
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