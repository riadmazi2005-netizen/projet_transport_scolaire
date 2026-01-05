import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { zonesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminLayout from '../components/AdminLayout';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { 
  MapPin, Plus, Edit, Trash2, Save, X, ArrowLeft, CheckCircle
} from 'lucide-react';

export default function AdminZones() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  const villes = ['Rabat', 'Salé', 'Temara'];
  
  const [form, setForm] = useState({
    nom: '',
    ville: '',
    description: '',
    actif: true
  });

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (editing) {
        await zonesAPI.update({
          id: editing.id,
          nom: form.nom,
          ville: form.ville,
          description: form.description,
          actif: form.actif
        });
      } else {
        await zonesAPI.create({
          nom: form.nom,
          ville: form.ville,
          description: form.description,
          actif: form.actif
        });
      }
      
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.message || 'Erreur lors de la sauvegarde de la zone');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    
    try {
      await zonesAPI.delete(deleteConfirm.id);
      setDeleteConfirm({ show: false, id: null });
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.message || 'Erreur lors de la suppression de la zone');
      setDeleteConfirm({ show: false, id: null });
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const handleEdit = (zone) => {
    setEditing(zone);
    setForm({
      nom: zone.nom || '',
      ville: zone.ville || '',
      description: zone.description || '',
      actif: zone.actif !== undefined ? zone.actif : true
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ nom: '', ville: '', description: '', actif: true });
    setEditing(null);
    setShowForm(false);
    setError(null);
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
    <AdminLayout title="Gestion des Zones">
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
        <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <MapPin className="w-7 h-7" />
                Gestion des Zones
              </h1>
              <p className="text-blue-100 mt-1">{zones.length} zone(s) au total</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une zone
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium">Nom de la zone *</Label>
                  <Input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="mt-1 h-12 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Ville *</Label>
                  <select
                    value={form.ville}
                    onChange={(e) => setForm({ ...form, ville: e.target.value })}
                    className="mt-1 h-12 rounded-xl w-full px-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner une ville</option>
                    {villes.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 h-12 rounded-xl"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actif"
                  checked={form.actif}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <Label htmlFor="actif" className="text-gray-700 font-medium cursor-pointer">
                  Zone active
                </Label>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                  <Save className="w-4 h-4 mr-2" />
                  {editing ? 'Modifier' : 'Ajouter'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {zones.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune zone trouvée</p>
            </div>
          ) : (
            zones.map((zone) => (
              <div key={zone.id} className="p-6 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                        {zone.nom}
                        {zone.ville && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {zone.ville}
                          </span>
                        )}
                        {zone.actif && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            Active
                          </span>
                        )}
                        {!zone.actif && (
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
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(zone)}
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(zone.id)}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Supprimer la zone"
        message="Êtes-vous sûr de vouloir supprimer cette zone ?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: null })}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />
    </AdminLayout>
  );
}

