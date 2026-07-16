import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

interface TrendProps {
  direction?: "up" | "down" | "neutral";
  children: React.ReactNode;
  className?: string;
}

const ICON = { up: ArrowUp, down: ArrowDown, neutral: ArrowRight };
const COLOR = {
  up: "text-success-foreground",
  down: "text-danger-foreground",
  neutral: "text-text-3",
};

export function Trend({ direction = "neutral", children, className = "" }: TrendProps) {
  const Icon = ICON[direction];
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] font-semibold ${COLOR[direction]} ${className}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
      {children}
    </span>
  );
}
