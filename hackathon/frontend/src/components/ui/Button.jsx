import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:scale-105',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500 shadow-lg hover:shadow-xl transform hover:scale-105',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus:ring-green-500 shadow-lg hover:shadow-xl transform hover:scale-105',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 focus:ring-yellow-500 shadow-lg hover:shadow-xl transform hover:scale-105',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-500 shadow-lg hover:shadow-xl transform hover:scale-105',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500 transform hover:scale-105',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 transform hover:scale-105',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 focus:ring-white/50 shadow-lg hover:shadow-xl transform hover:scale-105',
    neon: 'bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black focus:ring-cyan-500 shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 animate-pulse'
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
    xlarge: 'px-8 py-4 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;

  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <span className={`${iconPosition === 'right' ? 'ml-2' : 'mr-2'} ${loading ? 'opacity-0' : ''}`}>
        {icon}
      </span>
    );
  };

  const renderLoadingSpinner = () => {
    if (!loading) return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <LoadingSpinner type="dots" size="small" color="white" />
      </div>
    );
  };

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple Effect */}
      <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative flex items-center justify-center">
        {iconPosition === 'left' && renderIcon()}
        <span className={loading ? 'opacity-0' : ''}>
          {children}
        </span>
        {iconPosition === 'right' && renderIcon()}
      </div>
      
      {/* Loading Spinner */}
      {renderLoadingSpinner()}
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
    </button>
  );
};

// Special Button Variants
export const FloatingButton = ({ children, ...props }) => (
  <Button
    {...props}
    className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl hover:shadow-3xl animate-bounce"
    size="large"
  >
    {children}
  </Button>
);

export const IconButton = ({ icon, ...props }) => (
  <Button
    {...props}
    className="p-2 rounded-full"
    size="small"
  >
    {icon}
  </Button>
);

export const GradientButton = ({ gradient = 'blue', children, ...props }) => {
  const gradients = {
    blue: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
    purple: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    green: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
    orange: 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
    rainbow: 'from-red-500 via-yellow-500 to-blue-500 hover:from-red-600 hover:via-yellow-600 hover:to-blue-600'
  };

  return (
    <Button
      {...props}
      className={`bg-gradient-to-r ${gradients[gradient]} animate-gradient`}
    >
      {children}
    </Button>
  );
};

export const GlowButton = ({ children, ...props }) => (
  <Button
    {...props}
    className="animate-glow shadow-lg hover:shadow-2xl"
  >
    {children}
  </Button>
);

export const MagneticButton = ({ children, ...props }) => {
  const handleMouseMove = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'translate(0px, 0px) scale(1)';
  };

  return (
    <Button
      {...props}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="magnetic"
    >
      {children}
    </Button>
  );
};

export const PulseButton = ({ children, ...props }) => (
  <Button
    {...props}
    className="animate-pulse hover:animate-none"
  >
    {children}
  </Button>
);

export const BounceButton = ({ children, ...props }) => (
  <Button
    {...props}
    className="animate-bounce hover:animate-none"
  >
    {children}
  </Button>
);

export const ShimmerButton = ({ children, ...props }) => (
  <Button
    {...props}
    className="relative overflow-hidden"
  >
    <span className="relative z-10">{children}</span>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
  </Button>
);

export default Button;
