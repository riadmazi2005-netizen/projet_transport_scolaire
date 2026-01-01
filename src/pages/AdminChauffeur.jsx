import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { chauffeursAPI, busAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminLayout from '../components/AdminLayout';
import { 
  Users, Plus, Edit, Trash2, Save, X, Eye, EyeOff, AlertCircle, ArrowLeft, Bus
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
    nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', salaire: '', date_embauche: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chauffeursRes, busesRes] = await Promise.all([
        chauffeursAPI.getAll(),
        busAPI.getAll()
      ]);
      
      const chauffeursData = chauffeursRes?.data || chauffeursRes || [];
      const busesData = busesRes?.data || busesRes || [];
      
      // Enrichir les chauffeurs avec l'info du bus assigné (un seul bus maximum)
      const chauffeursEnrichis = Array.isArray(chauffeursData) ? chauffeursData.map(c => {
        const busAssigne = Array.isArray(busesData) ? busesData.find(b => b.chauffeur_id === c.id) : null;
        return {
          ...c,
          bus: busAssigne
        };
      }) : [];
      
      setChauffeurs(chauffeursEnrichis);
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
      let data;
      
      if (editing) {
        // En mode édition, on peut modifier email, téléphone, mot de passe et salaire
        data = {
          email: form.email,
          telephone: form.telephone
        };
        
        // Ajouter le mot de passe seulement s'il est rempli
        if (form.mot_de_passe) {
          data.mot_de_passe = form.mot_de_passe;
        }
        
        // Ajouter le salaire si fourni
        if (form.salaire !== '' && form.salaire !== null && form.salaire !== undefined) {
          data.salaire = parseFloat(form.salaire) || 0;
        }
      } else {
        // En mode création, envoyer toutes les données (sans permis)
        data = { 
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          telephone: form.telephone,
          mot_de_passe: form.mot_de_passe,
          salaire: parseInt(form.salaire) || 0,
          date_embauche: form.date_embauche || null,
          nombre_accidents: 0,
          statut: 'Actif'
        };
      }
      
      if (editing) {
        await chauffeursAPI.update(editing.id, data);
      } else {
        await chauffeursAPI.create(data);
      }
      
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement du chauffeur: ' + (err.message || 'Erreur inconnue'));
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
    setForm({ nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', salaire: '', date_embauche: '' });
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
      salaire: item.salaire !== null && item.salaire !== undefined ? item.salaire.toString() : ''
    });
    setEditing(item);
    setShowForm(true);
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
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
    <AdminLayout title="Gestion des Chauffeurs">
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
              className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {showForm && (
            <div className="p-6 bg-green-50 border-b border-green-100">
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!editing && (
                  <>
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
                      <Label>Date d'embauche</Label>
                      <Input
                        type="date"
                        value={form.date_embauche}
                        onChange={(e) => setForm({ ...form, date_embauche: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Mot de passe</Label>
                      <Input
                        type="password"
                        value={form.mot_de_passe}
                        onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                        className="mt-1 rounded-xl"
                        required
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
                  </>
                )}
                {editing && (
                  <>
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
                      <Label>Mot de passe (laisser vide pour ne pas changer)</Label>
                      <Input
                        type="password"
                        value={form.mot_de_passe}
                        onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                        className="mt-1 rounded-xl"
                      />
                    </div>
                  </>
                )}
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
                          {item.salaire !== null && item.salaire !== undefined ? parseFloat(item.salaire).toLocaleString('fr-FR') : '0'} DH
                        </span>
                        {item.bus && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg flex items-center gap-1">
                            <Bus className="w-3 h-3" />
                            {item.bus.numero}
                          </span>
                        )}
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
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Mot de passe:</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-gray-700 font-mono text-xs border border-gray-200 break-all max-w-md">
                            {showPassword[item.id] ? (item.user_password || item.mot_de_passe || 'N/A') : '••••••••'}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => togglePasswordVisibility(item.id)}
                            className="rounded-lg border-gray-300 hover:bg-gray-100 flex-shrink-0"
                          >
                            {showPassword[item.id] ? <EyeOff className="w-4 h-4 text-gray-700" /> : <Eye className="w-4 h-4 text-gray-700" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => editItem(item)} className="rounded-xl border-gray-300 hover:bg-gray-100">
                      <Edit className="w-4 h-4 text-gray-700" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)} className="rounded-xl border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400">
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
    </AdminLayout>
  );
}