import { Priority } from "@/types/task";
import { AlertCircle, Flame, SignalLow, SignalMedium } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  priority: Priority;
  showIcon?: boolean;
  className?: string;
}

const config: Record<
  Priority,
  { label: string; textClass: string; bgClass: string; icon: any }
> = {
  LOW: {
    label: "Low",
    textClass: "text-ink-subtle",
    bgClass: "bg-surface-3 border-hairline",
    icon: SignalLow,
  },
  MEDIUM: {
    label: "Medium",
    textClass: "text-blue-400",
    bgClass: "bg-blue-500/10 border-blue-500/20",
    icon: SignalMedium,
  },
  HIGH: {
    label: "High",
    textClass: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    icon: AlertCircle,
  },
  URGENT: {
    label: "Urgent",
    textClass: "text-rose-400",
    bgClass: "bg-rose-500/10 border-rose-500/20",
    icon: Flame,
  },
};

export function TaskPriorityBadge({ priority, showIcon = true, className }: Props) {
  const item = config[priority] || config.MEDIUM;
  const Icon = item.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border tracking-tight uppercase select-none",
        item.bgClass,
        item.textClass,
        className
      )}
    >
      {showIcon && <Icon className="w-2.5 h-2.5" />}
      {item.label}
    </span>
  );
}
