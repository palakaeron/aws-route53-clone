'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  /**
   * Primary confirmation message shown in the dialog body.
   */
  message: React.ReactNode;
  /**
   * Optional secondary warning message (shown in a highlighted block).
   */
  warning?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true the confirm button renders as danger (red). */
  danger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable accessible confirmation dialog built on top of the existing
 * Modal component. Replaces all window.confirm() usage.
 */
export function ConfirmModal({
  open,
  title,
  message,
  warning,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      maxWidth={480}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="aws-confirm-modal-body">
        <p className="aws-confirm-modal-message">{message}</p>
        {warning && (
          <div className="aws-confirm-modal-warning" role="alert">
            <AlertTriangle size={16} className="aws-confirm-modal-warning-icon" />
            <span>{warning}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
