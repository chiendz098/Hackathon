import React, { useState, useEffect } from 'react';
import './PetEvolutionSystem.css';

const PetEvolutionSystem = ({ pet, onEvolutionComplete }) => {
  const [evolutionStage, setEvolutionStage] = useState(0);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionProgress, setEvolutionProgress] = useState(0);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);

  const evolutionStages = {
    cat: [
      { name: 'Mèo Con', level: 1, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
      { name: 'Mèo Teen', level: 10, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
      { name: 'Mèo Trưởng Thành', level: 20, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
      { name: 'Mèo Thông Minh', level: 30, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' }
    ],
    dog: [
      { name: 'Cún Con', level: 1, gif: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8W9ep/giphy.gif' },
      { name: 'Cún Teen', level: 10, gif: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8W9ep/giphy.gif' },
      { name: 'Cún Trưởng Thành', level: 20, gif: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8W9ep/giphy.gif' },
      { name: 'Cún Thông Minh', level: 30, gif: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8W9ep/giphy.gif' }
    ],
    rabbit: [
      { name: 'Thỏ Con', level: 1, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
      { name: 'Thỏ Teen', level: 10, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
      { name: 'Thỏ Trưởng Thành', level: 20, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
      { name: 'Thỏ Thông Minh', level: 30, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' }
    ],
    dragon: [
      { name: 'Rồng Con', level: 1, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
      { name: 'Rồng Teen', level: 10, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
      { name: 'Rồng Trưởng Thành', level: 20, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
      { name: 'Rồng Huyền Thoại', level: 30, gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' }
    ]
  };

  useEffect(() => {
    if (pet) {
      const currentStage = Math.floor((pet.level || 1) / 10);
      setEvolutionStage(currentStage);
      setEvolutionProgress(((pet.level || 1) % 10) * 10);
    }
  }, [pet]);

  const canEvolve = () => {
    return pet && (pet.level || 1) >= (evolutionStage + 1) * 10;
  };

  const triggerEvolution = () => {
    if (!canEvolve()) return;

    setIsEvolving(true);
    setShowEvolutionModal(true);

    // Simulate evolution process
    setTimeout(() => {
      const newStage = evolutionStage + 1;
      setEvolutionStage(newStage);
      setEvolutionProgress(0);
      setIsEvolving(false);
      
      if (onEvolutionComplete) {
        onEvolutionComplete(newStage);
      }
    }, 3000);
  };

  const getCurrentStageInfo = () => {
    if (!pet || !evolutionStages[pet.type]) return null;
    return evolutionStages[pet.type][evolutionStage] || evolutionStages[pet.type][0];
  };

  const getNextStageInfo = () => {
    if (!pet || !evolutionStages[pet.type] || evolutionStage >= evolutionStages[pet.type].length - 1) return null;
    return evolutionStages[pet.type][evolutionStage + 1];
  };

  if (!pet) return null;

  const currentStage = getCurrentStageInfo();
  const nextStage = getNextStageInfo();

  return (
    <div className="pet-evolution-system">
      {/* Evolution Progress Bar */}
      <div className="evolution-progress-container">
        <div className="evolution-stage-info">
          <h4>Tiến Hóa: {currentStage?.name}</h4>
          <p>Level {pet.level || 1}</p>
        </div>
        
        <div className="evolution-progress-bar">
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{ width: `${evolutionProgress}%` }}
            />
          </div>
          <span className="progress-text">{evolutionProgress}%</span>
        </div>

        {nextStage && (
          <div className="next-stage-info">
            <p>Tiếp theo: {nextStage.name} (Level {nextStage.level})</p>
          </div>
        )}
      </div>

      {/* Evolution Button */}
      {canEvolve() && (
        <button 
          className="evolve-btn"
          onClick={triggerEvolution}
          disabled={isEvolving}
        >
          {isEvolving ? '🔄 Đang Tiến Hóa...' : '✨ Tiến Hóa!'}
        </button>
      )}

      {/* Evolution Stages Display */}
      <div className="evolution-stages">
        <h5>Quá Trình Tiến Hóa</h5>
        <div className="stages-timeline">
          {evolutionStages[pet.type]?.map((stage, index) => (
            <div 
              key={index}
              className={`stage-item ${index <= evolutionStage ? 'completed' : ''} ${index === evolutionStage ? 'current' : ''}`}
            >
              <div className="stage-icon">
                {index <= evolutionStage ? '✅' : '⭕'}
              </div>
              <div className="stage-info">
                <span className="stage-name">{stage.name}</span>
                <span className="stage-level">Level {stage.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evolution Modal */}
      {showEvolutionModal && (
        <div className="evolution-modal-overlay">
          <div className="evolution-modal">
            <div className="modal-header">
              <h3>🎉 Tiến Hóa Thành Công!</h3>
            </div>
            
            <div className="evolution-animation">
              <div className="old-pet">
                <img src={currentStage?.gif} alt="Old Pet" />
                <p>{currentStage?.name}</p>
              </div>
              
              <div className="evolution-arrow">➡️</div>
              
              <div className="new-pet">
                <img src={nextStage?.gif} alt="New Pet" />
                <p>{nextStage?.name}</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="close-modal-btn"
                onClick={() => setShowEvolutionModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetEvolutionSystem; 