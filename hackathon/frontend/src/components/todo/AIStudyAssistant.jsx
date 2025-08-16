import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Mic,
  MicOff,
  Zap,
  Target,
  Clock,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Star,
  Coffee,
  Music,
  Moon,
  Sun,
  Timer,
  BarChart3,
  Settings,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Sparkles,
  Rocket,
  Trophy,
  Flame,
  Heart,
  Users,
  MessageCircle,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  RotateCcw,
  Save,
  Share2,
  Download,
  Upload,
  Lock,
  Unlock
} from 'lucide-react';

const AIStudyAssistant = ({ todos, onUpdate, onAddTodo }) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [showAssistant, setShowAssistant] = useState(false);
  const [currentMode, setCurrentMode] = useState('study');
  const [studySession, setStudySession] = useState({
    isActive: false,
    duration: 25,
    breakTime: 5,
    sessions: 4,
    currentSession: 0,
    timeRemaining: 25 * 60,
    isBreak: false
  });
  const [recommendations, setRecommendations] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [focusMode, setFocusMode] = useState('normal');
  const [ambientSound, setAmbientSound] = useState('none');
  const [showSettings, setShowSettings] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [productivityScore, setProductivityScore] = useState(85);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Voice commands mapping
  const voiceCommands = {
    'start study': () => startStudySession(),
    'pause study': () => pauseStudySession(),
    'stop study': () => stopStudySession(),
    'take break': () => startBreak(),
    'show analytics': () => setShowAnalytics(true),
    'hide analytics': () => setShowAnalytics(false),
    'deep focus': () => setFocusMode('deep'),
    'flow mode': () => setFocusMode('flow'),
    'sprint mode': () => setFocusMode('sprint'),
    'normal mode': () => setFocusMode('normal'),
    'play music': () => setAmbientSound('music'),
    'play rain': () => setAmbientSound('rain'),
    'play cafe': () => setAmbientSound('cafe'),
    'stop sound': () => setAmbientSound('none'),
    'create task': () => handleCreateTask(),
    'show recommendations': () => generateRecommendations(),
    'hide assistant': () => setShowAssistant(false)
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'vi-VN';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript.toLowerCase();
          }
        }
        if (finalTranscript) {
          setVoiceCommand(finalTranscript);
          processVoiceCommand(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const processVoiceCommand = (command) => {
    for (const [key, action] of Object.entries(voiceCommands)) {
      if (command.includes(key)) {
        action();
        break;
      }
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const startStudySession = () => {
    setStudySession(prev => ({
      ...prev,
      isActive: true,
      timeRemaining: prev.duration * 60,
      isBreak: false
    }));
  };

  const pauseStudySession = () => {
    setStudySession(prev => ({
      ...prev,
      isActive: false
    }));
  };

  const stopStudySession = () => {
    setStudySession(prev => ({
      ...prev,
      isActive: false,
      timeRemaining: prev.duration * 60,
      currentSession: 0
    }));
  };

  const startBreak = () => {
    setStudySession(prev => ({
      ...prev,
      isBreak: true,
      timeRemaining: prev.breakTime * 60
    }));
  };

  const handleCreateTask = () => {
    // Trigger task creation
    console.log('Creating new task via voice command');
  };

  const generateRecommendations = () => {
    const newRecommendations = [
      {
        id: 1,
        type: 'study',
        title: 'Optimize Study Schedule',
        description: 'Based on your productivity patterns, study between 9-11 AM for best results',
        icon: '📅',
        action: 'Apply Schedule'
      },
      {
        id: 2,
        type: 'break',
        title: 'Take a Short Break',
        description: 'You\'ve been studying for 45 minutes. Time for a 5-minute break!',
        icon: '☕',
        action: 'Start Break'
      },
      {
        id: 3,
        type: 'focus',
        title: 'Switch to Deep Focus Mode',
        description: 'Your environment is perfect for deep work. Enable focus mode?',
        icon: '🧠',
        action: 'Enable'
      },
      {
        id: 4,
        type: 'review',
        title: 'Review Previous Material',
        description: 'It\'s been 24 hours since you studied this topic. Time for a review!',
        icon: '📚',
        action: 'Start Review'
      }
    ];
    setRecommendations(newRecommendations);
  };

  const getProductivityInsights = () => {
    return [
      {
        title: 'Peak Performance Time',
        value: '9:00 AM - 11:00 AM',
        icon: '🌅',
        color: 'text-yellow-600'
      },
      {
        title: 'Focus Duration',
        value: '45 minutes average',
        icon: '⏱️',
        color: 'text-blue-600'
      },
      {
        title: 'Break Efficiency',
        value: '92% optimal',
        icon: '☕',
        color: 'text-green-600'
      },
      {
        title: 'Study Streak',
        value: '7 days',
        icon: '🔥',
        color: 'text-red-600'
      }
    ];
  };

  const getAmbientSounds = () => {
    return [
      { id: 'none', name: 'No Sound', icon: '🔇' },
      { id: 'rain', name: 'Rain Sounds', icon: '🌧️' },
      { id: 'cafe', name: 'Cafe Ambience', icon: '☕' },
      { id: 'forest', name: 'Forest Sounds', icon: '🌲' },
      { id: 'waves', name: 'Ocean Waves', icon: '🌊' },
      { id: 'white-noise', name: 'White Noise', icon: '🔊' }
    ];
  };

  const getFocusModes = () => {
    return [
      { id: 'normal', name: 'Normal Focus', icon: '👁️', description: 'Standard study mode' },
      { id: 'deep', name: 'Deep Focus', icon: '🧠', description: 'Intensive concentration mode' },
      { id: 'flow', name: 'Flow State', icon: '🌊', description: 'Optimal performance mode' },
      { id: 'sprint', name: 'Sprint Mode', icon: '⚡', description: 'High-intensity short bursts' }
    ];
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main Assistant Button */}
      <motion.button
        onClick={() => setShowAssistant(!showAssistant)}
        className={`relative p-4 rounded-full shadow-lg transition-all duration-300 ${
          showAssistant 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-xl'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Brain className="w-6 h-6" />
        {studySession.isActive && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {showAssistant && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Brain className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold">AI Study Assistant</h3>
                    <p className="text-sm opacity-90">Your personal study companion</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Voice Command Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <Mic className="w-4 h-4 mr-2" />
                    Voice Commands
                  </h4>
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                
                {isListening && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Listening... Say something like "start study" or "take break"
                  </div>
                )}
                
                {voiceCommand && (
                  <div className="text-sm bg-white dark:bg-gray-700 p-2 rounded border">
                    <strong>Command:</strong> {voiceCommand}
                  </div>
                )}

                <button
                  onClick={() => setShowVoiceCommands(!showVoiceCommands)}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                >
                  {showVoiceCommands ? 'Hide' : 'Show'} Available Commands
                </button>

                <AnimatePresence>
                  {showVoiceCommands && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-1"
                    >
                      {Object.keys(voiceCommands).map((command) => (
                        <div key={command} className="text-xs text-gray-600 dark:text-gray-400">
                          • "{command}"
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Study Session Timer */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <Timer className="w-4 h-4 mr-2" />
                    Study Session
                  </h4>
                  <div className="flex items-center space-x-2">
                    {studySession.isActive ? (
                      <button
                        onClick={pauseStudySession}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={startStudySession}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={stopStudySession}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    {Math.floor(studySession.timeRemaining / 60)}:{(studySession.timeRemaining % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {studySession.isBreak ? 'Break Time' : `Session ${studySession.currentSession + 1}/${studySession.sessions}`}
                  </div>
                </div>
              </div>

              {/* Focus Mode */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  Focus Mode
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {getFocusModes().map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setFocusMode(mode.id)}
                      className={`p-2 rounded-lg text-sm transition-colors ${
                        focusMode === mode.id
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{mode.icon}</span>
                        <span>{mode.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambient Sounds */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <Music className="w-4 h-4 mr-2" />
                  Ambient Sounds
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {getAmbientSounds().map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => setAmbientSound(sound.id)}
                      className={`p-2 rounded-lg text-sm transition-colors ${
                        ambientSound === sound.id
                          ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg">{sound.icon}</div>
                        <div className="text-xs">{sound.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Actions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={generateRecommendations}
                    className="p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Get Tips</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Analytics</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={startBreak}
                    className="p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Coffee className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Take Break</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleCreateTask}
                    className="p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="w-4 h-4 text-green-500" />
                      <span className="text-sm">New Task</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Recommendations
                  </h4>
                  <div className="space-y-2">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{rec.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                              {rec.title}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {rec.description}
                            </div>
                          </div>
                          <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                            {rec.action}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analytics Preview */}
              <AnimatePresence>
                {showAnalytics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg"
                  >
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Productivity Insights
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {getProductivityInsights().map((insight) => (
                        <div key={insight.title} className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{insight.icon}</span>
                            <span className={`text-sm font-medium ${insight.color}`}>
                              {insight.value}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {insight.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIStudyAssistant; 