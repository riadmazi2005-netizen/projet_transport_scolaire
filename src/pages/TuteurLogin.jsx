import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { authAPI } from '../services/apiService';
import LoginForm from '../components/ui/LoginForm';
import { Users } from 'lucide-react';

export default function TuteurLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      // Le type d'utilisateur est déterminé automatiquement par le backend
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.success) {
        // Save JWT token for API authentication
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        
        // Save user data
        authAPI.saveUser(response.user);

        // Store in localStorage for session (for backward compatibility)
        localStorage.setItem('tuteur_session', JSON.stringify(response.user));

        // Navigate to dashboard
        navigate(createPageUrl('TuteurDashboard'));
      } else {
        setError(response.message || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Erreur de connexion. Veuillez vérifier vos identifiants.');
    }
    
    setLoading(false);
  };

  const handleRegister = () => {
    navigate(createPageUrl('TuteurRegister'));
  };

  return (
    <LoginForm
      title="Espace Tuteur"
      icon={Users}
      onLogin={handleLogin}
      onRegister={handleRegister}
      showRegister={true}
      loading={loading}
      error={error}
    />
  );
}