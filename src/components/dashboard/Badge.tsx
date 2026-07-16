import type { ReactNode } from "react";

const TONE_CLASSES = {
  accent: "bg-accent/10 text-accent border-accent/25",
  success: "bg-success/10 text-success-foreground border-success/25",
  danger: "bg-danger/10 text-danger-foreground border-danger/25",
  warning: "bg-warning/10 text-warning-foreground border-warning/25",
  info: "bg-info/10 text-info-foreground border-info/25",
  neutral: "bg-white/5 text-text-2 border-border-strong",
} as const;

export type BadgeTone = keyof typeof TONE_CLASSES;

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
