'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number | string;
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = 600,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus modal container on open
    modalRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="aws-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aws-modal-title"
    >
      <div
        ref={modalRef}
        className="aws-modal-content"
        style={{ maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }}
        tabIndex={-1}
      >
        <div className="aws-modal-header">
          <div>
            <h2 id="aws-modal-title" className="aws-modal-title">
              {title}
            </h2>
            {subtitle && <p className="aws-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="aws-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="aws-modal-body">{children}</div>

        {footer && <div className="aws-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
