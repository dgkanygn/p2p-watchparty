import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 rounded-sm',
    md: 'text-sm px-3.5 py-2 rounded-sm',
    lg: 'text-sm px-4 py-2.5 rounded-sm font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-app-accent text-black border border-app-accent hover:bg-app-accent-hover hover:border-app-accent-hover font-semibold',
    secondary:
      'bg-app-surface text-app-text border border-app-border hover:bg-app-hover hover:border-app-border-focus',
    danger:
      'bg-app-danger text-white border border-app-danger hover:opacity-90',
    ghost:
      'bg-transparent text-app-muted hover:text-app-text hover:bg-app-hover border border-transparent',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
