import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-[2px]">
      <div
        className={`w-full ${maxWidth} bg-app-surface border border-app-border rounded-md shadow-2xl overflow-hidden flex flex-col`}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-app-border">
            <h3 className="text-sm font-semibold text-app-text tracking-tight">
              {title}
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-app-muted hover:text-app-text transition-colors p-1"
                aria-label="Kapat"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
