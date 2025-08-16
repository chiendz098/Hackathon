import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedPet = ({ 
  pet, 
  currentAnimation = 'idle', 
  size = 'medium',
  onClick,
  className = '',
  showEffects = true 
}) => {
  const [currentGif, setCurrentGif] = useState('');
  const [effects, setEffects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Size configurations
  const sizeConfig = {
    small: { width: 80, height: 80 },
    medium: { width: 120, height: 120 },
    large: { width: 200, height: 200 },
    xlarge: { width: 300, height: 300 }
  };

  const { width, height } = sizeConfig[size] || sizeConfig.medium;

  useEffect(() => {
    if (pet && pet.animations) {
      const animation = pet.animations[currentAnimation];
      if (animation) {
        setCurrentGif(animation.gif);
        setEffects(animation.effects || []);
        setIsLoading(false);
      }
    }
  }, [pet, currentAnimation]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    // Fallback to emoji if GIF fails to load
    setCurrentGif('');
    setIsLoading(false);
  };

  const getPetEmoji = (species) => {
    const emojiMap = {
      cat: '🐱',
      dog: '🐕',
      dragon: '🐉',
      unicorn: '🦄',
      phoenix: '🦅',
      butterfly: '🦋',
      penguin: '🐧',
      fox: '🦊',
      lion: '🦁',
      panda: '🐼'
    };
    return emojiMap[species] || '🐾';
  };

  const renderEffects = () => {
    if (!showEffects || effects.length === 0) return null;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {effects.map((effect, index) => (
          <motion.div
            key={`${effect}-${index}`}
            className={`absolute ${getEffectClass(effect)}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {getEffectIcon(effect)}
          </motion.div>
        ))}
      </div>
    );
  };

  const getEffectClass = (effect) => {
    const effectClasses = {
      sparkles: 'text-yellow-400 text-2xl',
      hearts: 'text-red-400 text-xl',
      tears: 'text-blue-400 text-lg',
      clouds: 'text-gray-400 text-xl',
      zzz: 'text-gray-500 text-lg',
      nom: 'text-orange-400 text-lg',
      footsteps: 'text-gray-600 text-sm',
      speed: 'text-blue-500 text-lg',
      wind: 'text-cyan-400 text-lg',
      bounce: 'text-purple-400 text-lg',
      stars: 'text-yellow-300 text-lg',
      music: 'text-pink-400 text-lg',
      confetti: 'text-rainbow text-lg',
      fire: 'text-red-500 text-xl',
      lightning: 'text-yellow-300 text-xl',
      heal: 'text-green-400 text-lg',
      light: 'text-yellow-200 text-lg',
      evolution: 'text-purple-500 text-xl',
      rainbow: 'text-rainbow text-xl',
      gentle_breathing: 'text-blue-300 text-sm',
      purring: 'text-purple-300 text-sm',
      tail_wag: 'text-orange-300 text-sm',
      droopy_ears: 'text-gray-400 text-sm',
      bright_eyes: 'text-blue-400 text-sm',
      excited_jump: 'text-yellow-400 text-lg',
      happy_bark: 'text-orange-400 text-sm',
      whimper: 'text-gray-500 text-sm',
      nom_nom: 'text-orange-500 text-lg',
      happy_face: 'text-yellow-400 text-lg',
      graceful_walk: 'text-blue-300 text-sm',
      bouncy_walk: 'text-orange-300 text-sm',
      excited_tail: 'text-orange-400 text-sm',
      fast_run: 'text-blue-500 text-lg',
      wind_effect: 'text-cyan-300 text-sm',
      stealth_mode: 'text-gray-600 text-sm',
      focus_eyes: 'text-yellow-400 text-sm',
      majestic_pose: 'text-purple-400 text-lg',
      mane_flow: 'text-orange-400 text-sm',
      gentle_roar: 'text-red-400 text-lg',
      happy_mane: 'text-orange-300 text-sm',
      droopy_mane: 'text-gray-400 text-sm',
      soft_whimper: 'text-gray-500 text-sm',
      mighty_roar: 'text-red-500 text-xl',
      mane_swirl: 'text-orange-400 text-lg',
      powerful_run: 'text-red-400 text-lg',
      bamboo_chew: 'text-green-400 text-sm',
      happy_roll: 'text-black text-lg',
      bamboo_dance: 'text-green-300 text-sm',
      no_bamboo: 'text-gray-400 text-sm',
      bamboo_nom: 'text-green-500 text-lg',
      bamboo_dreams: 'text-green-300 text-sm',
      eternal_flame: 'text-red-500 text-xl',
      majestic_glow: 'text-yellow-400 text-lg',
      fire_dance: 'text-red-400 text-lg',
      golden_aura: 'text-yellow-300 text-lg',
      dimmed_flame: 'text-gray-400 text-lg',
      ash_trail: 'text-gray-500 text-sm',
      majestic_flight: 'text-red-400 text-lg',
      fire_trail: 'text-red-500 text-lg',
      rebirth_flame: 'text-red-600 text-2xl',
      golden_explosion: 'text-yellow-400 text-2xl',
      gentle_flutter: 'text-purple-300 text-sm',
      color_shift: 'text-rainbow text-sm',
      excited_flutter: 'text-purple-400 text-lg',
      pollen_trail: 'text-yellow-300 text-sm',
      slow_flutter: 'text-gray-400 text-sm',
      faded_colors: 'text-gray-500 text-sm',
      graceful_flight: 'text-purple-400 text-lg',
      pollen_dust: 'text-yellow-300 text-sm',
      gentle_landing: 'text-purple-300 text-sm',
      wing_fold: 'text-gray-400 text-sm',
      gentle_waddle: 'text-gray-300 text-sm',
      curious_look: 'text-blue-400 text-sm',
      excited_waddle: 'text-orange-300 text-sm',
      happy_sound: 'text-blue-400 text-sm',
      droopy_head: 'text-gray-400 text-sm',
      slow_waddle: 'text-gray-500 text-sm',
      smooth_swim: 'text-blue-400 text-lg',
      water_splash: 'text-blue-300 text-sm',
      ice_slide: 'text-cyan-400 text-lg',
      snow_trail: 'text-white text-sm',
      alert_ears: 'text-orange-400 text-sm',
      tail_swish: 'text-orange-300 text-sm',
      playful_bounce: 'text-yellow-400 text-lg',
      happy_tail: 'text-orange-400 text-sm',
      sad_whimper: 'text-gray-500 text-sm'
    };
    return effectClasses[effect] || 'text-gray-400 text-sm';
  };

  const getEffectIcon = (effect) => {
    const effectIcons = {
      sparkles: '✨',
      hearts: '❤️',
      tears: '💧',
      clouds: '☁️',
      zzz: '💤',
      nom: '🍖',
      footsteps: '👣',
      speed: '💨',
      wind: '🌪️',
      bounce: '⚡',
      stars: '⭐',
      music: '🎵',
      confetti: '🎉',
      fire: '🔥',
      lightning: '⚡',
      heal: '💚',
      light: '💡',
      evolution: '🌟',
      rainbow: '🌈',
      gentle_breathing: '💨',
      purring: '😸',
      tail_wag: '🐕',
      droopy_ears: '😔',
      bright_eyes: '👀',
      excited_jump: '🦘',
      happy_bark: '🐕',
      whimper: '😢',
      nom_nom: '🍖',
      happy_face: '😊',
      graceful_walk: '🚶',
      bouncy_walk: '🦘',
      excited_tail: '🐕',
      fast_run: '🏃',
      wind_effect: '💨',
      stealth_mode: '👁️',
      focus_eyes: '👀',
      majestic_pose: '👑',
      mane_flow: '🦁',
      gentle_roar: '🦁',
      happy_mane: '🦁',
      droopy_mane: '🦁',
      soft_whimper: '🦁',
      mighty_roar: '🦁',
      mane_swirl: '🦁',
      powerful_run: '🦁',
      bamboo_chew: '🎋',
      happy_roll: '🐼',
      bamboo_dance: '🎋',
      no_bamboo: '😔',
      bamboo_nom: '🎋',
      bamboo_dreams: '🎋',
      eternal_flame: '🔥',
      majestic_glow: '✨',
      fire_dance: '🔥',
      golden_aura: '✨',
      dimmed_flame: '🔥',
      ash_trail: '💨',
      majestic_flight: '🦅',
      fire_trail: '🔥',
      rebirth_flame: '🔥',
      golden_explosion: '✨',
      gentle_flutter: '🦋',
      color_shift: '🌈',
      excited_flutter: '🦋',
      pollen_trail: '🌸',
      slow_flutter: '🦋',
      faded_colors: '🎨',
      graceful_flight: '🦋',
      pollen_dust: '🌸',
      gentle_landing: '🦋',
      wing_fold: '🦋',
      gentle_waddle: '🐧',
      curious_look: '👀',
      excited_waddle: '🐧',
      happy_sound: '🔊',
      droopy_head: '😔',
      slow_waddle: '🐧',
      smooth_swim: '🏊',
      water_splash: '💧',
      ice_slide: '⛸️',
      snow_trail: '❄️',
      alert_ears: '👂',
      tail_swish: '🐕',
      playful_bounce: '🦘',
      happy_tail: '🐕',
      sad_whimper: '😢',
      gentle_sit: '🐱'
    };
    return effectIcons[effect] || '✨';
  };

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width, height }}
      onClick={onClick}
      whileHover={{ scale: onClick ? 1.05 : 1 }}
      whileTap={{ scale: onClick ? 0.95 : 1 }}
    >
      {/* Loading state */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-4xl animate-pulse">
              {getPetEmoji(pet?.species)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet GIF */}
      {currentGif && (
        <motion.img
          src={currentGif}
          alt={pet?.name || 'Pet'}
          className="w-full h-full object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Fallback emoji if no GIF */}
      {!currentGif && !isLoading && (
        <motion.div
          className="w-full h-full flex items-center justify-center text-6xl"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {getPetEmoji(pet?.species)}
        </motion.div>
      )}

      {/* Effects overlay */}
      {renderEffects()}

      {/* Pet name */}
      {pet?.name && (
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded-full shadow-sm">
            {pet.name}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimatedPet; 