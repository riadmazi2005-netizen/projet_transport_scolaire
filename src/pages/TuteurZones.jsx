import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { zonesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import TuteurLayout from '../components/TuteurLayout';
import { 
  MapPin, ArrowLeft, CheckCircle, Search, Filter
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TuteurZones() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [villeFilter, setVilleFilter] = useState('all');
  const [actifFilter, setActifFilter] = useState('all');

  const villes = ['Rabat', 'Salé', 'Temara'];

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const zonesRes = await zonesAPI.getAll();
      const zonesData = zonesRes?.data || zonesRes || [];
      setZones(Array.isArray(zonesData) ? zonesData : []);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des zones');
    } finally {
      setLoading(false);
    }
  };

  const filteredZones = zones.filter(zone => {
    const matchSearch = searchTerm === '' ||
      zone.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchVille = villeFilter === 'all' || zone.ville === villeFilter;
    
    const matchActif = actifFilter === 'all' || 
      (actifFilter === 'active' && zone.actif !== false) ||
      (actifFilter === 'inactive' && zone.actif === false);
    
    return matchSearch && matchVille && matchActif;
  });

  if (loading) {
    return (
      <TuteurLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </TuteurLayout>
    );
  }

  return (
    <TuteurLayout title="Zones Disponibles">
      <div className="mb-4">
        <button
          onClick={() => navigate(createPageUrl('TuteurDashboard'))}
          className="flex items-center gap-2 text-gray-600 hover:text-lime-600 transition-colors"
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
        <div className="p-6 bg-gradient-to-r from-lime-500 to-lime-600">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <MapPin className="w-7 h-7" />
                Zones Disponibles
              </h1>
              <p className="text-lime-100 mt-1">
                {filteredZones.length} zone(s) {searchTerm || villeFilter !== 'all' || actifFilter !== 'all' ? 'trouvée(s)' : 'au total'}
              </p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Rechercher
              </label>
              <Input
                placeholder="Rechercher une zone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Ville
              </label>
              <Select value={villeFilter} onValueChange={setVilleFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {villes.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Statut
              </label>
              <Select value={actifFilter} onValueChange={setActifFilter}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="active">Actives uniquement</SelectItem>
                  <SelectItem value="inactive">Inactives uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Liste des zones */}
        <div className="divide-y divide-gray-100">
          {filteredZones.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune zone trouvée</p>
              {(searchTerm || villeFilter !== 'all' || actifFilter !== 'all') && (
                <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
              )}
            </div>
          ) : (
            filteredZones.map((zone, index) => (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-lime-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-lime-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-lime-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2 flex-wrap">
                      {zone.nom}
                      {zone.ville && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {zone.ville}
                        </span>
                      )}
                      {zone.actif !== false && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Active
                        </span>
                      )}
                      {zone.actif === false && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </h3>
                    {zone.description && (
                      <p className="text-sm text-gray-600 mt-1">{zone.description}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </TuteurLayout>
  );
}

