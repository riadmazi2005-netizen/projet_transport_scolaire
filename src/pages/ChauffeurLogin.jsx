import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { authAPI } from '../services/apiService';
import LoginForm from '../components/ui/LoginForm';
import { Bus } from 'lucide-react';

export default function ChauffeurLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.success) {
        localStorage.setItem('chauffeur_session', JSON.stringify(response.user));
        authAPI.saveUser(response.user);
        navigate(createPageUrl('ChauffeurDashboard'));
      } else {
        // Si le serveur répond mais avec success: false
        setError(response.message || 'Email ou mot de passe incorrect.');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      
      // On vérifie si c'est une erreur d'authentification (401) 
      // ou si on veut simplement afficher un message fixe pour la sécurité
      if (err.response && err.response.status === 401) {
        setError('Email ou mot de passe incorrect.');
      } else {
        // Optionnel : différencier l'erreur d'identifiants d'une erreur réseau
        setError('Email ou mot de passe incorrect.'); 
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      title="Espace Chauffeur"
      icon={Bus}
      onLogin={handleLogin}
      showRegister={false}
      loading={loading}
      error={error}
    />
  );
}