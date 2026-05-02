import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: Props) {
  return (
    <div className={`max-w-lg mx-auto px-4 pt-4 pb-24 ${className}`}>
      {children}
    </div>
  );
}
