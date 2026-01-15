import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, presencesAPI, paiementsAPI, accidentsAPI, busAPI, inscriptionsAPI, demandesAPI, tuteursAPI, signalementsAPI, essenceAPI, chauffeursAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
import {
  BarChart3, Calendar, Users, Bus, CreditCard,
  AlertCircle, TrendingUp, Filter, ArrowLeft, Fuel, Wrench, Trophy, UserX
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { format, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminStats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [dateFin, setDateFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [periodePreset, setPeriodePreset] = useState('mois');
  const [activeTab, setActiveTab] = useState('overview'); // overview, bus, students

  // Filters for detailed stats
  const [busFilter, setBusFilter] = useState('all');
  const [classeFilter, setClasseFilter] = useState('all');
  const [niveauFilter, setNiveauFilter] = useState('all');
  const [groupeFilter, setGroupeFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');

  const [data, setData] = useState({
    eleves: [], presences: [], paiements: [], accidents: [], inscriptions: [],
    buses: [], demandes: [], signalements: [], essence: [], tuteurs: [], chauffeurs: []
  });

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  useEffect(() => {
    if (isInitialLoad) { setIsInitialLoad(false); return; }
    if (dateDebut && dateFin) {
      const timeoutId = setTimeout(() => { loadData(); }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [dateDebut, dateFin]);

  useEffect(() => {
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
      const [elevesRes, paiementsRes, accidentsRes, busesRes, inscriptionsRes, demandesRes, tuteursRes, signalementsRes, essenceRes, chauffeursRes] = await Promise.allSettled([
        elevesAPI.getAll(), paiementsAPI.getAll(), accidentsAPI.getAll(), busAPI.getAll(),
        inscriptionsAPI.getAll(), demandesAPI.getAll(), tuteursAPI.getAll(), signalementsAPI.getAll(),
        essenceAPI.getAll(), chauffeursAPI.getAll()
      ]);

      const getVal = (res) => res.status === 'fulfilled' ? (res.value?.data || res.value || []) : [];
      const elevesArray = getVal(elevesRes);

      const eleves = Array.isArray(elevesArray) ? elevesArray : [];

      setData({
        eleves, presences: [], // Presences loaded separately
        paiements: getVal(paiementsRes), accidents: getVal(accidentsRes), inscriptions: getVal(inscriptionsRes),
        buses: getVal(busesRes), demandes: getVal(demandesRes), tuteurs: getVal(tuteursRes),
        signalements: getVal(signalementsRes), essence: getVal(essenceRes), chauffeurs: getVal(chauffeursRes)
      });

      loadPresences(new Date(dateDebut), new Date(dateFin));

    } catch (err) {
      console.error('Erreur chargement stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPresences = async (startDate, endDate) => {
    try {
      const presencesPromises = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        presencesPromises.push(presencesAPI.getByDate(dateStr).catch(() => ({ data: [] })));
      }
      const presencesResults = await Promise.allSettled(presencesPromises);
      const presences = presencesResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => {
          const d = result.value?.data || result.value || [];
          return Array.isArray(d) ? d : [];
        });
      setData(prev => ({ ...prev, presences }));
    } catch (e) { console.warn("Presences error", e); }
  };

  const filterByDate = (items, dateField = 'date') => {
    return items.filter(item => {
      const itemDate = item[dateField] || item.date_creation;
      if (!itemDate) return false;
      const date = new Date(itemDate);
      return date >= new Date(dateDebut) && date <= new Date(dateFin + 'T23:59:59');
    });
  };

  // --- STATS COMPUTATION ---
  const filteredAccidents = filterByDate(data.accidents, 'date');
  const filteredEssence = filterByDate(data.essence, 'date');
  const filteredSignalements = filterByDate(data.signalements, 'date');
  const filteredPresences = filterByDate(data.presences, 'date');

  // --- BUS VIEW HELPERS ---
  const getBusStats = () => {
    let relevantBuses = data.buses;
    if (busFilter !== 'all') {
      relevantBuses = data.buses.filter(b => b.id.toString() === busFilter);
    }

    return relevantBuses.map(bus => {
      const busAccidents = filteredAccidents.filter(a => a.bus_id === bus.id);
      const busEssence = filteredEssence.filter(e => e.bus_id === bus.id);
      const busSignalements = filteredSignalements.filter(s => s.bus_id === bus.id);

      const totalCost = busEssence.reduce((acc, curr) => acc + (parseFloat(curr.montant) || parseFloat(curr.prix_total) || 0), 0);

      return {
        ...bus,
        accidentsCount: busAccidents.length,
        fuelCost: totalCost,
        issuesCount: busSignalements.length
      };
    });
  };

  const busStatsData = getBusStats();
  const selectedBus = busFilter !== 'all' ? busStatsData[0] : null;

  // --- STUDENT VIEW HELPERS ---
  const getFilteredStudents = () => {
    return data.eleves.filter(eleve => {
      const getNiveauFromClasse = (classe) => {
        const classeUpper = (classe || '').toUpperCase();
        if (['1AP', '2AP', '3AP', '4AP', '5AP', '6AP'].includes(classeUpper)) return 'Primaire';
        if (['1AC', '2AC', '3AC'].includes(classeUpper)) return 'Collège';
        if (['TC', '1BAC', '2BAC'].includes(classeUpper)) return 'Lycée';
        return null;
      };

      const matchClasse = classeFilter === 'all' || (eleve.classe && eleve.classe.toUpperCase() === classeFilter.toUpperCase());
      const matchNiveau = niveauFilter === 'all' || getNiveauFromClasse(eleve.classe) === niveauFilter;
      const inscription = data.inscriptions.find(i => i.eleve_id === eleve.id);

      const groupeEleve = eleve.groupe;
      const groupeInscription = inscription?.groupe;
      const groupeDemande = data.demandes.find(d => d.eleve_id === eleve.id && d.type_demande === 'inscription')?.groupe;
      const studentGroup = groupeEleve || groupeInscription || groupeDemande;
      const matchGroupe = groupeFilter === 'all' || studentGroup === groupeFilter;

      const fullName = `${eleve.nom} ${eleve.prenom}`.toLowerCase();
      const matchSearch = studentSearch === '' || fullName.includes(studentSearch.toLowerCase());

      return matchClasse && matchNiveau && matchGroupe && matchSearch;
    });
  };

  const filteredStudents = getFilteredStudents();

  const studentAbsenceStats = filteredStudents.map(eleve => {
    const myPresences = filteredPresences.filter(p => p.eleve_id == eleve.id);
    const absMatin = myPresences.filter(p => p.present_matin == 0).length;
    const absSoir = myPresences.filter(p => p.present_soir == 0).length;
    return {
      ...eleve,
      totalAbsences: absMatin + absSoir
    };
  }).sort((a, b) => b.totalAbsences - a.totalAbsences);

  const topAbsentees = studentAbsenceStats.slice(0, 5);

  const classesDisponibles = ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP', '1AC', '2AC', '3AC', 'TC', '1BAC', '2BAC'];
  const groupesDisponibles = ['A', 'B'];


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
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="flex items-center gap-2 text-gray-500 hover:text-amber-600 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-amber-500" />
            Statistiques & Analyses
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <Select value={periodePreset} onValueChange={setPeriodePreset}>
            <SelectTrigger className="w-[140px] border-none bg-gray-50 h-10 rounded-xl">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semaine">Semaine</SelectItem>
              <SelectItem value="mois">Mois</SelectItem>
              <SelectItem value="annee">Année</SelectItem>
              <SelectItem value="custom">Personnalisé</SelectItem>
            </SelectContent>
          </Select>
          {(periodePreset === 'custom') && (
            <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg">
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="bg-transparent border-none outline-none text-gray-600 w-32" />
              <span className="text-gray-400">→</span>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="bg-transparent border-none outline-none text-gray-600 w-32" />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${activeTab === 'overview' ? 'text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BarChart3 className="w-4 h-4" /> Vue Globale
          {activeTab === 'overview' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-amber-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('bus')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${activeTab === 'bus' ? 'text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Bus className="w-4 h-4" /> Flotte & Bus
          {activeTab === 'bus' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-amber-500 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${activeTab === 'students' ? 'text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="w-4 h-4" /> Élèves & Présences
          {activeTab === 'students' && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-amber-500 rounded-t-full" />}
        </button>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-2">Total Élèves Filt.</div>
                <div className="text-3xl font-bold text-gray-800">{filteredStudents.length}</div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-2">Accidents</div>
                <div className="text-3xl font-bold text-red-500">{filteredAccidents.length}</div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-2">Dépenses Carburant</div>
                <div className="text-3xl font-bold text-amber-500">{Math.round(filteredEssence.reduce((s, e) => s + parseFloat(e.prix_total || e.montant || 0), 0))} DH</div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-2">Signalements</div>
                <div className="text-3xl font-bold text-orange-500">{filteredSignalements.length}</div>
              </div>
            </div>
            <div className="bg-blue-50 p-8 rounded-3xl text-center">
              <h3 className="text-blue-800 font-bold text-lg mb-2">Bienvenue dans le nouveau module statistiques</h3>
              <p className="text-blue-600">Utilisez les onglets ci-dessus pour accéder aux analyses détaillées par Bus ou par Élève.</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'bus' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 max-w-md">
              <Bus className="text-gray-400" />
              <Select value={busFilter} onValueChange={setBusFilter}>
                <SelectTrigger className="border-none shadow-none focus:ring-0">
                  <SelectValue placeholder="Sélectionner un bus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vue d'ensemble (Tous les bus)</SelectItem>
                  {data.buses.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.numero || b.immatriculation} - {b.marque}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {busFilter === 'all' ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-lg">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <Fuel className="w-5 h-5 text-amber-500" /> Consommation Carburant par Bus
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={busStatsData.sort((a, b) => b.fuelCost - a.fuelCost)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="numero" />
                          <YAxis />
                          <Tooltip contentStyle={{ borderRadius: '12px' }} />
                          <Bar dataKey="fuelCost" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Montant (DH)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-lg">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" /> Accidents par Bus
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={busStatsData.sort((a, b) => b.accidentsCount - a.accidentsCount)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="numero" />
                          <YAxis allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px' }} />
                          <Bar dataKey="accidentsCount" fill="#EF4444" radius={[4, 4, 0, 0]} name="Accidents" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Bus className="w-5 h-5 text-blue-600" /> Liste complète des bus
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-6 py-4">Bus</th>
                          <th className="px-6 py-4">Immatriculation</th>
                          <th className="px-6 py-4 text-center">Capacité</th>
                          <th className="px-6 py-4 text-center">Inscrits</th>
                          <th className="px-6 py-4 text-right">Carburant</th>
                          <th className="px-6 py-4 text-center">Accidents</th>
                          <th className="px-6 py-4 text-center">Signalements</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {busStatsData.map((bus) => (
                          <tr key={bus.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-800">{bus.numero}</div>
                              <div className="text-xs text-gray-500">{bus.marque} {bus.modele}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{bus.immatriculation}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {bus.capacite} places
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {bus.eleves_inscrits || 0}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-amber-600">
                              {bus.fuelCost > 0 ? `${bus.fuelCost} DH` : '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {bus.accidentsCount > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {bus.accidentsCount}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {bus.issuesCount > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  {bus.issuesCount}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedBus && (
                  <>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                          <Bus className="w-8 h-8" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">{selectedBus.numero}</h2>
                          <p className="text-gray-500">{selectedBus.marque} {selectedBus.modele} • {selectedBus.immatriculation}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-center">
                        <div className="px-6 py-2 bg-gray-50 rounded-xl">
                          <div className="text-2xl font-bold text-gray-800">{selectedBus.capacite}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Capacité</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                        <div className="text-red-500 font-medium mb-1">Accidents</div>
                        <div className="text-4xl font-bold text-red-700">{selectedBus.accidentsCount}</div>
                        <p className="text-sm text-red-400 mt-2">Sur la période sélectionnée</p>
                      </div>
                      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                        <div className="text-amber-600 font-medium mb-1">Carburant</div>
                        <div className="text-4xl font-bold text-amber-700">{selectedBus.fuelCost} <span className="text-xl">DH</span></div>
                        <p className="text-sm text-amber-500 mt-2">Dépenses totales</p>
                      </div>
                      <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                        <div className="text-orange-600 font-medium mb-1">Pannes & Problèmes</div>
                        <div className="text-4xl font-bold text-orange-700">{selectedBus.issuesCount}</div>
                        <p className="text-sm text-orange-500 mt-2">Signalements reçus</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={classeFilter} onValueChange={setClasseFilter}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-none">
                  <SelectValue placeholder="Classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classesDisponibles.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={groupeFilter} onValueChange={setGroupeFilter}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-none">
                  <SelectValue placeholder="Groupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  {groupesDisponibles.map(g => <SelectItem key={g} value={g}>Groupe {g}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="md:col-span-2 relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un élève..."
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-1 focus:ring-amber-500 transition-all font-medium text-gray-700"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <UserX className="w-5 h-5 text-red-500" /> Top Absences
                  </h3>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top 5</span>
                </div>
                <div className="p-4">
                  {topAbsentees.length > 0 ? (
                    <div className="space-y-4">
                      {topAbsentees.map((eleve, idx) => (
                        <div key={eleve.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-red-500' : 'bg-gray-400'}`}>
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">{eleve.nom} {eleve.prenom}</div>
                              <div className="text-xs text-gray-500">{eleve.classe} • Groupe {eleve.groupe || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-red-600">{eleve.totalAbsences}</div>
                            <div className="text-xs text-red-400">Absences</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400">Aucune absence enregistrée pour ces critères.</div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg border-l-4 border-amber-500">
                  <div className="text-gray-500 text-sm font-medium mb-1">Nombre d'élèves</div>
                  <div className="text-4xl font-bold text-gray-800">{filteredStudents.length}</div>
                  <div className="text-xs text-amber-600 mt-2 font-medium">Correspondant aux filtres</div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg border-l-4 border-red-500">
                  <div className="text-gray-500 text-sm font-medium mb-1">Total Absences</div>
                  <div className="text-4xl font-bold text-red-600">
                    {studentAbsenceStats.reduce((sum, e) => sum + e.totalAbsences, 0)}
                  </div>
                  <div className="text-xs text-red-400 mt-2 font-medium">Sur la période sélectionnée</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </AdminLayout>
  );
}