import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { signalementsAPI, busAPI, chauffeursAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
import { 
  AlertTriangle, Calendar, Bus, User, ArrowLeft, Eye, CheckCircle, X, Wrench, Clock, AlertCircle, Image as ImageIcon, ZoomIn
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminProblemes() {
  const navigate = useNavigate();
  const [signalements, setSignalements] = useState([]);
  const [buses, setBuses] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterUrgence, setFilterUrgence] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [signalementsRes, busesRes, chauffeursRes] = await Promise.all([
        signalementsAPI.getAll(),
        busAPI.getAll(),
        chauffeursAPI.getAll()
      ]);
      
      const signalementsData = signalementsRes?.data || signalementsRes || [];
      const busesData = busesRes?.data || busesRes || [];
      const chauffeursData = chauffeursRes?.data || chauffeursRes || [];
      
      setSignalements(Array.isArray(signalementsData) ? signalementsData.sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0)) : []);
      setBuses(Array.isArray(busesData) ? busesData : []);
      setChauffeurs(Array.isArray(chauffeursData) ? chauffeursData : []);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatut = async (signalementId, nouveauStatut) => {
    try {
      await signalementsAPI.update(signalementId, { statut: nouveauStatut });
      await loadData();
      alert(`Signalement marqué comme ${nouveauStatut === 'resolu' ? 'résolu' : nouveauStatut === 'en_cours' ? 'en cours' : 'en attente'}`);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDelete = async (signalementId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      try {
        await signalementsAPI.delete(signalementId);
        await loadData();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Erreur lors de la suppression du signalement');
      }
    }
  };

  const getUrgenceColor = (urgence) => {
    switch (urgence) {
      case 'haute': return 'bg-red-100 text-red-700 border-red-300';
      case 'moyenne': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'faible': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'resolu': return 'bg-green-100 text-green-700 border-green-300';
      case 'en_cours': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'en_attente': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeProblemeLabel = (type) => {
    const labels = {
      'mecanique': 'Mécanique',
      'eclairage': 'Éclairage',
      'portes': 'Portes',
      'climatisation': 'Climatisation',
      'pneus': 'Pneus',
      'autre': 'Autre'
    };
    return labels[type] || type;
  };

  const filteredSignalements = signalements.filter(s => {
    if (filterStatut !== 'all' && s.statut !== filterStatut) return false;
    if (filterUrgence !== 'all' && s.urgence !== filterUrgence) return false;
    return true;
  });

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
    <AdminLayout title="Gestion des Problèmes de Maintenance">
      <div className="mb-6">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-800 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par statut</label>
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-full rounded-xl border-2 border-amber-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="resolu">Résolu</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par urgence</label>
          <Select value={filterUrgence} onValueChange={setFilterUrgence}>
            <SelectTrigger className="w-full rounded-xl border-2 border-amber-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les urgences</SelectItem>
              <SelectItem value="haute">Haute</SelectItem>
              <SelectItem value="moyenne">Moyenne</SelectItem>
              <SelectItem value="faible">Faible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-100"
      >
        <div className="p-8 bg-gradient-to-r from-orange-600 via-orange-700 to-orange-600 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Wrench className="w-7 h-7 text-white" />
            </div>
            Gestion des Problèmes de Maintenance
          </h2>
        </div>

        <div className="divide-y divide-orange-100">
          {filteredSignalements.map((signalement) => {
            const bus = buses.find(b => b.id === signalement.bus_id);
            const chauffeur = chauffeurs.find(c => c.id === signalement.chauffeur_id);
            
            return (
              <motion.div 
                key={signalement.id} 
                className="p-8 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white transition-all duration-300"
                whileHover={{ x: 4 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-6 flex-1">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                      signalement.urgence === 'haute' ? 'bg-gradient-to-br from-red-600 to-red-700' :
                      signalement.urgence === 'moyenne' ? 'bg-gradient-to-br from-yellow-600 to-yellow-700' :
                      'bg-gradient-to-br from-green-600 to-green-700'
                    }`}>
                      <Wrench className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {getTypeProblemeLabel(signalement.type_probleme)}
                        </h3>
                        <span className={`px-4 py-2 rounded-xl font-semibold border-2 ${getUrgenceColor(signalement.urgence)}`}>
                          {signalement.urgence === 'haute' ? 'URGENT' : signalement.urgence === 'moyenne' ? 'Moyenne' : 'Faible'}
                        </span>
                        <span className={`px-4 py-2 rounded-xl font-semibold border-2 ${getStatutColor(signalement.statut)}`}>
                          {signalement.statut === 'resolu' ? 'Résolu' : signalement.statut === 'en_cours' ? 'En cours' : 'En attente'}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{signalement.description}</p>
                      <div className="flex flex-wrap gap-3">
                        {bus && (
                          <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md flex items-center gap-2">
                            <Bus className="w-4 h-4" />
                            {bus.numero}
                          </span>
                        )}
                        {chauffeur && (
                          <span className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {chauffeur.prenom} {chauffeur.nom}
                          </span>
                        )}
                        <span className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold shadow-md flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(signalement.date_creation), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 ml-6">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        setSelectedSignalement(signalement);
                        setShowDetailsModal(true);
                      }}
                      className="rounded-xl border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 w-11 h-11 shadow-md"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                    {signalement.statut !== 'resolu' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateStatut(signalement.id, 'resolu')}
                        className="rounded-xl border-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 w-11 h-11 shadow-md"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(signalement.id)}
                      className="rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 w-11 h-11 shadow-md"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filteredSignalements.length === 0 && (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-10 h-10 text-orange-600 opacity-60" />
              </div>
              <p className="text-orange-700 font-semibold text-lg">Aucun problème signalé</p>
              <p className="text-orange-600 text-sm mt-2">Les signalements de maintenance apparaîtront ici</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal de détails */}
      {showDetailsModal && selectedSignalement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Wrench className="w-8 h-8 text-orange-600" />
                  Détails du Signalement
                </h3>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSignalement(null);
                  }}
                  className="rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Type de problème</label>
                    <p className="text-gray-800 font-semibold">{getTypeProblemeLabel(selectedSignalement.type_probleme)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Urgence</label>
                    <span className={`inline-block px-3 py-1 rounded-lg font-semibold ${getUrgenceColor(selectedSignalement.urgence)}`}>
                      {selectedSignalement.urgence === 'haute' ? 'URGENT' : selectedSignalement.urgence === 'moyenne' ? 'Moyenne' : 'Faible'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Statut</label>
                    <span className={`inline-block px-3 py-1 rounded-lg font-semibold ${getStatutColor(selectedSignalement.statut)}`}>
                      {selectedSignalement.statut === 'resolu' ? 'Résolu' : selectedSignalement.statut === 'en_cours' ? 'En cours' : 'En attente'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date de signalement</label>
                    <p className="text-gray-800">
                      {format(new Date(selectedSignalement.date_creation), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>

                {selectedSignalement.bus_id && (() => {
                  const bus = buses.find(b => b.id === selectedSignalement.bus_id);
                  return bus ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                        <Bus className="w-4 h-4" />
                        Bus concerné
                      </label>
                      <p className="text-gray-800 font-semibold">{bus.numero}</p>
                    </div>
                  ) : null;
                })()}

                {selectedSignalement.chauffeur_id && (() => {
                  const chauffeur = chauffeurs.find(c => c.id === selectedSignalement.chauffeur_id);
                  return chauffeur ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Chauffeur
                      </label>
                      <p className="text-gray-800">{chauffeur.prenom} {chauffeur.nom}</p>
                    </div>
                  ) : null;
                })()}

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <p className="text-gray-800 bg-gray-50 p-4 rounded-xl">{selectedSignalement.description}</p>
                </div>

                {selectedSignalement.photos && (() => {
                  try {
                    let photos = [];
                    if (Array.isArray(selectedSignalement.photos)) {
                      photos = selectedSignalement.photos;
                    } else if (typeof selectedSignalement.photos === 'string') {
                      photos = JSON.parse(selectedSignalement.photos);
                    }
                    
                    if (Array.isArray(photos) && photos.length > 0) {
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Photos ({photos.length})
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {photos.map((photo, index) => {
                              const photoSrc = typeof photo === 'string' 
                                ? photo 
                                : (photo?.data || photo?.src || photo);
                              
                              if (!photoSrc) return null;
                              
                              return (
                                <div
                                  key={index}
                                  className="relative group cursor-pointer"
                                  onClick={() => setSelectedPhoto(photoSrc)}
                                >
                                  <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 group-hover:border-orange-400 transition-colors">
                                    <img
                                      src={photoSrc}
                                      alt={`Photo problème ${index + 1}`}
                                      className="w-full h-32 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                  } catch (e) {
                    console.error('Erreur parsing photos:', e);
                  }
                  return null;
                })()}

                {selectedSignalement.date_resolution && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date de résolution</label>
                    <p className="text-gray-800">
                      {format(new Date(selectedSignalement.date_resolution), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSignalement(null);
                  }}
                  className="rounded-xl"
                >
                  Fermer
                </Button>
                {selectedSignalement.statut !== 'resolu' && (
                  <Button
                    onClick={() => {
                      handleUpdateStatut(selectedSignalement.id, 'resolu');
                      setShowDetailsModal(false);
                      setSelectedSignalement(null);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marquer comme résolu
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal pour voir les photos en grand */}
      {selectedPhoto && (
        <div 
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
              alt="Photo problème"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}

