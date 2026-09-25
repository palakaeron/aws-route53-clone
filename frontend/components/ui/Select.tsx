'use client';

import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: (SelectOption | string)[];
  children?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helperText, options, children, id, className = '', ...props },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`aws-field ${error ? 'aws-field-error' : ''}`}>
      {label && (
        <label htmlFor={selectId} className="aws-label">
          {label}
          {props.required && <span className="aws-required">*</span>}
        </label>
      )}
      <select ref={ref} id={selectId} className={`aws-select ${className}`} {...props}>
        {options
          ? options.map((opt) => {
              const value = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const disabled = typeof opt === 'string' ? false : opt.disabled;
              return (
                <option key={value} value={value} disabled={disabled}>
                  {optLabel}
                </option>
              );
            })
          : children}
      </select>
      {error && <span className="aws-field-error-text">{error}</span>}
      {!error && helperText && <span className="aws-field-helper-text">{helperText}</span>}
    </div>
  );
});
