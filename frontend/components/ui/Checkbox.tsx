'use client';

import React, { forwardRef } from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, className = '', ...props },
  ref
) {
  const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <label htmlFor={checkboxId} className={`aws-checkbox-wrap ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        id={checkboxId}
        className="aws-checkbox-input"
        {...props}
      />
      <span className="aws-checkbox-custom" />
      {label && <span className="aws-checkbox-label">{label}</span>}
    </label>
  );
});
