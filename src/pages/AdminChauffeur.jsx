import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { chauffeursAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, ArrowLeft, Plus, Edit, Trash2, Save, X, Eye, EyeOff, AlertCircle
} from 'lucide-react';

export default function AdminChauffeurs() {
  const navigate = useNavigate();
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', permis: '', salaire: '', date_embauche: ''
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
      const data = await chauffeursAPI.getAll();
      setChauffeurs(data);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des chauffeurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const data = { 
        ...form, 
        salaire: parseInt(form.salaire), 
        nombre_accidents: editing ? editing.nombre_accidents : 0, 
        statut: editing ? editing.statut : 'Actif' 
      };
      
      if (editing) {
        await chauffeursAPI.update(editing.id, data);
      } else {
        await chauffeursAPI.create(data);
      }
      
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement du chauffeur');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) {
      try {
        await chauffeursAPI.delete(id);
        await loadData();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Erreur lors de la suppression du chauffeur');
      }
    }
  };

  const resetForm = () => {
    setForm({ nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', permis: '', salaire: '', date_embauche: '' });
    setEditing(null);
    setShowForm(false);
  };

  const editItem = (item) => {
    setForm({
      nom: item.nom || '',
      prenom: item.prenom || '',
      email: item.email || '',
      telephone: item.telephone || '',
      mot_de_passe: item.mot_de_passe || '',
      permis: item.permis || '',
      salaire: item.salaire?.toString() || '',
      date_embauche: item.date_embauche || ''
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
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-green-500 to-emerald-500">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6" />
              Gestion des Chauffeurs
            </h2>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-white text-green-600 hover:bg-green-50 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {showForm && (
            <div className="p-6 bg-green-50 border-b border-green-100">
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
                  <Label>Mot de passe (pour connexion)</Label>
                  <Input
                    value={form.mot_de_passe}
                    onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label>Numéro de permis</Label>
                  <Input
                    value={form.permis}
                    onChange={(e) => setForm({ ...form, permis: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label>Salaire (DH)</Label>
                  <Input
                    type="number"
                    value={form.salaire}
                    onChange={(e) => setForm({ ...form, salaire: e.target.value })}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label>Date d'embauche</Label>
                  <Input
                    type="date"
                    value={form.date_embauche}
                    onChange={(e) => setForm({ ...form, date_embauche: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div className="md:col-span-3 flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                    <Save className="w-4 h-4 mr-2" />
                    {editing ? 'Modifier' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {chauffeurs.map((item) => (
              <div key={item.id} className="p-6 hover:bg-green-50/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                      <Users className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{item.prenom} {item.nom}</h3>
                      <p className="text-gray-500">{item.telephone}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                          {item.salaire} DH
                        </span>
                        <span className={`px-2 py-1 rounded-lg ${
                          item.nombre_accidents >= 3 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.nombre_accidents || 0} accident(s)
                        </span>
                        {item.nombre_accidents >= 3 && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Licenciement
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Mot de passe:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {showPassword[item.id] ? item.mot_de_passe : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(item.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showPassword[item.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
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
            ))}
            {chauffeurs.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun chauffeur enregistré</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}