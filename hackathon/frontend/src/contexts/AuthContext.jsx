import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage if available
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo && userInfo !== 'undefined' && userInfo !== 'null') {
      try {
        // Verify token is valid by parsing it
        const base64 = token.split('.')[1];
        if (base64) {
          const payload = JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')));
          
          // Load full user info from localStorage
          if (userInfo && userInfo !== 'undefined' && userInfo !== 'null') {
            const user = JSON.parse(userInfo);
            setUser(user);
          }
        }
      } catch (error) {
        console.error('Error parsing token or user info:', error);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
      }
    } else if (token) {
      // Only token exists, create minimal user object
      try {
        const base64 = token.split('.')[1];
        if (base64) {
          const payload = JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')));
          setUser({ 
            id: payload.id,
            name: 'User',
            ...payload 
          });
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        setUser(null);
        localStorage.removeItem('token');
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = (userObj, token) => {
    if (!userObj || !token) {
      console.error('Login failed: userObj or token is undefined');
      return;
    }
    
    // Store full user info in localStorage for persistence
    localStorage.setItem('userInfo', JSON.stringify(userObj));
    setUser(userObj);
    localStorage.setItem('token', token);
    // You can add toast notification here if you have a toast system
    console.log('Login successful:', userObj.name || 'User');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    // You can add toast notification here if you have a toast system
    console.log('Logout successful');
    navigate('/');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('userInfo', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
