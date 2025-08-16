import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import './AIPetCompanion.css';

const AIPetCompanion = () => {
  const { user } = useAuth();
  const { apiCall } = useApi();
  const [pet, setPet] = useState(null);
  const [petResponse, setPetResponse] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingTodos, setPendingTodos] = useState([]);
  const [petMood, setPetMood] = useState('happy');
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [hasNoPet, setHasNoPet] = useState(false);
  
  const recognitionRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'vi-VN';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceCommand(transcript);
        processVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Load pet status on mount
  useEffect(() => {
    // Only load pet status if user is authenticated
    if (user && user.id) {
      loadPetStatus();
      const interval = setInterval(loadPetStatus, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadPetStatus = async () => {
    // Don't make API call if user is not authenticated
    if (!user || !user.id) {
      return;
    }

    try {
      const response = await apiCall('/pets/status', 'GET');
      if (response.success) {
        setPet(response.pet);
        setPetResponse(response.petResponse);
        setPendingTodos(response.reminders || []);
        setPetMood(response.pet.mood);
        setHasNoPet(false);
      }
    } catch (error) {
      // Handle 404 (no active pet) gracefully
      if (error.status === 404 || error.message?.includes('No active pet found')) {
        setPet(null);
        setPetResponse(null);
        setPendingTodos([]);
        setHasNoPet(true);
      } else {
        console.error('Error loading pet status:', error);
        setHasNoPet(false);
      }
    }
  };

  const processVoiceCommand = async (command) => {
    try {
      const response = await apiCall('/pets/voice-command', 'POST', {
        command,
        userId: user.id
      });

      if (response.success) {
        setPetResponse(response.response);
        setIsAnimating(true);
        
        // Trigger animation based on response type
        if (response.response.type === 'celebration') {
          triggerAnimation('dance');
        } else if (response.response.type === 'motivation') {
          triggerAnimation('jump');
        } else {
          triggerAnimation('wave');
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setPetResponse(null);
          setIsAnimating(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
    }
  };

  const triggerAnimation = (animationType) => {
    if (animationRef.current) {
      animationRef.current.className = `pet-avatar ${animationType}`;
      setTimeout(() => {
        if (animationRef.current) {
          animationRef.current.className = 'pet-avatar';
        }
      }, 2000);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const interactWithPet = async (action, message = '') => {
    try {
      const response = await apiCall('/pets/interact', 'POST', {
        action,
        message
      });

      if (response.success) {
        setPetResponse(response.response);
        setPetMood(response.petMood);
        setIsAnimating(true);
        
        triggerAnimation(response.response.animation);
        
        setTimeout(() => {
          setPetResponse(null);
          setIsAnimating(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error interacting with pet:', error);
    }
  };

  const feedPet = async () => {
    if (!pet) return;
    
    try {
      const response = await apiCall(`/pets/feed/${pet.id}`, 'POST');
      if (response.success) {
        setPet(response.pet);
        setPetResponse(response.response);
        setIsAnimating(true);
        triggerAnimation('eat');
        setTimeout(() => {
          setPetResponse(null);
          setIsAnimating(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error feeding pet:', error);
    }
  };

  const playWithPet = async () => {
    if (!pet) return;
    
    try {
      const response = await apiCall(`/pets/play/${pet.id}`, 'POST');
      if (response.success) {
        setPet(response.pet);
        setPetResponse(response.response);
        setIsAnimating(true);
        triggerAnimation('play');
        setTimeout(() => {
          setPetResponse(null);
          setIsAnimating(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error playing with pet:', error);
    }
  };

  if (!pet && !hasNoPet) {
    return null;
  }

  // Show message when user has no pet
  if (hasNoPet) {
    return (
      <div className="ai-pet-companion no-pet">
        <div className="no-pet-message">
          <div className="no-pet-icon">🐾</div>
          <h3>Bạn chưa có pet nào!</h3>
          <p>Hãy vào shop để nhận nuôi một pet cưng nhé!</p>
          <button 
            className="adopt-pet-btn"
            onClick={() => window.location.href = '/shop'}
          >
            🏪 Vào Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-pet-companion">
      {/* Floating Pet Avatar */}
      <div 
        className={`pet-container ${isVisible ? 'visible' : ''} ${isAnimating ? 'animating' : ''}`}
        onClick={() => setIsVisible(!isVisible)}
      >
        <div 
          ref={animationRef}
          className={`pet-avatar ${petMood}`}
          style={{
            backgroundImage: `url(${pet.avatar || '/default-pet.png'})`
          }}
        />
        
        {/* Pet Status Indicators */}
        <div className="pet-status">
          <div className="status-bar happiness">
            <span>😊</span>
            <div className="bar">
              <div 
                className="fill" 
                style={{ width: `${pet.happiness}%` }}
              />
            </div>
          </div>
          <div className="status-bar hunger">
            <span>🍽️</span>
            <div className="bar">
              <div 
                className="fill" 
                style={{ width: `${pet.hunger}%` }}
              />
            </div>
          </div>
        </div>

        {/* Voice Command Button */}
        <button 
          className={`voice-btn ${isListening ? 'listening' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isListening) {
              stopListening();
            } else {
              startListening();
            }
          }}
          title="Nói chuyện với pet"
        >
          {isListening ? '🎤' : '🎤'}
        </button>
      </div>

      {/* Pet Interaction Panel */}
      {isVisible && (
        <div className="pet-panel">
          <div className="panel-header">
            <h3>{pet.nickname || pet.name}</h3>
            <button 
              className="close-btn"
              onClick={() => setIsVisible(false)}
            >
              ✕
            </button>
          </div>

          {/* Pet Response */}
          {petResponse && (
            <div className="pet-response">
              <div className="response-bubble">
                <p>{petResponse.message}</p>
                {petResponse.todoCount && (
                  <div className="todo-reminder">
                    <span>📝 {petResponse.todoCount} việc chưa hoàn thành</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <button 
              className="action-btn feed"
              onClick={feedPet}
              title="Cho pet ăn"
            >
              🍽️ Cho ăn
            </button>
            <button 
              className="action-btn play"
              onClick={playWithPet}
              title="Chơi với pet"
            >
              🎾 Chơi
            </button>
            <button 
              className="action-btn praise"
              onClick={() => interactWithPet('praise')}
              title="Khen pet"
            >
              👍 Khen
            </button>
            <button 
              className="action-btn study"
              onClick={() => interactWithPet('study_reminder')}
              title="Nhắc nhở học tập"
            >
              📚 Học tập
            </button>
          </div>

          {/* Voice Input */}
          <div className="voice-input-section">
            <button 
              className={`voice-input-btn ${isListening ? 'listening' : ''}`}
              onClick={() => setShowVoiceInput(!showVoiceInput)}
            >
              {isListening ? '🎤 Đang nghe...' : '🎤 Nói chuyện với pet'}
            </button>
            
            {showVoiceInput && (
              <div className="voice-input">
                <input
                  type="text"
                  placeholder="Nhập lệnh hoặc gọi 'pet cưng ơi'"
                  value={voiceCommand}
                  onChange={(e) => setVoiceCommand(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      processVoiceCommand(voiceCommand);
                      setVoiceCommand('');
                    }
                  }}
                />
                <button 
                  className="send-btn"
                  onClick={() => {
                    processVoiceCommand(voiceCommand);
                    setVoiceCommand('');
                  }}
                >
                  Gửi
                </button>
              </div>
            )}
          </div>

          {/* Todo Reminders */}
          {pendingTodos.length > 0 && (
            <div className="todo-reminders">
              <h4>📝 Việc cần làm:</h4>
              <ul>
                {pendingTodos.slice(0, 3).map(todo => (
                  <li key={todo.id} className={`priority-${todo.priority}`}>
                    {todo.title}
                    {todo.dueDate && (
                      <span className="due-date">
                        {new Date(todo.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {pendingTodos.length > 3 && (
                <p className="more-todos">
                  Và {pendingTodos.length - 3} việc khác...
                </p>
              )}
            </div>
          )}

          {/* Pet Stats */}
          <div className="pet-stats">
            <div className="stat">
              <span>Hạnh phúc:</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill happiness" 
                  style={{ width: `${pet.happiness}%` }}
                />
                <span>{pet.happiness}%</span>
              </div>
            </div>
            <div className="stat">
              <span>Đói:</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill hunger" 
                  style={{ width: `${pet.hunger}%` }}
                />
                <span>{pet.hunger}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Command Instructions */}
      <div className="voice-instructions">
        <p>💡 Thử nói: "pet cưng ơi", "todo", "việc cần làm"</p>
      </div>
    </div>
  );
};

export default AIPetCompanion;