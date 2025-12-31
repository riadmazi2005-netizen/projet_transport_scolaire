import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, notificationsAPI, demandesAPI } from '../services/apiService';

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
  MapPin, Bus, CheckCircle 
} from 'lucide-react';

export default function TuteurInscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tuteur, setTuteur] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Infos élève
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: '',
    classe: '',
    niveau: '',
    zone: '',
    adresse: '',
    lien_parente: '',
    lien_parente_custom: '', // Pour valeur personnalisée
    // Infos inscription
    type_transport: '',
    abonnement: '',
    groupe: ''
  });

  const zones = ['Medina', 'Hay Sinaï', 'Hay El Fath', 'Souissi', 'Akkari', 'Manal', 'Agdal', 'Nahda-Takkadoum', 'Temara'];
  
  // Classes selon le niveau
  const classesParNiveau = {
    'Primaire': ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP'],
    'Collège': ['1AC', '2AC', '3AC'],
    'Lycée': ['TC', '1BAC', '2BAC']
  };
  
  // Récupérer les classes disponibles selon le niveau sélectionné
  const classesDisponibles = formData.niveau ? (classesParNiveau[formData.niveau] || []) : [];

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    setTuteur(JSON.parse(session));
  }, [navigate]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validation des champs requis
      if (!formData.nom || !formData.prenom || !formData.classe || !formData.zone || !formData.adresse) {
        setError('Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }
      
      if (!formData.type_transport || !formData.abonnement || !formData.groupe) {
        setError('Veuillez remplir tous les champs de transport');
        setLoading(false);
        return;
      }
      
      // Prepare eleve data for database
      const eleveData = {
        nom: formData.nom,
        prenom: formData.prenom,
        date_naissance: formData.date_naissance || null,
        adresse: formData.adresse,
        telephone_parent: tuteur.telephone,
        email_parent: tuteur.email,
        classe: formData.classe,
        tuteur_id: tuteur.id,
        statut: 'Inactif' // Will be 'Actif' after payment
      };
      
      // Create eleve
      const eleveResponse = await elevesAPI.create(eleveData);
      
      if (!eleveResponse || !eleveResponse.success || !eleveResponse.data) {
        const errorMsg = eleveResponse?.message || 'Erreur lors de la création de l\'élève';
        console.error('Erreur création élève:', eleveResponse);
        throw new Error(errorMsg);
      }
      
      const newEleve = eleveResponse.data;
      
      // Préparer le lien de parenté (valeur sélectionnée ou personnalisée)
      const lienParenteFinal = formData.lien_parente === 'Autre' 
        ? formData.lien_parente_custom.trim() 
        : formData.lien_parente;
      
      // Create demande (inscription request)
      const demandeResponse = await demandesAPI.create({
        eleve_id: newEleve.id,
        tuteur_id: tuteur.id,
        type_demande: 'inscription',
        zone_geographique: formData.zone,
        description: JSON.stringify({
          type_transport: formData.type_transport,
          abonnement: formData.abonnement,
          groupe: formData.groupe,
          zone: formData.zone,
          niveau: formData.niveau,
          lien_parente: lienParenteFinal,
          sexe: formData.sexe
        }),
        statut: 'En attente'
      });
      
      if (!demandeResponse || !demandeResponse.success) {
        const errorMsg = demandeResponse?.message || 'Erreur lors de la création de la demande';
        console.error('Erreur création demande:', demandeResponse);
        throw new Error(errorMsg);
      }
      
      // Create notification for tuteur
      try {
        await notificationsAPI.create({
          destinataire_id: tuteur.id,
          destinataire_type: 'tuteur',
          titre: 'Inscription envoyée',
          message: `L'inscription de ${formData.prenom} ${formData.nom} a été envoyée et est en attente de validation.`,
          type: 'info'
        });
      } catch (notifError) {
        console.warn('Erreur notification tuteur:', notifError);
        // On continue même si la notification échoue
      }
      
      // Récupérer tous les admins pour leur envoyer une notification
      try {
        const adminsData = await getAdmins();
        if (adminsData.success && adminsData.data && adminsData.data.length > 0) {
          // Envoyer notification à tous les admins
          const notificationPromises = adminsData.data.map(admin => 
            notificationsAPI.create({
              destinataire_id: admin.id,
              destinataire_type: 'admin',
              titre: 'Nouvelle demande d\'inscription',
              message: `Nouvelle demande d'inscription pour ${formData.prenom} ${formData.nom} de ${tuteur.prenom} ${tuteur.nom}`,
              type: 'info'
            })
          );
          await Promise.all(notificationPromises);
        }
      } catch (adminError) {
        // Si l'endpoint n'existe pas, on continue sans notification admin
        console.warn('Impossible de récupérer les admins pour la notification:', adminError);
      }
      
      // Rediriger vers le dashboard après un court délai pour permettre l'affichage du succès
      setTimeout(() => {
        navigate(createPageUrl('TuteurDashboard'));
      }, 500);
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      const errorMessage = err.message || err.response?.message || 'Erreur lors de l\'envoi de l\'inscription. Veuillez réessayer.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Infos Tuteur', icon: User },
    { num: 2, title: 'Infos Élève', icon: GraduationCap },
    { num: 3, title: 'Transport', icon: Bus }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-500 to-yellow-500">
            <button
              onClick={() => navigate(createPageUrl('TuteurDashboard'))}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <UserPlus className="w-7 h-7" />
              Inscription d'un élève
            </h1>
          </div>

          {/* Steps */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div key={step.num} className="flex items-center">
                  <div 
                    className={`flex items-center gap-2 cursor-pointer ${
                      currentStep >= step.num ? 'text-amber-600' : 'text-gray-400'
                    }`}
                    onClick={() => currentStep > step.num && setCurrentStep(step.num)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step.num 
                        ? 'bg-amber-500 text-white' 
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
                    <div className={`w-12 sm:w-24 h-1 mx-2 rounded ${
                      currentStep > step.num ? 'bg-amber-500' : 'bg-gray-200'
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
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-500" />
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
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl"
                >
                  Continuer
                </Button>
              </motion.div>
            )}

            {/* Step 2: Infos Élève */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-500" />
                  Informations de l'Élève
                </h3>

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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 font-medium">Date de naissance</Label>
                    <Input
                      type="date"
                      value={formData.date_naissance}
                      onChange={(e) => handleChange('date_naissance', e.target.value)}
                      className="mt-1 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Sexe</Label>
                    <Select 
                      value={formData.sexe} 
                      onValueChange={(v) => handleChange('sexe', v)}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 font-medium">Niveau</Label>
                    <Select 
                      value={formData.niveau} 
                      onValueChange={(v) => {
                        handleChange('niveau', v);
                        // Réinitialiser la classe quand on change de niveau
                        handleChange('classe', '');
                      }}
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
                    <Label className="text-gray-700 font-medium">Classe</Label>
                    <Select 
                      value={formData.classe} 
                      onValueChange={(v) => handleChange('classe', v)}
                      disabled={!formData.niveau}
                    >
                      <SelectTrigger className="mt-1 h-12 rounded-xl">
                        <SelectValue placeholder={formData.niveau ? "Sélectionnez" : "Sélectionnez d'abord le niveau"} />
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
                    {formData.niveau && classesDisponibles.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">Niveau non reconnu</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    Adresse
                  </Label>
                  <Input
                    value={formData.adresse}
                    onChange={(e) => handleChange('adresse', e.target.value)}
                    className="mt-1 h-12 rounded-xl"
                    placeholder="Adresse complète"
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    Zone géographique
                  </Label>
                  <Select 
                    value={formData.zone} 
                    onValueChange={(v) => handleChange('zone', v)}
                  >
                    <SelectTrigger className="mt-1 h-12 rounded-xl">
                      <SelectValue placeholder="Sélectionnez votre zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map(z => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                    disabled={!formData.nom || !formData.prenom || !formData.niveau || !formData.classe || !formData.zone || !formData.adresse}
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
                  <Bus className="w-5 h-5 text-amber-500" />
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
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
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
                    <div className="border-t border-amber-200 pt-2 mt-2 flex justify-between">
                      <span className="text-gray-800 font-semibold">Montant estimé:</span>
                      <span className="font-bold text-amber-600">
                        {formData.abonnement === 'Mensuel' 
                          ? (formData.type_transport === 'Aller-Retour' ? '400 DH/mois' : '250 DH/mois')
                          : (formData.type_transport === 'Aller-Retour' ? '4000 DH/an' : '2500 DH/an')
                        }
                      </span>
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
                        Envoyer l'inscription
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