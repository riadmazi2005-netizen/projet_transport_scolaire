import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { authAPI } from '../services/apiService';
import LoginForm from '../components/ui/LoginForm';
import { Bus } from 'lucide-react';

export default function ResponsableLogin() { // <-- Ne pas oublier l'export et le nom du composant
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fonction pour interpréter les messages d'erreur
  const getErrorMessage = (err, response) => {
    // Si c'est une erreur de type 401 (Unauthorized)
    if (err?.response?.status === 401) {
      return 'Email ou mot de passe incorrect.';
    }

    const message = (response?.message || err?.message || '').toLowerCase();
    
    if (message.includes('credentials') || message.includes('invalid') || message.includes('incorrect')) {
      return 'Email ou mot de passe incorrect.';
    }
    if (message.includes('not found') || message.includes('introuvable')) {
      return 'Aucun compte responsable trouvé avec cet email.';
    }
    if (message.includes('inactive') || message.includes('inactif')) {
      return 'Votre compte est inactif. Contactez l\'administration.';
    }
    
    // Message par défaut sécurisé
    return 'Email ou mot de passe incorrect.';
  };

  const handleLogin = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      // Vérifier que l'utilisateur est bien un responsable
      const response = await authAPI.login(formData.email, formData.password, 'responsable');
      
      if (response.success) {
        localStorage.setItem('responsable_session', JSON.stringify(response.user));
        authAPI.saveUser(response.user);
        navigate(createPageUrl('ResponsableDashboard'));
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
      title="Espace Responsable Bus"
      icon={Bus}
      onLogin={handleLogin}
      showRegister={false}
      loading={loading}
      error={error}
    />
  );
}