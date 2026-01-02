import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, User, Filter, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PresenceList({ 
  eleves, 
  presences, 
  onTogglePresence, 
  selectedDate,
  onDateChange,
  readOnly = false,
  onNotifyAbsence = null
}) {
  // Détecter automatiquement la période (matin/soir) selon l'heure actuelle
  const getCurrentPeriod = () => {
    const now = new Date();
    const hour = now.getHours();
    // Matin : avant 13h00, Soir : à partir de 13h00
    return hour < 13 ? 'matin' : 'soir';
  };

  const [groupFilter, setGroupFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  // La période est toujours la période actuelle détectée automatiquement
  const periodeFilter = getCurrentPeriod();
  const [markingPresence, setMarkingPresence] = useState(new Set()); // Pour suivre les élèves en cours de marquage
  const [markingAbsence, setMarkingAbsence] = useState(new Set()); // Pour suivre les élèves en cours de marquage d'absence
  const [sentMessages, setSentMessages] = useState(new Set()); // Pour suivre les élèves pour qui un message a été envoyé

  const getPresenceStatus = (eleveId) => {
    const presence = presences.find(p => 
      p.eleve_id === eleveId && 
      p.date === selectedDate
    );
    if (!presence) return { matin: null, soir: null, hasRecord: false };
    return {
      matin: presence.present_matin,
      soir: presence.present_soir,
      hasRecord: true
    };
  };

  // Filtrer les élèves : exclure ceux qui sont marqués comme présents (pour qu'ils disparaissent de la liste)
  // ET exclure ceux pour qui un message d'absence a été envoyé
  const filteredEleves = eleves.filter(eleve => {
    // Exclure si un message a été envoyé pour cet élève
    if (sentMessages.has(eleve.id)) {
      return false;
    }
    
    const matchGroup = groupFilter === 'all' || eleve.groupe === groupFilter;
    const matchSearch = eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       eleve.prenom.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchGroup || !matchSearch) {
      return false;
    }
    
    // Vérifier le statut de présence
    const status = getPresenceStatus(eleve.id);
    
    // Afficher l'élève si :
    // - Il n'a pas de présence enregistrée pour cette date (pas encore marqué)
    // - Il est marqué comme absent (isPresent === false)
    // Ne pas afficher si : isPresent === true (explicitement marqué présent)
    if (!status.hasRecord) {
      // Pas de présence enregistrée, afficher l'élève
      return true;
    } else {
      // Présence enregistrée, vérifier le statut pour la période sélectionnée
      const isPresent = periodeFilter === 'matin' ? status.matin : status.soir;
      // Afficher seulement si absent (pas présent)
      return !isPresent;
    }
  });

  const handlePresence = async (eleveId) => {
    if (readOnly) return;
    
    // Ajouter l'élève à la liste des élèves en cours de marquage pour l'effet visuel
    setMarkingPresence(prev => new Set(prev).add(eleveId));
    
    // Attendre un peu pour montrer l'effet vert avant de marquer la présence
    setTimeout(async () => {
      const newValue = true; // Marquer comme présent
      await onTogglePresence(eleveId, periodeFilter, newValue);
      
      // Retirer l'élève de la liste après un court délai pour l'animation de sortie
      setTimeout(() => {
        setMarkingPresence(prev => {
          const newSet = new Set(prev);
          newSet.delete(eleveId);
          return newSet;
        });
      }, 500);
    }, 300);
  };

  const handleAbsence = async (eleveId) => {
    if (readOnly) return;
    
    // Trouver l'élève
    const eleve = eleves.find(e => e.id === eleveId);
    if (!eleve) return;
    
    // Ajouter l'élève à la liste des élèves en cours de marquage d'absence pour l'effet visuel
    setMarkingAbsence(prev => new Set(prev).add(eleveId));
    
    // Attendre un peu pour montrer l'effet rouge avant de marquer l'absence
    setTimeout(async () => {
      const newValue = false; // Marquer comme absent
      await onTogglePresence(eleveId, periodeFilter, newValue);
      
      // Marquer que l'élève doit disparaître de la liste
      setSentMessages(prev => new Set(prev).add(eleveId));
      
      // Retirer l'élève de la liste après un court délai et rediriger vers communication
      setTimeout(() => {
        setMarkingAbsence(prev => {
          const newSet = new Set(prev);
          newSet.delete(eleveId);
          return newSet;
        });
        
        // Rediriger vers le formulaire de communication
        if (onNotifyAbsence) {
          onNotifyAbsence(eleve, periodeFilter);
        }
      }, 500);
    }, 300);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Check className="w-6 h-6" />
            Gestion des Présences
          </h3>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
            <span className="text-white text-sm font-medium">
              Période: <span className="font-bold">{getCurrentPeriod() === 'matin' ? 'Matin' : 'Soir'}</span>
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Rechercher un élève..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500"
          />

          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="bg-white/90 border-0 rounded-xl focus:ring-purple-500 focus:border-purple-500">
              <SelectValue placeholder="Groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              <SelectItem value="A">Groupe A</SelectItem>
              <SelectItem value="B">Groupe B</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste verticale */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {/* Debug info - à retirer en production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-2 text-xs text-gray-500 p-2 bg-gray-50 rounded">
            Debug: {eleves.length} élèves totaux, {filteredEleves.length} filtrés, {presences.length} présences pour {selectedDate}
            <br />
            Période: {periodeFilter}, Groupe: {groupFilter}, Recherche: "{searchTerm}"
          </div>
        )}
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filteredEleves.map((eleve, index) => {
              const status = getPresenceStatus(eleve.id);
              const isMarking = markingPresence.has(eleve.id);
              const isMarkingAbsent = markingAbsence.has(eleve.id);
              const hasSentMessage = sentMessages.has(eleve.id);
              
              // Déterminer la couleur de fond et bordure selon l'état
              let bgColor = 'white';
              let borderColor = 'rgb(243 244 246)'; // border-gray-100
              let avatarBg = eleve.sexe === 'Masculin' ? 'bg-purple-100' : 'bg-pink-100';
              let avatarIcon = <User className={`w-6 h-6 ${eleve.sexe === 'Masculin' ? 'text-purple-500' : 'text-pink-500'}`} />;
              
              if (isMarking) {
                bgColor = 'rgb(220 252 231)'; // bg-green-100
                borderColor = 'rgb(34 197 94)'; // border-green-500
                avatarBg = 'bg-green-200';
                avatarIcon = (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-6 h-6 text-green-600" strokeWidth={3} />
                  </motion.div>
                );
              } else if (isMarkingAbsent) {
                bgColor = 'rgb(254 242 242)'; // bg-red-100
                borderColor = 'rgb(239 68 68)'; // border-red-500
                avatarBg = 'bg-red-200';
                avatarIcon = (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <X className="w-6 h-6 text-red-600" strokeWidth={3} />
                  </motion.div>
                );
              }
              
              return (
                <motion.div
                  key={eleve.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: (isMarking || isMarkingAbsent) ? 0.7 : 1, 
                    x: 0,
                    backgroundColor: bgColor,
                    borderColor: borderColor
                  }}
                  exit={{ 
                    opacity: 0, 
                    x: 20, 
                    scale: 0.9,
                    backgroundColor: isMarking ? 'rgb(220 252 231)' : 'rgb(254 242 242)' // Sortie en vert ou rouge
                  }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    isMarking 
                      ? 'bg-green-100 border-green-500' 
                      : isMarkingAbsent
                      ? 'bg-red-100 border-red-500'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${avatarBg}`}>
                      {avatarIcon}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {eleve.nom} {eleve.prenom}
                      </h4>
                      <div className="flex gap-3 text-sm text-gray-500">
                        <span>{eleve.classe}</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          Groupe {eleve.groupe}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Bouton Présence (✓ vert) */}
                    <motion.button
                      onClick={() => handlePresence(eleve.id)}
                      disabled={readOnly || isMarking}
                      whileHover={!readOnly && !isMarking ? { scale: 1.1 } : {}}
                      whileTap={!readOnly && !isMarking ? { scale: 0.95 } : {}}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        readOnly || isMarking ? 'cursor-default opacity-50' : 'cursor-pointer'
                      } bg-green-500 text-white shadow-lg shadow-green-200 hover:bg-green-600`}
                      title="Marquer comme présent"
                    >
                      <Check className="w-6 h-6" strokeWidth={3} />
                    </motion.button>

                    {/* Bouton Absence (✗ rouge) */}
                    <motion.button
                      onClick={() => handleAbsence(eleve.id)}
                      disabled={readOnly || isMarking || isMarkingAbsent}
                      whileHover={!readOnly && !isMarking && !isMarkingAbsent ? { scale: 1.1 } : {}}
                      whileTap={!readOnly && !isMarking && !isMarkingAbsent ? { scale: 0.95 } : {}}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        readOnly || isMarking || isMarkingAbsent ? 'cursor-default opacity-50' : 'cursor-pointer'
                      } bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600`}
                      title="Marquer comme absent et envoyer un message"
                    >
                      <X className="w-6 h-6" strokeWidth={3} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>

        {filteredEleves.length === 0 && eleves.length > 0 && (
          <div className="text-center py-12 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">Tous les élèves sont marqués comme présents pour cette période</p>
            <p className="text-sm text-gray-400">
              ({eleves.length} élève{eleves.length > 1 ? 's' : ''} présent{eleves.length > 1 ? 's' : ''})
            </p>
          </div>
        )}
        
        {eleves.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun élève assigné à ce bus</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {eleves.filter(e => {
                const s = getPresenceStatus(e.id);
                return s.hasRecord && (periodeFilter === 'matin' ? s.matin : s.soir);
              }).length}
            </p>
            <p className="text-sm text-gray-500">Présents</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-red-500">
              {eleves.filter(e => {
                const s = getPresenceStatus(e.id);
                return s.hasRecord && (periodeFilter === 'matin' ? !s.matin : !s.soir);
              }).length}
            </p>
            <p className="text-sm text-gray-500">Absents</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-gray-700">{eleves.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
