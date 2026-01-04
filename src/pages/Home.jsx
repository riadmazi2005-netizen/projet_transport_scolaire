import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { contactAPI } from '../services/apiService';
import { Bus, Users, UserCog, Shield, GraduationCap, Phone, Mail, MapPin, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AnimatedBusHero from '../components/AnimatedBusHero';

function ContactForm() {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await contactAPI.sendMessage(formData);
      if (response.success) {
        setSuccess(true);
        setFormData({ nom: '', email: '', message: '' });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(response.message || 'Erreur lors de l\'envoi du message');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="nom" className="text-gray-700 font-medium mb-2 block">
            Votre nom
          </Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            placeholder="Votre nom"
            className="h-12 rounded-xl border-gray-300"
            required
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">
            Votre email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Votre email"
            className="h-12 rounded-xl border-gray-300"
            required
          />
        </div>

        <div>
          <Label htmlFor="message" className="text-gray-700 font-medium mb-2 block">
            Votre message
          </Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Votre message"
            className="min-h-[120px] rounded-xl border-gray-300"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Envoyer le message
            </>
          )}
        </Button>
      </form>
    </>
  );
}

export default function Home() {
  // Le son du klaxon est maintenant géré par le composant AnimatedBusHero

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

        {/* Animated Bus Hero Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full mb-16 -mx-4 md:-mx-8 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div 
            className="relative w-full"
            style={{ height: '70vh', minHeight: '500px' }}
          >
            {/* <AnimatedBusHero /> */}
            <div className="w-full h-full bg-gradient-to-b from-blue-100 via-orange-50 to-amber-50 flex items-center justify-center">
              <p className="text-2xl font-bold text-gray-800">Bus Image</p>
            </div>
            {/* Overlay avec texte */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/60 via-amber-900/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-12 left-8 md:left-12 text-white pointer-events-none">
              <p className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg">Transport Fiable & Sécurisé</p>
              <p className="text-lg md:text-xl opacity-90 drop-shadow-md">Pour tous vos enfants</p>
              <p className="text-sm md:text-base mt-2 opacity-75 italic">Cliquez sur le bus pour entendre le klaxon</p>
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

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 mb-16"
          id="contact"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
              {/* Left Panel - Dark Yellow/Orange */}
              <div className="bg-gradient-to-br from-amber-700 to-orange-700 p-8 md:p-12 flex flex-col justify-center text-white">
                <h2 className="text-4xl font-bold mb-4">Contactez-nous</h2>
                <p className="text-amber-100 text-lg mb-8">
                  Notre équipe est disponible pour répondre à toutes vos questions concernant le service de transport scolaire.
                </p>

                <div className="space-y-6">
                  {/* Phone 1 */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-amber-100 text-sm">Téléphone</p>
                      <p className="text-white font-semibold">+212 714390289</p>
                    </div>
                  </div>

                  {/* Phone 2 */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-amber-100 text-sm">Téléphone</p>
                      <p className="text-white font-semibold">+212 669-266176</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-amber-100 text-sm">Email</p>
                      <p className="text-white font-semibold">mohammed5@gmail.com</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-amber-100 text-sm">Adresse</p>
                      <p className="text-white font-semibold">Rabat, Maroc</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - White Form */}
              <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Envoyez-nous un message
                </h3>
                <ContactForm />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center mt-8 text-gray-500"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Bus className="w-5 h-5 text-amber-500" />
            <span className="font-semibold">Mohammed 5 School Bus</span>
          </div>
          <p>© 2024 Mohammed 5 School Bus. Tous droits réservés.</p>
        </motion.div>
      </div>
    </div>
  );
}