import React from 'react';

const LoadingSpinner = ({ 
  type = 'spinner', 
  size = 'medium', 
  color = 'primary',
  text = '',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-blue-500',
    secondary: 'border-purple-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    danger: 'border-red-500',
    white: 'border-white'
  };

  const renderSpinner = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className={`spinner ${sizeClasses[size]} ${colorClasses[color]} ${className}`} />
        );
      
      case 'pulse':
        return (
          <div className={`pulse-loader ${sizeClasses[size]} ${className}`} />
        );
      
      case 'dots':
        return (
          <div className={`dots-loader ${className}`}>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      
      case 'bars':
        return (
          <div className={`flex gap-1 ${className}`}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-1 bg-${color}-500 animate-pulse`}
                style={{
                  height: '20px',
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );
      
      case 'ring':
        return (
          <div className={`relative ${sizeClasses[size]} ${className}`}>
            <div className={`absolute inset-0 border-4 border-gray-200 rounded-full`}></div>
            <div className={`absolute inset-0 border-4 ${colorClasses[color]} rounded-full border-t-transparent animate-spin`}></div>
          </div>
        );
      
      case 'cube':
        return (
          <div className={`relative ${sizeClasses[size]} ${className}`}>
            <div className="absolute inset-0 animate-spin">
              <div className="w-full h-full border-2 border-blue-500 transform rotate-45"></div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDirection: 'reverse' }}>
              <div className="w-full h-full border-2 border-purple-500 transform -rotate-45"></div>
            </div>
          </div>
        );
      
      case 'wave':
        return (
          <div className={`flex gap-1 ${className}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-1 bg-${color}-500 animate-bounce`}
                style={{
                  height: '20px',
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );
      
      default:
        return (
          <div className={`spinner ${sizeClasses[size]} ${colorClasses[color]} ${className}`} />
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderSpinner()}
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
};

// Page Loading Component
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center">
      <LoadingSpinner type="ring" size="xlarge" color="primary" />
      <p className="mt-4 text-lg font-medium text-gray-700 animate-pulse">{message}</p>
    </div>
  </div>
);

// Button Loading Component
export const ButtonLoader = ({ size = 'small', color = 'white' }) => (
  <LoadingSpinner type="spinner" size={size} color={color} />
);

// Inline Loading Component
export const InlineLoader = ({ text = 'Loading...' }) => (
  <div className="flex items-center space-x-2">
    <LoadingSpinner type="dots" size="small" />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
);

// Skeleton Loading Component
export const SkeletonLoader = ({ 
  type = 'text', 
  lines = 1, 
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={i}
                className="skeleton h-4 rounded"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            ))}
          </div>
        );
      
      case 'card':
        return (
          <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
            <div className="skeleton h-6 w-3/4 rounded mb-3"></div>
            <div className="skeleton h-4 w-full rounded mb-2"></div>
            <div className="skeleton h-4 w-2/3 rounded"></div>
          </div>
        );
      
      case 'avatar':
        return (
          <div className={`skeleton rounded-full ${className}`} style={{ width: '40px', height: '40px' }} />
        );
      
      case 'image':
        return (
          <div className={`skeleton rounded ${className}`} style={{ width: '100%', height: '200px' }} />
        );
      
      default:
        return (
          <div className={`skeleton h-4 rounded ${className}`} />
        );
    }
  };

  return renderSkeleton();
};

// Progress Bar Component
export const ProgressBar = ({ 
  progress = 0, 
  color = 'primary',
  showPercentage = true,
  className = ''
}) => {
  const colorClasses = {
    primary: 'bg-blue-500',
    secondary: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="progress-bar">
        <div 
          className={`progress-fill ${colorClasses[color]}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-sm text-gray-600 mt-1 text-center">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 