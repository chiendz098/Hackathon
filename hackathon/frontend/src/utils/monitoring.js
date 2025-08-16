// Performance monitoring
const performance = {
  metrics: {},
  marks: {},
  
  // Start timing a metric
  startMeasure: (name) => {
    performance.marks[name] = performance.now();
  },
  
  // End timing a metric
  endMeasure: (name) => {
    if (performance.marks[name]) {
      const duration = performance.now() - performance.marks[name];
      performance.metrics[name] = duration;
      delete performance.marks[name];
      return duration;
    }
    return null;
  },
  
  // Get all metrics
  getMetrics: () => {
    return performance.metrics;
  },
  
  // Clear all metrics
  clearMetrics: () => {
    performance.metrics = {};
    performance.marks = {};
  }
};

// Error tracking
const errorTracking = {
  errors: [],
  maxErrors: 100,
  
  // Log an error
  logError: (error, context = {}) => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        type: error.name
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context
      }
    };
    
    errorTracking.errors.unshift(errorLog);
    
    // Keep only the last maxErrors
    if (errorTracking.errors.length > errorTracking.maxErrors) {
      errorTracking.errors.pop();
    }
    
    // Send to logging service in production
    if (import.meta.env && import.meta.env.PROD) {
      errorTracking.sendToLoggingService(errorLog);
    }
    
    return errorLog;
  },
  
  // Get all logged errors
  getErrors: () => {
    return errorTracking.errors;
  },
  
  // Clear error log
  clearErrors: () => {
    errorTracking.errors = [];
  },
  
  // Send to logging service (implement based on your logging service)
  sendToLoggingService: (errorLog) => {
    // Example implementation:
    // logger.error(errorLog);
    console.error('Error logged:', errorLog);
  }
};

// User activity tracking
const userTracking = {
  events: [],
  maxEvents: 1000,
  
  // Track a user event
  trackEvent: (eventName, eventData = {}) => {
    const event = {
      timestamp: new Date().toISOString(),
      event: eventName,
      data: eventData,
      url: window.location.href
    };
    
    userTracking.events.unshift(event);
    
    // Keep only the last maxEvents
    if (userTracking.events.length > userTracking.maxEvents) {
      userTracking.events.pop();
    }
    
    // Send to analytics service in production
    if (import.meta.env && import.meta.env.PROD) {
      userTracking.sendToAnalytics(event);
    }
    
    return event;
  },
  
  // Get all tracked events
  getEvents: () => {
    return userTracking.events;
  },
  
  // Clear event log
  clearEvents: () => {
    userTracking.events = [];
  },
  
  // Send to analytics service (implement based on your analytics service)
  sendToAnalytics: (event) => {
    // Example implementation:
    // analytics.track(event);
    console.log('Event tracked:', event);
  }
};

// Resource monitoring
const resourceMonitoring = {
  resources: {},
  
  // Start monitoring resources
  startMonitoring: () => {
    // Monitor memory usage
    if (window.performance && window.performance.memory) {
      setInterval(() => {
        const memory = window.performance.memory;
        resourceMonitoring.resources.memory = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
      }, 5000);
    }
    
    // Monitor network requests
    if (window.navigator.connection) {
      setInterval(() => {
        const connection = window.navigator.connection;
        resourceMonitoring.resources.network = {
          type: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
      }, 5000);
    }
  },
  
  // Get current resource usage
  getResourceUsage: () => {
    return resourceMonitoring.resources;
  }
};

// Console logging wrapper
const logger = {
  // Log levels
  levels: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  },
  
  currentLevel: 1, // Default to INFO
  
  // Set logging level
  setLevel: (level) => {
    logger.currentLevel = level;
  },
  
  // Format log message
  format: (level, message, data = null) => {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
  },
  
  // Logging methods
  debug: (message, data = null) => {
    if (logger.currentLevel <= logger.levels.DEBUG) {
      const log = logger.format('DEBUG', message, data);
      console.debug(log);
      return log;
    }
  },
  
  info: (message, data = null) => {
    if (logger.currentLevel <= logger.levels.INFO) {
      const log = logger.format('INFO', message, data);
      console.info(log);
      return log;
    }
  },
  
  warn: (message, data = null) => {
    if (logger.currentLevel <= logger.levels.WARN) {
      const log = logger.format('WARN', message, data);
      console.warn(log);
      return log;
    }
  },
  
  error: (message, data = null) => {
    if (logger.currentLevel <= logger.levels.ERROR) {
      const log = logger.format('ERROR', message, data);
      console.error(log);
      errorTracking.logError(new Error(message), data);
      return log;
    }
  }
};

// Initialize monitoring
const initMonitoring = () => {
  // Set up performance monitoring
  performance.clearMetrics();
  
  // Set up error tracking
  window.addEventListener('error', (event) => {
    errorTracking.logError(event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    errorTracking.logError(event.reason);
  });
  
  // Start resource monitoring
  resourceMonitoring.startMonitoring();
  
  // Set logging level based on environment
  logger.setLevel(
    (import.meta.env && import.meta.env.PROD)
      ? logger.levels.INFO
      : logger.levels.DEBUG
  );
};

export {
  performance,
  errorTracking,
  userTracking,
  resourceMonitoring,
  logger,
  initMonitoring
}; 