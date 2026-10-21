import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-mono text-app-muted select-none">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full bg-app-surface text-app-text border border-app-border rounded-sm px-3 py-2 text-sm placeholder:text-app-dim focus:outline-none focus:border-app-border-focus transition-colors ${
            error ? 'border-app-danger' : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-app-danger">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
