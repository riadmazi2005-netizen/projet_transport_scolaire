import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Bus, Users, UserCog, Shield, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const spaces = [
    {
      title: "Espace Tuteur",
      icon: Users,
      description: "Gérez les inscriptions et suivez vos enfants",
      link: "TuteurLogin",
      gradient: "from-amber-400 to-yellow-500"
    },
    {
      title: "Espace Responsable Bus",
      icon: UserCog,
      description: "Supervisez le bus et gérez les présences",
      link: "ResponsableLogin",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      title: "Espace Chauffeur",
      icon: Bus,
      description: "Consultez vos trajets et informations",
      link: "ChauffeurLogin",
      gradient: "from-yellow-400 to-amber-500"
    },
    {
      title: "Espace Administrateur",
      icon: Shield,
      description: "Gérez l'ensemble du système",
      link: "AdminLogin",
      gradient: "from-orange-400 to-amber-600"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-white to-yellow-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200 rounded-full opacity-20 blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-200 rounded-full opacity-20 blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl rotate-6 absolute inset-0 opacity-30" />
              <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center relative shadow-2xl">
                <Bus className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
            Mohammed <span className="text-amber-500">5</span> School Bus
          </h1>
          
          <p className="text-xl md:text-2xl text-amber-600 font-medium italic">
            Votre service est notre priorité
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-6">
            <GraduationCap className="w-6 h-6 text-amber-500" />
            <span className="text-gray-600">Transport Scolaire Sécurisé</span>
          </div>
        </motion.div>

        {/* Bus Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center mb-16"
        >
          <div className="relative">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694e9878090ae6571e82701e/b6246c87a_image.png" 
              alt="Bus Scolaire Mohammed 5"
              className="rounded-3xl shadow-2xl max-w-full md:max-w-2xl h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-amber-900/30 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-lg font-semibold">Transport Fiable & Sécurisé</p>
              <p className="text-sm opacity-90">Pour tous vos enfants</p>
            </div>
          </div>
        </motion.div>

        {/* Space Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {spaces.map((space, index) => (
            <motion.div
              key={space.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <Link to={createPageUrl(space.link)}>
                <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${space.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 bg-gradient-to-br ${space.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors shadow-lg`}>
                      <space.icon className="w-8 h-8 text-white group-hover:text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-white mb-2 transition-colors">
                      {space.title}
                    </h3>
                    
                    <p className="text-gray-500 group-hover:text-white/90 text-sm transition-colors">
                      {space.description}
                    </p>
                    
                    <div className="mt-6 flex items-center text-amber-500 group-hover:text-white font-medium transition-colors">
                      <span>Accéder</span>
                      <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16 text-gray-500"
        >
          <p>© 2025 Mohammed 5 School Bus - Tous droits réservés</p>
        </motion.div>
      </div>
    </div>
  );
}