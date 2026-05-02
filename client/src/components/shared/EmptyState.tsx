import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <p className="text-gray-400 text-base mb-4">{message}</p>
      {action}
    </div>
  );
}
