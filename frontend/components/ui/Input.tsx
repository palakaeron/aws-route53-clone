'use client';

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, icon, id, className = '', ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`aws-field ${error ? 'aws-field-error' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="aws-label">
          {label}
          {props.required && <span className="aws-required">*</span>}
        </label>
      )}
      <div className="aws-input-wrapper">
        {icon && <span className="aws-input-icon">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={`aws-input ${icon ? 'aws-input-with-icon' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="aws-field-error-text">{error}</span>}
      {!error && helperText && <span className="aws-field-helper-text">{helperText}</span>}
    </div>
  );
});
