import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  readOnly = false 
}) {
  const [groupFilter, setGroupFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [periodeFilter, setPeriodeFilter] = useState('matin');

  const filteredEleves = eleves.filter(eleve => {
    const matchGroup = groupFilter === 'all' || eleve.groupe === groupFilter;
    const matchSearch = eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       eleve.prenom.toLowerCase().includes(searchTerm.toLowerCase());
    return matchGroup && matchSearch;
  });

  const getPresenceStatus = (eleveId) => {
    const presence = presences.find(p => 
      p.eleve_id === eleveId && 
      p.date === selectedDate
    );
    if (!presence) return { matin: false, soir: false };
    return {
      matin: presence.present_matin,
      soir: presence.present_soir
    };
  };

  const handleToggle = (eleveId) => {
    if (readOnly) return;
    const currentStatus = getPresenceStatus(eleveId);
    const newValue = periodeFilter === 'matin' ? !currentStatus.matin : !currentStatus.soir;
    onTogglePresence(eleveId, periodeFilter, newValue);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-amber-500 to-yellow-500">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Check className="w-6 h-6" />
          Gestion des Présences
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="pl-10 bg-white/90 border-0 rounded-xl"
            />
          </div>
          
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="bg-white/90 border-0 rounded-xl">
              <SelectValue placeholder="Groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              <SelectItem value="A">Groupe A</SelectItem>
              <SelectItem value="B">Groupe B</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
            <SelectTrigger className="bg-white/90 border-0 rounded-xl">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matin">Matin</SelectItem>
              <SelectItem value="soir">Soir</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Rechercher un élève..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/90 border-0 rounded-xl"
          />
        </div>
      </div>

      {/* Liste verticale */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        <div className="space-y-2">
          {filteredEleves.map((eleve, index) => {
            const status = getPresenceStatus(eleve.id);
            const isPresent = periodeFilter === 'matin' ? status.matin : status.soir;
            
            return (
              <motion.div
                key={eleve.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  isPresent 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    eleve.sexe === 'Masculin' ? 'bg-blue-100' : 'bg-pink-100'
                  }`}>
                    <User className={`w-6 h-6 ${
                      eleve.sexe === 'Masculin' ? 'text-blue-500' : 'text-pink-500'
                    }`} />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {eleve.nom} {eleve.prenom}
                    </h4>
                    <div className="flex gap-3 text-sm text-gray-500">
                      <span>{eleve.classe}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        Groupe {eleve.groupe}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(eleve.id)}
                  disabled={readOnly}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-105'
                  } ${
                    isPresent 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {isPresent ? (
                    <Check className="w-7 h-7" strokeWidth={3} />
                  ) : (
                    <X className="w-7 h-7" strokeWidth={2} />
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {filteredEleves.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun élève trouvé</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {filteredEleves.filter(e => {
                const s = getPresenceStatus(e.id);
                return periodeFilter === 'matin' ? s.matin : s.soir;
              }).length}
            </p>
            <p className="text-sm text-gray-500">Présents</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-red-500">
              {filteredEleves.filter(e => {
                const s = getPresenceStatus(e.id);
                return periodeFilter === 'matin' ? !s.matin : !s.soir;
              }).length}
            </p>
            <p className="text-sm text-gray-500">Absents</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-gray-700">{filteredEleves.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}