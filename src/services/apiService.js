// src/services/apiService.js
// Service centralisé pour tous les appels API vers le backend PHP

// URL du backend - Configuration pour XAMPP
// Le dossier backend doit être placé dans C:\xampp\htdocs\backend
const API_BASE_URL = 'http://localhost/backend/api';

/**
 * Fonction utilitaire pour gérer les requêtes HTTP
 */
const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...(options.body && { body: options.body }),
    ...options,
  };

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    
    // Try to parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    
    // Lire le body une seule fois
    const text = await response.text();
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error('[API] Error parsing JSON:', jsonError);
        console.error('[API] Response text:', text);
        throw new Error('Réponse invalide du serveur. Le backend ne renvoie pas du JSON valide.');
      }
    } else {
      console.error('[API] Non-JSON response:', text);
      throw new Error(text || 'Erreur lors de la requête');
    }

    if (!response.ok) {
      console.error(`[API] Error ${response.status}:`, data);
      throw new Error(data.message || `Erreur ${response.status}: Erreur lors de la requête`);
    }

    console.log('[API] Success:', data);
    return data;
  } catch (error) {
    // Gestion spécifique des erreurs réseau
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('[API] Network Error:', error);
      throw new Error(`Impossible de se connecter au serveur. Vérifiez que:
1. XAMPP Apache est démarré
2. Le backend est dans C:\\xampp\\htdocs\\backend
3. L'URL ${API_BASE_URL} est accessible dans votre navigateur`);
    }
    
    // If it's already an Error with a message, rethrow it
    if (error instanceof Error) {
      console.error('[API] Error:', error);
      throw error;
    }
    console.error('[API] Unknown Error:', error);
    throw new Error('Erreur de connexion au serveur');
  }
};

// ============================================
// AUTHENTIFICATION
// ============================================

export const authAPI = {
  // Connexion (le type d'utilisateur est déterminé automatiquement par le backend)
  // Accepte email ou téléphone et expectedRole pour sécuriser l'accès
  login: async (emailOrPhone, password, expectedRole = null) => {
    // Détecter si c'est un email ou un téléphone
    const isEmail = emailOrPhone.includes('@');
    const data = isEmail 
      ? { email: emailOrPhone, password }
      : { telephone: emailOrPhone, password };
    
    // Ajouter le rôle attendu si spécifié
    if (expectedRole) {
      data.expected_role = expectedRole;
    }
    
    return fetchAPI('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Inscription tuteur
  register: async (userData) => {
    return fetchAPI('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Déconnexion
  logout: async () => {
    try {
      await fetchAPI('/auth/logout.php', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Récupérer utilisateur connecté
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Sauvegarder utilisateur
  saveUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// ============================================
// CHAUFFEURS
// ============================================

export const chauffeursAPI = {
  getAll: () => fetchAPI('/chauffeurs/getAll.php'),
  getById: (id) => fetchAPI(`/chauffeurs/getById.php?id=${id}`),
  create: (data) => fetchAPI('/chauffeurs/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI('/chauffeurs/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
  delete: (id) => fetchAPI('/chauffeurs/delete.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
  getAccidents: (id) => fetchAPI(`/chauffeurs/accidents.php?chauffeur_id=${id}`),
};

// ============================================
// RESPONSABLES BUS
// ============================================

export const responsablesAPI = {
  getAll: () => fetchAPI('/responsables/getAll.php'),
  getById: (id) => fetchAPI(`/responsables/getById.php?id=${id}`),
  create: (data) => fetchAPI('/responsables/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI('/responsables/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
  delete: (id) => fetchAPI('/responsables/delete.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
};

// ============================================
// TUTEURS
// ============================================

export const tuteursAPI = {
  getAll: () => fetchAPI('/tuteurs/getAll.php'),
  getById: (id) => fetchAPI(`/tuteurs/getById.php?id=${id}`),
  create: (data) => fetchAPI('/tuteurs/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI('/tuteurs/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
  getEleves: (id) => fetchAPI(`/tuteurs/eleves.php?tuteur_id=${id}`),
  getPaiements: (id) => fetchAPI(`/tuteurs/paiements.php?tuteur_id=${id}`),
};

// ============================================
// ÉLÈVES
// ============================================

export const elevesAPI = {
  getAll: () => fetchAPI('/eleves/getAll.php'),
  getById: (id) => fetchAPI(`/eleves/getById.php?id=${id}`),
  getByBus: (busId) => fetchAPI(`/eleves/getByBus.php?bus_id=${busId}`),
  create: (data) => fetchAPI('/eleves/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI('/eleves/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
  delete: (id) => fetchAPI('/eleves/delete.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
};

// ============================================
// BUS
// ============================================

export const busAPI = {
  getAll: () => fetchAPI('/bus/getAll.php'),
  getById: (id) => fetchAPI(`/bus/getById.php?id=${id}`),
  create: (data) => fetchAPI('/bus/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI('/bus/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
  delete: (id) => fetchAPI('/bus/delete.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
  getEleves: (id) => fetchAPI(`/bus/eleves.php?bus_id=${id}`),
  getByZone: (zone) => fetchAPI(`/bus/getByZone.php?zone=${encodeURIComponent(zone)}`),
};

// ============================================
// TRAJETS
// ============================================

export const trajetsAPI = {
  getAll: () => fetchAPI('/trajets/getAll.php'),
  getById: (id) => fetchAPI(`/trajets/getById.php?id=${id}`),
  create: (data) => fetchAPI('/trajets/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI('/trajets/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
  delete: (id) => fetchAPI('/trajets/delete.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
};

// ============================================
// PRÉSENCES
// ============================================

export const presencesAPI = {
  getByDate: (date, busId = null) => {
    const url = busId 
      ? `/presences/getByDate.php?date=${date}&bus_id=${busId}`
      : `/presences/getByDate.php?date=${date}`;
    return fetchAPI(url);
  },
  getByEleve: (eleveId, startDate, endDate) => 
    fetchAPI(`/presences/getByEleve.php?eleve_id=${eleveId}&start_date=${startDate}&end_date=${endDate}`),
  marquer: (data) => fetchAPI('/presences/marquer.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getStatistiques: (eleveId) => fetchAPI(`/presences/statistiques.php?eleve_id=${eleveId}`),
};

// ============================================
// ACCIDENTS
// ============================================

export const accidentsAPI = {
  getAll: () => fetchAPI('/accidents/getAll.php'),
  getById: (id) => fetchAPI(`/accidents/getById.php?id=${id}`),
  getByChauffeur: (chauffeurId) => fetchAPI(`/accidents/getByChauffeur.php?chauffeur_id=${chauffeurId}`),
  getByResponsable: (responsableId) => fetchAPI(`/accidents/getByResponsable.php?responsable_id=${responsableId}`),
  create: (data) => fetchAPI('/accidents/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI('/accidents/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
  validate: (id) => fetchAPI('/accidents/validate.php', {
    method: 'PUT',
    body: JSON.stringify({ id }),
  }),
  delete: (id) => fetchAPI('/accidents/delete.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
};

// ============================================
// NOTIFICATIONS
// ============================================

export const notificationsAPI = {
  getByUser: (userId, userType) => 
    fetchAPI(`/notifications/getByUser.php?user_id=${userId}&user_type=${userType}`),
  getSentByResponsable: (responsableId) => 
    fetchAPI(`/notifications/getSentByResponsable.php?responsable_id=${responsableId}`),
  marquerLue: (id) => fetchAPI('/notifications/marquerLue.php', {
    method: 'PUT',
    body: JSON.stringify({ id }),
  }),
  create: (data) => fetchAPI('/notifications/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI('/notifications/delete.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
};

// ============================================
// DEMANDES
// ============================================

export const demandesAPI = {
  getAll: () => fetchAPI('/demandes/getAll.php'),
  getByUser: (userId, userType) => 
    fetchAPI(`/demandes/getByUser.php?user_id=${userId}&user_type=${userType}`),
  getByTuteur: (tuteurId) => 
    fetchAPI(`/demandes/getByTuteur.php?tuteur_id=${tuteurId}`),
  create: (data) => fetchAPI('/demandes/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI('/demandes/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
  delete: (id) => fetchAPI('/demandes/delete.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  }),
  traiter: (id, statut, commentaire, raisonRefus, traitePar) => fetchAPI('/demandes/traiter.php', {
    method: 'PUT',
    body: JSON.stringify({ id, statut, commentaire, raison_refus: raisonRefus, traite_par: traitePar }),
  }),
  verifierCode: (demandeId, code) => fetchAPI('/demandes/verifierCode.php', {
    method: 'POST',
    body: JSON.stringify({ demande_id: demandeId, code_verification: code }),
  }),
};

// ============================================
// INSCRIPTIONS
// ============================================

export const inscriptionsAPI = {
  getAll: () => fetchAPI('/inscriptions/getAll.php'),
  getByEleve: (eleveId) => fetchAPI(`/inscriptions/getByEleve.php?eleve_id=${eleveId}`),
  create: (data) => fetchAPI('/inscriptions/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI('/inscriptions/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
};

// ============================================
// PAIEMENTS
// ============================================

export const paiementsAPI = {
  getAll: () => fetchAPI('/paiements/getAll.php'),
  getByTuteur: (tuteurId) => fetchAPI(`/paiements/getByTuteur.php?tuteur_id=${tuteurId}`),
  getByEleve: (eleveId) => fetchAPI(`/paiements/getByEleve.php?eleve_id=${eleveId}`),
  create: (data) => fetchAPI('/paiements/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchAPI('/paiements/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
  delete: (id) => fetchAPI(`/paiements/delete.php?id=${id}`, {
    method: 'DELETE',
  }),
  getImpaye: () => fetchAPI('/paiements/getImpaye.php'),
};

// ============================================
// ZONES
// ============================================

export const zonesAPI = {
  getAll: () => fetchAPI('/zones/getAll.php'),
  create: (data) => fetchAPI('/zones/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data) => fetchAPI('/zones/update.php', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchAPI(`/zones/delete.php?id=${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// CONTACT
// ============================================

export const contactAPI = {
  sendMessage: (data) => fetchAPI('/contact/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ============================================
// STATISTIQUES
// ============================================

export const statistiquesAPI = {
  getDashboard: (role, userId) => 
    fetchAPI(`/statistiques/dashboard.php?role=${role}&user_id=${userId}`),
  getFinancieres: () => fetchAPI('/statistiques/financieres.php'),
  getPresences: (startDate, endDate) => 
    fetchAPI(`/statistiques/presences.php?start_date=${startDate}&end_date=${endDate}`),
};

// ============================================
// ESSENCE
// ============================================

export const essenceAPI = {
  getAll: () => fetchAPI('/essence/getAll.php'),
  create: (data) => fetchAPI('/essence/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getByChauffeur: (chauffeurId) => fetchAPI(`/essence/getByChauffeur.php?chauffeur_id=${chauffeurId}`),
};

// ============================================
// RAPPORTS TRAJET
// ============================================

export const rapportsAPI = {
  create: (data) => fetchAPI('/rapports/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getByChauffeur: (chauffeurId) => fetchAPI(`/rapports/getByChauffeur.php?chauffeur_id=${chauffeurId}`),
};

// ============================================
// CHECKLIST
// ============================================

export const checklistAPI = {
  create: (data) => fetchAPI('/checklist/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ============================================
// SIGNALEMENTS
// ============================================

export const signalementsAPI = {
  getAll: () => fetchAPI('/signalements/getAll.php'),
  create: (data) => fetchAPI('/signalements/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getByChauffeur: (chauffeurId) => fetchAPI(`/signalements/getByChauffeur.php?chauffeur_id=${chauffeurId}`),
  update: (id, data) => fetchAPI('/signalements/update.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  }),
  delete: (id) => fetchAPI(`/signalements/delete.php?id=${id}`, {
    method: 'DELETE',
  }),
};