import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { accidentsAPI, busAPI, chauffeursAPI, notificationsAPI, elevesAPI, inscriptionsAPI, tuteursAPI } from '../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import AdminLayout from '../components/AdminLayout';
import AlertDialog from '../components/ui/AlertDialog';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertCircle, Calendar, Bus, User, MapPin, ArrowLeft, Eye, Mail, Users, Camera, FileImage, CheckCircle, ZoomIn, X, BookOpen, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminAccidents() {
  const navigate = useNavigate();
  const [accidents, setAccidents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [tuteurs, setTuteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showLicencierModal, setShowLicencierModal] = useState(false);
  const [chauffeurToLicencier, setChauffeurToLicencier] = useState(null);
  const [alertDialog, setAlertDialog] = useState({ show: false, message: '', type: 'success' });
  const [filters, setFilters] = useState({
    statut: 'all',
    gravite: 'all',
    bus: 'all',
    dateDebut: '',
    dateFin: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accidentsRes, busesRes, chauffeursRes, elevesRes, inscriptionsRes, tuteursRes] = await Promise.all([
        accidentsAPI.getAll(),
        busAPI.getAll(),
        chauffeursAPI.getAll(),
        elevesAPI.getAll(),
        inscriptionsAPI.getAll(),
        tuteursAPI.getAll()
      ]);
      
      const accidentsData = accidentsRes?.data || accidentsRes || [];
      const busesData = busesRes?.data || busesRes || [];
      const chauffeursData = chauffeursRes?.data || chauffeursRes || [];
      const elevesData = elevesRes?.data || elevesRes || [];
      const inscriptionsData = inscriptionsRes?.data || inscriptionsRes || [];
      const tuteursData = tuteursRes?.data || tuteursRes || [];
      
      const sortedAccidents = Array.isArray(accidentsData) 
        ? accidentsData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)) 
        : [];
      setAccidents(sortedAccidents);
      setBuses(Array.isArray(busesData) ? busesData : []);
      setChauffeurs(Array.isArray(chauffeursData) ? chauffeursData : []);
      setEleves(Array.isArray(elevesData) ? elevesData : []);
      setInscriptions(Array.isArray(inscriptionsData) ? inscriptionsData : []);
      setTuteurs(Array.isArray(tuteursData) ? tuteursData : []);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (accidentId) => {
    try {
      await accidentsAPI.validate(accidentId);
      await loadData();
      setAlertDialog({ show: true, message: 'Accident marqué comme lu avec succès', type: 'success' });
    } catch (err) {
      console.error('Erreur lors de la validation:', err);
      setError('Erreur lors du marquage comme lu');
      setAlertDialog({ show: true, message: 'Erreur lors du marquage comme lu', type: 'error' });
    }
  };

  const handleLicencier = async (chauffeurId) => {
    try {
      await chauffeursAPI.licencier(chauffeurId);
      await loadData();
      setShowLicencierModal(false);
      setChauffeurToLicencier(null);
      setAlertDialog({ show: true, message: 'Chauffeur licencié avec succès. Le responsable a été notifié.', type: 'success' });
    } catch (err) {
      console.error('Erreur lors du licenciement:', err);
      setError('Erreur lors du licenciement du chauffeur');
      setAlertDialog({ show: true, message: 'Erreur lors du licenciement du chauffeur', type: 'error' });
    }
  };

  const handleNotifyTuteurs = async (accident) => {
    if (!accident.bus_id) {
      setError('Aucun bus associé à cet accident');
      return;
    }
    
    try {
      // Trouver tous les élèves dans le bus au moment de l'accident
      const activeInscriptions = inscriptions.filter(i => 
        i.bus_id === accident.bus_id && i.statut === 'Active'
      );
      const elevesInBus = eleves.filter(e => 
        activeInscriptions.some(i => i.eleve_id === e.id)
      );
      
      // Trouver les tuteurs uniques
      const tuteursIds = [...new Set(elevesInBus.map(e => e.tuteur_id).filter(Boolean))];
      const tuteursToNotify = tuteurs.filter(t => tuteursIds.includes(t.id));
      
      if (tuteursToNotify.length === 0) {
        setError('Aucun tuteur trouvé pour les élèves de ce bus');
        return;
      }
      
      const bus = buses.find(b => b.id === accident.bus_id);
      const busNumero = bus?.numero || 'Inconnu';
      
      // Créer un message de notification
      let message = `Un accident a été déclaré concernant le bus ${busNumero}.\n\n`;
      message += `Date: ${format(new Date(accident.date), 'dd/MM/yyyy', { locale: fr })}`;
      if (accident.heure) {
        message += ` à ${accident.heure}`;
      }
      message += `\nLieu: ${accident.lieu || 'Non spécifié'}\n`;
      message += `Gravité: ${accident.gravite}\n\n`;
      message += `Description: ${accident.description}\n`;
      if (accident.degats) {
        message += `Dégâts: ${accident.degats}\n`;
      }
      if (accident.nombre_eleves !== null && accident.nombre_eleves !== undefined) {
        message += `Nombre d'élèves dans le bus: ${accident.nombre_eleves}\n`;
      }
      if (accident.nombre_blesses !== null && accident.nombre_blesses !== undefined && accident.nombre_blesses > 0) {
        message += `Nombre de blessés: ${accident.nombre_blesses}\n`;
      }
      
      // Ajouter les noms des élèves concernés si disponibles
      if (accident.eleves_concernees && Array.isArray(accident.eleves_concernees) && accident.eleves_concernees.length > 0) {
        message += `\nÉlèves présents dans le bus:\n`;
        accident.eleves_concernees.forEach((eleve, index) => {
          const nomComplet = typeof eleve === 'object' && eleve.nom 
            ? `${eleve.prenom} ${eleve.nom}` 
            : eleve;
          message += `- ${nomComplet}\n`;
        });
      }
      
      message += `\nVeuillez contacter l'école pour plus d'informations.`;
      
      // Envoyer les notifications
      const notificationPromises = tuteursToNotify.map(tuteur => {
        // Trouver l'utilisateur_id du tuteur
        const tuteurUtilisateurId = tuteur.utilisateur_id || tuteur.id;
        return notificationsAPI.create({
          destinataire_id: tuteurUtilisateurId,
          destinataire_type: 'tuteur',
          titre: 'Accident déclaré - Bus ' + busNumero,
          message: message,
          type: 'alerte'
        });
      });
      
      await Promise.all(notificationPromises);
      setAlertDialog({ show: true, message: `Notifications envoyées à ${tuteursToNotify.length} tuteur(s)`, type: 'success' });
    } catch (err) {
      console.error('Erreur lors de l\'envoi des notifications:', err);
      setError('Erreur lors de l\'envoi des notifications aux tuteurs');
      setAlertDialog({ show: true, message: 'Erreur lors de l\'envoi des notifications aux tuteurs', type: 'error' });
    }
  };

  const getGraviteBadge = (gravite) => {
    const styles = {
      'Légère': 'bg-yellow-100 text-yellow-700',
      'Moyenne': 'bg-orange-100 text-orange-700',
      'Grave': 'bg-red-100 text-red-700'
    };
    return styles[gravite] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={() => navigate(createPageUrl('AdminDashboard'))}
              className="flex items-center gap-2 text-gray-600 hover:text-amber-800 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au tableau de bord
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                ×
              </button>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-500 to-rose-500">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Rapports d'Accidents
              </h2>
              <p className="text-red-100 mt-1">Rapports reçus des chauffeurs et responsables bus</p>
            </div>

            {/* Filtres */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <Select value={filters.statut} onValueChange={(value) => setFilters({...filters, statut: value})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="En attente">En attente</SelectItem>
                      <SelectItem value="Validé">Validé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gravité</label>
                  <Select value={filters.gravite} onValueChange={(value) => setFilters({...filters, gravite: value})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les gravités</SelectItem>
                      <SelectItem value="Légère">Légère</SelectItem>
                      <SelectItem value="Moyenne">Moyenne</SelectItem>
                      <SelectItem value="Grave">Grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus</label>
                  <Select value={filters.bus} onValueChange={(value) => setFilters({...filters, bus: value})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les bus</SelectItem>
                      {buses.map(bus => (
                        <SelectItem key={bus.id} value={bus.id.toString()}>
                          {bus.numero}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                  <Input
                    type="date"
                    value={filters.dateDebut}
                    onChange={(e) => setFilters({...filters, dateDebut: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                  <Input
                    type="date"
                    value={filters.dateFin}
                    onChange={(e) => setFilters({...filters, dateFin: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
              </div>
              {(filters.statut !== 'all' || filters.gravite !== 'all' || filters.bus !== 'all' || filters.dateDebut || filters.dateFin) && (
                <Button
                  variant="outline"
                  onClick={() => setFilters({ statut: 'all', gravite: 'all', bus: 'all', dateDebut: '', dateFin: '' })}
                  className="mt-4 rounded-xl"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {filteredAccidents.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun accident déclaré{filters.statut !== 'all' || filters.gravite !== 'all' || filters.bus !== 'all' || filters.dateDebut || filters.dateFin ? ' (après filtrage)' : ''}</p>
                </div>
              ) : (
                <>
                  {(filters.statut !== 'all' || filters.gravite !== 'all' || filters.bus !== 'all' || filters.dateDebut || filters.dateFin) && (
                    <div className="p-4 bg-blue-50 border-b border-blue-200">
                      <p className="text-sm text-blue-700">
                        <strong>{filteredAccidents.length}</strong> accident(s) trouvé(s)
                        {filteredAccidents.length !== accidents.length && (
                          <span> sur {accidents.length} total</span>
                        )}
                      </p>
                    </div>
                  )}
                  {filteredAccidents.map((accident) => {
                    const bus = buses.find(b => b.id === accident.bus_id);
                    const chauffeur = accident.chauffeur_id ? chauffeurs.find(c => c.id === accident.chauffeur_id) : null;
                    const chauffeurAccidents = accident.chauffeur_id ? accidents.filter(a => a.chauffeur_id === accident.chauffeur_id) : [];
                    const has3Accidents = chauffeurAccidents.length >= 3;
                    
                    return (
                    <div key={accident.id} className="p-6 hover:bg-red-50/50 transition-colors">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGraviteBadge(accident.gravite)}`}>
                              {accident.gravite}
                            </span>
                            {accident.statut === 'En attente' && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                                En attente
                              </span>
                            )}
                            {accident.statut === 'Validé' && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                Validé
                              </span>
                            )}
                            {accident.blesses && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                                Blessés
                              </span>
                            )}
                            {has3Accidents && accident.chauffeur_id && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white font-bold">
                                ⚠️ À LICENCIER (3 accidents)
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {format(new Date(accident.date), 'dd MMMM yyyy', { locale: fr })}
                              {accident.heure && ` à ${accident.heure}`}
                            </div>
                            {bus && (
                              <div className="flex items-center gap-1">
                                <Bus className="w-4 h-4 text-amber-500" />
                                {bus.numero}
                              </div>
                            )}
                            {(accident.chauffeur_prenom || accident.chauffeur_nom) && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4 text-green-500" />
                                {accident.chauffeur_prenom || ''} {accident.chauffeur_nom || ''}
                              </div>
                            )}
                            {(accident.responsable_prenom || accident.responsable_nom) && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4 text-blue-500" />
                                {accident.responsable_prenom || ''} {accident.responsable_nom || ''} (Responsable)
                              </div>
                            )}
                            {accident.lieu && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-red-500" />
                                {accident.lieu}
                              </div>
                            )}
                            {accident.nombre_eleves !== null && accident.nombre_eleves !== undefined && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-blue-500" />
                                {accident.nombre_eleves} élève(s)
                              </div>
                            )}
                            {accident.nombre_blesses !== null && accident.nombre_blesses !== undefined && accident.nombre_blesses > 0 && (
                              <div className="flex items-center gap-1 text-red-600 font-semibold">
                                <AlertCircle className="w-4 h-4" />
                                {accident.nombre_blesses} blessé(s)
                              </div>
                            )}
                          </div>

                          <h3 className="font-semibold text-gray-800 mb-2">{accident.description}</h3>
                          {accident.degats && (
                            <p className="text-sm text-gray-500 mb-2">
                              <strong>Dégâts:</strong> {accident.degats}
                            </p>
                          )}
                          {accident.photos && (() => {
                            try {
                              let hasPhotos = false;
                              if (Array.isArray(accident.photos) && accident.photos.length > 0) {
                                hasPhotos = true;
                              } else if (typeof accident.photos === 'string' && accident.photos.trim() !== '') {
                                if (accident.photos.startsWith('data:image')) {
                                  hasPhotos = true;
                                } else {
                                  try {
                                    const parsed = JSON.parse(accident.photos);
                                    hasPhotos = Array.isArray(parsed) && parsed.length > 0;
                                  } catch (e) {
                                    hasPhotos = false;
                                  }
                                }
                              }
                              return hasPhotos ? (
                                <div className="flex items-center gap-2 text-blue-600 text-sm mt-2">
                                  <Camera className="w-4 h-4" />
                                  <span>Photos disponibles</span>
                                </div>
                              ) : null;
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedAccident(accident);
                              setShowDetailsModal(true);
                            }}
                            className="rounded-xl"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </Button>
                          {accident.statut === 'En attente' && (
                            <Button
                              onClick={() => handleValidate(accident.id)}
                              className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                            >
                              <BookOpen className="w-4 h-4 mr-2" />
                              Marquer comme lu
                            </Button>
                          )}
                          {accident.bus_id && (
                            <Button
                              onClick={() => handleNotifyTuteurs(accident)}
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Informer les tuteurs
                            </Button>
                          )}
                          {has3Accidents && accident.chauffeur_id && (
                            <Button
                              onClick={() => {
                                setChauffeurToLicencier({
                                  id: accident.chauffeur_id,
                                  nom: accident.chauffeur_nom || chauffeur?.nom || '',
                                  prenom: accident.chauffeur_prenom || chauffeur?.prenom || ''
                                });
                                setShowLicencierModal(true);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Licencier
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal Licencier */}
      {showLicencierModal && chauffeurToLicencier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Licencier le chauffeur</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-gray-800 mb-2">
                <strong>Chauffeur:</strong> {chauffeurToLicencier.prenom} {chauffeurToLicencier.nom}
              </p>
              <p className="text-sm text-gray-600">
                Le chauffeur sera supprimé de la base de données, le bus sera désaffecté et le responsable sera notifié.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowLicencierModal(false);
                  setChauffeurToLicencier(null);
                }}
                variant="outline"
                className="flex-1 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={() => handleLicencier(chauffeurToLicencier.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
              >
                Confirmer le licenciement
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Détails */}
      {showDetailsModal && selectedAccident && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-500 to-rose-500">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Détails de l'Accident
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedAccident(null);
                  }}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                  <p className="text-gray-800">
                    {format(new Date(selectedAccident.date), 'dd MMMM yyyy', { locale: fr })}
                    {selectedAccident.heure && ` à ${selectedAccident.heure}`}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Gravité</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getGraviteBadge(selectedAccident.gravite)}`}>
                    {selectedAccident.gravite}
                  </span>
                </div>

                {selectedAccident.lieu && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Lieu</label>
                    <p className="text-gray-800">{selectedAccident.lieu}</p>
                  </div>
                )}

                {(() => {
                  const bus = buses.find(b => b.id === selectedAccident.bus_id);
                  return bus ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Bus</label>
                      <p className="text-gray-800">{bus.numero}</p>
                    </div>
                  ) : null;
                })()}

                {((selectedAccident.chauffeur_prenom || selectedAccident.chauffeur_nom) || selectedAccident.chauffeur_id) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Chauffeur</label>
                    <p className="text-gray-800">
                      {selectedAccident.chauffeur_prenom || ''} {selectedAccident.chauffeur_nom || ''}
                      {!selectedAccident.chauffeur_prenom && !selectedAccident.chauffeur_nom && selectedAccident.chauffeur_id && 'Chauffeur ID: ' + selectedAccident.chauffeur_id}
                    </p>
                  </div>
                )}
                
                {((selectedAccident.responsable_prenom || selectedAccident.responsable_nom) || selectedAccident.responsable_id) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Responsable</label>
                    <p className="text-gray-800">
                      {selectedAccident.responsable_prenom || ''} {selectedAccident.responsable_nom || ''}
                      {!selectedAccident.responsable_prenom && !selectedAccident.responsable_nom && selectedAccident.responsable_id && 'Responsable ID: ' + selectedAccident.responsable_id}
                    </p>
                  </div>
                )}

                {selectedAccident.nombre_eleves !== null && selectedAccident.nombre_eleves !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre d'élèves</label>
                    <p className="text-gray-800">{selectedAccident.nombre_eleves}</p>
                  </div>
                )}

                {selectedAccident.nombre_blesses !== null && selectedAccident.nombre_blesses !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre de blessés</label>
                    <p className="text-red-600 font-semibold">{selectedAccident.nombre_blesses}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <p className="text-gray-800">{selectedAccident.description}</p>
              </div>

              {selectedAccident.degats && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Dégâts</label>
                  <p className="text-gray-800">{selectedAccident.degats}</p>
                </div>
              )}

              {selectedAccident.eleves_concernees && Array.isArray(selectedAccident.eleves_concernees) && selectedAccident.eleves_concernees.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Élèves présents dans le bus
                  </label>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <ul className="space-y-2">
                      {selectedAccident.eleves_concernees.map((eleve, index) => (
                        <li key={index} className="text-gray-800">
                          {typeof eleve === 'object' && eleve.nom ? `${eleve.prenom} ${eleve.nom}` : eleve}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Photos
                </label>
                {(() => {
                  try {
                    let photosArray = [];
                    const photosField = selectedAccident.photos;
                    
                    // Si les photos sont null ou undefined
                    if (!photosField) {
                      return (
                        <div className="bg-gray-50 rounded-xl p-6 text-center">
                          <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500 text-sm">Aucune photo disponible</p>
                        </div>
                      );
                    }
                    
                    // Si c'est déjà un tableau (déjà décodé par le backend)
                    if (Array.isArray(photosField)) {
                      photosArray = photosField;
                    } 
                    // Si c'est une chaîne JSON
                    else if (typeof photosField === 'string' && photosField.trim() !== '') {
                      try {
                        // Vérifier si la chaîne commence par [ ou {
                        if (photosField.trim().startsWith('[') || photosField.trim().startsWith('{')) {
                          const parsed = JSON.parse(photosField);
                          if (Array.isArray(parsed)) {
                            photosArray = parsed;
                          } else if (parsed && typeof parsed === 'object') {
                            // Si c'est un objet avec une propriété photos
                            if (Array.isArray(parsed.photos)) {
                              photosArray = parsed.photos;
                            } 
                            // Si l'objet contient directement les données
                            else if (parsed.data && Array.isArray(parsed.data)) {
                              photosArray = parsed.data;
                            }
                            // Si c'est un objet unique avec une propriété data/base64
                            else if (parsed.data || parsed.src || parsed.url) {
                              photosArray = [parsed.data || parsed.src || parsed.url];
                            }
                          }
                        } else if (photosField.startsWith('data:image')) {
                          // Si c'est une seule photo en base64 directe
                          photosArray = [photosField];
                        }
                      } catch (parseError) {
                        console.error('Erreur parsing photos:', parseError, photosField);
                        // Si le parsing échoue, essayer de traiter comme une seule photo
                        if (photosField.startsWith('data:image')) {
                          photosArray = [photosField];
                        }
                      }
                    }
                    
                    // Filtrer et normaliser les photos valides
                    const validPhotos = photosArray
                      .map((photo, idx) => {
                        if (typeof photo === 'string') {
                          // Vérifier que c'est bien une URL base64 valide
                          return photo.trim() !== '' && (photo.startsWith('data:image') || photo.startsWith('http')) ? photo : null;
                        } else if (photo && typeof photo === 'object') {
                          // Extraire l'URL depuis l'objet
                          return photo.data || photo.src || photo.url || photo.base64 || null;
                        }
                        return null;
                      })
                      .filter(photoSrc => {
                        return photoSrc && 
                               typeof photoSrc === 'string' && 
                               photoSrc.trim() !== '' && 
                               (photoSrc.startsWith('data:image') || photoSrc.startsWith('http'));
                      });
                    
                    if (validPhotos.length === 0) {
                      return (
                        <div className="bg-gray-50 rounded-xl p-6 text-center">
                          <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500 text-sm">Aucune photo valide</p>
                          <p className="text-xs text-gray-400 mt-1">Les photos peuvent être corrompues ou dans un format non supporté</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {validPhotos.map((photoSrc, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative group cursor-pointer"
                            onClick={() => setSelectedPhoto(photoSrc)}
                          >
                            <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 group-hover:border-red-400 transition-colors bg-gray-100">
                              <img 
                                src={photoSrc} 
                                alt={`Photo ${index + 1}`}
                                className="w-full h-32 object-cover"
                                onError={(e) => {
                                  console.error('Erreur chargement image:', index, photoSrc?.substring(0, 50));
                                  e.target.parentElement.style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log('Image chargée avec succès:', index);
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                Photo {index + 1}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  } catch (e) {
                    console.error('Erreur traitement photos:', e, selectedAccident.photos);
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-600 text-sm font-medium">Erreur lors du chargement des photos</p>
                        <p className="text-red-500 text-xs mt-1">{e.message}</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAccident(null);
                }}
                className="rounded-xl"
              >
                Fermer
              </Button>
              {selectedAccident.statut === 'En attente' && (
                <Button
                  onClick={() => {
                    handleValidate(selectedAccident.id);
                    setShowDetailsModal(false);
                    setSelectedAccident(null);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Marquer comme lu
                </Button>
              )}
              {selectedAccident.bus_id && (
                <Button
                  onClick={() => handleNotifyTuteurs(selectedAccident)}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Informer les tuteurs
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal pour voir les photos en grand */}
      <AnimatePresence>
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
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
                alt="Photo accident"
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dialog d'alerte */}
      <AlertDialog
        isOpen={alertDialog.show}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ show: false, message: '', type: 'success' })}
      />
    </AdminLayout>
  );
}
