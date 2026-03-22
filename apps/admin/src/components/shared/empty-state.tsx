import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-text-tertiary" strokeWidth={1.5} />
      </div>
      <h4 className="text-sm font-medium text-text-primary mb-1">{title}</h4>
      {description && (
        <p className="text-xs text-text-secondary max-w-[260px]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
