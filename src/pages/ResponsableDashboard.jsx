import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { responsablesAPI, busAPI, chauffeursAPI, elevesAPI, presencesAPI, notificationsAPI, demandesAPI, inscriptionsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  UserCog, Bell, LogOut, Bus, Users, AlertCircle,
  DollarSign, TrendingUp, User, Edit, CheckCircle
} from 'lucide-react';
import NotificationPanel from '../components/ui/NotificationPanel';
import StatCard from '../components/ui/StatCard';
import PresenceList from '../components/ui/PresenceList';
import { format } from 'date-fns';

export default function ResponsableDashboard() {
  const navigate = useNavigate();
  const [responsable, setResponsable] = useState(null);
  const [buses, setBuses] = useState([]);
  const [chauffeur, setChauffeur] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [presences, setPresences] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('presence');

  useEffect(() => {
    const session = localStorage.getItem('responsable_session');
    if (!session) {
      navigate(createPageUrl('ResponsableLogin'));
      return;
    }
    
    const responsableData = JSON.parse(session);
    setResponsable(responsableData);
    loadData(responsableData);
  }, [navigate]);

  const loadData = async (responsableData) => {
    try {
      // Charger tous les bus assignés à ce responsable
      const allBuses = await busAPI.getAll();
      const myBuses = allBuses.filter(b => b.responsable_id === responsableData.id);
      setBuses(myBuses);
      
      // Si le responsable a des bus
      if (myBuses.length > 0) {
        const mainBus = myBuses[0]; // Premier bus comme bus principal
        
        // Charger le chauffeur du bus principal
        if (mainBus.chauffeur_id) {
          try {
            const chauffeurData = await chauffeursAPI.getById(mainBus.chauffeur_id);
            setChauffeur(chauffeurData);
          } catch (err) {
            console.warn('Chauffeur non trouvé:', err);
          }
        }
        
        // Charger tous les élèves assignés aux bus du responsable
        const allInscriptions = await inscriptionsAPI.getAll();
        const busIds = myBuses.map(b => b.id);
        const myInscriptions = allInscriptions.filter(i => busIds.includes(i.bus_id));
        
        const allEleves = await elevesAPI.getAll();
        const myEleves = allEleves.filter(e => 
          myInscriptions.some(i => i.eleve_id === e.id)
        );
        setEleves(myEleves);
      }
      
      // Charger les présences
      try {
        const presencesData = await presencesAPI.getByDate(selectedDate);
        setPresences(presencesData);
      } catch (err) {
        console.warn('Présences non disponibles:', err);
        setPresences([]);
      }
      
      // Charger les notifications
      const notificationsResponse = await notificationsAPI.getByUser(responsableData.id, 'responsable');
      const notificationsData = notificationsResponse?.data || notificationsResponse || [];
      setNotifications(notificationsData.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('responsable_session');
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

  const handleTogglePresence = async (eleveId, periode, value) => {
    try {
      const existingPresence = presences.find(p => 
        p.eleve_id === eleveId && p.date === selectedDate
      );
      
      if (existingPresence) {
        const updateData = periode === 'matin' 
          ? { present_matin: value }
          : { present_soir: value };
        
        await presencesAPI.marquer({
          ...existingPresence,
          ...updateData
        });
        
        setPresences(prev => prev.map(p => 
          p.id === existingPresence.id 
            ? { ...p, ...updateData }
            : p
        ));
      } else {
        const newPresence = await presencesAPI.marquer({
          eleve_id: eleveId,
          date: selectedDate,
          present_matin: periode === 'matin' ? value : false,
          present_soir: periode === 'soir' ? value : false,
          bus_id: buses[0]?.id,
          responsable_id: responsable.id
        });
        
        setPresences(prev => [...prev, newPresence]);
      }
      
      // Si marqué comme absent, envoyer notification au tuteur
      if (!value) {
        const eleve = eleves.find(e => e.id === eleveId);
        if (eleve && eleve.tuteur_id) {
          await notificationsAPI.create({
            destinataire_id: eleve.tuteur_id,
            destinataire_type: 'tuteur',
            titre: 'Absence signalée',
            message: `${eleve.prenom} ${eleve.nom} a été marqué(e) absent(e) le ${selectedDate} (${periode}).`,
            type: 'alerte',
            date: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('Erreur lors de la modification de présence:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.lue).length;
  const mainBus = buses.length > 0 ? buses[0] : null;
  const totalAccidents = chauffeur?.nombre_accidents || 0;

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
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <UserCog className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {responsable?.prenom} {responsable?.nom}
                </h1>
                <p className="text-gray-500">Responsable Bus</p>
                {responsable?.zone_responsabilite && (
                  <p className="text-sm text-gray-400">{responsable.zone_responsabilite}</p>
                )}
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
            title="Mes Bus" 
            value={buses.length} 
            icon={Bus} 
            color="amber"
            subtitle={mainBus?.numero || 'Aucun bus'}
          />
          <StatCard 
            title="Élèves" 
            value={eleves.length} 
            icon={Users} 
            color="blue"
          />
          <StatCard 
            title="Accidents chauffeur" 
            value={totalAccidents} 
            icon={AlertCircle} 
            color={totalAccidents >= 3 ? 'red' : 'green'}
          />
          <StatCard 
            title="Notifications" 
            value={unreadCount} 
            icon={Bell} 
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['presence', 'eleves', 'bus', 'demandes'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                  : ''
              }`}
            >
              {tab === 'presence' && 'Présences'}
              {tab === 'eleves' && 'Élèves'}
              {tab === 'bus' && 'Mes Bus'}
              {tab === 'demandes' && 'Demandes'}
            </Button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'presence' && (
          <PresenceList
            eleves={eleves}
            presences={presences}
            onTogglePresence={handleTogglePresence}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}

        {activeTab === 'eleves' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-500" />
                Liste des Élèves
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {eleves.map((eleve) => (
                <div key={eleve.id} className="p-4 hover:bg-amber-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{eleve.nom} {eleve.prenom}</h3>
                        <p className="text-sm text-gray-500">
                          {eleve.classe}
                          {eleve.telephone_parent && ` • ${eleve.telephone_parent}`}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      eleve.statut === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {eleve.statut}
                    </span>
                  </div>
                </div>
              ))}
              {eleves.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun élève affecté à vos bus</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bus' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {buses.map((bus) => (
              <div key={bus.id} className="bg-white rounded-3xl shadow-xl p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-amber-500" />
                  Bus {bus.numero}
                </h2>
                <div className="space-y-4">
                  <div className="bg-amber-50 rounded-2xl p-4 text-center">
                    <p className="text-4xl font-bold text-amber-600">{bus.numero}</p>
                    <p className="text-gray-500">{bus.immatriculation}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Marque</span>
                      <span className="font-medium">{bus.marque || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Modèle</span>
                      <span className="font-medium">{bus.modele || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Capacité</span>
                      <span className="font-medium">{bus.capacite} places</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Statut</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        bus.statut === 'Actif' ? 'bg-green-100 text-green-700' : 
                        bus.statut === 'En maintenance' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {bus.statut}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {buses.length === 0 && (
              <div className="col-span-2 bg-white rounded-3xl shadow-xl p-12 text-center text-gray-400">
                <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun bus assigné</p>
              </div>
            )}

            {/* Chauffeur Info */}
            {chauffeur && (
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-500" />
                  Chauffeur
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {chauffeur.prenom} {chauffeur.nom}
                      </h3>
                      <p className="text-gray-500">{chauffeur.telephone}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Permis</span>
                      <span className="font-medium">{chauffeur.numero_permis}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Accidents</span>
                      <span className={`font-bold ${
                        chauffeur.nombre_accidents >= 3 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {chauffeur.nombre_accidents} / 3
                      </span>
                    </div>
                  </div>
                  {chauffeur.nombre_accidents >= 3 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                      <AlertCircle className="w-5 h-5 inline mr-2" />
                      Attention: 3 accidents = licenciement + amende 1000 DH
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'demandes' && (
          <DemandeForm 
            demandeur={responsable} 
            demandeurType="responsable"
            onSubmit={async (demande) => {
              try {
                await demandesAPI.create(demande);
                
                // Notifier tous les admins
                await notificationsAPI.create({
                  destinataire_id: 1, // ID admin par défaut
                  destinataire_type: 'admin',
                  titre: `Nouvelle demande de ${demande.type_demande}`,
                  message: `${responsable.prenom} ${responsable.nom} (Responsable Bus) a fait une demande de ${demande.type_demande.toLowerCase()}.`,
                  type: 'info'
                });
              } catch (err) {
                console.error('Erreur lors de la création de la demande:', err);
                alert('Erreur lors de l\'envoi de la demande');
              }
            }}
          />
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

function DemandeForm({ demandeur, demandeurType, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    type_demande: '',
    raisons: '',
    salaire_demande: '',
    date_debut_conge: '',
    date_fin_conge: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit({
        demandeur_id: demandeur.id,
        demandeur_type: demandeurType,
        type_demande: formData.type_demande,
        raisons: formData.raisons,
        salaire_demande: formData.type_demande === 'Augmentation' ? parseInt(formData.salaire_demande) : null,
        salaire_actuel: demandeur.salaire || null,
        date_debut_conge: formData.type_demande === 'Congé' ? formData.date_debut_conge : null,
        date_fin_conge: formData.type_demande === 'Congé' ? formData.date_fin_conge : null,
        statut: 'En attente'
      });
      
      setSuccess(true);
      setFormData({
        type_demande: '',
        raisons: '',
        salaire_demande: '',
        date_debut_conge: '',
        date_fin_conge: ''
      });
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-amber-500" />
        Faire une demande
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
          <label className="block text-gray-700 font-medium mb-2">Type de demande</label>
          <select
            value={formData.type_demande}
            onChange={(e) => setFormData({ ...formData, type_demande: e.target.value })}
            className="w-full h-12 rounded-xl border border-gray-200 px-4"
            required
          >
            <option value="">Sélectionnez</option>
            <option value="Augmentation">Demande d'augmentation</option>
            <option value="Congé">Demande de congé</option>
            <option value="Autre">Autre demande</option>
          </select>
        </div>

        {formData.type_demande === 'Augmentation' && demandeur.salaire && (
          <>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-gray-600">Salaire actuel</p>
              <p className="text-2xl font-bold text-amber-600">{demandeur.salaire} DH</p>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Salaire demandé (DH)</label>
              <input
                type="number"
                value={formData.salaire_demande}
                onChange={(e) => setFormData({ ...formData, salaire_demande: e.target.value })}
                className="w-full h-12 rounded-xl border border-gray-200 px-4"
                required
              />
            </div>
          </>
        )}

        {formData.type_demande === 'Congé' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Date début</label>
              <input
                type="date"
                value={formData.date_debut_conge}
                onChange={(e) => setFormData({ ...formData, date_debut_conge: e.target.value })}
                className="w-full h-12 rounded-xl border border-gray-200 px-4"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Date fin</label>
              <input
                type="date"
                value={formData.date_fin_conge}
                onChange={(e) => setFormData({ ...formData, date_fin_conge: e.target.value })}
                className="w-full h-12 rounded-xl border border-gray-200 px-4"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-gray-700 font-medium mb-2">Justification / Raisons</label>
          <textarea
            value={formData.raisons}
            onChange={(e) => setFormData({ ...formData, raisons: e.target.value })}
            className="w-full rounded-xl border border-gray-200 p-4 min-h-[120px]"
            placeholder="Expliquez les raisons de votre demande..."
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !formData.type_demande}
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Envoyer la demande'
          )}
        </Button>
      </form>
    </div>
  );
}