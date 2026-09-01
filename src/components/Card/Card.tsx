import type { ReactNode, MouseEventHandler } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  active?: boolean;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = '',
  onClick,
  active = false,
  hoverable = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-paper border rounded-none overflow-hidden transition-all
        ${active ? 'border-highlight/50 bg-toplayer/20' : 'border-border'}
        ${hoverable ? 'cursor-pointer hover:border-secondary/40 hover:bg-paper/80' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
