import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, subtitle, action, children, className = "" }: SectionProps) {
  return (
    <section className={`rounded-lg border border-border bg-surface p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-text-1">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11.5px] text-text-3">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
