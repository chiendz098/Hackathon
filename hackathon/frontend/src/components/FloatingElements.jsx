import React from 'react';
import { motion } from 'framer-motion';

const FloatingElements = () => {
  const floatingShapes = [
    {
      type: 'circle',
      size: 'w-4 h-4',
      color: 'from-blue-400 to-cyan-400',
      position: 'top-20 left-10',
      animation: {
        y: [0, -30, 0],
        x: [0, 20, 0],
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.8, 0.3],
      },
      duration: 8,
      delay: 0,
    },
    {
      type: 'square',
      size: 'w-6 h-6',
      color: 'from-purple-400 to-pink-400',
      position: 'top-40 right-20',
      animation: {
        y: [0, 25, 0],
        x: [0, -15, 0],
        rotate: [0, 180, 360],
        scale: [1, 0.8, 1],
      },
      duration: 10,
      delay: 1,
    },
    {
      type: 'triangle',
      size: 'w-5 h-5',
      color: 'from-green-400 to-emerald-400',
      position: 'bottom-40 left-1/4',
      animation: {
        y: [0, -40, 0],
        x: [0, 30, 0],
        rotate: [0, 360, 0],
        scale: [1, 1.3, 1],
      },
      duration: 12,
      delay: 2,
    },
    {
      type: 'diamond',
      size: 'w-3 h-3',
      color: 'from-yellow-400 to-orange-400',
      position: 'top-1/2 right-1/3',
      animation: {
        y: [0, -20, 0],
        x: [0, -25, 0],
        rotate: [0, 90, 180, 270, 360],
        scale: [1, 0.7, 1],
      },
      duration: 15,
      delay: 3,
    },
    {
      type: 'star',
      size: 'w-4 h-4',
      color: 'from-pink-400 to-red-400',
      position: 'bottom-20 right-1/4',
      animation: {
        y: [0, 35, 0],
        x: [0, 40, 0],
        rotate: [0, -180, -360],
        scale: [1, 1.1, 1],
      },
      duration: 14,
      delay: 4,
    },
  ];

  const renderShape = (shape) => {
    const baseClasses = `absolute ${shape.size} bg-gradient-to-br ${shape.color} rounded-full blur-sm`;
    
    switch (shape.type) {
      case 'square':
        return <div className={`${baseClasses} rounded-lg`} />;
      case 'triangle':
        return (
          <div className={`${baseClasses} rounded-none`} style={{
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
          }} />
        );
      case 'diamond':
        return (
          <div className={`${baseClasses} rounded-none`} style={{
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
          }} />
        );
      case 'star':
        return (
          <div className={`${baseClasses} rounded-none`} style={{
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
          }} />
        );
      default:
        return <div className={baseClasses} />;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
      {floatingShapes.map((shape, index) => (
        <motion.div
          key={index}
          className={`${shape.position}`}
          animate={shape.animation}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay,
          }}
        >
          {renderShape(shape)}
        </motion.div>
      ))}

      {/* Additional floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 60 - 30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 15 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 8,
          }}
        />
      ))}

      {/* Floating text elements */}
      <motion.div
        className="absolute top-1/4 left-1/6 text-white/20 text-xs font-mono"
        animate={{
          y: [0, -10, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        &lt;code&gt;
      </motion.div>

      <motion.div
        className="absolute bottom-1/4 right-1/6 text-white/20 text-xs font-mono"
        animate={{
          y: [0, 15, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        &lt;/div&gt;
      </motion.div>

      {/* Animated lines */}
      <motion.div
        className="absolute top-1/3 left-1/2 w-px h-20 bg-gradient-to-b from-transparent via-blue-400/50 to-transparent"
        animate={{
          height: [20, 40, 20],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 right-1/2 w-px h-16 bg-gradient-to-b from-transparent via-purple-400/50 to-transparent"
        animate={{
          height: [16, 32, 16],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </div>
  );
};

export default FloatingElements; 