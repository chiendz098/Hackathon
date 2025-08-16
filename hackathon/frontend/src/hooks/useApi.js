import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { handleApiError, retryOperation, showErrorNotification } from '../utils/errorHandler';
import * as api from '../api';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'https://ai-learning-backend.loca.lt'}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.refreshToken(refreshToken);
          const { token } = response.data;
          localStorage.setItem('token', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic request handler
  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await retryOperation(async () => {
        const requestConfig = {
          method,
          url: url.startsWith('/') ? url : `/${url}`,
          ...config
        };

        if (data) {
          requestConfig.data = data;
        }

        return axiosInstance(requestConfig);
      });

      return response.data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      showErrorNotification(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  // GET request
  const get = useCallback((url, config = {}) => {
    return request('get', url, null, config);
  }, [request]);

  // POST request
  const post = useCallback((url, data, config = {}) => {
    return request('post', url, data, config);
  }, [request]);

  // PUT request
  const put = useCallback((url, data, config = {}) => {
    return request('put', url, data, config);
  }, [request]);

  // DELETE request
  const del = useCallback((url, config = {}) => {
    return request('delete', url, null, config);
  }, [request]);

  // PATCH request
  const patch = useCallback((url, data, config = {}) => {
    return request('patch', url, data, config);
  }, [request]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    patch,
    request
  };
};

// Custom hook for todos
export const useTodos = (options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getTodos(options);
      setData(response.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return {
    data,
    loading,
    error,
    refetch: fetchTodos
  };
};

// Custom hook for todo actions
export const useTodoActions = () => {
  const [loading, setLoading] = useState(false);

  const addTodo = useCallback(async (todoData) => {
    setLoading(true);
    try {
      const response = await api.addTodo(todoData);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTodo = useCallback(async (id, todoData) => {
    setLoading(true);
    try {
      const response = await api.updateTodo(id, todoData);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTodo = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await api.deleteTodo(id);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeTodo = useCallback(async (id, completionData) => {
    setLoading(true);
    try {
      const response = await api.completeTodo(id, completionData);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    loading
  };
};

// Custom hook for gamification API
export const useGamificationApi = () => {
  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getUserProgress();
      setProgress(response.data);
    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAchievements = useCallback(async () => {
    try {
      const response = await api.getAchievements();
      setAchievements(response.data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await api.getLeaderboard();
      setLeaderboard(response.data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  }, []);

  const awardXP = useCallback(async (amount, reason, taskId) => {
    try {
      const response = await api.awardXP(amount, reason, taskId);
      return response.data;
    } catch (err) {
      console.error('Error awarding XP:', err);
      throw err;
    }
  }, []);

  const spinDailyWheel = useCallback(async () => {
    try {
      const response = await api.spinDailyWheel();
      return response.data;
    } catch (err) {
      console.error('Error spinning wheel:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProgress();
    fetchAchievements();
    fetchLeaderboard();
  }, [fetchProgress, fetchAchievements, fetchLeaderboard]);

  return {
    progress,
    achievements,
    leaderboard,
    awardXP,
    spinDailyWheel,
    loading,
    refetch: fetchProgress
  };
};

// Custom hook for AI features
export const useAI = () => {
  const [loading, setLoading] = useState(false);

  const askGemini = useCallback(async (prompt) => {
    setLoading(true);
    try {
      const response = await api.askGemini(prompt);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateEnhancedTodos = useCallback(async (input, context) => {
    setLoading(true);
    try {
      const response = await api.generateEnhancedTodos(input, context);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateLearningPlan = useCallback(async (goal, timeframe, currentLevel, preferences) => {
    setLoading(true);
    try {
      const response = await api.generateLearningPlan(goal, timeframe, currentLevel, preferences);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    askGemini,
    generateEnhancedTodos,
    generateLearningPlan,
    loading
  };
};



// Custom hook for notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getNotifications();
      setNotifications(response.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    markRead,
    loading,
    refetch: fetchNotifications
  };
};

// Custom hook for profile
export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getUserProfile();
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await api.updateUserProfile(data);
      setProfile(response.data);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    updateProfile,
    loading,
    refetch: fetchProfile
  };
};

// Custom hook for API calls
export const useApiCall = () => {
  const [loading, setLoading] = useState(false);

  const call = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    try {
      const response = await apiFunction(...args);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    call,
    loading
  };
};

export default useApi; 