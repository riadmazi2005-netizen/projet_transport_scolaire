import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, notificationsAPI, presencesAPI, demandesAPI, inscriptionsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  Users, Bell, UserPlus, Edit, LogOut, GraduationCap, 
  Bus, CreditCard, Clock, CheckCircle, AlertCircle, Eye, XCircle,
  TrendingUp, MapPin, Calendar, FileText
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import NotificationPanel from '../components/ui/NotificationPanel';
import StatCard from '../components/ui/StatCard';

export default function TuteurDashboard() {
  const navigate = useNavigate();
  const [tuteur, setTuteur] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inscriptionFilter, setInscriptionFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('eleves');

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    
    const tuteurData = JSON.parse(session);
    setTuteur(tuteurData);
    // Utiliser type_id qui est l'ID du tuteur dans la table tuteurs
    const tuteurId = tuteurData.type_id || tuteurData.id;
    loadData(tuteurId, tuteurData.id); // Passer aussi l'ID utilisateur
  }, [navigate]);

  const loadData = async (tuteurId, userId) => {
    try {
      // Charger toutes les données nécessaires
      const [elevesRes, notificationsRes, demandesRes, inscriptionsRes] = await Promise.allSettled([
        elevesAPI.getAll(),
        notificationsAPI.getByUser(userId, 'tuteur'),
        demandesAPI.getAll(),
        inscriptionsAPI.getAll()
      ]);
      
      const allEleves = elevesRes.status === 'fulfilled'
        ? (Array.isArray(elevesRes.value?.data) ? elevesRes.value.data : (Array.isArray(elevesRes.value) ? elevesRes.value : []))
        : [];
      const notificationsData = notificationsRes.status === 'fulfilled'
        ? (Array.isArray(notificationsRes.value?.data) ? notificationsRes.value.data : (Array.isArray(notificationsRes.value) ? notificationsRes.value : []))
        : [];
      const allDemandes = demandesRes.status === 'fulfilled'
        ? (Array.isArray(demandesRes.value?.data) ? demandesRes.value.data : (Array.isArray(demandesRes.value) ? demandesRes.value : []))
        : [];
      const allInscriptions = inscriptionsRes.status === 'fulfilled'
        ? (Array.isArray(inscriptionsRes.value?.data) ? inscriptionsRes.value.data : (Array.isArray(inscriptionsRes.value) ? inscriptionsRes.value : []))
        : [];
      
      // Filtrer les élèves du tuteur
      const elevesData = Array.isArray(allEleves) ? allEleves.filter(e => e.tuteur_id === tuteurId) : [];
      
      // Filtrer uniquement les demandes d'inscription
      const demandesInscription = Array.isArray(allDemandes) 
        ? allDemandes.filter(d => d.type_demande === 'inscription' && d.tuteur_id === tuteurId)
        : [];
      
      // Enrichir les élèves avec les informations de demande et d'inscription
      const elevesEnriched = elevesData.map(eleve => {
        // Trouver la demande d'inscription la plus récente pour cet élève
        const demandeInscription = demandesInscription
          .filter(d => d.eleve_id === eleve.id)
          .sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0))[0];
        
        // Trouver l'inscription active pour cet élève
        const inscription = Array.isArray(allInscriptions) 
          ? allInscriptions.find(i => i.eleve_id === eleve.id && i.statut === 'Active')
          : null;
        
        // Déterminer le statut à afficher
        let statutDemande = null;
        if (inscription) {
          // L'élève a une inscription active, donc il est inscrit
          statutDemande = 'Inscrit';
        } else if (demandeInscription) {
          // Utiliser le statut de la demande et mapper selon les besoins
          const statut = demandeInscription.statut || 'En attente';
          if (statut === 'En attente') {
            statutDemande = 'En cours de traitement';
          } else if (statut === 'Validée') {
            // Quand l'admin valide, on affiche "En attente de paiement"
            statutDemande = 'En attente de paiement';
          } else if (statut === 'Refusée') {
            statutDemande = 'Refusée';
          } else {
            statutDemande = statut;
          }
        } else {
          // Pas de demande ni d'inscription - par défaut "En cours de traitement"
          statutDemande = 'En cours de traitement';
        }
        
        return {
          ...eleve,
          demande_inscription: demandeInscription,
          inscription: inscription,
          statut_demande: statutDemande
        };
      });
      
      setEleves(elevesEnriched);
      setNotifications(notificationsData.sort((a, b) => new Date(b.date || b.date_creation || 0) - new Date(a.date || a.date_creation || 0)));
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('tuteur_session');
    navigate(createPageUrl('Home'));
  };

  const markNotificationAsRead = async (notifId) => {
    try {
      await notificationsAPI.marquerLue(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, lue: true } : n));
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  const getStatusBadge = (statut) => {
    const styles = {
      'En cours de traitement': 'bg-blue-100 text-blue-700 border-blue-200',
      'En attente de paiement': 'bg-orange-100 text-orange-700 border-orange-200',
      'Refusée': 'bg-red-100 text-red-700 border-red-200',
      'Inscrit': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'En attente': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return styles[statut] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleCancelDemande = async (eleve) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler la demande d'inscription de ${eleve.prenom} ${eleve.nom}?`)) {
      return;
    }
    
    try {
      // Si une demande existe, mettre à jour son statut
      if (eleve.demande_inscription?.id) {
        // Note: Il faudrait peut-être créer une API pour mettre à jour le statut de la demande
        // Pour l'instant, on peut supprimer l'élève si la demande n'est pas encore traitée
        if (eleve.statut_demande === 'En cours de traitement') {
          await elevesAPI.delete(eleve.id);
        }
      } else {
        // Supprimer l'élève s'il n'y a pas de demande
        await elevesAPI.delete(eleve.id);
      }
      
      // Recharger les données
      const tuteurId = tuteur.type_id || tuteur.id;
      loadData(tuteurId, tuteur.id);
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
      alert('Erreur lors de l\'annulation de la demande');
    }
  };

  const filteredEleves = eleves.filter(e => {
    if (inscriptionFilter === 'all') return true;
    if (inscriptionFilter === 'inscrit') return e.statut_demande === 'Inscrit';
    if (inscriptionFilter === 'en_attente') return e.statut_demande === 'En attente de paiement';
    if (inscriptionFilter === 'en_traitement') return e.statut_demande === 'En cours de traitement';
    if (inscriptionFilter === 'refusee') return e.statut_demande === 'Refusée';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.lue).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Bienvenue, {tuteur?.prenom} {tuteur?.nom}
                </h1>
                <p className="text-gray-500">{tuteur?.email}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNotifications(true)}
                className="relative rounded-xl"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              
              <Link to={createPageUrl('TuteurProfile')}>
                <Button variant="outline" className="rounded-xl">
                  <Edit className="w-5 h-5 mr-2" />
                  Profil
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Mes Enfants" 
            value={eleves.length} 
            icon={GraduationCap} 
            color="amber"
          />
          <StatCard 
            title="En attente" 
            value={eleves.filter(e => e.statut_demande === 'En cours de traitement' || e.statut_demande === 'En attente').length} 
            icon={Clock} 
            color="orange"
          />
          <StatCard 
            title="Affectés" 
            value={eleves.filter(e => e.statut_demande === 'Inscrit' || e.statut_demande === 'En attente de paiement').length} 
            icon={CheckCircle} 
            color="green"
          />
          <StatCard 
            title="Notifications" 
            value={unreadCount} 
            icon={Bell} 
            color="blue"
          />
        </div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex gap-4 flex-wrap"
        >
          <Link to={createPageUrl('TuteurInscription')}>
            <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl h-14 px-8 shadow-lg hover:shadow-xl transition-all">
              <UserPlus className="w-5 h-5 mr-2" />
              Inscrire un nouvel élève
            </Button>
          </Link>
          <Link to={createPageUrl('TuteurDemandes')}>
            <Button variant="outline" className="rounded-xl h-14 px-8 shadow-lg hover:shadow-xl transition-all">
              <FileText className="w-5 h-5 mr-2" />
              Mes Demandes
            </Button>
          </Link>
        </motion.div>

        {/* Content */}
        {activeTab === 'eleves' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-amber-500" />
                Mes Enfants
              </h2>
              <Select value={inscriptionFilter} onValueChange={setInscriptionFilter}>
                <SelectTrigger className="w-48 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les élèves</SelectItem>
                  <SelectItem value="inscrit">Inscrits</SelectItem>
                  <SelectItem value="en_attente">En attente de paiement</SelectItem>
                  <SelectItem value="en_traitement">En cours de traitement</SelectItem>
                  <SelectItem value="refusee">Refusées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredEleves.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun élève inscrit pour le moment</p>
              <Link to={createPageUrl('TuteurInscription')}>
                <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
                  Inscrire un élève
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEleves.map((eleve, index) => (
                <motion.div
                  key={eleve.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-6 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <GraduationCap className="w-7 h-7 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {eleve.nom} {eleve.prenom}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                          <span>{eleve.classe}</span>
                          {eleve.adresse && (
                            <>
                              <span>•</span>
                              <span>{eleve.adresse.substring(0, 30)}...</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-4 py-2 rounded-xl text-sm font-medium border ${getStatusBadge(eleve.statut_demande)}`}>
                        {eleve.statut_demande}
                      </span>
                      
                      {/* Bouton Détails - toujours visible */}
                      <Link to={createPageUrl(`TuteurEleveDetails?eleveId=${eleve.id}`)}>
                        <Button variant="outline" className="rounded-xl">
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </Button>
                      </Link>
                      
                      {/* Boutons selon le statut */}
                      {(eleve.statut_demande === 'En cours de traitement' || eleve.statut_demande === 'En attente') && (
                        <>
                          <Link to={createPageUrl(`TuteurDemandes`)}>
                            <Button variant="outline" className="rounded-xl">
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            onClick={() => handleCancelDemande(eleve)}
                            className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Annuler
                          </Button>
                        </>
                      )}
                      
                      {eleve.statut_demande === 'En attente de paiement' && eleve.demande_inscription?.id && (
                        <Link to={createPageUrl(`TuteurPaiement?demandeId=${eleve.demande_inscription.id}`)}>
                          <Button className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Payer
                          </Button>
                        </Link>
                      )}
                      
                      {eleve.statut_demande === 'Refusée' && (
                        <span className="text-sm text-red-600 font-medium italic">Demande refusée</span>
                      )}
                      
                      {eleve.statut_demande === 'Inscrit' && (
                        <span className="text-sm text-green-600 font-medium">Élève inscrit</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        )}

        {activeTab === 'demandes' && (
          <DemandeFormTuteur tuteur={tuteur} eleves={eleves} />
        )}
      </div>

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onDelete={async (notifId) => {
          try {
            await notificationsAPI.delete(notifId);
            setNotifications(prev => prev.filter(n => n.id !== notifId));
          } catch (err) {
            console.error('Erreur lors de la suppression de la notification:', err);
          }
        }}
      />
    </div>
  );
}

function DemandeFormTuteur({ tuteur, eleves }) {
  const zones = ['agdal', '(takaddoum-haynahda)', 'hay riad', 'temara', 'medina', 'hay el fath', 'hay lmohit', 'yaakoub al mansour'];
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    eleve_id: '',
    nouvelle_adresse: '',
    nouvelle_zone: '',
    date_demenagement: '',
    raisons: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await demandesAPI.create({
        eleve_id: parseInt(formData.eleve_id),
        tuteur_id: tuteur.id,
        type_demande: 'Déménagement',
        nouvelle_adresse: formData.nouvelle_adresse,
        nouvelle_zone: formData.nouvelle_zone,
        date_demenagement: formData.date_demenagement,
        raisons: formData.raisons,
        statut: 'En attente'
      });
      
      // Notifier l'admin
      await notificationsAPI.create({
        destinataire_id: 1, // ID admin par défaut
        destinataire_type: 'admin',
        titre: 'Nouvelle demande de changement d\'adresse/zone',
        message: `${tuteur.prenom} ${tuteur.nom} a fait une demande de changement d'adresse/zone pour un élève.`,
        type: 'info'
      });
      
      setSuccess(true);
      setFormData({
        eleve_id: '',
        nouvelle_adresse: '',
        nouvelle_zone: '',
        date_demenagement: '',
        raisons: ''
      });
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la demande:', err);
      alert('Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  const selectedEleve = eleves.find(e => e.id === parseInt(formData.eleve_id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl p-6"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-amber-500" />
        Demande de changement d'adresse / Zone (Déménagement)
      </h2>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700"
        >
          <CheckCircle className="w-5 h-5" />
          Demande envoyée avec succès !
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label className="text-gray-700 font-medium mb-2">Sélectionner l'élève</Label>
          <Select
            value={formData.eleve_id}
            onValueChange={(v) => setFormData({ ...formData, eleve_id: v })}
          >
            <SelectTrigger className="mt-1 h-12 rounded-xl">
              <SelectValue placeholder="Sélectionnez un élève" />
            </SelectTrigger>
            <SelectContent>
              {eleves.map(eleve => (
                <SelectItem key={eleve.id} value={eleve.id.toString()}>
                  {eleve.prenom} {eleve.nom} - {eleve.classe}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEleve && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="text-sm text-gray-600 mb-2">Informations actuelles</p>
            <p className="font-medium">Adresse actuelle: <span className="text-gray-700">{selectedEleve.adresse || 'Non renseignée'}</span></p>
          </div>
        )}

        <div>
          <Label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            Nouvelle adresse
          </Label>
          <Input
            value={formData.nouvelle_adresse}
            onChange={(e) => setFormData({ ...formData, nouvelle_adresse: e.target.value })}
            className="mt-1 h-12 rounded-xl"
            placeholder="Nouvelle adresse complète"
            required
          />
        </div>

        <div>
          <Label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            Nouvelle zone
          </Label>
          <Select
            value={formData.nouvelle_zone}
            onValueChange={(v) => setFormData({ ...formData, nouvelle_zone: v })}
          >
            <SelectTrigger className="mt-1 h-12 rounded-xl">
              <SelectValue placeholder="Sélectionnez la nouvelle zone" />
            </SelectTrigger>
            <SelectContent>
              {zones.map(zone => (
                <SelectItem key={zone} value={zone}>{zone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Date de déménagement
          </Label>
          <Input
            type="date"
            value={formData.date_demenagement}
            onChange={(e) => setFormData({ ...formData, date_demenagement: e.target.value })}
            className="mt-1 h-12 rounded-xl"
            required
          />
        </div>

        <div>
          <Label className="text-gray-700 font-medium mb-2">Raisons / Justification</Label>
          <Textarea
            value={formData.raisons}
            onChange={(e) => setFormData({ ...formData, raisons: e.target.value })}
            className="mt-1 rounded-xl min-h-[120px]"
            placeholder="Expliquez les raisons du déménagement..."
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !formData.eleve_id}
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Envoyer la demande'
          )}
        </Button>
      </form>
    </motion.div>
  );
}