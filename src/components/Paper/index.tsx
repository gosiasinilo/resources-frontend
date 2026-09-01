import type { ReactNode } from 'react';

interface PaperProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}


export default function Paper({ children, className = '', padded = false }: PaperProps) {
  return (
    <div
      className={`bg-paper border border-border rounded ${padded ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
