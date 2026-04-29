interface StatusBadgeProps {
  status: string;
}

const LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  awaiting_completion: 'Awaiting Confirmation',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
  // Accept already-formatted values too
  Pending: 'Pending',
  'In Progress': 'In Progress',
  'Awaiting Confirmation': 'Awaiting Confirmation',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  Disputed: 'Disputed',
};

const COLORS: Record<string, string> = {
  Pending: 'bg-charcoal-50 text-charcoal-600 border-charcoal-200',
  'In Progress': 'bg-honey-50 text-honey-800 border-honey-200',
  'Awaiting Confirmation': 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
  Disputed: 'bg-orange-50 text-orange-700 border-orange-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = LABELS[status] ?? status;
  const color = COLORS[label] ?? 'bg-charcoal-50 text-charcoal-600 border-charcoal-200';

  return (
    <span
      className={`text-xs font-bold font-sans px-2.5 py-0.5 rounded-full border ${color}`}
    >
      {label}
    </span>
  );
}
