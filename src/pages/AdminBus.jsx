import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { busAPI, trajetsAPI, chauffeursAPI, responsablesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
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

  const [busForm, setBusForm] = useState({
    numero: '', capacite: '', chauffeur_id: '', responsable_id: '', trajet_id: '', statut: 'Actif'
  });

  const [trajetForm, setTrajetForm] = useState({
    nom: '', zones: [], heure_depart_matin_a: '07:30', heure_arrivee_matin_a: '08:00',
    heure_depart_soir_a: '17:00', heure_arrivee_soir_a: '17:30',
    heure_depart_matin_b: '08:00', heure_arrivee_matin_b: '08:30',
    heure_depart_soir_b: '17:30', heure_arrivee_soir_b: '18:00'
  });

  const zones = ['Medina', 'Hay Sinaï', 'Hay El Fath', 'Souissi', 'Akkari', 'Manal', 'Agdal', 'Nahda-Takkadoum', 'Temara'];

  useEffect(() => {
    loadData();
  }, []);

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

  const handleDeleteBus = async (busId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bus ?')) {
      try {
        await busAPI.delete(busId);
        await loadData();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Erreur lors de la suppression du bus');
      }
    }
  };

  const handleDeleteTrajet = async (trajetId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce trajet ?')) {
      try {
        await trajetsAPI.delete(trajetId);
        await loadData();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Erreur lors de la suppression du trajet');
      }
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
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestion des Bus et Trajets">
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'buses' ? 'default' : 'outline'}
            onClick={() => setActiveTab('buses')}
            className={`rounded-xl ${activeTab === 'buses' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
          >
            <Bus className="w-4 h-4 mr-2" />
            Bus ({buses.length})
          </Button>
          <Button
            variant={activeTab === 'trajets' ? 'default' : 'outline'}
            onClick={() => setActiveTab('trajets')}
            className={`rounded-xl ${activeTab === 'trajets' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Trajets ({trajets.length})
          </Button>
        </div>

      {/* Buses Tab */}
      {activeTab === 'buses' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Bus className="w-6 h-6 text-amber-500" />
                Gestion des Bus
              </h2>
              <Button
                onClick={() => setShowBusForm(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un bus
              </Button>
            </div>

            {showBusForm && (
              <div className="p-6 bg-amber-50 border-b border-amber-100">
                <form onSubmit={handleSaveBus} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Numéro du bus</Label>
                    <Input
                      value={busForm.numero}
                      onChange={(e) => setBusForm({ ...busForm, numero: e.target.value })}
                      placeholder="Ex: BUS-001"
                      className="mt-1 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label>Capacité</Label>
                    <Input
                      type="number"
                      value={busForm.capacite}
                      onChange={(e) => setBusForm({ ...busForm, capacite: e.target.value })}
                      placeholder="Ex: 40"
                      className="mt-1 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label>Chauffeur</Label>
                    <Select value={busForm.chauffeur_id} onValueChange={(v) => setBusForm({ ...busForm, chauffeur_id: v })}>
                      <SelectTrigger className="mt-1 rounded-xl">
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
                    <Label>Responsable</Label>
                    <Select value={busForm.responsable_id} onValueChange={(v) => setBusForm({ ...busForm, responsable_id: v })}>
                      <SelectTrigger className="mt-1 rounded-xl">
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
                    <Label>Trajet</Label>
                    <Select value={busForm.trajet_id} onValueChange={(v) => setBusForm({ ...busForm, trajet_id: v })}>
                      <SelectTrigger className="mt-1 rounded-xl">
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
                  <div className="md:col-span-3 flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={resetBusForm} className="rounded-xl">
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                      <Save className="w-4 h-4 mr-2" />
                      {editingBus ? 'Modifier' : 'Enregistrer'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="divide-y divide-gray-100">
              {buses.map((bus) => {
                const chauffeur = chauffeurs.find(c => c.id === bus.chauffeur_id);
                const responsable = responsables.find(r => r.id === bus.responsable_id);
                const trajet = trajets.find(t => t.id === bus.trajet_id);
                
                return (
                  <div key={bus.id} className="p-6 hover:bg-amber-50/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
                          <Bus className="w-8 h-8 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{bus.numero}</h3>
                          <div className="flex flex-wrap gap-2 mt-2 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">
                              {bus.capacite} places
                            </span>
                            {chauffeur && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                                {chauffeur.prenom} {chauffeur.nom}
                              </span>
                            )}
                            {responsable && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg">
                                Resp: {responsable.prenom} {responsable.nom}
                              </span>
                            )}
                            {trajet && (
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                                {trajet.nom}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => editBus(bus)} className="rounded-xl">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteBus(bus.id)} className="rounded-xl text-red-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {buses.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun bus enregistré</p>
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
            className="bg-white rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Navigation className="w-6 h-6 text-amber-500" />
                Gestion des Trajets
              </h2>
              <Button
                onClick={() => setShowTrajetForm(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un trajet
              </Button>
            </div>

            {showTrajetForm && (
              <div className="p-6 bg-amber-50 border-b border-amber-100">
                <form onSubmit={handleSaveTrajet} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nom du trajet</Label>
                      <Input
                        value={trajetForm.nom}
                        onChange={(e) => setTrajetForm({ ...trajetForm, nom: e.target.value })}
                        placeholder="Ex: Trajet Nord"
                        className="mt-1 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        Zones desservies (max 2)
                      </Label>
                      <div className="mt-2 space-y-2">
                        {/* Zones sélectionnées */}
                        {trajetForm.zones.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {trajetForm.zones.map((zone, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
                              >
                                {zone}
                                <button
                                  type="button"
                                  onClick={() => handleZoneSelect(zone)}
                                  className="ml-1 hover:text-amber-900"
                                >
                                  <X className="w-3 h-3" />
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
                          <SelectTrigger className="rounded-xl">
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Départ Matin A</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_depart_matin_a}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_depart_matin_a: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Arrivée Matin A</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_arrivee_matin_a}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_arrivee_matin_a: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Départ Soir A</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_depart_soir_a}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_depart_soir_a: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Arrivée Soir A</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_arrivee_soir_a}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_arrivee_soir_a: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Départ Matin B</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_depart_matin_b}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_depart_matin_b: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Arrivée Matin B</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_arrivee_matin_b}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_arrivee_matin_b: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Départ Soir B</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_depart_soir_b}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_depart_soir_b: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Arrivée Soir B</Label>
                      <Input
                        type="time"
                        value={trajetForm.heure_arrivee_soir_b}
                        onChange={(e) => setTrajetForm({ ...trajetForm, heure_arrivee_soir_b: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={resetTrajetForm} className="rounded-xl">
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                      <Save className="w-4 h-4 mr-2" />
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
                  <div key={trajet.id} className="p-6 hover:bg-amber-50/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{trajet.nom}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {zonesArray.map((zone, i) => (
                            <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {zone}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-gray-500">Groupe A</p>
                            <p>Matin: {trajet.heure_depart_matin_a} - {trajet.heure_arrivee_matin_a}</p>
                            <p>Soir: {trajet.heure_depart_soir_a} - {trajet.heure_arrivee_soir_a}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Groupe B</p>
                            <p>Matin: {trajet.heure_depart_matin_b} - {trajet.heure_arrivee_matin_b}</p>
                            <p>Soir: {trajet.heure_depart_soir_b} - {trajet.heure_arrivee_soir_b}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => editTrajet(trajet)} className="rounded-xl">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteTrajet(trajet.id)} className="rounded-xl text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {trajets.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <Navigation className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun trajet enregistré</p>
                </div>
              )}
            </div>
        </motion.div>
      )}
    </AdminLayout>
  );
}