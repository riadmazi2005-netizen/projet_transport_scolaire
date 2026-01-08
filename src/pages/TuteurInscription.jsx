import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, notificationsAPI, demandesAPI, zonesAPI } from '../services/apiService';
import { calculerMontantFacture, formaterMontantFacture } from '../utils/calculFacture';

// Helper function to get admins
const getAdmins = async () => {
  const response = await fetch('http://localhost/backend/api/utilisateurs/getAdmins.php');
  if (response.ok) {
    return await response.json();
  }
  return { success: false, data: [] };
};
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GraduationCap, ArrowLeft, UserPlus, User,
  MapPin, Bus, CheckCircle, Plus, X, Trash2, AlertCircle
} from 'lucide-react';

export default function TuteurInscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tuteur, setTuteur] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [elevesList, setElevesList] = useState([{
    // Infos élève
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: '',
    classe: '',
    niveau: '',
    ville: '',
    zone: '',
    adresse: '',
  }]);
  const [formData, setFormData] = useState({
    lien_parente: '',
    lien_parente_custom: '', // Pour valeur personnalisée
    // Infos inscription (communes à tous les élèves)
    type_transport: '',
    abonnement: '',
    groupe: ''
  });

  const villes = ['Rabat', 'Salé', 'Temara'];
  const [zones, setZones] = useState([]);
  const [zonesFiltrees, setZonesFiltrees] = useState([]);

  // Classes selon le niveau
  const classesParNiveau = {
    'Primaire': ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP'],
    'Collège': ['1AC', '2AC', '3AC'],
    'Lycée': ['TC', '1BAC', '2BAC']
  };

  // Fonction pour obtenir les classes disponibles selon le niveau
  const getClassesDisponibles = (niveau) => {
    return niveau ? (classesParNiveau[niveau] || []) : [];
  };

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    setTuteur(JSON.parse(session));
    loadZones();
  }, [navigate]);

  // Recharger les zones si elles ne sont pas chargées
  useEffect(() => {
    if (zones.length === 0) {
      console.log('🔄 Rechargement des zones car aucune zone n\'est chargée');
      loadZones();
    }
  }, [zones.length]);

  useEffect(() => {
    // Filtrer les zones selon la ville sélectionnée
    if (formData.ville) {
      const zonesFiltrees = zones.filter(z => {
        const matchVille = z.ville && z.ville.trim() === formData.ville.trim();
        // Gérer actif comme boolean (true/false) ou comme entier (1/0) depuis MySQL
        const estActif = z.actif === true || z.actif === 1 || z.actif === '1';
        return matchVille && estActif;
      });
      setZonesFiltrees(zonesFiltrees);
      // Réinitialiser la zone si elle n'est plus valide
      if (formData.zone && !zonesFiltrees.some(z => z.nom === formData.zone)) {
        setFormData(prev => ({ ...prev, zone: '' }));
      }
    } else {
      setZonesFiltrees([]);
      setFormData(prev => ({ ...prev, zone: '' }));
    }
  }, [formData.ville, zones]);

  const loadZones = async () => {
    try {
      console.log('🔄 Chargement des zones...');
      const zonesRes = await zonesAPI.getAll();
      console.log('📦 Réponse brute zonesAPI.getAll():', zonesRes);
      console.log('📦 Type de réponse:', typeof zonesRes);
      console.log('📦 Est un tableau?', Array.isArray(zonesRes));

      // Gérer différentes structures de réponse
      let zonesData;

      // Cas 1: { success: true, data: [...] }
      if (zonesRes && typeof zonesRes === 'object' && zonesRes.success !== false && zonesRes.data) {
        zonesData = zonesRes.data;
        console.log('✅ Format détecté: { success, data }');
      }
      // Cas 2: Tableau direct
      else if (Array.isArray(zonesRes)) {
        zonesData = zonesRes;
        console.log('✅ Format détecté: Tableau direct');
      }
      // Cas 3: { data: [...] } sans success
      else if (zonesRes && typeof zonesRes === 'object' && zonesRes.data && Array.isArray(zonesRes.data)) {
        zonesData = zonesRes.data;
        console.log('✅ Format détecté: { data }');
      }
      // Cas 4: Réponse vide ou invalide
      else {
        console.warn('⚠️ Format de réponse non reconnu:', zonesRes);
        zonesData = [];
      }

      const zonesArray = Array.isArray(zonesData) ? zonesData : [];
      console.log(`✅ Zones chargées: ${zonesArray.length} zone(s)`);

      if (zonesArray.length > 0) {
        console.log('📋 Exemple de zone:', zonesArray[0]);
        const villesUniques = [...new Set(zonesArray.map(z => z.ville).filter(Boolean))];
        console.log('🏙️ Villes disponibles:', villesUniques);
        console.log('📊 Répartition par ville:', villesUniques.map(ville => ({
          ville,
          count: zonesArray.filter(z => z.ville === ville).length
        })));
      } else {
        console.warn('⚠️ Aucune zone chargée!');
      }

      setZones(zonesArray);
      return zonesArray;
    } catch (err) {
      console.error('❌ Erreur lors du chargement des zones:', err);
      console.error('❌ Détails:', err.message, err.stack);

      // Afficher un message d'erreur à l'utilisateur
      const errorMessage = err.message || 'Erreur inconnue';
      if (errorMessage.includes('connexion') || errorMessage.includes('base de données') || errorMessage.includes('MySQL')) {
        setError('Impossible de charger les zones. Vérifiez que MySQL est démarré dans XAMPP.');
      } else {
        setError('Erreur lors du chargement des zones: ' + errorMessage);
      }

      setZones([]);
      return [];
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEleveChange = (index, name, value) => {
    setElevesList(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [name]: value };
      // Si on change le niveau, réinitialiser la classe
      if (name === 'niveau') {
        newList[index].classe = '';
      }
      // Si on change la ville, réinitialiser la zone et recharger les zones si nécessaire
      if (name === 'ville') {
        newList[index].zone = '';
        // Recharger les zones si elles ne sont pas encore chargées
        if (zones.length === 0) {
          console.log('🔄 Rechargement des zones car la ville a changé et aucune zone n\'est chargée');
          loadZones();
        }
      }
      return newList;
    });
  };

  const addEleve = () => {
    setElevesList(prev => [...prev, {
      nom: '',
      prenom: '',
      date_naissance: '',
      sexe: '',
      classe: '',
      niveau: '',
      ville: '',
      zone: '',
      adresse: '',
    }]);
  };

  const removeEleve = (index) => {
    if (elevesList.length > 1) {
      setElevesList(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation des champs de transport (communs à tous les élèves)
      if (!formData.type_transport || !formData.abonnement || !formData.groupe) {
        setError('Veuillez remplir tous les champs de transport');
        setLoading(false);
        return;
      }

      // Validation de tous les élèves
      for (let i = 0; i < elevesList.length; i++) {
        const eleve = elevesList[i];
        if (!eleve.nom || !eleve.prenom || !eleve.classe || !eleve.ville || !eleve.zone || !eleve.adresse) {
          setError(`Veuillez remplir tous les champs obligatoires pour l'élève ${i + 1}`);
          setLoading(false);
          return;
        }
      }

      // Utiliser type_id qui est l'ID du tuteur dans la table tuteurs
      const tuteurId = tuteur.type_id || tuteur.id;

      // Préparer le lien de parenté (valeur sélectionnée ou personnalisée)
      const lienParenteFinal = formData.lien_parente === 'Autre'
        ? formData.lien_parente_custom.trim()
        : formData.lien_parente;

      // Créer tous les élèves et leurs demandes
      const results = [];
      for (const eleveData of elevesList) {
        // Create eleve
        const eleveResponse = await elevesAPI.create({
          nom: eleveData.nom,
          prenom: eleveData.prenom,
          date_naissance: eleveData.date_naissance || null,
          adresse: eleveData.adresse,
          telephone_parent: tuteur.telephone,
          email_parent: tuteur.email,
          classe: eleveData.classe,
          tuteur_id: tuteurId,
          statut: 'Inactif' // Will be 'Actif' after payment
        });

        if (!eleveResponse || !eleveResponse.success || !eleveResponse.data) {
          const errorMsg = eleveResponse?.message || 'Erreur lors de la création de l\'élève';
          console.error('Erreur création élève:', eleveResponse);
          throw new Error(errorMsg);
        }

        const newEleve = eleveResponse.data;

        // Create demande (inscription request)
        const demandeResponse = await demandesAPI.create({
          eleve_id: newEleve.id,
          tuteur_id: tuteurId,
          type_demande: 'inscription',
          zone_geographique: eleveData.zone,
          description: JSON.stringify({
            type_transport: formData.type_transport,
            abonnement: formData.abonnement,
            groupe: formData.groupe,
            zone: eleveData.zone,
            niveau: eleveData.niveau,
            lien_parente: lienParenteFinal,
            sexe: eleveData.sexe
          }),
          statut: 'En attente'
        });

        if (!demandeResponse || !demandeResponse.success) {
          const errorMsg = demandeResponse?.message || 'Erreur lors de la création de la demande';
          console.error('Erreur création demande:', demandeResponse);
          throw new Error(errorMsg);
        }

        results.push({ eleve: newEleve, demande: demandeResponse });
      }

      // Créer les notifications
      try {
        const nomsEleves = elevesList.map(e => `${e.prenom} ${e.nom}`).join(', ');
        await notificationsAPI.create({
          destinataire_id: tuteur.id,
          destinataire_type: 'tuteur',
          titre: 'Inscription(s) envoyée(s)',
          message: `L'inscription de ${elevesList.length === 1 ? nomsEleves : `${elevesList.length} élèves (${nomsEleves})`} a été envoyée et est en attente de validation.`,
          type: 'info'
        });
      } catch (notifError) {
        console.warn('Erreur notification tuteur:', notifError);
      }

      // Récupérer tous les admins pour leur envoyer une notification
      try {
        const adminsData = await getAdmins();
        if (adminsData.success && adminsData.data && adminsData.data.length > 0) {
          const nomsEleves = elevesList.map(e => `${e.prenom} ${e.nom}`).join(', ');
          const notificationPromises = adminsData.data.map(admin =>
            notificationsAPI.create({
              destinataire_id: admin.id,
              destinataire_type: 'admin',
              titre: 'Nouvelle(s) demande(s) d\'inscription',
              message: `${elevesList.length === 1 ? 'Nouvelle demande' : `${elevesList.length} nouvelles demandes`} d'inscription pour ${nomsEleves} de ${tuteur.prenom} ${tuteur.nom}`,
              type: 'info'
            })
          );
          await Promise.all(notificationPromises);
        }
      } catch (adminError) {
        console.warn('Impossible de récupérer les admins pour la notification:', adminError);
      }

      // Rediriger vers le dashboard après un court délai
      setTimeout(() => {
        navigate(createPageUrl('TuteurDashboard'));
      }, 500);
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      const errorMessage = err.message || err.response?.message || 'Erreur lors de l\'envoi de l\'inscription. Veuillez réessayer.';
      setError(errorMessage);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Infos Tuteur', icon: User },
    { num: 2, title: 'Infos Élève', icon: GraduationCap },
    { num: 3, title: 'Transport', icon: Bus }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-lime-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-lime-500 to-lime-600">
            <button
              onClick={() => navigate(createPageUrl('TuteurDashboard'))}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <UserPlus className="w-7 h-7" />
              Inscription {elevesList.length === 1 ? "d'un élève" : `de ${elevesList.length} élèves`}
            </h1>
          </div>

          {/* Steps */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div key={step.num} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 cursor-pointer ${currentStep >= step.num ? 'text-amber-600' : 'text-gray-400'
                      }`}
                    onClick={() => currentStep > step.num && setCurrentStep(step.num)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= step.num
                        ? 'bg-lime-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                      }`}>
                      {currentStep > step.num ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="hidden sm:block font-medium">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 sm:w-24 h-1 mx-2 rounded ${currentStep > step.num ? 'bg-lime-500' : 'bg-gray-200'
                      }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6">
            {/* Step 1: Infos Tuteur */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-lime-50 rounded-2xl p-6 border border-lime-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-lime-500" />
                    Informations du Tuteur
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Nom</Label>
                      <Input
                        value={tuteur?.nom || ''}
                        disabled
                        className="mt-1 bg-white border-gray-200"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600">Prénom</Label>
                      <Input
                        value={tuteur?.prenom || ''}
                        disabled
                        className="mt-1 bg-white border-gray-200"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600">Email</Label>
                      <Input
                        value={tuteur?.email || ''}
                        disabled
                        className="mt-1 bg-white border-gray-200"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600">Téléphone</Label>
                      <Input
                        value={tuteur?.telephone || ''}
                        disabled
                        className="mt-1 bg-white border-gray-200"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Lien de parenté avec l'élève</Label>
                  <Select
                    value={formData.lien_parente}
                    onValueChange={(v) => {
                      handleChange('lien_parente', v);
                      // Réinitialiser la valeur personnalisée si on change d'option
                      if (v !== 'Autre') {
                        handleChange('lien_parente_custom', '');
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1 h-12 rounded-xl">
                      <SelectValue placeholder="Sélectionnez le lien" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Père">Père</SelectItem>
                      <SelectItem value="Mère">Mère</SelectItem>
                      <SelectItem value="Tuteur légal">Tuteur légal</SelectItem>
                      <SelectItem value="Grand-père">Grand-père</SelectItem>
                      <SelectItem value="Grand-mère">Grand-mère</SelectItem>
                      <SelectItem value="Oncle">Oncle</SelectItem>
                      <SelectItem value="Tante">Tante</SelectItem>
                      <SelectItem value="Frère">Frère</SelectItem>
                      <SelectItem value="Sœur">Sœur</SelectItem>
                      <SelectItem value="Autre">Autre (précisez)</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.lien_parente === 'Autre' && (
                    <Input
                      type="text"
                      placeholder="Précisez le lien de parenté (ex: cousin, beau-père, etc.)"
                      value={formData.lien_parente_custom}
                      onChange={(e) => handleChange('lien_parente_custom', e.target.value)}
                      className="mt-2 h-12 rounded-xl"
                      required
                    />
                  )}
                </div>

                <Button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.lien_parente || (formData.lien_parente === 'Autre' && !formData.lien_parente_custom.trim())}
                  className="w-full h-12 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white rounded-xl"
                >
                  Continuer
                </Button>
              </motion.div>
            )}

            {/* Step 2: Infos Élève(s) */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-lime-500" />
                    Informations des Élèves ({elevesList.length})
                  </h3>
                  <Button
                    type="button"
                    onClick={addEleve}
                    variant="outline"
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un élève
                  </Button>
                </div>

                {elevesList.map((eleve, index) => {
                  const classesDisponibles = getClassesDisponibles(eleve.niveau);
                  const zonesFiltreesEleve = eleve.ville
                    ? zones.filter(z => {
                      // Comparaison insensible à la casse et aux espaces
                      const zoneVille = (z.ville || '').toString().trim();
                      const eleveVille = (eleve.ville || '').toString().trim();
                      const matchVille = zoneVille.toLowerCase() === eleveVille.toLowerCase();
                      // Gérer actif comme boolean (true/false) ou comme entier (1/0) depuis MySQL
                      const estActif = z.actif === true || z.actif === 1 || z.actif === '1' || z.actif === 'true';
                      const result = matchVille && estActif;
                      return result;
                    })
                    : [];

                  // Debug: afficher les zones filtrées
                  if (eleve.ville) {
                    console.log(`Filtrage zones pour "${eleve.ville}":`);
                    console.log(`  - Total zones chargées: ${zones.length}`);
                    console.log(`  - Zones filtrées: ${zonesFiltreesEleve.length}`);
                    console.log(`  - Zones trouvées:`, zonesFiltreesEleve.map(z => z.nom));
                    if (zonesFiltreesEleve.length === 0 && zones.length > 0) {
                      const zonesMemeVille = zones.filter(z => {
                        const zoneVille = (z.ville || '').toString().trim().toLowerCase();
                        const eleveVille = (eleve.ville || '').toString().trim().toLowerCase();
                        return zoneVille === eleveVille;
                      });
                      console.log(`  - Zones avec même ville (sans filtre actif): ${zonesMemeVille.length}`, zonesMemeVille);
                    }
                  }

                  return (
                    <div key={index} className="bg-gray-50 rounded-2xl p-6 border-2 border-lime-200 relative">
                      {elevesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEleve(index)}
                          className="absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <div className="mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-lime-500 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <h4 className="font-semibold text-gray-800">Élève {index + 1}</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-700 font-medium">Nom *</Label>
                          <Input
                            value={eleve.nom}
                            onChange={(e) => handleEleveChange(index, 'nom', e.target.value)}
                            className="mt-1 h-12 rounded-xl"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700 font-medium">Prénom *</Label>
                          <Input
                            value={eleve.prenom}
                            onChange={(e) => handleEleveChange(index, 'prenom', e.target.value)}
                            className="mt-1 h-12 rounded-xl"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label className="text-gray-700 font-medium">Date de naissance</Label>
                          <Input
                            type="date"
                            value={eleve.date_naissance}
                            onChange={(e) => handleEleveChange(index, 'date_naissance', e.target.value)}
                            className="mt-1 h-12 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700 font-medium">Sexe</Label>
                          <Select
                            value={eleve.sexe}
                            onValueChange={(v) => handleEleveChange(index, 'sexe', v)}
                          >
                            <SelectTrigger className="mt-1 h-12 rounded-xl">
                              <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Masculin">Masculin</SelectItem>
                              <SelectItem value="Féminin">Féminin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label className="text-gray-700 font-medium">Niveau</Label>
                          <Select
                            value={eleve.niveau}
                            onValueChange={(v) => handleEleveChange(index, 'niveau', v)}
                          >
                            <SelectTrigger className="mt-1 h-12 rounded-xl">
                              <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Primaire">Primaire</SelectItem>
                              <SelectItem value="Collège">Collège</SelectItem>
                              <SelectItem value="Lycée">Lycée</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-700 font-medium">Classe *</Label>
                          <Select
                            value={eleve.classe}
                            onValueChange={(v) => handleEleveChange(index, 'classe', v)}
                            disabled={!eleve.niveau}
                          >
                            <SelectTrigger className="mt-1 h-12 rounded-xl">
                              <SelectValue placeholder={eleve.niveau ? "Sélectionnez" : "Sélectionnez d'abord le niveau"} />
                            </SelectTrigger>
                            <SelectContent>
                              {classesDisponibles.length > 0 ? (
                                classesDisponibles.map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>Aucune classe disponible</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label className="text-gray-700 font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-lime-500" />
                          Ville *
                        </Label>
                        <Select
                          value={eleve.ville}
                          onValueChange={(v) => handleEleveChange(index, 'ville', v)}
                        >
                          <SelectTrigger className="mt-1 h-12 rounded-xl">
                            <SelectValue placeholder="Sélectionnez votre ville" />
                          </SelectTrigger>
                          <SelectContent>
                            {villes.map(v => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="mt-4">
                        <Label className="text-gray-700 font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-lime-500" />
                          Zone géographique *
                        </Label>
                        <Select
                          value={eleve.zone}
                          onValueChange={(v) => handleEleveChange(index, 'zone', v)}
                          disabled={!eleve.ville || zonesFiltreesEleve.length === 0}
                        >
                          <SelectTrigger className={`mt-1 h-12 rounded-xl ${!eleve.ville || zonesFiltreesEleve.length === 0 ? 'border-orange-300' : ''}`}>
                            <SelectValue placeholder={eleve.ville ? "Sélectionnez votre zone" : "Sélectionnez d'abord la ville"} />
                          </SelectTrigger>
                          <SelectContent>
                            {zonesFiltreesEleve.length > 0 ? (
                              zonesFiltreesEleve.map(z => (
                                <SelectItem key={z.id || z.nom} value={z.nom}>{z.nom}</SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-gray-500">
                                {eleve.ville ? "Aucune zone disponible pour cette ville" : "Sélectionnez d'abord la ville"}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {eleve.ville && zonesFiltreesEleve.length === 0 && (
                          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-700 flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4" />
                              Aucune zone disponible pour {eleve.ville}
                            </p>
                            <div className="text-xs text-amber-600 space-y-1">
                              <p>• Zones chargées: {zones.length}</p>
                              <p>• Zones pour cette ville: {zones.filter(z => {
                                const zoneVille = (z.ville || '').toString().trim().toLowerCase();
                                const eleveVille = (eleve.ville || '').toString().trim().toLowerCase();
                                return zoneVille === eleveVille;
                              }).length}</p>
                              {zones.length === 0 && (
                                <p className="text-red-600 font-medium mt-2">
                                  ⚠️ Les zones ne sont pas chargées. Vérifiez que MySQL est démarré dans XAMPP.
                                </p>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  console.log('🔄 Rechargement manuel des zones');
                                  setError('');
                                  await loadZones();
                                }}
                                className="mt-2 text-xs"
                              >
                                Recharger les zones
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <Label className="text-gray-700 font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-lime-500" />
                          Adresse *
                        </Label>
                        <Input
                          value={eleve.adresse}
                          onChange={(e) => handleEleveChange(index, 'adresse', e.target.value)}
                          className="mt-1 h-12 rounded-xl"
                          placeholder="Ex: Quartier Hay Riad, Rue Mohammed V, Maison N°12"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Veuillez entrer le quartier, la rue et le nom/numéro de la maison</p>
                      </div>
                    </div>
                  );
                })}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Retour
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={elevesList.some(e => !e.nom || !e.prenom || !e.niveau || !e.classe || !e.ville || !e.zone || !e.adresse)}
                    className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl"
                  >
                    Continuer
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Infos Transport */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-lime-500" />
                  Informations de Transport
                </h3>

                <div>
                  <Label className="text-gray-700 font-medium">Type de transport</Label>
                  <Select
                    value={formData.type_transport}
                    onValueChange={(v) => handleChange('type_transport', v)}
                  >
                    <SelectTrigger className="mt-1 h-12 rounded-xl">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aller">Aller uniquement</SelectItem>
                      <SelectItem value="Retour">Retour uniquement</SelectItem>
                      <SelectItem value="Aller-Retour">Aller-Retour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Type d'abonnement</Label>
                  <Select
                    value={formData.abonnement}
                    onValueChange={(v) => handleChange('abonnement', v)}
                  >
                    <SelectTrigger className="mt-1 h-12 rounded-xl">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensuel">Mensuel</SelectItem>
                      <SelectItem value="Annuel">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Groupe horaire</Label>
                  <Select
                    value={formData.groupe}
                    onValueChange={(v) => handleChange('groupe', v)}
                  >
                    <SelectTrigger className="mt-1 h-12 rounded-xl">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">
                        Groupe A (Matin: 7h30-8h00 / Soir: 17h00-17h30)
                      </SelectItem>
                      <SelectItem value="B">
                        Groupe B (Matin: 8h00-8h30 / Soir: 17h30-18h00)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Summary */}
                <div className="bg-lime-50 rounded-2xl p-6 border border-lime-100">
                  <h4 className="font-semibold text-gray-800 mb-3">Récapitulatif</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type de transport:</span>
                      <span className="font-medium">{formData.type_transport || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Abonnement:</span>
                      <span className="font-medium">{formData.abonnement || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Groupe:</span>
                      <span className="font-medium">{formData.groupe || '-'}</span>
                    </div>
                    <div className="border-t border-amber-200 pt-2 mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600">Prix unitaire:</span>
                        <span className="font-medium text-gray-800">
                          {formData.type_transport && formData.abonnement
                            ? formaterMontantFacture(formData.type_transport, formData.abonnement)
                            : '-'}
                        </span>
                      </div>

                      {formData.type_transport && formData.abonnement && (
                        <>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-600">Nombre d'élèves:</span>
                            <span className="font-medium text-gray-800">{elevesList.length}</span>
                          </div>

                          {elevesList.length > 1 && (
                            <div className="text-xs text-lime-700 italic mb-2">
                              * Réduction famille appliquée (-10% pour le 2ème, -20% pour les suivants)
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 border-t border-amber-300/50">
                            <span className="text-gray-800 font-semibold">Total standard:</span>
                            <span className="line-through text-gray-400 font-medium">
                              {(() => {
                                const unitPrice = calculerMontantFacture(formData.type_transport, formData.abonnement);
                                return `${unitPrice * elevesList.length} DH`;
                              })()}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-1">
                            <span className="text-gray-900 font-bold text-lg">Total à payer:</span>
                            <span className="font-bold text-amber-600 text-xl">
                              {(() => {
                                const unitPrice = calculerMontantFacture(formData.type_transport, formData.abonnement);
                                let total = 0;
                                for (let i = 0; i < elevesList.length; i++) {
                                  if (i === 0) total += unitPrice;
                                  else if (i === 1) total += unitPrice * 0.9;
                                  else total += unitPrice * 0.8;
                                }
                                return `${total} DH`;
                              })()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.type_transport || !formData.abonnement || !formData.groupe}
                    className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Envoyer {elevesList.length === 1 ? "l'inscription" : `les ${elevesList.length} inscriptions`}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}