import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { chauffeursAPI, responsablesAPI, busAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminLayout from '../components/AdminLayout';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Users, UserCog, Plus, Edit, Trash2, Save, X, Eye, EyeOff, AlertCircle, ArrowLeft, Bus
} from 'lucide-react';

export default function AdminChauffeur() {
  const navigate = useNavigate();
  const [chauffeurs, setChauffeurs] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chauffeurs');
  const [showChauffeurForm, setShowChauffeurForm] = useState(false);
  const [showResponsableForm, setShowResponsableForm] = useState(false);
  const [editingChauffeur, setEditingChauffeur] = useState(null);
  const [editingResponsable, setEditingResponsable] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [error, setError] = useState(null);
  const [deleteChauffeurConfirm, setDeleteChauffeurConfirm] = useState({ show: false, id: null });
  const [deleteResponsableConfirm, setDeleteResponsableConfirm] = useState({ show: false, id: null });
  const [licencierConfirm, setLicencierConfirm] = useState({ show: false, id: null, nom: '' });
  const [cleanTerminatedConfirm, setCleanTerminatedConfirm] = useState(false);

  const [chauffeurForm, setChauffeurForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', salaire: '', date_embauche: ''
  });

  const [responsableForm, setResponsableForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', salaire: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chauffeursRes, responsablesRes, busesRes] = await Promise.all([
        chauffeursAPI.getAll(),
        responsablesAPI.getAll(),
        busAPI.getAll()
      ]);

      const chauffeursData = chauffeursRes?.data || chauffeursRes || [];
      const responsablesData = responsablesRes?.data || responsablesRes || [];
      const busesData = busesRes?.data || busesRes || [];

      // Enrichir les chauffeurs avec l'info du bus assigné
      const chauffeursEnrichis = Array.isArray(chauffeursData) ? chauffeursData.map(c => {
        const busAssigne = Array.isArray(busesData) ? busesData.find(b => b.chauffeur_id === c.id) : null;
        return { ...c, bus: busAssigne };
      }) : [];

      // Enrichir les responsables avec l'info du bus assigné
      const responsablesEnrichis = Array.isArray(responsablesData) ? responsablesData.map(r => {
        const busAssigne = Array.isArray(busesData) ? busesData.find(b => b.responsable_id === r.id) : null;
        return { ...r, bus: busAssigne };
      }) : [];

      setChauffeurs(chauffeursEnrichis);
      setResponsables(responsablesEnrichis);
      setBuses(Array.isArray(busesData) ? busesData : []);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChauffeur = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let data;

      if (editingChauffeur) {
        data = {
          email: chauffeurForm.email,
          telephone: chauffeurForm.telephone
        };

        if (chauffeurForm.mot_de_passe) {
          data.mot_de_passe = chauffeurForm.mot_de_passe;
        }

        if (chauffeurForm.salaire !== '' && chauffeurForm.salaire !== null && chauffeurForm.salaire !== undefined) {
          data.salaire = parseFloat(chauffeurForm.salaire) || 0;
        }
      } else {
        data = {
          nom: chauffeurForm.nom,
          prenom: chauffeurForm.prenom,
          email: chauffeurForm.email,
          telephone: chauffeurForm.telephone,
          mot_de_passe: chauffeurForm.mot_de_passe,
          salaire: parseInt(chauffeurForm.salaire) || 0,
          date_embauche: chauffeurForm.date_embauche || null,
          nombre_accidents: 0,
          statut: 'Actif'
        };
      }

      if (editingChauffeur) {
        await chauffeursAPI.update(editingChauffeur.id, data);
      } else {
        await chauffeursAPI.create(data);
      }

      resetChauffeurForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement du chauffeur: ' + (err.message || 'Erreur inconnue'));
    }
  };

  const handleSaveResponsable = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let data;

      if (editingResponsable) {
        data = {
          email: responsableForm.email,
          telephone: responsableForm.telephone
        };

        if (responsableForm.mot_de_passe) {
          data.mot_de_passe = responsableForm.mot_de_passe;
        }

        if (responsableForm.salaire !== '' && responsableForm.salaire !== null && responsableForm.salaire !== undefined) {
          data.salaire = parseFloat(responsableForm.salaire) || 0;
        }
      } else {
        data = {
          nom: responsableForm.nom,
          prenom: responsableForm.prenom,
          email: responsableForm.email,
          telephone: responsableForm.telephone,
          mot_de_passe: responsableForm.mot_de_passe,
          salaire: parseFloat(responsableForm.salaire) || 0,
          role: 'responsable',
          statut: 'Actif'
        };
      }

      if (editingResponsable) {
        await responsablesAPI.update(editingResponsable.id, data);
      } else {
        await responsablesAPI.create(data);
      }

      resetResponsableForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Erreur lors de l\'enregistrement du responsable: ' + (err.message || 'Erreur inconnue'));
    }
  };

  const handleDeleteChauffeurClick = (id) => {
    setDeleteChauffeurConfirm({ show: true, id });
  };

  const handleDeleteChauffeur = async () => {
    if (!deleteChauffeurConfirm.id) return;

    try {
      await chauffeursAPI.delete(deleteChauffeurConfirm.id);
      await loadData();
      setDeleteChauffeurConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression du chauffeur: ' + (err.message || 'Erreur inconnue'));
      setDeleteChauffeurConfirm({ show: false, id: null });
    }
  };

  const handleDeleteResponsableClick = (id) => {
    setDeleteResponsableConfirm({ show: true, id });
  };

  const handleDeleteResponsable = async () => {
    if (!deleteResponsableConfirm.id) return;

    try {
      await responsablesAPI.delete(deleteResponsableConfirm.id);
      await loadData();
      setDeleteResponsableConfirm({ show: false, id: null });
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setDeleteResponsableConfirm({ show: false, id: null });
    }
  };

  const handleLicencierClick = (item) => {
    setLicencierConfirm({ show: true, id: item.id, nom: `${item.prenom} ${item.nom}` });
  };

  const handleLicencier = async () => {
    if (!licencierConfirm.id) return;
    try {
      // Le backend (licencier.php) gère déjà la suppression totale (chauffeur, auth, accidents, etc.)
      await chauffeursAPI.licencier(licencierConfirm.id);

      // On met à jour l'état local pour retirer immédiatement le chauffeur de la liste
      setChauffeurs(prev => prev.filter(c => c.id !== licencierConfirm.id));

      setLicencierConfirm({ show: false, id: null, nom: '' });
      // Optionnel: Ajouter un feedback visuel si nécessaire, mais le retrait de la liste est explicite
    } catch (err) {
      console.error('Erreur licenciement:', err);
      // Si erreur, on recharge les données pour être sûr de l'état
      await loadData();
      setError('Erreur lors du licenciement du chauffeur');
      setLicencierConfirm({ show: false, id: null, nom: '' });
    }
  };



  const resetChauffeurForm = () => {
    setChauffeurForm({ nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', salaire: '', date_embauche: '' });
    setEditingChauffeur(null);
    setShowChauffeurForm(false);
  };

  const resetResponsableForm = () => {
    setResponsableForm({ nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', salaire: '' });
    setEditingResponsable(null);
    setShowResponsableForm(false);
  };

  const editChauffeur = (item) => {
    setChauffeurForm({
      nom: item.nom || '',
      prenom: item.prenom || '',
      email: item.email || '',
      telephone: item.telephone || '',
      mot_de_passe: '',
      salaire: item.salaire !== null && item.salaire !== undefined ? item.salaire.toString() : ''
    });
    setEditingChauffeur(item);
    setShowChauffeurForm(true);
  };

  const editResponsable = (item) => {
    setResponsableForm({
      nom: item.nom || '',
      prenom: item.prenom || '',
      email: item.email || '',
      telephone: item.telephone || '',
      mot_de_passe: '',
      salaire: item.salaire !== null && item.salaire !== undefined ? item.salaire.toString() : ''
    });
    setEditingResponsable(item);
    setShowResponsableForm(true);
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
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
    <AdminLayout title="Chauffeur & Responsable Bus">
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
          variant={activeTab === 'chauffeurs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('chauffeurs')}
          className={`rounded-xl font-semibold transition-all duration-300 ${activeTab === 'chauffeurs'
            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-200'
            : 'border-2 border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:bg-emerald-50'
            }`}
        >
          <Users className="w-5 h-5 mr-2" />
          Chauffeurs ({chauffeurs.length})
        </Button>
        <Button
          variant={activeTab === 'responsables' ? 'default' : 'outline'}
          onClick={() => setActiveTab('responsables')}
          className={`rounded-xl font-semibold transition-all duration-300 ${activeTab === 'responsables'
            ? 'bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white shadow-lg shadow-violet-200'
            : 'border-2 border-violet-200 hover:border-violet-300 text-violet-700 hover:bg-violet-50'
            }`}
        >
          <UserCog className="w-5 h-5 mr-2" />
          Responsables Bus ({responsables.length})
        </Button>
      </div>

      {/* Chauffeurs Tab */}
      {activeTab === 'chauffeurs' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100"
        >
          <div className="p-8 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Users className="w-7 h-7 text-white" />
              </div>
              Gestion des Chauffeurs
            </h2>
            <div className="flex gap-3">

              <Button
                onClick={() => setShowChauffeurForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Ajouter un chauffeur
              </Button>
            </div>
          </div>

          {showChauffeurForm && (
            <div className="p-8 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border-b-2 border-emerald-200">
              <form onSubmit={handleSaveChauffeur} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {!editingChauffeur && (
                  <>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Nom</Label>
                      <Input
                        value={chauffeurForm.nom}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, nom: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Prénom</Label>
                      <Input
                        value={chauffeurForm.prenom}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, prenom: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Email</Label>
                      <Input
                        type="email"
                        value={chauffeurForm.email}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, email: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Téléphone</Label>
                      <Input
                        value={chauffeurForm.telephone}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, telephone: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Date d'embauche</Label>
                      <Input
                        type="date"
                        value={chauffeurForm.date_embauche}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, date_embauche: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Mot de passe</Label>
                      <Input
                        type="password"
                        value={chauffeurForm.mot_de_passe}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, mot_de_passe: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Salaire (DH)</Label>
                      <Input
                        type="number"
                        value={chauffeurForm.salaire}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, salaire: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                        required
                      />
                    </div>
                  </>
                )}
                {editingChauffeur && (
                  <>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Email</Label>
                      <Input
                        type="email"
                        value={chauffeurForm.email}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, email: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Téléphone</Label>
                      <Input
                        value={chauffeurForm.telephone}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, telephone: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Salaire (DH)</Label>
                      <Input
                        type="number"
                        value={chauffeurForm.salaire}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, salaire: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-900 font-semibold mb-2 block">Mot de passe (laisser vide pour ne pas changer)</Label>
                      <Input
                        type="password"
                        value={chauffeurForm.mot_de_passe}
                        onChange={(e) => setChauffeurForm({ ...chauffeurForm, mot_de_passe: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 h-12"
                      />
                    </div>
                  </>
                )}
                <div className="md:col-span-3 flex gap-4 justify-end pt-4 border-t-2 border-emerald-200">
                  <Button type="button" variant="outline" onClick={resetChauffeurForm} className="rounded-xl border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold px-6">
                    <X className="w-5 h-5 mr-2" />
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                    <Save className="w-5 h-5 mr-2" />
                    {editingChauffeur ? 'Modifier' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-emerald-100">
            {chauffeurs.map((item) => (
              <motion.div
                key={item.id}
                className="p-8 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-white transition-all duration-300"
                whileHover={{ x: 4 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-emerald-900 mb-3">{item.prenom} {item.nom}</h3>
                      <p className="text-gray-500 mb-2">{item.telephone}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md">
                          {item.salaire !== null && item.salaire !== undefined ? parseFloat(item.salaire).toLocaleString('fr-FR') : '0'} DH
                        </span>
                        {item.bus && (
                          <span className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold shadow-md flex items-center gap-2">
                            <Bus className="w-4 h-4" />
                            {item.bus.numero}
                          </span>
                        )}
                        <span className={`px-4 py-2 rounded-xl font-semibold shadow-md ${item.nombre_accidents >= 3
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                          : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                          }`}>
                          {item.nombre_accidents || 0} accident(s)
                        </span>
                        {item.nombre_accidents >= 3 && (
                          <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-md flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Licenciement
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Mot de passe:</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-gray-700 font-mono text-xs border border-gray-200 break-all max-w-md">
                            {showPassword[item.id] ? (item.mot_de_passe_plain || item.user_password || item.mot_de_passe || 'N/A') : '••••••••'}
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
                  <div className="flex gap-3">
                    <Button variant="outline" size="icon" onClick={() => editChauffeur(item)} className="rounded-xl border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 w-11 h-11 shadow-md">
                      <Edit className="w-5 h-5" />
                    </Button>

                    {/* Suppression standard uniquement (Licenciement est automatique) */}
                    <Button variant="outline" size="icon" onClick={() => handleDeleteChauffeurClick(item.id)} className="rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 w-11 h-11 shadow-md">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            {chauffeurs.length === 0 && (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-emerald-600 opacity-60" />
                </div>
                <p className="text-emerald-700 font-semibold text-lg">Aucun chauffeur enregistré</p>
                <p className="text-emerald-600 text-sm mt-2">Cliquez sur "Ajouter un chauffeur" pour commencer</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Responsables Tab */}
      {activeTab === 'responsables' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-violet-100"
        >
          <div className="p-8 bg-gradient-to-r from-violet-600 via-violet-700 to-violet-600 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <UserCog className="w-7 h-7 text-white" />
              </div>
              Gestion des Responsables Bus
            </h2>
            <Button
              onClick={() => setShowResponsableForm(true)}
              className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un responsable
            </Button>
          </div>

          {showResponsableForm && (
            <div className="p-8 bg-gradient-to-br from-violet-50 via-white to-violet-50 border-b-2 border-violet-200">
              <form onSubmit={handleSaveResponsable} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {!editingResponsable && (
                  <>
                    <div>
                      <Label className="text-violet-900 font-semibold mb-2 block">Nom</Label>
                      <Input
                        value={responsableForm.nom}
                        onChange={(e) => setResponsableForm({ ...responsableForm, nom: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-violet-900 font-semibold mb-2 block">Prénom</Label>
                      <Input
                        value={responsableForm.prenom}
                        onChange={(e) => setResponsableForm({ ...responsableForm, prenom: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-violet-900 font-semibold mb-2 block">Email</Label>
                      <Input
                        type="email"
                        value={responsableForm.email}
                        onChange={(e) => setResponsableForm({ ...responsableForm, email: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-violet-900 font-semibold mb-2 block">Téléphone</Label>
                      <Input
                        value={responsableForm.telephone}
                        onChange={(e) => setResponsableForm({ ...responsableForm, telephone: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-violet-900 font-semibold mb-2 block">Salaire (DH)</Label>
                      <Input
                        type="number"
                        value={responsableForm.salaire}
                        onChange={(e) => setResponsableForm({ ...responsableForm, salaire: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-violet-900 font-semibold mb-2 block">Mot de passe</Label>
                      <Input
                        type="password"
                        value={responsableForm.mot_de_passe}
                        onChange={(e) => setResponsableForm({ ...responsableForm, mot_de_passe: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 h-12"
                        required
                      />
                    </div>
                  </>
                )}
                {editingResponsable && (
                  <>
                    <div>
                      <Label className="text-violet-900 font-semibold mb-2 block">Email</Label>
                      <Input
                        type="email"
                        value={responsableForm.email}
                        onChange={(e) => setResponsableForm({ ...responsableForm, email: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-violet-900 font-semibold mb-2 block">Téléphone</Label>
                      <Input
                        value={responsableForm.telephone}
                        onChange={(e) => setResponsableForm({ ...responsableForm, telephone: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-violet-900 font-semibold mb-2 block">Salaire (DH)</Label>
                      <Input
                        type="number"
                        value={responsableForm.salaire}
                        onChange={(e) => setResponsableForm({ ...responsableForm, salaire: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-violet-900 font-semibold mb-2 block">Mot de passe (laisser vide pour ne pas changer)</Label>
                      <Input
                        type="password"
                        value={responsableForm.mot_de_passe}
                        onChange={(e) => setResponsableForm({ ...responsableForm, mot_de_passe: e.target.value })}
                        className="mt-1 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 h-12"
                      />
                    </div>
                  </>
                )}
                <div className="md:col-span-3 flex gap-4 justify-end pt-4 border-t-2 border-violet-200">
                  <Button type="button" variant="outline" onClick={resetResponsableForm} className="rounded-xl border-2 border-violet-300 text-violet-700 hover:bg-violet-50 font-semibold px-6">
                    <X className="w-5 h-5 mr-2" />
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                    <Save className="w-5 h-5 mr-2" />
                    {editingResponsable ? 'Modifier' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-violet-100">
            {responsables.map((item) => {
              const isPasswordVisible = showPassword[item.id] || false;
              const passwordValue = item.mot_de_passe_plain || item.user_password || item.mot_de_passe || 'N/A';
              const passwordDisplay = isPasswordVisible ? passwordValue : '••••••••';

              return (
                <motion.div
                  key={item.id}
                  className="p-8 hover:bg-gradient-to-r hover:from-violet-50 hover:to-white transition-all duration-300"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserCog className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-violet-900 mb-3">{item.prenom} {item.nom}</h3>
                        <p className="text-gray-500 mb-2">{item.telephone}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-semibold shadow-md">
                            {item.id}
                          </span>
                          {item.salaire !== null && item.salaire !== undefined && (
                            <span className="px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-semibold shadow-md">
                              {parseFloat(item.salaire).toLocaleString('fr-FR')} DH
                            </span>
                          )}
                          {item.bus && (
                            <span className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold shadow-md flex items-center gap-2">
                              <Bus className="w-4 h-4" />
                              {item.bus.numero}
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Mot de passe:</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-gray-700 font-mono text-xs border border-gray-200 break-all max-w-md">
                              {passwordDisplay}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => togglePasswordVisibility(item.id)}
                              className="rounded-lg border-gray-300 hover:bg-gray-100 flex-shrink-0"
                            >
                              {isPasswordVisible ? <EyeOff className="w-4 h-4 text-gray-700" /> : <Eye className="w-4 h-4 text-gray-700" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="icon" onClick={() => editResponsable(item)} className="rounded-xl border-2 border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400 w-11 h-11 shadow-md">
                        <Edit className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteResponsableClick(item.id)} className="rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 w-11 h-11 shadow-md">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {responsables.length === 0 && (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCog className="w-10 h-10 text-violet-600 opacity-60" />
                </div>
                <p className="text-violet-700 font-semibold text-lg">Aucun responsable enregistré</p>
                <p className="text-violet-600 text-sm mt-2">Cliquez sur "Ajouter un responsable" pour commencer</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Dialog de confirmation de suppression de chauffeur */}
      <ConfirmDialog
        isOpen={deleteChauffeurConfirm.show}
        title="Supprimer le chauffeur"
        message="Êtes-vous sûr de vouloir supprimer ce chauffeur ? Cette action est irréversible."
        onConfirm={handleDeleteChauffeur}
        onCancel={() => setDeleteChauffeurConfirm({ show: false, id: null })}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Dialog de confirmation de licenciement */}
      <ConfirmDialog
        isOpen={licencierConfirm.show}
        title="Licencier le chauffeur"
        message={`Êtes-vous sûr de vouloir licencier ${licencierConfirm.nom || 'ce chauffeur'} ? Cette action est irréversible : le chauffeur sera supprimé, ses données nettoyées et le responsable sera notifié.`}
        onConfirm={handleLicencier}
        onCancel={() => setLicencierConfirm({ show: false, id: null, nom: '' })}
        confirmText="LICENCIER DÉFINITIVEMENT"
        cancelText="Annuler"
        variant="destructive"
      />

      {/* Dialog de confirmation de suppression de responsable */}
      <ConfirmDialog
        isOpen={deleteResponsableConfirm.show}
        title="Supprimer le responsable"
        message="Êtes-vous sûr de vouloir supprimer ce responsable ? Cette action est irréversible."
        onConfirm={handleDeleteResponsable}
        onCancel={() => setDeleteResponsableConfirm({ show: false, id: null })}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
      />

    </AdminLayout>
  );
}
