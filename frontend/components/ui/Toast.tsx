'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useToast, ToastMessage } from '@/lib/hooks/useToast';

export function ToastItem({ toast }: { toast: ToastMessage }) {
  const { removeToast } = useToast();

  const icons = {
    success: <CheckCircle2 size={18} className="aws-toast-icon-success" />,
    error: <AlertCircle size={18} className="aws-toast-icon-error" />,
    info: <Info size={18} className="aws-toast-icon-info" />,
    warning: <AlertTriangle size={18} className="aws-toast-icon-warning" />,
  };

  return (
    <div className={`aws-toast aws-toast-${toast.type}`} role="status">
      <div className="aws-toast-icon-wrap">{icons[toast.type]}</div>
      <div className="aws-toast-body">
        {toast.title && <div className="aws-toast-title">{toast.title}</div>}
        <div className="aws-toast-message">{toast.message}</div>
      </div>
      <button
        type="button"
        className="aws-toast-close"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss message"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="aws-toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
