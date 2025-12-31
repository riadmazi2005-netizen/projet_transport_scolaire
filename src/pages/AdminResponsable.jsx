import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { responsablesAPI, busAPI, authAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserCog, ArrowLeft, Plus, Edit, Trash2, Save, X, Eye, EyeOff, Bus
} from 'lucide-react';

export default function AdminResponsables() {
  const navigate = useNavigate();
  const [responsables, setResponsables] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '', 
    mot_de_passe: '', 
    zone_responsabilite: ''
  });

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      navigate(createPageUrl('AdminLogin'));
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [responsablesData, busesData] = await Promise.all([
        responsablesAPI.getAll(),
        busAPI.getAll()
      ]);
      
      // Enrichir les responsables avec les infos des bus assignés
      const responsablesEnrichis = responsablesData.map(r => {
        const busAssignes = busesData.filter(b => b.responsable_id === r.id);
        return {
          ...r,
          buses: busAssignes
        };
      });
      
      setResponsables(responsablesEnrichis);
      setBuses(busesData);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données');
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const data = { 
        ...form, 
        role: 'responsable',
        statut: 'Actif'
      };
      
      if (editing) {
        await responsablesAPI.update(editing.id, data);
      } else {
        await responsablesAPI.create(data);
      }
      
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement du responsable');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce responsable ?')) {
      try {
        await responsablesAPI.delete(id);
        await loadData();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Erreur lors de la suppression du responsable');
      }
    }
  };

  const resetForm = () => {
    setForm({ 
      nom: '', 
      prenom: '', 
      email: '', 
      telephone: '', 
      mot_de_passe: '', 
      zone_responsabilite: ''
    });
    setEditing(null);
    setShowForm(false);
  };

  const editItem = (item) => {
    setForm({
      nom: item.nom || '',
      prenom: item.prenom || '',
      email: item.email || '',
      telephone: item.telephone || '',
      mot_de_passe: '', // Ne pas pré-remplir le mot de passe pour la sécurité
      zone_responsabilite: item.zone_responsabilite || ''
    });
    setEditing(item);
    setShowForm(true);
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
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
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-500 to-violet-500">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCog className="w-6 h-6" />
              Gestion des Responsables Bus
            </h2>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-white text-purple-600 hover:bg-purple-50 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {showForm && (
            <div className="p-6 bg-purple-50 border-b border-purple-100">
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label>Prénom</Label>
                  <Input
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label>Mot de passe {editing && '(laisser vide pour ne pas changer)'}</Label>
                  <Input
                    type="password"
                    value={form.mot_de_passe}
                    onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                    className="mt-1 rounded-xl"
                    required={!editing}
                  />
                </div>
                <div>
                  <Label>Zone de responsabilité</Label>
                  <Input
                    value={form.zone_responsabilite}
                    onChange={(e) => setForm({ ...form, zone_responsabilite: e.target.value })}
                    placeholder="Ex: Zone Centre"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div className="md:col-span-3 flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl">
                    <Save className="w-4 h-4 mr-2" />
                    {editing ? 'Modifier' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {responsables.map((item) => {
              return (
                <div key={item.id} className="p-6 hover:bg-purple-50/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                        <UserCog className="w-7 h-7 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{item.prenom} {item.nom}</h3>
                        <p className="text-gray-500">{item.telephone}</p>
                        <p className="text-sm text-gray-400">{item.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-sm">
                          {item.zone_responsabilite && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg">
                              {item.zone_responsabilite}
                            </span>
                          )}
                          {item.buses && item.buses.length > 0 && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg flex items-center gap-1">
                              <Bus className="w-3 h-3" />
                              {item.buses.length} bus assigné{item.buses.length > 1 ? 's' : ''}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-lg ${
                            item.statut === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.statut}
                          </span>
                        </div>
                        {item.buses && item.buses.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            Bus: {item.buses.map(b => b.numero).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => editItem(item)} className="rounded-xl">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)} className="rounded-xl text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {responsables.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun responsable enregistré</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}