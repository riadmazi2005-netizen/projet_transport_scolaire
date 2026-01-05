import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBusHero({ onBusClick }) {
  const audioRef = useRef(null);
  const [isClicked, setIsClicked] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Précharger l'audio
    if (!audioRef.current) {
      audioRef.current = new Audio('/school_bus_horn_short.mp3');
      audioRef.current.volume = 0.4;
      audioRef.current.preload = 'auto';
    }
  }, []);

  const handleBusClick = () => {
    // Effet visuel
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);

    // Son de klaxon
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.log('Erreur de lecture audio:', error);
      });
    }

    // Callback parent si nécessaire
    if (onBusClick) {
      onBusClick();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-blue-100 via-orange-50 to-amber-50">
      {/* Ciel avec gradient sunrise */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-200 via-yellow-100 to-blue-200 opacity-60" />
      
      {/* Nuages animés */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute"
          initial={{ x: -200, y: 20 + i * 40 }}
          animate={{
            x: ['-200px', 'calc(100% + 200px)'],
          }}
          transition={{
            duration: 30 + i * 10,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 5,
          }}
        >
          <div className="w-40 h-20 bg-white rounded-full shadow-md opacity-70" style={{ transform: `scale(${1 + i * 0.1})` }} />
        </motion.div>
      ))}

      {/* Oiseaux animés */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`bird-${i}`}
          className="absolute"
          initial={{ x: -100, y: 50 + i * 30 }}
          animate={{
            x: ['-100px', 'calc(100% + 100px)'],
            y: [50 + i * 30, 60 + i * 30, 50 + i * 30],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 3,
          }}
        >
          <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700">
            <path d="M1 7.5C1 7.5 4 1 10 1C16 1 19 7.5 19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 7.5C1 7.5 4 14 10 14C16 14 19 7.5 19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      ))}

      {/* Route avec lignes animées */}
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-b from-gray-200 to-gray-300">
        {/* Lignes de route animées */}
        <div className="absolute top-1/2 w-full h-1">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`road-line-${i}`}
              className="absolute h-full bg-yellow-400"
              style={{
                width: '100px',
                left: `${i * 200}px`,
              }}
              animate={{
                x: [0, -400],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
                delay: (i * 200) / 200,
              }}
            />
          ))}
        </div>
      </div>

      {/* Photo du bus avec animation */}
      <motion.div
        className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 cursor-pointer"
        style={{
          width: '500px',
          height: '300px',
          zIndex: 10,
        }}
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          y: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleBusClick}
      >
        <motion.div
          className="relative w-full h-full"
          animate={isClicked ? { 
            scale: [1, 1.05, 1],
            filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)']
          } : {}}
          transition={{ duration: 0.3 }}
          onLoad={() => setIsLoaded(true)}
        >
          <img
            src="/bus-main.jpg"
            alt="Bus scolaire"
            className={`w-full h-full object-contain transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsLoaded(true)}
            style={{
              filter: isClicked ? 'brightness(1.2)' : 'none',
            }}
          />
          
          {/* Effet de brillance sur les fenêtres (overlay subtil) */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: [
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Particules de poussière légères derrière le bus */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute bottom-1/4"
          style={{
            left: `calc(50% - ${200 + i * 30}px)`,
            width: '4px',
            height: '4px',
            backgroundColor: 'rgba(200, 200, 200, 0.4)',
            borderRadius: '50%',
          }}
          animate={{
            y: [0, -30 - i * 5],
            x: [0, 10 + i * 2],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + i * 0.2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.15,
          }}
        />
      ))}

      {/* Texte en overlay */}
      <div className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-white text-center z-20 pointer-events-none">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg"
        >
          Transport Fiable & Sécurisé
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-xl md:text-2xl opacity-90 drop-shadow-md"
        >
          Pour tous vos enfants
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-sm md:text-base mt-2 opacity-75 italic drop-shadow-md"
        >
          Cliquez sur le bus pour entendre le klaxon
        </motion.p>
      </div>
    </div>
  );
}
