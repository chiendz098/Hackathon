import React from 'react';

const Card = React.forwardRef(({
  children, variant = 'default', hover = true, className = '', ...props
}, ref) => {
  const baseClasses = 'card';

  const variantClasses = {
    default: '',
    gradient: 'card-gradient',
    glass: 'card-glass',
    elevated: 'shadow-lg'
  };

  const hoverClasses = hover ? 'hover-lift hover-glow' : '';

  const classes = [
    baseClasses,
    variantClasses[variant],
    hoverClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={classes}
      style={{
        transition: 'all 0.2s ease-in-out'
      }}
      {...props}
    >
      {children}
    </div>
  );
});

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

const CardBody = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
export { CardHeader, CardBody, CardFooter };