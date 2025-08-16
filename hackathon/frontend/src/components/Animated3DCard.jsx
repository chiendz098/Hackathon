import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Animated3DCard = ({ 
  children, 
  className = "", 
  intensity = 20,
  scale = 1.05,
  shadow = true,
  border = true,
  ...props 
}) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 30 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [-intensity, intensity], [intensity, -intensity]);
  const rotateY = useTransform(springX, [-intensity, intensity], [-intensity, intensity]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      whileHover={{ scale }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...props}
    >
      {/* Main card content */}
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        transition={{ duration: 0.1 }}
      >
        {children}
      </motion.div>

      {/* Enhanced shadow effect */}
      {shadow && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black/20 to-transparent opacity-0"
          style={{
            transform: "translateZ(-20px)",
          }}
          animate={{
            opacity: isHovered ? 0.3 : 0,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Glowing border effect */}
      {border && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 opacity-0"
          style={{
            transform: "translateZ(-10px)",
          }}
          animate={{
            opacity: isHovered ? 0.6 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Light reflection effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0"
        style={{
          transform: "translateZ(10px)",
        }}
        animate={{
          opacity: isHovered ? 0.3 : 0,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default Animated3DCard; 