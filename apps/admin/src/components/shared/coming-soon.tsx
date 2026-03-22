import { PageHeader } from "./page-header";
import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <>
      <PageHeader title={title} />
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-[var(--radius-lg)] bg-surface-hover flex items-center justify-center mb-5">
          <Construction className="h-8 w-8 text-text-tertiary" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          Coming soon
        </h2>
        <p className="text-sm text-text-secondary max-w-sm">
          {description || `The ${title} module is under development. Check back soon.`}
        </p>
      </div>
    </>
  );
}
