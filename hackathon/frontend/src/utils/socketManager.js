import io from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnecting = false;
  }

  connect() {
    if (this.socket && this.socket.connected) {
      console.log('🔌 Socket already connected');
      return this.socket;
    }

    if (this.isConnecting) {
      console.log('🔌 Socket connection in progress...');
      return this.socket;
    }

    this.isConnecting = true;
    console.log('🔌 Creating new socket connection...');

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'https://ai-learning-backend.loca.lt', {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.socket.on('connect', () => {
      console.log('🔌 Global socket connected');
      console.log('🔌 Socket ID:', this.socket.id);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Global socket connection error:', error);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Global socket disconnected:', reason);
      this.isConnecting = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Global socket reconnected after', attemptNumber, 'attempts');
    });

    // Store in window for backward compatibility
    window.socket = this.socket;

    return this.socket;
  }

  getSocket() {
    if (!this.socket || !this.socket.connected) {
      return this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      window.socket = null;
    }
  }

  // Add event listener with automatic cleanup
  on(event, callback, componentId = null) {
    const socket = this.getSocket();
    
    // Store the callback with componentId for proper cleanup
    if (componentId) {
      if (!this.listeners.has(componentId)) {
        this.listeners.set(componentId, new Map());
      }
      
      // Check if listener already exists for this component and event
      const componentListeners = this.listeners.get(componentId);
      if (componentListeners.has(event)) {
        console.log(`🔌 Listener already exists for event: ${event}, component: ${componentId}, removing old one`);
        const oldCallback = componentListeners.get(event);
        socket.off(event, oldCallback);
      }
      
      componentListeners.set(event, callback);
    }
    
    // Add the listener to socket
    socket.on(event, callback);
    
    console.log(`🔌 Added listener for event: ${event}, component: ${componentId || 'global'}`);
  }

  // Remove event listener
  off(event, componentId = null) {
    const socket = this.getSocket();
    
    if (componentId && this.listeners.has(componentId)) {
      const componentListeners = this.listeners.get(componentId);
      if (componentListeners.has(event)) {
        const callback = componentListeners.get(event);
        socket.off(event, callback);
        componentListeners.delete(event);
        console.log(`🔌 Removed listener for event: ${event}, component: ${componentId}`);
      }
    } else {
      // Remove global listener
      socket.off(event);
      console.log(`🔌 Removed global listener for event: ${event}`);
    }
  }

  // Remove all listeners for a component
  removeComponentListeners(componentId) {
    if (this.listeners.has(componentId)) {
      const componentListeners = this.listeners.get(componentId);
      const socket = this.getSocket();
      
      console.log(`🔌 Removing ${componentListeners.size} listeners for component: ${componentId}`);
      
      componentListeners.forEach((callback, event) => {
        socket.off(event, callback);
        console.log(`🔌 Removed listener: ${event}`);
      });
      
      this.listeners.delete(componentId);
    }
  }

  // Emit event
  emit(event, data, callback = null) {
    const socket = this.getSocket();
    if (callback) {
      socket.emit(event, data, callback);
    } else {
      socket.emit(event, data);
    }
  }

  // Debug: Get all active listeners
  getActiveListeners() {
    const result = {};
    this.listeners.forEach((componentListeners, componentId) => {
      result[componentId] = Array.from(componentListeners.keys());
    });
    return result;
  }

  // Debug: Check if listener exists
  hasListener(event, componentId = null) {
    if (componentId && this.listeners.has(componentId)) {
      return this.listeners.get(componentId).has(event);
    }
    return false;
  }

  // Clean up all listeners (useful for debugging)
  cleanupAllListeners() {
    console.log('🧹 Cleaning up all listeners...');
    const socket = this.getSocket();
    
    this.listeners.forEach((componentListeners, componentId) => {
      console.log(`🧹 Cleaning up component: ${componentId}`);
      componentListeners.forEach((callback, event) => {
        socket.off(event, callback);
        console.log(`🧹 Removed listener: ${event}`);
      });
    });
    
    this.listeners.clear();
    console.log('🧹 All listeners cleaned up');
  }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager; 