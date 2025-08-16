import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TypewriterText = ({ 
  texts, 
  speed = 100, 
  deleteSpeed = 50, 
  pauseTime = 2000,
  className = "",
  cursorBlink = true 
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!texts || texts.length === 0) return;

    const currentFullText = texts[currentTextIndex];
    
    if (isDeleting) {
      // Deleting text
      if (currentText === '') {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        return;
      }
      
      const timeout = setTimeout(() => {
        setCurrentText(currentText.slice(0, -1));
      }, deleteSpeed);
      
      return () => clearTimeout(timeout);
    } else {
      // Typing text
      if (currentText === currentFullText) {
        // Pause before deleting
        const timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseTime);
        
        return () => clearTimeout(timeout);
      }
      
      const timeout = setTimeout(() => {
        setCurrentText(currentFullText.slice(0, currentText.length + 1));
      }, speed);
      
      return () => clearTimeout(timeout);
    }
  }, [currentText, currentTextIndex, isDeleting, texts, speed, deleteSpeed, pauseTime]);

  // Cursor blink effect
  useEffect(() => {
    if (!cursorBlink) return;
    
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => clearInterval(interval);
  }, [cursorBlink]);

  return (
    <div className={`inline-block ${className}`}>
      <span className="text-2xl md:text-3xl text-white font-medium">
        {currentText}
      </span>
      <AnimatePresence>
        {showCursor && (
          <motion.span
            key="cursor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-block w-0.5 h-8 bg-white ml-1 animate-pulse"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TypewriterText; 