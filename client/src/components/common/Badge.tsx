import React from 'react';

interface BadgeProps {
  variant?: 'admin' | 'control' | 'default' | 'danger';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => {
  const variantStyles = {
    admin: 'bg-app-accent-faint text-app-accent border border-app-accent/30',
    control: 'bg-app-hover text-app-text border border-app-border-focus',
    default: 'bg-app-surface text-app-muted border border-app-border',
    danger: 'bg-app-danger/10 text-app-danger border border-app-danger/30',
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
};
