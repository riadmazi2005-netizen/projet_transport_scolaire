import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { essenceAPI, busAPI, chauffeursAPI } from '../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
import {
  Fuel, Calendar, Bus, User, ArrowLeft, TrendingUp, TrendingDown, Filter, Image as ImageIcon, ZoomIn, X
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminEssence() {
  const navigate = useNavigate();
  const [prisesEssence, setPrisesEssence] = useState([]);
  const [buses, setBuses] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBus, setFilterBus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('mois'); // mois, semaine, jour, tous
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prisesRes, busesRes, chauffeursRes] = await Promise.all([
        essenceAPI.getAll(),
        busAPI.getAll(),
        chauffeursAPI.getAll()
      ]);

      const prisesData = prisesRes?.data || prisesRes || [];
      const busesData = busesRes?.data || busesRes || [];
      const chauffeursData = chauffeursRes?.data || chauffeursRes || [];

      setPrisesEssence(Array.isArray(prisesData) ? prisesData : []);
      setBuses(Array.isArray(busesData) ? busesData : []);
      setChauffeurs(Array.isArray(chauffeursData) ? chauffeursData : []);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les prises d'essence
  const filteredPrises = useMemo(() => {
    let filtered = prisesEssence;

    // Filtre par bus
    if (filterBus !== 'all') {
      filtered = filtered.filter(p => p.bus_id === parseInt(filterBus));
    }

    // Filtre par date
    if (filterDate) {
      filtered = filtered.filter(p => p.date === filterDate);
    }

    // Filtre par période
    const now = new Date();
    if (filterPeriode === 'jour') {
      const today = format(now, 'yyyy-MM-dd');
      filtered = filtered.filter(p => p.date === today);
    } else if (filterPeriode === 'semaine') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(p => new Date(p.date) >= weekAgo);
    } else if (filterPeriode === 'mois') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(p => new Date(p.date) >= monthAgo);
    }

    return filtered;
  }, [prisesEssence, filterBus, filterDate, filterPeriode]);

  // Calculer les statistiques par bus
  const statsParBus = useMemo(() => {
    const stats = {};

    filteredPrises.forEach(prise => {
      const busId = prise.bus_id;
      if (!stats[busId]) {
        stats[busId] = {
          bus_numero: prise.bus_numero,
          bus_marque: prise.bus_marque,
          bus_modele: prise.bus_modele,
          totalLitres: 0,
          totalCout: 0,
          nombrePrises: 0,
          prixMoyenLitre: 0
        };
      }

      stats[busId].totalLitres += parseFloat(prise.quantite_litres || 0);
      stats[busId].totalCout += parseFloat(prise.prix_total || 0);
      stats[busId].nombrePrises += 1;
    });

    // Calculer le prix moyen par litre
    Object.keys(stats).forEach(busId => {
      const stat = stats[busId];
      if (stat.totalLitres > 0) {
        stat.prixMoyenLitre = stat.totalCout / stat.totalLitres;
      }
    });

    // Trier par consommation (total litres) décroissant
    return Object.values(stats).sort((a, b) => b.totalLitres - a.totalLitres);
  }, [filteredPrises]);

  // Statistiques globales
  const statsGlobales = useMemo(() => {
    const totalLitres = filteredPrises.reduce((sum, p) => sum + parseFloat(p.quantite_litres || 0), 0);
    const totalCout = filteredPrises.reduce((sum, p) => sum + parseFloat(p.prix_total || 0), 0);
    const nombrePrises = filteredPrises.length;
    const prixMoyenLitre = totalLitres > 0 ? totalCout / totalLitres : 0;

    return {
      totalLitres,
      totalCout,
      nombrePrises,
      prixMoyenLitre
    };
  }, [filteredPrises]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestion de la Consommation d'Essence">
      <div className="mb-6">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-800 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par bus</label>
          <Select value={filterBus} onValueChange={setFilterBus}>
            <SelectTrigger className="w-full rounded-xl border-2 border-amber-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les bus</SelectItem>
              {buses.map(bus => (
                <SelectItem key={bus.id} value={bus.id.toString()}>
                  {bus.numero} - {bus.marque} {bus.modele}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
          <Select value={filterPeriode} onValueChange={setFilterPeriode}>
            <SelectTrigger className="w-full rounded-xl border-2 border-amber-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Toutes les périodes</SelectItem>
              <SelectItem value="jour">Aujourd'hui</SelectItem>
              <SelectItem value="semaine">7 derniers jours</SelectItem>
              <SelectItem value="mois">Ce mois</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Date spécifique</label>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-xl border-2 border-amber-200"
          />
        </div>
        <div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Fuel className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total litres</p>
          <p className="text-3xl font-bold">{statsGlobales.totalLitres.toFixed(1)} L</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Coût total</p>
          <p className="text-3xl font-bold">{statsGlobales.totalCout.toFixed(2)} DH</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Nombre de prises</p>
          <p className="text-3xl font-bold">{statsGlobales.nombrePrises}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Prix moyen /L</p>
          <p className="text-3xl font-bold">{statsGlobales.prixMoyenLitre.toFixed(2)} DH</p>
        </motion.div>
      </div>

      {/* Statistiques par bus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-100 mb-6"
      >
        <div className="p-8 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Bus className="w-7 h-7 text-white" />
            </div>
            Consommation par Bus
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {statsParBus.length === 0 ? (
            <div className="p-16 text-center">
              <Fuel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">Aucune consommation enregistrée</p>
            </div>
          ) : (
            statsParBus.map((stat, index) => (
              <motion.div
                key={stat.bus_numero}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-8 hover:bg-gradient-to-r hover:from-amber-50 hover:to-white transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl flex items-center justify-center shadow-lg">
                      <Bus className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-amber-900 mb-3">
                        {stat.bus_numero}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {stat.bus_marque} {stat.bus_modele}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4">
                          <p className="text-sm text-gray-600 mb-1">Total litres</p>
                          <p className="text-2xl font-bold text-blue-600">{stat.totalLitres.toFixed(1)} L</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                          <p className="text-sm text-gray-600 mb-1">Coût total</p>
                          <p className="text-2xl font-bold text-green-600">{stat.totalCout.toFixed(2)} DH</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                          <p className="text-sm text-gray-600 mb-1">Nombre de prises</p>
                          <p className="text-2xl font-bold text-purple-600">{stat.nombrePrises}</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4">
                          <p className="text-sm text-gray-600 mb-1">Prix moyen /L</p>
                          <p className="text-2xl font-bold text-orange-600">{stat.prixMoyenLitre.toFixed(2)} DH</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Historique détaillé */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200"
      >
        <div className="p-8 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            Historique des Prises d'Essence
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredPrises.length === 0 ? (
            <div className="p-16 text-center">
              <Fuel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">Aucune prise d'essence enregistrée</p>
              <p className="text-gray-400 text-sm mt-2">Les remplissages d'essence effectués par les chauffeurs apparaîtront ici</p>
            </div>
          ) : (
            filteredPrises.map((prise) => (
              <motion.div
                key={prise.id}
                className="p-8 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300"
                whileHover={{ x: 4 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                      <Fuel className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {format(new Date(prise.date), 'dd MMMM yyyy', { locale: fr })} à {prise.heure}
                        </h3>
                        {prise.bus_numero && (
                          <span className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold shadow-md">
                            {prise.bus_numero}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Quantité</p>
                          <p className="text-lg font-semibold text-gray-800">{prise.quantite_litres} L</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Prix total</p>
                          <p className="text-lg font-semibold text-green-600">{parseFloat(prise.prix_total).toFixed(2)} DH</p>
                        </div>
                        {prise.kilometrage_actuel && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Kilométrage</p>
                            <p className="text-lg font-semibold text-gray-800">{prise.kilometrage_actuel} km</p>
                          </div>
                        )}
                        {prise.station_service && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Station</p>
                            <p className="text-lg font-semibold text-gray-800">{prise.station_service}</p>
                          </div>
                        )}
                        {prise.chauffeur_prenom && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Chauffeur</p>
                            <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {prise.chauffeur_prenom} {prise.chauffeur_nom}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Photo du ticket */}
                      {prise.photo_ticket && prise.photo_ticket !== 'null' && prise.photo_ticket !== '' && prise.photo_ticket !== null && (() => {
                        try {
                          let photoSrc = prise.photo_ticket;

                          // Si c'est une chaîne JSON, essayer de parser
                          if (typeof photoSrc === 'string' && photoSrc.trim().startsWith('[')) {
                            try {
                              const parsed = JSON.parse(photoSrc);
                              if (Array.isArray(parsed) && parsed.length > 0) {
                                photoSrc = parsed[0];
                              }
                            } catch (e) {
                              // Garder la valeur originale si le parsing échoue
                            }
                          }

                          // Nettoyer les guillemets si présents
                          if (typeof photoSrc === 'string') {
                            photoSrc = photoSrc.replace(/^["']+|["']+$/g, '');
                          }

                          // Vérifier que c'est une URL valide
                          if (typeof photoSrc === 'string') {
                            // Fonction interne pour traiter et normaliser la photo (identique à ChauffeurDashboard)
                            const processPhoto = (rawPhoto) => {
                              if (!rawPhoto) return null;
                              let src = String(rawPhoto).trim();
                              src = src.replace(/^["']+|["']+$/g, ''); // Enlever guillemets
                              src = src.replace(/^\\["']+|\\["']+$/g, ''); // Enlever guillemets échappés

                              if (src.startsWith('data:image') || src.startsWith('http')) return src;

                              const cleanBase64 = src.replace(/\s/g, '');
                              if (cleanBase64.length > 50) {
                                return `data:image/jpeg;base64,${cleanBase64}`;
                              }
                              return null;
                            };

                            const processedSrc = processPhoto(photoSrc);
                            const photoLength = String(photoSrc).length;
                            const isTruncated = photoLength === 255;

                            if (!processedSrc && isTruncated) {
                              return (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ImageIcon className="w-5 h-5 text-red-500" />
                                    <span className="text-sm font-semibold text-gray-700">Photo du ticket</span>
                                  </div>
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-700 font-medium mb-1">⚠️ Photo tronquée (BDD)</p>
                                    <p className="text-xs text-red-600">
                                      La colonne BDD est en VARCHAR(255). Exécutez la migration LONGTEXT pour les prochains envois.
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            if (processedSrc) {
                              return (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex items-center gap-2 mb-3">
                                    <ImageIcon className="w-5 h-5 text-amber-600" />
                                    <span className="text-sm font-semibold text-gray-700">Photo du ticket</span>
                                  </div>
                                  <div
                                    className="relative group cursor-pointer inline-block"
                                    onClick={() => setSelectedPhoto(processedSrc)}
                                  >
                                    <img
                                      src={processedSrc}
                                      alt="Ticket essence"
                                      className="max-w-xs h-40 object-contain rounded-lg border-2 border-amber-200 bg-gray-50 hover:border-amber-400 transition-colors shadow-md"
                                      onError={(e) => {
                                        console.error('Erreur chargement image ticket Admin');
                                        const cleanBase64 = processedSrc.replace(/^data:image\/[^;]+;base64,/, '');
                                        if (cleanBase64.length > 50) {
                                          if (!e.target.dataset.triedPng) {
                                            e.target.dataset.triedPng = 'true';
                                            e.target.src = `data:image/png;base64,${cleanBase64}`;
                                          } else if (!e.target.dataset.triedWebp) {
                                            e.target.dataset.triedWebp = 'true';
                                            e.target.src = `data:image/webp;base64,${cleanBase64}`;
                                          } else {
                                            e.target.style.display = 'none';
                                          }
                                        } else {
                                          e.target.style.display = 'none';
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center rounded-lg pointer-events-none">
                                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          }

                          return null;
                        } catch (e) {
                          console.error('Erreur traitement photo:', e);
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Modal pour voir la photo en grand */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedPhoto}
                alt="Photo ticket essence"
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  console.error('Erreur modal image ticket Admin');
                  if (!e.target.parentElement.querySelector('.error-msg')) {
                    const div = document.createElement('div');
                    div.className = 'error-msg text-white bg-red-600 p-4 rounded-xl text-center';
                    div.innerHTML = "<p class='font-bold'>Erreur d'affichage</p><p class='text-sm'>L'image est peut-être corrompue ou trop grande.</p>";
                    e.target.parentElement.appendChild(div);
                  }
                  e.target.style.display = 'none';
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

