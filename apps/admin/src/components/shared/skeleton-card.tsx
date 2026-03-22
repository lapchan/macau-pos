import { Card } from "./card";

export function SkeletonCard() {
  return (
    <Card>
      <div className="space-y-3">
        <div className="skeleton h-4 w-1/3 rounded-[var(--radius-sm)]" />
        <div className="skeleton h-3 w-2/3 rounded-[var(--radius-sm)]" />
        <div className="skeleton h-24 w-full rounded-[var(--radius-sm)] mt-2" />
      </div>
    </Card>
  );
}
