import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { authAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Users, Eye, EyeOff, ArrowLeft, UserPlus } from 'lucide-react';

export default function TuteurRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    confirm_password: '',
    adresse: ''
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (formData.mot_de_passe !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    // Validate password strength
    if (formData.mot_de_passe.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for registration - remove confirm_password and adresse (not in DB)
      const { confirm_password, adresse, ...userData } = formData;
      userData.role = 'tuteur'; // Add role for backend
      
      // Call register API
      const response = await authAPI.register(userData);
      
      if (response.success) {
        // Registration successful, redirect to login
        navigate(createPageUrl('TuteurLogin'));
      } else {
        setError(response.message || 'Erreur lors de la création du compte');
      }
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      
      // Handle different error types
      const errorMessage = err.message || '';
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('déjà')) {
        setError('Un compte existe déjà avec cet email');
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError('Erreur lors de la création du compte. Veuillez réessayer.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-amber-100">
          <button
            onClick={() => navigate(createPageUrl('TuteurLogin'))}
            className="flex items-center gap-2 text-gray-500 hover:text-amber-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Créer un compte</h2>
            <p className="text-gray-500 mt-2">Inscription Espace Tuteur</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium">Nom</Label>
                <Input
                  value={formData.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  className="mt-1 h-11 rounded-xl border-gray-200"
                  placeholder="Votre nom"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Prénom</Label>
                <Input
                  value={formData.prenom}
                  onChange={(e) => handleChange('prenom', e.target.value)}
                  className="mt-1 h-11 rounded-xl border-gray-200"
                  placeholder="Votre prénom"
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
                className="mt-1 h-11 rounded-xl border-gray-200"
                placeholder="exemple@email.com"
                required
              />
            </div>

            <div>
              <Label className="text-gray-700 font-medium">Téléphone</Label>
              <Input
                value={formData.telephone}
                onChange={(e) => handleChange('telephone', e.target.value)}
                className="mt-1 h-11 rounded-xl border-gray-200"
                placeholder="06XXXXXXXX"
                required
              />
            </div>

            <div>
              <Label className="text-gray-700 font-medium">Adresse</Label>
              <Input
                value={formData.adresse}
                onChange={(e) => handleChange('adresse', e.target.value)}
                className="mt-1 h-11 rounded-xl border-gray-200"
                placeholder="Votre adresse"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium">Mot de passe</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.mot_de_passe}
                    onChange={(e) => handleChange('mot_de_passe', e.target.value)}
                    className="h-11 rounded-xl border-gray-200"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Confirmer</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => handleChange('confirm_password', e.target.value)}
                    className="h-11 rounded-xl border-gray-200"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Le mot de passe doit contenir au moins 6 caractères
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl font-semibold shadow-lg mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Créer mon compte
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Vous avez déjà un compte ?{' '}
            <button
              onClick={() => navigate(createPageUrl('TuteurLogin'))}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Se connecter
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}