// utils.js - Fonctions utilitaires pour l'application

/**
 * Crée une URL pour une page donnée
 * @param {string} pageName - Nom de la page
 * @returns {string} - URL de la page
 */
export const createPageUrl = (pageName) => {
  return `/${pageName}`;
};

/**
 * Formate une date au format français
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date formatée
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formate une heure
 * @param {string} time - Heure au format HH:mm
 * @returns {string} - Heure formatée
 */
export const formatTime = (time) => {
  if (!time) return '';
  return time;
};

/**
 * Calcule l'âge à partir d'une date de naissance
 * @param {string|Date} birthDate - Date de naissance
 * @returns {number} - Âge en années
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Valide un numéro de téléphone marocain
 * @param {string} phone - Numéro de téléphone
 * @returns {boolean} - True si valide
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^(06|07)\d{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Valide un email
 * @param {string} email - Email
 * @returns {boolean} - True si valide
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un CIN marocain
 * @param {string} cin - CIN
 * @returns {boolean} - True si valide
 */
export const isValidCIN = (cin) => {
  const cinRegex = /^[A-Z]{1,2}\d{5,6}$/;
  return cinRegex.test(cin);
};

/**
 * Génère une couleur aléatoire pour les avatars
 * @param {string} name - Nom pour générer la couleur
 * @returns {string} - Classe Tailwind pour la couleur
 */
export const getAvatarColor = (name) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ];
  
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Obtient les initiales d'un nom
 * @param {string} firstName - Prénom
 * @param {string} lastName - Nom
 * @returns {string} - Initiales
 */
export const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

/**
 * Formate un montant en dirhams
 * @param {number} amount - Montant
 * @returns {string} - Montant formaté
 */
export const formatCurrency = (amount) => {
  if (!amount) return '0 DH';
  return `${amount.toLocaleString('fr-FR')} DH`;
};

/**
 * Obtient le mois actuel au format "Mois Année"
 * @returns {string} - Mois actuel
 */
export const getCurrentMonth = () => {
  const now = new Date();
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
};

/**
 * Vérifie si une date est aujourd'hui
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean} - True si c'est aujourd'hui
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return today.getDate() === checkDate.getDate() &&
         today.getMonth() === checkDate.getMonth() &&
         today.getFullYear() === checkDate.getFullYear();
};

/**
 * Trie un tableau par une propriété
 * @param {Array} array - Tableau à trier
 * @param {string} property - Propriété à utiliser pour le tri
 * @param {string} order - 'asc' ou 'desc'
 * @returns {Array} - Tableau trié
 */
export const sortBy = (array, property, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filtre un tableau par une recherche
 * @param {Array} array - Tableau à filtrer
 * @param {string} searchTerm - Terme de recherche
 * @param {Array} properties - Propriétés à rechercher
 * @returns {Array} - Tableau filtré
 */
export const filterBySearch = (array, searchTerm, properties) => {
  if (!searchTerm) return array;
  
  const lowerSearch = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return properties.some(prop => {
      const value = item[prop];
      return value && value.toString().toLowerCase().includes(lowerSearch);
    });
  });
};