import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBusHero({ onBusClick }) {
  const audioRef = useRef(null);
  const [isClicked, setIsClicked] = useState(false);

  const handleBusClick = () => {
    // Effet visuel
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);

    // Son de klaxon
    if (!audioRef.current) {
      audioRef.current = new Audio('/school_bus_horn_short.mp3');
      audioRef.current.volume = 0.4; // Volume doux
    }
    
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(error => {
      console.log('Erreur de lecture audio:', error);
    });

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
          <svg width="120" height="60" viewBox="0 0 120 60" className="opacity-70">
            <ellipse cx="40" cy="30" rx="35" ry="25" fill="white" opacity="0.8" />
            <ellipse cx="60" cy="25" rx="30" ry="20" fill="white" opacity="0.8" />
            <ellipse cx="80" cy="30" rx="35" ry="25" fill="white" opacity="0.8" />
          </svg>
        </motion.div>
      ))}

      {/* Oiseaux volants */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`bird-${i}`}
          className="absolute"
          initial={{ x: -50, y: 50 + i * 30 }}
          animate={{
            x: ['-50px', 'calc(100% + 50px)'],
            y: [50 + i * 30, 40 + i * 30, 60 + i * 30, 50 + i * 30],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 3,
          }}
        >
          <svg width="40" height="20" viewBox="0 0 40 20" className="opacity-60">
            <path
              d="M10 10 Q20 5 30 10 Q20 15 10 10"
              fill="none"
              stroke="#4A5568"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      ))}

      {/* Route */}
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

      {/* Bus scolaire animé */}
      <motion.div
        className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 cursor-pointer"
        style={{
          width: '400px',
          height: '200px',
        }}
        animate={{
          x: ['-50%', '-50%'],
          y: [0, -5, 0],
        }}
        transition={{
          y: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleBusClick}
      >
        <motion.div
          animate={isClicked ? { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <svg
            viewBox="0 0 400 200"
            className="w-full h-full"
            style={{ filter: isClicked ? 'brightness(1.2)' : 'none' }}
          >
            {/* Corps du bus */}
            <rect x="50" y="60" width="300" height="100" rx="10" fill="#FFD700" stroke="#FFA500" strokeWidth="3" />
            
            {/* Fenêtres */}
            {[...Array(6)].map((_, i) => (
              <rect
                key={`window-${i}`}
                x={70 + i * 45}
                y="75"
                width="30"
                height="35"
                rx="3"
                fill="#87CEEB"
                opacity="0.6"
              />
            ))}
            
            {/* Porte */}
            <rect x="60" y="75" width="25" height="50" rx="2" fill="#FF8C00" />
            <line x1="72" y1="75" x2="72" y2="125" stroke="#333" strokeWidth="2" />
            
            {/* Pare-brise */}
            <polygon points="50,60 50,80 70,75 70,65" fill="#E6F3FF" opacity="0.7" />
            <line x1="60" y1="70" x2="50" y2="70" stroke="#333" strokeWidth="2" />
            
            {/* Grille avant */}
            <rect x="45" y="85" width="8" height="50" fill="#333" />
            <line x1="49" y1="85" x2="49" y2="135" stroke="#666" strokeWidth="1" />
            <line x1="45" y1="110" x2="53" y2="110" stroke="#666" strokeWidth="1" />
            
            {/* Phares */}
            <circle cx="45" cy="95" r="4" fill="#FFD700" />
            <circle cx="45" cy="125" r="4" fill="#FF6B6B" />
            
            {/* Panneau de destination */}
            <rect x="80" y="40" width="240" height="25" rx="3" fill="#000" />
            <text x="200" y="58" textAnchor="middle" fill="#FFD700" fontSize="16" fontWeight="bold" fontFamily="Arial">
              MOHAMMED 5 SCHOOL BUS
            </text>
            
            {/* Toit */}
            <rect x="55" y="55" width="290" height="10" rx="5" fill="#FFA500" />
            
            {/* Réflecteurs latéraux */}
            <circle cx="350" cy="75" r="5" fill="#FF6B6B" />
            <circle cx="350" cy="135" r="5" fill="#FF6B6B" />
            
            {/* Roues avec rotation */}
            <g>
              {/* Roue arrière */}
              <circle cx="110" cy="150" r="25" fill="#333" />
              <circle cx="110" cy="150" r="18" fill="#666" />
              <circle cx="110" cy="150" r="12" fill="#888" />
              {[...Array(5)].map((_, i) => (
                <line
                  key={`spoke-${i}`}
                  x1="110"
                  y1="150"
                  x2="110"
                  y2="135"
                  stroke="#AAA"
                  strokeWidth="2"
                  transform={`rotate(${i * 72} 110 150)`}
                />
              ))}
              
              {/* Roue avant */}
              <circle cx="290" cy="150" r="25" fill="#333" />
              <circle cx="290" cy="150" r="18" fill="#666" />
              <circle cx="290" cy="150" r="12" fill="#888" />
              {[...Array(5)].map((_, i) => (
                <line
                  key={`spoke-front-${i}`}
                  x1="290"
                  y1="150"
                  x2="290"
                  y2="135"
                  stroke="#AAA"
                  strokeWidth="2"
                  transform={`rotate(${i * 72} 290 150)`}
                />
              ))}
            </g>
          </svg>
        </motion.div>
      </motion.div>

      {/* Particules de poussière derrière le bus */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute"
          style={{
            bottom: '28%',
            left: `calc(50% - ${150 + i * 10}px)`,
          }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 2],
            y: [0, -20 - i * 5, -40 - i * 10],
            x: [-20 - i * 5, -40 - i * 10, -60 - i * 15],
          }}
          transition={{
            duration: 1.5 + i * 0.2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.1,
          }}
        >
          <div
            className="w-2 h-2 bg-gray-400 rounded-full"
            style={{ opacity: 0.5 }}
          />
        </motion.div>
      ))}

      {/* Réflexions de lumière sur les fenêtres */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`reflection-${i}`}
          className="absolute"
          style={{
            bottom: '42%',
            left: `calc(50% - ${120 - i * 45}px)`,
            width: '25px',
            height: '30px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
            borderRadius: '3px',
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            x: [0, 5, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
}

