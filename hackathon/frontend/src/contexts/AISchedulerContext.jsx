import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { getAISchedulerRecommendations } from '../api';

const AISchedulerContext = createContext();

export const useAIScheduler = () => {
  const context = useContext(AISchedulerContext);
  if (!context) {
    throw new Error('useAIScheduler must be used within an AISchedulerProvider');
  }
  return context;
};

export const AISchedulerProvider = ({ children }) => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  // Load recommendations on user change
  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const checkConflicts = async (todoId, proposedDate, proposedDuration) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-scheduler/check-conflicts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          todoId,
          proposedDate,
          proposedDuration
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts);
        return data;
      } else {
        throw new Error('Failed to check conflicts');
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
      toast.error('Failed to check schedule conflicts');
      return { hasConflicts: false, conflicts: [], aiSuggestions: [] };
    } finally {
      setLoading(false);
    }
  };

  const autoSchedule = async (todoIds, preferences = {}) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-scheduler/auto-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          todoIds,
          preferences
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data.schedule);
        setAiInsights(data.insights);
        
        toast.success(data.message, {
          icon: '🤖',
          duration: 4000
        });
        
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to auto-schedule');
      }
    } catch (error) {
      console.error('Error auto-scheduling:', error);
      toast.error(error.message || 'Failed to optimize schedule');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await getAISchedulerRecommendations();
      if (response.data && response.data.success) {
        setRecommendations(response.data.recommendations || []);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    }
  };

  const dismissRecommendation = (recommendationId) => {
    setRecommendations(prev => 
      prev.filter(rec => rec.id !== recommendationId)
    );
  };

  const applyRecommendation = async (recommendation) => {
    try {
      switch (recommendation.action) {
        case 'start_pomodoro_session':
          // Navigate to pomodoro timer or start session
          toast.success('Starting focus session!');
          break;
        
        case 'view_urgent_tasks':
          // Navigate to urgent tasks view
          toast.success('Showing urgent tasks');
          break;
        
        case 'view_quick_tasks':
          // Navigate to quick tasks
          toast.success('Showing quick tasks');
          break;
        
        default:
          toast.info('Recommendation applied');
      }
      
      dismissRecommendation(recommendation.id);
    } catch (error) {
      console.error('Error applying recommendation:', error);
      toast.error('Failed to apply recommendation');
    }
  };

  const getConflictSeverity = (conflicts) => {
    if (!conflicts || conflicts.length === 0) return 'none';
    
    const hasTimeConflict = conflicts.some(c => c.type === 'time_conflict');
    const hasWorkloadConflict = conflicts.some(c => c.type === 'workload_conflict');
    
    if (hasTimeConflict) return 'high';
    if (hasWorkloadConflict) return 'medium';
    return 'low';
  };

  const getOptimalStudyTime = (taskComplexity, userPreferences = {}) => {
    const now = new Date();
    const optimal = new Date(now);
    
    // Default optimal times based on complexity
    const optimalHours = {
      high: 14, // 2 PM for complex tasks
      medium: 10, // 10 AM for medium tasks
      low: 16 // 4 PM for simple tasks
    };
    
    // Apply user preferences
    if (userPreferences.preferMorning && optimalHours[taskComplexity] > 12) {
      optimal.setHours(9, 0, 0, 0);
    } else if (userPreferences.preferEvening && optimalHours[taskComplexity] < 16) {
      optimal.setHours(18, 0, 0, 0);
    } else {
      optimal.setHours(optimalHours[taskComplexity] || 14, 0, 0, 0);
    }
    
    // Ensure it's not in the past
    if (optimal <= now) {
      optimal.setDate(optimal.getDate() + 1);
    }
    
    return optimal;
  };

  const generateStudyPlan = (todos, timeframe = 'week') => {
    if (!todos || todos.length === 0) return [];
    
    const plan = [];
    const now = new Date();
    
    // Sort todos by priority and deadline
    const sortedTodos = [...todos].sort((a, b) => {
      const priorityDiff = (b.priority || 3) - (a.priority || 3);
      if (priorityDiff !== 0) return priorityDiff;
      
      const aDeadline = a.deadline ? new Date(a.deadline) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const bDeadline = b.deadline ? new Date(b.deadline) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return aDeadline - bDeadline;
    });
    
    let currentDate = new Date(now);
    currentDate.setHours(9, 0, 0, 0); // Start at 9 AM
    
    sortedTodos.forEach((todo, index) => {
      const estimatedDuration = todo.estimatedTime || 60;
      const sessions = Math.ceil(estimatedDuration / 90); // 90-minute sessions max
      
      for (let i = 0; i < sessions; i++) {
        const sessionDuration = Math.min(90, estimatedDuration - (i * 90));
        
        plan.push({
          id: `${todo.id}-session-${i}`,
          todoId: todo.id,
          title: sessions > 1 ? `${todo.title} (Part ${i + 1})` : todo.title,
          startTime: new Date(currentDate),
          duration: sessionDuration,
          type: 'study',
          priority: todo.priority,
          subject: todo.subject
        });
        
        // Move to next time slot (add session duration + 15 min break)
        currentDate = new Date(currentDate.getTime() + (sessionDuration + 15) * 60000);
        
        // If it's past 6 PM, move to next day at 9 AM
        if (currentDate.getHours() >= 18) {
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(9, 0, 0, 0);
        }
      }
    });
    
    return plan;
  };

  const value = {
    schedule,
    conflicts,
    recommendations,
    loading,
    aiInsights,
    
    // Actions
    checkConflicts,
    autoSchedule,
    fetchRecommendations,
    dismissRecommendation,
    applyRecommendation,
    
    // Utilities
    getConflictSeverity,
    getOptimalStudyTime,
    generateStudyPlan,
    
    // Refresh
    refreshRecommendations: fetchRecommendations,
    clearConflicts: () => setConflicts([]),
    clearSchedule: () => setSchedule([])
  };

  return (
    <AISchedulerContext.Provider value={value}>
      {children}
    </AISchedulerContext.Provider>
  );
};
