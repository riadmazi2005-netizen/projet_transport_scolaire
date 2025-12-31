import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { elevesAPI, notificationsAPI, presencesAPI, demandesAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  Users, Bell, UserPlus, Edit, LogOut, GraduationCap, 
  Bus, CreditCard, Clock, CheckCircle, AlertCircle, Eye, XCircle,
  TrendingUp, MapPin, Calendar
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
    loadData(tuteurData.id);
  }, [navigate]);

  const loadData = async (tuteurId) => {
    try {
      // Charger les élèves du tuteur
      const allElevesResponse = await elevesAPI.getAll();
      const allEleves = allElevesResponse?.data || allElevesResponse || [];
      const elevesData = allEleves.filter(e => e.tuteur_id === tuteurId);
      
      // Charger les notifications
      const notificationsResponse = await notificationsAPI.getByUser(tuteurId, 'tuteur');
      const notificationsData = notificationsResponse?.data || notificationsResponse || [];
      
      setEleves(elevesData);
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
      'Actif': 'bg-green-100 text-green-700 border-green-200',
      'Inactif': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'En attente': 'bg-orange-100 text-orange-700 border-orange-200',
      'Validé': 'bg-blue-100 text-blue-700 border-blue-200',
      'Refusé': 'bg-red-100 text-red-700 border-red-200',
      'Suspendu': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return styles[statut] || 'bg-gray-100 text-gray-700';
  };

  const handleCancelInscription = async (eleve) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler l'inscription de ${eleve.prenom} ${eleve.nom}? L'élève sera supprimé du système.`)) {
      return;
    }
    
    try {
      // Mettre à jour le statut d'abord
      await elevesAPI.update(eleve.id, {
        statut: 'Inactif'
      });
      
      // Supprimer l'élève
      await elevesAPI.delete(eleve.id);
      
      // Recharger les données
      loadData(tuteur.id);
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
      alert('Erreur lors de l\'annulation de l\'inscription');
    }
  };

  const filteredEleves = eleves.filter(e => {
    if (inscriptionFilter === 'all') return true;
    if (inscriptionFilter === 'inscrit') return e.statut === 'Actif';
    if (inscriptionFilter === 'non_inscrit') return e.statut === 'Inactif';
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
            title="Inactifs" 
            value={eleves.filter(e => e.statut === 'Inactif').length} 
            icon={Clock} 
            color="orange"
          />
          <StatCard 
            title="Actifs" 
            value={eleves.filter(e => e.statut === 'Actif').length} 
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
          className="mb-8"
        >
          <Link to={createPageUrl('TuteurInscription')}>
            <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl h-14 px-8 shadow-lg hover:shadow-xl transition-all">
              <UserPlus className="w-5 h-5 mr-2" />
              Inscrire un nouvel élève
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
                  <SelectItem value="inscrit">Inscrits (Actifs)</SelectItem>
                  <SelectItem value="non_inscrit">Non inscrits (Inactifs)</SelectItem>
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
                      <span className={`px-4 py-2 rounded-xl text-sm font-medium border ${getStatusBadge(eleve.statut)}`}>
                        {eleve.statut}
                      </span>
                      
                      <Link to={createPageUrl(`TuteurEleveDetails?eleveId=${eleve.id}`)}>
                        <Button variant="outline" className="rounded-xl">
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </Button>
                      </Link>
                      
                      {eleve.statut === 'Actif' && (
                        <Button
                          variant="outline"
                          onClick={() => handleCancelInscription(eleve)}
                          className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Annuler
                        </Button>
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