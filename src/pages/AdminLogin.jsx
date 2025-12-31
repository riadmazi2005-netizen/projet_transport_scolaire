import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { authAPI } from '../services/apiService';
import LoginForm from '../components/ui/LoginForm';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fonction pour filtrer les messages d'erreur comme pour les autres rôles
  const getErrorMessage = (err, response) => {
    // Si c'est une erreur 401 (identifiants faux)
    if (err?.response?.status === 401 || response?.status === 401) {
      return 'Email ou mot de passe incorrect.';
    }

    const message = (response?.message || err?.message || '').toLowerCase();
    
    if (message.includes('credentials') || message.includes('invalid') || message.includes('incorrect')) {
      return 'Email ou mot de passe incorrect.';
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connexion au serveur')) {
      return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
    }
    
    return 'Email ou mot de passe incorrect.';
  };

  const handleLogin = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.success) {
        authAPI.saveUser(response.user);
        localStorage.setItem('admin_session', JSON.stringify(response.user));
        navigate(createPageUrl('AdminDashboard'));
      } else {
        setError(getErrorMessage(null, response));
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(getErrorMessage(err, null));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      title="Espace Administrateur"
      icon={Shield}
      onLogin={handleLogin}
      showRegister={false}
      loading={loading}
      error={error}
    />
  );
}