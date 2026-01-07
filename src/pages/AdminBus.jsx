import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { busAPI, trajetsAPI, chauffeursAPI, responsablesAPI, zonesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Bus, Plus, Edit, Trash2, Navigation, MapPin, Save, X, ArrowLeft
} from 'lucide-react';

export default function AdminBus() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [trajets, setTrajets] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('buses');
  const [showBusForm, setShowBusForm] = useState(false);
  const [showTrajetForm, setShowTrajetForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [editingTrajet, setEditingTrajet] = useState(null);
  const [error, setError] = useState(null);
  const [zones, setZones] = useState([]);
  const [deleteBusConfirm, setDeleteBusConfirm] = useState({ show: false, id: null });
  const [deleteTrajetConfirm, setDeleteTrajetConfirm] = useState({ show: false, id: null });

  const [busForm, setBusForm] = useState({
    numero: '', capacite: '', chauffeur_id: '', responsable_id: '', trajet_id: '', statut: 'Actif'
  });

  const [trajetForm, setTrajetForm] = useState({
    nom: '', zones: [], heure_depart_matin_a: '07:30', heure_arrivee_matin_a: '08:00',
    heure_depart_soir_a: '17:00', heure_arrivee_soir_a: '17:30',
    heure_depart_matin_b: '08:00', heure_arrivee_matin_b: '08:30',
    heure_depart_soir_b: '17:30', heure_arrivee_soir_b: '18:00'
  });

  useEffect(() => {
    loadData();
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const response = await zonesAPI.getAll();
      const zonesData = response?.data || response || [];
      // Filtrer uniquement les zones actives et extraire les noms
      const activeZones = zonesData
        .filter(z => z.actif !== false)
        .map(z => z.nom);
      setZones(activeZones);
    } catch (err) {
      console.error('Erreur lors du chargement des zones:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [busesRes, trajetsRes, chauffeursRes, responsablesRes] = await Promise.all([
        busAPI.getAll(),
        trajetsAPI.getAll(),
        chauffeursAPI.getAll(),
        responsablesAPI.getAll()
      ]);

      const busesArray = Array.isArray(busesRes?.data) ? busesRes.data : (Array.isArray(busesRes) ? busesRes : []);
      const trajetsArray = Array.isArray(trajetsRes?.data) ? trajetsRes.data : (Array.isArray(trajetsRes) ? trajetsRes : []);
      const chauffeursArray = Array.isArray(chauffeursRes?.data) ? chauffeursRes.data : (Array.isArray(chauffeursRes) ? chauffeursRes : []);
      const responsablesArray = Array.isArray(responsablesRes?.data) ? responsablesRes.data : (Array.isArray(responsablesRes) ? responsablesRes : []);

      setBuses(busesArray);
      setTrajets(trajetsArray);
      setChauffeurs(chauffeursArray);
      setResponsables(responsablesArray);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBus = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Vérifier si le chauffeur est déjà affecté à un autre bus
      if (busForm.chauffeur_id) {
        const existingBusWithChauffeur = buses.find(b =>
          b.chauffeur_id === parseInt(busForm.chauffeur_id) &&
          (!editingBus || b.id !== editingBus.id)
        );
        if (existingBusWithChauffeur) {
          setError(`Ce chauffeur est déjà affecté au bus ${existingBusWithChauffeur.numero}. Veuillez d'abord retirer son affectation de ce bus avant de l'affecter à un autre bus.`);
          return;
        }
      }

      // Vérifier si le responsable est déjà affecté à un autre bus
      if (busForm.responsable_id) {
        const existingBusWithResponsable = buses.find(b =>
          b.responsable_id === parseInt(busForm.responsable_id) &&
          (!editingBus || b.id !== editingBus.id)
        );
        if (existingBusWithResponsable) {
          setError(`Ce responsable est déjà affecté au bus ${existingBusWithResponsable.numero}. Veuillez d'abord retirer son affectation de ce bus avant de l'affecter à un autre bus.`);
          return;
        }
      }

      const data = {
        numero: busForm.numero,
        capacite: parseInt(busForm.capacite),
        chauffeur_id: busForm.chauffeur_id || null,
        responsable_id: busForm.responsable_id || null,
        trajet_id: busForm.trajet_id || null,
        statut: busForm.statut || 'Actif'
      };

      if (editingBus) {
        await busAPI.update(editingBus.id, data);
      } else {
        await busAPI.create(data);
      }

      resetBusForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement du bus: ' + (err.message || 'Erreur inconnue'));
    }
  };

  const handleSaveTrajet = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (trajetForm.zones.length === 0) {
        setError('Veuillez sélectionner au moins une zone');
        return;
      }

      if (trajetForm.zones.length > 2) {
        setError('Vous ne pouvez sélectionner au maximum que 2 zones');
        return;
      }

      const data = {
        ...trajetForm,
        zones: trajetForm.zones // Envoyer directement le tableau
      };

      if (editingTrajet) {
        await trajetsAPI.update(editingTrajet.id, data);
      } else {
        await trajetsAPI.create(data);
      }

      resetTrajetForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement du trajet');
    }
  };

  const handleDeleteBusClick = (busId) => {
    setDeleteBusConfirm({ show: true, id: busId });
  };

  const handleDeleteBus = async () => {
    if (!deleteBusConfirm.id) return;

    try {
      await busAPI.delete(deleteBusConfirm.id);
      await loadData();
      setDeleteBusConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression du bus');
      setDeleteBusConfirm({ show: false, id: null });
    }
  };

  const handleDeleteTrajetClick = (trajetId) => {
    setDeleteTrajetConfirm({ show: true, id: trajetId });
  };

  const handleDeleteTrajet = async () => {
    if (!deleteTrajetConfirm.id) return;

    try {
      await trajetsAPI.delete(deleteTrajetConfirm.id);
      await loadData();
      setDeleteTrajetConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression du trajet');
      setDeleteTrajetConfirm({ show: false, id: null });
    }
  };

  const resetBusForm = () => {
    setBusForm({ numero: '', capacite: '', chauffeur_id: '', responsable_id: '', trajet_id: '', statut: 'Actif' });
    setEditingBus(null);
    setShowBusForm(false);
  };

  const resetTrajetForm = () => {
    setTrajetForm({
      nom: '', zones: [], heure_depart_matin_a: '07:30', heure_arrivee_matin_a: '08:00',
      heure_depart_soir_a: '17:00', heure_arrivee_soir_a: '17:30',
      heure_depart_matin_b: '08:00', heure_arrivee_matin_b: '08:30',
      heure_depart_soir_b: '17:30', heure_arrivee_soir_b: '18:00'
    });
    setEditingTrajet(null);
    setShowTrajetForm(false);
  };

  const editBus = (bus) => {
    setBusForm({
      numero: bus.numero || '',
      capacite: bus.capacite?.toString() || '',
      chauffeur_id: bus.chauffeur_id?.toString() || '',
      responsable_id: bus.responsable_id?.toString() || '',
      trajet_id: bus.trajet_id?.toString() || '',
      statut: bus.statut || 'Actif'
    });
    setEditingBus(bus);
    setShowBusForm(true);
  };

  const editTrajet = (trajet) => {
    // Convertir les zones en tableau si c'est une chaîne séparée par des virgules
    let zonesArray = [];
    if (Array.isArray(trajet.zones)) {
      zonesArray = trajet.zones;
    } else if (typeof trajet.zones === 'string' && trajet.zones.trim()) {
      zonesArray = trajet.zones.split(',').map(z => z.trim()).filter(z => z);
    }

    setTrajetForm({
      ...trajet,
      zones: zonesArray
    });
    setEditingTrajet(trajet);
    setShowTrajetForm(true);
  };

  const handleZoneSelect = (zone) => {
    setError(null); // Réinitialiser l'erreur
    if (trajetForm.zones.includes(zone)) {
      // Retirer la zone si déjà sélectionnée
      setTrajetForm({ ...trajetForm, zones: trajetForm.zones.filter(z => z !== zone) });
    } else {
      // Ajouter la zone si moins de 2 zones sont sélectionnées
      if (trajetForm.zones.length < 2) {
        setTrajetForm({ ...trajetForm, zones: [...trajetForm.zones, zone] });
      }
    }
  };

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
    <AdminLayout title="Gestion des Bus et Trajets">
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

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <Button
          variant={activeTab === 'buses' ? 'default' : 'outline'}
          onClick={() => setActiveTab('buses')}
          className={`rounded-xl font-semibold transition-all duration-300 ${activeTab === 'buses'
              ? 'bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white shadow-lg shadow-amber-200'
              : 'border-2 border-amber-200 hover:border-amber-300 text-amber-700 hover:bg-amber-50'
            }`}
        >
          <Bus className="w-5 h-5 mr-2" />
          Bus ({buses.length})
        </Button>
        <Button
          variant={activeTab === 'trajets' ? 'default' : 'outline'}
          onClick={() => setActiveTab('trajets')}
          className={`rounded-xl font-semibold transition-all duration-300 ${activeTab === 'trajets'
              ? 'bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white shadow-lg shadow-amber-200'
              : 'border-2 border-amber-200 hover:border-amber-300 text-amber-700 hover:bg-amber-50'
            }`}
        >
          <Navigation className="w-5 h-5 mr-2" />
          Trajets ({trajets.length})
        </Button>
      </div>

      {/* Buses Tab */}
      {activeTab === 'buses' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-100"
        >
          <div className="p-8 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Bus className="w-7 h-7 text-white" />
              </div>
              Gestion des Bus
            </h2>
            <Button
              onClick={() => setShowBusForm(true)}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un bus
            </Button>
          </div>

          {showBusForm && (
            <div className="p-8 bg-gradient-to-br from-amber-50 via-white to-amber-50 border-b-2 border-amber-200">
              <form onSubmit={handleSaveBus} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-amber-900 font-semibold mb-2 block">Numéro du bus</Label>
                  <Input
                    value={busForm.numero}
                    onChange={(e) => setBusForm({ ...busForm, numero: e.target.value })}
                    placeholder="Ex: BUS-001"
                    className="mt-1 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 h-12"
                    required
                  />
                </div>
                <div>
                  <Label className="text-amber-900 font-semibold mb-2 block">Capacité</Label>
                  <Input
                    type="number"
                    value={busForm.capacite}
                    onChange={(e) => setBusForm({ ...busForm, capacite: e.target.value })}
                    placeholder="Ex: 40"
                    className="mt-1 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 h-12"
                    required
                  />
                </div>
                <div>
                  <Label className="text-amber-900 font-semibold mb-2 block">Chauffeur</Label>
                  <Select value={busForm.chauffeur_id} onValueChange={(v) => setBusForm({ ...busForm, chauffeur_id: v })}>
                    <SelectTrigger className="mt-1 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 h-12">
                      <SelectValue placeholder="Sélectionnez un chauffeur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {chauffeurs
                        .filter(c => {
                          // Filtrer : ne garder que les chauffeurs non affectés (sauf celui du bus en cours d'édition)
                          const isAssigned = buses.some(b => b.chauffeur_id === c.id && (!editingBus || b.id !== editingBus.id));
                          return !isAssigned || (editingBus && editingBus.chauffeur_id === c.id);
                        })
                        .map(c => {
                          const currentBus = editingBus && editingBus.chauffeur_id === c.id ? editingBus : null;
                          return (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.prenom} {c.nom}
                              {currentBus && ` (bus ${currentBus.numero})`}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-900 font-semibold mb-2 block">Responsable</Label>
                  <Select value={busForm.responsable_id} onValueChange={(v) => setBusForm({ ...busForm, responsable_id: v })}>
                    <SelectTrigger className="mt-1 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 h-12">
                      <SelectValue placeholder="Sélectionnez un responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {responsables
                        .filter(r => {
                          // Filtrer : ne garder que les responsables non affectés (sauf celui du bus en cours d'édition)
                          const isAssigned = buses.some(b => b.responsable_id === r.id && (!editingBus || b.id !== editingBus.id));
                          return !isAssigned || (editingBus && editingBus.responsable_id === r.id);
                        })
                        .map(r => {
                          const currentBus = editingBus && editingBus.responsable_id === r.id ? editingBus : null;
                          return (
                            <SelectItem key={r.id} value={r.id.toString()}>
                              {r.prenom} {r.nom}
                              {currentBus && ` (bus ${currentBus.numero})`}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-900 font-semibold mb-2 block">Trajet</Label>
                  <Select value={busForm.trajet_id} onValueChange={(v) => setBusForm({ ...busForm, trajet_id: v })}>
                    <SelectTrigger className="mt-1 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 h-12">
                      <SelectValue placeholder="Sélectionnez un trajet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {trajets.map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 flex gap-4 justify-end pt-4 border-t-2 border-amber-200">
                  <Button type="button" variant="outline" onClick={resetBusForm} className="rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold px-6">
                    <X className="w-5 h-5 mr-2" />
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                    <Save className="w-5 h-5 mr-2" />
                    {editingBus ? 'Modifier' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-amber-100">
            {buses.map((bus) => {
              const chauffeur = chauffeurs.find(c => c.id === bus.chauffeur_id);
              const responsable = responsables.find(r => r.id === bus.responsable_id);
              const trajet = trajets.find(t => t.id === bus.trajet_id);

              return (
                <motion.div
                  key={bus.id}
                  className="p-8 hover:bg-gradient-to-r hover:from-amber-50 hover:to-white transition-all duration-300"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <Bus className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-amber-900 mb-3">{bus.numero}</h3>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md" title={`${bus.places_restantes} places restantes`}>
                            {bus.eleves_inscrits || 0} / {bus.capacite} places
                          </span>
                          {chauffeur && (
                            <span className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md">
                              {chauffeur.prenom} {chauffeur.nom}
                            </span>
                          )}
                          {responsable && (
                            <span className="px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-semibold shadow-md">
                              Resp: {responsable.prenom} {responsable.nom}
                            </span>
                          )}
                          {trajet && (
                            <span className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md">
                              {trajet.nom}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="icon" onClick={() => editBus(bus)} className="rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 w-11 h-11 shadow-md">
                        <Edit className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteBusClick(bus.id)} className="rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 w-11 h-11 shadow-md">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {buses.length === 0 && (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="w-10 h-10 text-amber-600 opacity-60" />
                </div>
                <p className="text-amber-700 font-semibold text-lg">Aucun bus enregistré</p>
                <p className="text-amber-600 text-sm mt-2">Cliquez sur "Ajouter un bus" pour commencer</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Trajets Tab */}
      {activeTab === 'trajets' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200"
        >
          <div className="p-8 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Navigation className="w-7 h-7 text-white" />
              </div>
              Gestion des Trajets
            </h2>
            <Button
              onClick={() => setShowTrajetForm(true)}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un trajet
            </Button>
          </div>

          {showTrajetForm && (
            <div className="p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b-2 border-gray-200">
              <form onSubmit={handleSaveTrajet} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-900 font-semibold mb-2 block">Nom du trajet</Label>
                    <Input
                      value={trajetForm.nom}
                      onChange={(e) => setTrajetForm({ ...trajetForm, nom: e.target.value })}
                      placeholder="Ex: Trajet Nord"
                      className="mt-1 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 h-12"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      Zones desservies (max 2)
                    </Label>
                    <div className="mt-2 space-y-2">
                      {/* Zones sélectionnées */}
                      {trajetForm.zones.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-4">
                          {trajetForm.zones.map((zone, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl text-sm font-semibold shadow-md"
                            >
                              <MapPin className="w-4 h-4" />
                              {zone}
                              <button
                                type="button"
                                onClick={() => handleZoneSelect(zone)}
                                className="ml-1 hover:bg-gray-800 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Menu de sélection */}
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value && value !== '') {
                            handleZoneSelect(value);
                          }
                        }}
                        disabled={trajetForm.zones.length >= 2}
                      >
                        <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 h-12">
                          <SelectValue placeholder={trajetForm.zones.length >= 2 ? "Maximum 2 zones sélectionnées" : "Sélectionnez une zone"} />
                        </SelectTrigger>
                        <SelectContent>
                          {zones
                            .filter(zone => !trajetForm.zones.includes(zone))
                            .map(zone => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {trajetForm.zones.length}/2 zones sélectionnées
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Groupe A</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-gray-800 font-semibold mb-2 block">Départ Matin</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_depart_matin_a}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_depart_matin_a: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 h-12"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-800 font-semibold mb-2 block">Arrivée Matin</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_arrivee_matin_a}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_arrivee_matin_a: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 h-12"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-800 font-semibold mb-2 block">Départ Soir</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_depart_soir_a}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_depart_soir_a: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 h-12"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-800 font-semibold mb-2 block">Arrivée Soir</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_arrivee_soir_a}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_arrivee_soir_a: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 h-12"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Groupe B</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-gray-800 font-semibold mb-2 block">Départ Matin</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_depart_matin_b}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_depart_matin_b: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 h-12"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-800 font-semibold mb-2 block">Arrivée Matin</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_arrivee_matin_b}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_arrivee_matin_b: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 h-12"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-800 font-semibold mb-2 block">Départ Soir</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_depart_soir_b}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_depart_soir_b: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 h-12"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-800 font-semibold mb-2 block">Arrivée Soir</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_arrivee_soir_b}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_arrivee_soir_b: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 h-12"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t-2 border-amber-200">
                  <Button type="button" variant="outline" onClick={resetTrajetForm} className="rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold px-6">
                    <X className="w-5 h-5 mr-2" />
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                    <Save className="w-5 h-5 mr-2" />
                    {editingTrajet ? 'Modifier' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {trajets.map((trajet) => {
              const zonesArray = Array.isArray(trajet.zones) ? trajet.zones : [];

              return (
                <motion.div
                  key={trajet.id}
                  className="p-8 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                          <Navigation className="w-9 h-9 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{trajet.nom}</h3>
                      </div>
                      <div className="flex flex-wrap gap-3 mb-6">
                        {zonesArray.map((zone, i) => (
                          <span key={i} className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {zone}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                          <p className="text-blue-900 font-bold text-lg mb-3">Groupe A</p>
                          <div className="space-y-2 text-gray-900">
                            <p className="font-semibold"><span className="text-gray-700">Matin:</span> {trajet.heure_depart_matin_a} - {trajet.heure_arrivee_matin_a}</p>
                            <p className="font-semibold"><span className="text-gray-700">Soir:</span> {trajet.heure_depart_soir_a} - {trajet.heure_arrivee_soir_a}</p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border-2 border-indigo-200 shadow-sm">
                          <p className="text-indigo-900 font-bold text-lg mb-3">Groupe B</p>
                          <div className="space-y-2 text-gray-900">
                            <p className="font-semibold"><span className="text-gray-700">Matin:</span> {trajet.heure_depart_matin_b} - {trajet.heure_arrivee_matin_b}</p>
                            <p className="font-semibold"><span className="text-gray-700">Soir:</span> {trajet.heure_depart_soir_b} - {trajet.heure_arrivee_soir_b}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 ml-6">
                      <Button variant="outline" size="icon" onClick={() => editTrajet(trajet)} className="rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 w-11 h-11 shadow-md">
                        <Edit className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteTrajetClick(trajet.id)} className="rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 w-11 h-11 shadow-md">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {trajets.length === 0 && (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Navigation className="w-10 h-10 text-gray-600 opacity-60" />
                </div>
                <p className="text-gray-700 font-semibold text-lg">Aucun trajet enregistré</p>
                <p className="text-gray-600 text-sm mt-2">Cliquez sur "Ajouter un trajet" pour commencer</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Dialog de confirmation de suppression de bus */}
      <ConfirmDialog
        isOpen={deleteBusConfirm.show}
        title="Supprimer le bus"
        message="Êtes-vous sûr de vouloir supprimer ce bus ? Cette action est irréversible."
        onConfirm={handleDeleteBus}
        onCancel={() => setDeleteBusConfirm({ show: false, id: null })}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Dialog de confirmation de suppression de trajet */}
      <ConfirmDialog
        isOpen={deleteTrajetConfirm.show}
        title="Supprimer le trajet"
        message="Êtes-vous sûr de vouloir supprimer ce trajet ? Cette action est irréversible."
        onConfirm={handleDeleteTrajet}
        onCancel={() => setDeleteTrajetConfirm({ show: false, id: null })}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </AdminLayout>
  );
}