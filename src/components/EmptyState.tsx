import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="border-[1.5px] border-dashed border-charcoal-200 rounded-lg bg-charcoal-50 p-12 text-center">
      <Icon className="w-8 h-8 text-charcoal-300 mx-auto" />
      <h3 className="font-sans font-bold text-lg text-charcoal-900 mt-4">{title}</h3>
      <p className="text-sm text-charcoal-500 mt-2 max-w-xs mx-auto">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
