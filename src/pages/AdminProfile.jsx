import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AdminLayout from '../components/AdminLayout';
import { Shield, Save, ArrowLeft, CheckCircle, AlertCircle, Lock } from 'lucide-react';

export default function AdminProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [admin, setAdmin] = useState(null);
  const [adresse, setAdresse] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      navigate(createPageUrl('AdminLogin'));
      return;
    }
    const adminData = JSON.parse(session);
    setAdmin(adminData);
    // Récupérer l'adresse depuis localStorage si elle existe
    setAdresse(adminData.adresse || '');
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Sauvegarder l'adresse dans localStorage uniquement
      const session = JSON.parse(localStorage.getItem('admin_session'));
      const updatedSession = { 
        ...session,
        adresse: adresse
      };
      localStorage.setItem('admin_session', JSON.stringify(updatedSession));
      
      // Mettre à jour l'état
      setAdmin(updatedSession);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde de l\'adresse. Veuillez réessayer.');
    }
    setLoading(false);
  };

  if (!admin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Mon Profil">
      <div className="mb-4">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-r from-amber-500 to-yellow-500">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7" />
            Mon Profil Administrateur
          </h1>
          <p className="text-amber-100 mt-1">Informations personnelles (en lecture seule)</p>
        </div>

        <div className="p-6">
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700"
            >
              <CheckCircle className="w-5 h-5" />
              Adresse mise à jour avec succès !
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom - Lecture seule */}
              <div>
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  Nom
                  <Lock className="w-4 h-4 text-gray-400" title="En lecture seule" />
                </Label>
                <Input
                  value={admin.nom || ''}
                  disabled
                  className="mt-1 h-12 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Ce champ ne peut pas être modifié</p>
              </div>

              {/* Prénom - Lecture seule */}
              <div>
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  Prénom
                  <Lock className="w-4 h-4 text-gray-400" title="En lecture seule" />
                </Label>
                <Input
                  value={admin.prenom || ''}
                  disabled
                  className="mt-1 h-12 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Ce champ ne peut pas être modifié</p>
              </div>

              {/* Email - Lecture seule */}
              <div>
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  Email
                  <Lock className="w-4 h-4 text-gray-400" title="En lecture seule" />
                </Label>
                <Input
                  type="email"
                  value={admin.email || ''}
                  disabled
                  className="mt-1 h-12 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Ce champ ne peut pas être modifié</p>
              </div>

              {/* Téléphone - Lecture seule */}
              <div>
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  Téléphone
                  <Lock className="w-4 h-4 text-gray-400" title="En lecture seule" />
                </Label>
                <Input
                  value={admin.telephone || ''}
                  disabled
                  className="mt-1 h-12 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Ce champ ne peut pas être modifié</p>
              </div>

              {/* Adresse - Modifiable */}
              <div className="md:col-span-2">
                <Label className="text-gray-700 font-medium">Adresse</Label>
                <Input
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Entrez votre adresse"
                  className="mt-1 h-12 rounded-xl"
                />
                <p className="text-xs text-gray-500 mt-1">Vous pouvez modifier votre adresse</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl('AdminDashboard'))}
                className="rounded-xl"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl font-semibold shadow-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Enregistrer l'adresse
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </AdminLayout>
  );
}

