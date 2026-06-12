const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    pro: 'badge-pro',
  };
  return <span className={`${variants[variant]} ${className}`}>{children}</span>;
};

export default Badge;
