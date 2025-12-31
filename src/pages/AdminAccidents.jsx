import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { accidentsAPI, busAPI, chauffeursAPI, notificationsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from '../components/AdminLayout';
import { 
  AlertCircle, Plus, Calendar, Bus, User, MapPin, Save, X
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminAccidents() {
  const navigate = useNavigate();
  const [accidents, setAccidents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    date: '', 
    heure: '', 
    bus_id: '', 
    chauffeur_id: '', 
    description: '', 
    degats: '', 
    lieu: '', 
    gravite: '', 
    blesses: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accidentsData, busesData, chauffeursData] = await Promise.all([
        accidentsAPI.getAll(),
        busAPI.getAll(),
        chauffeursAPI.getAll()
      ]);
      
      setAccidents(accidentsData.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setBuses(busesData);
      setChauffeurs(chauffeursData);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Créer l'accident
      await accidentsAPI.create(form);
      
      // Mettre à jour le compteur d'accidents du chauffeur
      const chauffeur = chauffeurs.find(c => c.id === parseInt(form.chauffeur_id));
      if (chauffeur) {
        const newCount = (chauffeur.nombre_accidents || 0) + 1;
        await chauffeursAPI.update(form.chauffeur_id, {
          nombre_accidents: newCount
        });
        
        // Vérifier si 3 accidents ou plus
        if (newCount >= 3) {
          await chauffeursAPI.update(form.chauffeur_id, {
            statut: 'Licencié'
          });
          
          // Notifier le chauffeur
          await notificationsAPI.create({
            destinataire_id: form.chauffeur_id,
            destinataire_type: 'chauffeur',
            titre: 'Licenciement',
            message: 'Suite à votre 3ème accident, vous êtes licencié avec une amende de 1000 DH conformément au règlement.',
            type: 'alerte'
          });
        }
      }
      
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement de l\'accident');
    }
  };

  const resetForm = () => {
    setForm({
      date: '', 
      heure: '', 
      bus_id: '', 
      chauffeur_id: '', 
      description: '', 
      degats: '', 
      lieu: '', 
      gravite: '', 
      blesses: false
    });
    setShowForm(false);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-500 hover:text-amber-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-red-500 to-rose-500">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Gestion des Accidents
            </h2>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-white text-red-600 hover:bg-red-50 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Déclarer un accident
            </Button>
          </div>

          {showForm && (
            <div className="p-6 bg-red-50 border-b border-red-100">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="mt-1 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label>Heure</Label>
                    <Input
                      type="time"
                      value={form.heure}
                      onChange={(e) => setForm({ ...form, heure: e.target.value })}
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Bus</Label>
                    <Select value={form.bus_id} onValueChange={(v) => setForm({ ...form, bus_id: v })}>
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        {buses.map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.numero}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Chauffeur</Label>
                    <Select value={form.chauffeur_id} onValueChange={(v) => setForm({ ...form, chauffeur_id: v })}>
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        {chauffeurs.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.prenom} {c.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Lieu</Label>
                    <Input
                      value={form.lieu}
                      onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                      className="mt-1 rounded-xl"
                      placeholder="Lieu de l'accident"
                    />
                  </div>
                  <div>
                    <Label>Gravité</Label>
                    <Select value={form.gravite} onValueChange={(v) => setForm({ ...form, gravite: v })}>
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Légère">Légère</SelectItem>
                        <SelectItem value="Moyenne">Moyenne</SelectItem>
                        <SelectItem value="Grave">Grave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.blesses}
                        onChange={(e) => setForm({ ...form, blesses: e.target.checked })}
                        className="w-5 h-5 rounded"
                      />
                      <span>Blessés signalés</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="Description de l'accident..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Dégâts</Label>
                  <Textarea
                    value={form.degats}
                    onChange={(e) => setForm({ ...form, degats: e.target.value })}
                    className="mt-1 rounded-xl"
                    placeholder="Description des dégâts..."
                    rows={2}
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {accidents.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun accident enregistré</p>
              </div>
            ) : (
              accidents.map((accident) => {
                const bus = buses.find(b => b.id === accident.bus_id);
                const chauffeur = chauffeurs.find(c => c.id === accident.chauffeur_id);
                
                return (
                  <div key={accident.id} className="p-6 hover:bg-red-50/50 transition-colors">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGraviteBadge(accident.gravite)}`}>
                            {accident.gravite}
                          </span>
                          {accident.blesses && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                              Blessés
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
                          {chauffeur && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4 text-green-500" />
                              {chauffeur.prenom} {chauffeur.nom}
                            </div>
                          )}
                          {accident.lieu && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-red-500" />
                              {accident.lieu}
                            </div>
                          )}
                        </div>

                        <h3 className="font-semibold text-gray-800 mb-2">{accident.description}</h3>
                        <p className="text-sm text-gray-500">
                          <strong>Dégâts:</strong> {accident.degats}
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