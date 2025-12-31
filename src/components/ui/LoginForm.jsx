import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Ajoutez ceci
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft } from 'lucide-react'; // Ajoutez ArrowLeft

export default function LoginForm({ 
  title, 
  icon: Icon, 
  onLogin, 
  onRegister, 
  showRegister = false,
  loginFields = [
    { name: 'email', label: 'Email ou Téléphone', type: 'text', placeholder: 'Entrez votre email ou téléphone' },
    { name: 'password', label: 'Mot de passe', type: 'password', placeholder: 'Entrez votre mot de passe' }
  ],
  loading = false,
  error = ''
}) {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // Initialisez le hook

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Conteneur principal de la carte avec 'relative' pour le positionnement du bouton */}
        <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-amber-100">
          
          {/* Bouton Retour en haut à gauche à l'intérieur */}
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="absolute top-6 left-6 p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all duration-200"
            title="Retour"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Icon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <p className="text-gray-500 mt-2">Connectez-vous pour accéder</p>
          </div>

          {/* ... reste du code (error, form, etc.) ... */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ... champs de formulaire ... */}
            {loginFields.map((field) => (
              <div key={field.name}>
                <Label className="text-gray-700 font-medium">{field.label}</Label>
                <div className="relative mt-1">
                  <Input
                    type={field.type === 'password' && showPassword ? 'text' : field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="h-12 rounded-xl border-gray-200 focus:border-amber-400 focus:ring-amber-400"
                    required
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          {showRegister && (
            <div className="mt-6 text-center">
              <p className="text-gray-500">Pas encore de compte ?</p>
              <Button
                variant="ghost"
                onClick={onRegister}
                className="mt-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Créer un compte
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}