import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { tuteursAPI, authAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Users, Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function TuteurProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tuteurId, setTuteurId] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: ''
  });

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    const tuteurData = JSON.parse(session);
    setTuteurId(tuteurData.id);
    setFormData({
      nom: tuteurData.nom || '',
      prenom: tuteurData.prenom || '',
      email: tuteurData.email || '',
      telephone: tuteurData.telephone || '',
      adresse: tuteurData.adresse || ''
    });
  }, [navigate]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Prepare data for update (exclude adresse as it's not in the database)
      const { adresse, ...updateData } = formData;
      
      // Update tuteur via API
      const response = await tuteursAPI.update(tuteurId, updateData);
      
      // Update local session with the response data or form data
      const session = JSON.parse(localStorage.getItem('tuteur_session'));
      const updatedSession = { 
        ...session, 
        ...updateData,
        // Keep adresse in local storage if it was there, but don't send it to API
        ...(adresse ? { adresse } : {})
      };
      localStorage.setItem('tuteur_session', JSON.stringify(updatedSession));
      
      // Also update the 'user' in localStorage if using authAPI
      const user = authAPI.getCurrentUser();
      if (user) {
        authAPI.saveUser({ ...user, ...updateData }, localStorage.getItem('token'));
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err.message || 'Erreur lors de la mise à jour du profil. Veuillez réessayer.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <button
            onClick={() => navigate(createPageUrl('TuteurDashboard'))}
            className="flex items-center gap-2 text-gray-500 hover:text-amber-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Mon Profil</h2>
            <p className="text-gray-500 mt-2">Modifiez vos informations personnelles</p>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700"
            >
              <CheckCircle className="w-5 h-5" />
              Profil mis à jour avec succès !
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium">Nom</Label>
                <Input
                  value={formData.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  className="mt-1 h-12 rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Prénom</Label>
                <Input
                  value={formData.prenom}
                  onChange={(e) => handleChange('prenom', e.target.value)}
                  className="mt-1 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-medium">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mt-1 h-12 rounded-xl"
                required
              />
            </div>

            <div>
              <Label className="text-gray-700 font-medium">Téléphone</Label>
              <Input
                value={formData.telephone}
                onChange={(e) => handleChange('telephone', e.target.value)}
                className="mt-1 h-12 rounded-xl"
                required
              />
            </div>

            <div>
              <Label className="text-gray-700 font-medium">Adresse</Label>
              <Input
                value={formData.adresse}
                onChange={(e) => handleChange('adresse', e.target.value)}
                className="mt-1 h-12 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl font-semibold shadow-lg mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}