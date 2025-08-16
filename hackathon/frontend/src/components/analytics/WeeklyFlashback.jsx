import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Confetti from 'react-confetti';

const WeeklyFlashback = ({ isOpen, onClose }) => {
  const { theme, currentTheme } = useTheme();
  const { user } = useAuth();
  const [flashbackData, setFlashbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchWeeklyFlashback();
    }
  }, [isOpen]);

  const fetchWeeklyFlashback = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/weekly-flashback', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFlashbackData(data.flashback);
          if (data.flashback.achievements.length > 0) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }
        }
      } else {
        console.error('Failed to fetch weekly flashback');
        setFlashbackData(null);
      }
    } catch (error) {
      console.error('Error fetching weekly flashback:', error);
      setFlashbackData(null);
    } finally {
      setLoading(false);
    }
  };

  const slides = flashbackData ? [
    {
      id: 'overview',
      title: '📊 Week Overview',
      component: <OverviewSlide data={flashbackData} />
    },
    {
      id: 'achievements',
      title: '🏆 Achievements',
      component: <AchievementsSlide achievements={flashbackData.achievements} />
    },
    {
      id: 'highlights',
      title: '✨ Week Highlights',
      component: <HighlightsSlide highlights={flashbackData.highlights} />
    },
    {
      id: 'improvements',
      title: '📈 Improvements',
      component: <ImprovementsSlide improvements={flashbackData.improvements} />
    },
    {
      id: 'goals',
      title: '🎯 Next Week Goals',
      component: <GoalsSlide goals={flashbackData.nextWeekGoals} quote={flashbackData.motivationalQuote} />
    }
  ] : [];

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className={currentTheme === 'neon' ? 'text-white' : 'text-gray-600'}>
            Generating your weekly flashback...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={150}
            gravity={0.3}
          />
        )}

        <motion.div
          className={`max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
            currentTheme === 'neon' 
              ? 'bg-gray-900 border border-cyan-500/30' 
              : 'bg-white border border-gray-200'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 border-b ${
            currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  📸 Weekly Flashback
                </h2>
                <p className={`mt-1 ${
                  currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {flashbackData?.weekRange} • {slides[currentSlide]?.title}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex space-x-1">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSlide
                          ? currentTheme === 'neon' ? 'bg-cyan-500' : 'bg-blue-500'
                          : currentTheme === 'neon' ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full transition-colors ${
                    currentTheme === 'neon' 
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Slide Content */}
          <div className="h-[calc(90vh-180px)] overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {slides[currentSlide]?.component}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className={`p-4 border-t flex items-center justify-between ${
            currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentSlide === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : currentTheme === 'neon'
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ← Previous
            </button>
            
            <span className={`text-sm ${
              currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {currentSlide + 1} of {slides.length}
            </span>
            
            <button
              onClick={currentSlide === slides.length - 1 ? onClose : nextSlide}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentTheme === 'neon'
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {currentSlide === slides.length - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Slide Components
const OverviewSlide = ({ data }) => {
  const { currentTheme } = useTheme();
  
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className={`text-2xl font-bold mb-2 ${
          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
        }`}>
          Amazing Week, {data.user?.name || 'Student'}!
        </h3>
        <p className={`text-lg ${
          currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Here's what you accomplished this week
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Tasks Completed', value: `${data.completedTasks}/${data.totalTasks}`, icon: '✅', color: 'green' },
          { label: 'Completion Rate', value: `${data.completionRate}%`, icon: '📊', color: 'blue' },
          { label: 'Study Hours', value: `${data.totalStudyTime}h`, icon: '⏰', color: 'purple' },
          { label: 'Study Streak', value: `${data.streakDays} days`, icon: '🔥', color: 'orange' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`text-center p-6 rounded-xl ${
              currentTheme === 'neon'
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className={`text-2xl font-bold mb-1 ${
              currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
            }`}>
              {stat.value}
            </div>
            <div className={`text-sm ${
              currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`mt-8 p-6 rounded-xl text-center ${
        currentTheme === 'neon'
          ? 'bg-cyan-500/20 border border-cyan-500/30'
          : 'bg-blue-50 border border-blue-200'
      }`}>
        <h4 className={`text-lg font-semibold mb-2 ${
          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
        }`}>
          🌟 Top Subject This Week
        </h4>
        <p className={`text-xl font-bold ${
          currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
        }`}>
          {data.topSubject}
        </p>
      </div>
    </div>
  );
};

const AchievementsSlide = ({ achievements }) => {
  const { currentTheme } = useTheme();
  
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className={`text-2xl font-bold mb-2 ${
          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
        }`}>
          Achievements Unlocked!
        </h3>
        <p className={`text-lg ${
          currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          You earned {achievements.length} new achievements this week
        </p>
      </div>

      <div className="space-y-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className={`p-6 rounded-xl border-2 ${
              achievement.rarity === 'rare' 
                ? 'border-purple-400 bg-purple-50' 
                : achievement.rarity === 'uncommon'
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-green-400 bg-green-50'
            } ${currentTheme === 'neon' ? 'bg-gray-800 border-gray-600' : ''}`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{achievement.icon}</div>
              <div className="flex-1">
                <h4 className={`text-lg font-bold ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  {achievement.title}
                </h4>
                <p className={`${
                  currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {achievement.description}
                </p>
              </div>
              <div className={`text-right ${
                currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
              }`}>
                <div className="font-bold">+{achievement.points}</div>
                <div className="text-sm">points</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const HighlightsSlide = ({ highlights }) => {
  const { currentTheme } = useTheme();
  
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✨</div>
        <h3 className={`text-2xl font-bold mb-2 ${
          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
        }`}>
          Week Highlights
        </h3>
        <p className={`text-lg ${
          currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Your most memorable moments this week
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {highlights.map((highlight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-xl ${
              currentTheme === 'neon'
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200 shadow-lg'
            }`}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{highlight.image}</div>
              <h4 className={`font-bold ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                {highlight.day}
              </h4>
              <h5 className={`text-lg font-semibold ${
                currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
              }`}>
                {highlight.event}
              </h5>
            </div>
            <p className={`text-center ${
              currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {highlight.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ImprovementsSlide = ({ improvements }) => {
  const { currentTheme } = useTheme();
  
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">📈</div>
        <h3 className={`text-2xl font-bold mb-2 ${
          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
        }`}>
          Your Growth This Week
        </h3>
        <p className={`text-lg ${
          currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          See how much you've improved!
        </p>
      </div>

      <div className="space-y-6">
        {improvements.map((improvement, index) => (
          <motion.div
            key={improvement.area}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className={`p-6 rounded-xl ${
              currentTheme === 'neon'
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-lg font-semibold ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                {improvement.area}
              </h4>
              <span className="text-green-500 font-bold text-lg">
                {improvement.improvement}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className={currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'}>
                    Before: {improvement.before}%
                  </span>
                  <span className={currentTheme === 'neon' ? 'text-white' : 'text-gray-900'}>
                    After: {improvement.after}%
                  </span>
                </div>
                <div className={`w-full bg-gray-200 rounded-full h-3 ${
                  currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <motion.div 
                    className="bg-green-500 h-3 rounded-full"
                    initial={{ width: `${improvement.before}%` }}
                    animate={{ width: `${improvement.after}%` }}
                    transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const GoalsSlide = ({ goals, quote }) => {
  const { currentTheme } = useTheme();
  
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className={`text-2xl font-bold mb-2 ${
          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
        }`}>
          Next Week Goals
        </h3>
        <p className={`text-lg ${
          currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Let's make next week even better!
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {goals.map((goal, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center space-x-3 p-4 rounded-lg ${
              currentTheme === 'neon'
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className={`w-6 h-6 rounded-full border-2 ${
              currentTheme === 'neon' ? 'border-cyan-500' : 'border-blue-500'
            }`} />
            <span className={`${
              currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
            }`}>
              {goal}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`p-6 rounded-xl text-center ${
          currentTheme === 'neon'
            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
            : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
        }`}
      >
        <div className="text-2xl mb-3">💭</div>
        <blockquote className={`text-lg italic mb-2 ${
          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
        }`}>
          "{quote.text}"
        </blockquote>
        <cite className={`text-sm ${
          currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          — {quote.author}
        </cite>
      </motion.div>
    </div>
  );
};

export default WeeklyFlashback;
