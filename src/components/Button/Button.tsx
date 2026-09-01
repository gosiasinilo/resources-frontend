import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: IconProp;
  danger?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  icon,
  danger = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed';

  const variant = danger
    ? 'border border-orange-400/40 text-orange-400 hover:border-orange-700 hover:text-orange-700 '
    : 'bg-toplayer text-text hover:brightness-110 active:brightness-70';

  return (
    <button
      className={`${base} ${variant} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <FontAwesomeIcon icon={icon} className="text-xs" />}
      {children}
    </button>
  );
}
