import React from 'react';
import AdminLayout from '../components/AdminLayout';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  return (
    <AdminLayout title="Tableau de bord">
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-6">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Bienvenue dans l'espace administrateur
          </h2>
          <p className="text-gray-500">
            Utilisez le menu latéral pour accéder aux différentes sections
          </p>
        </motion.div>
      </div>
    </AdminLayout>
  );
}