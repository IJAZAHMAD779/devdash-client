import { ProjectStatus } from "@/types/project";
import { cn } from "@/lib/utils";

interface Props {
  status: ProjectStatus;
  className?: string;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; dotClass: string; bgClass: string; textClass: string }
> = {
  PLANNING: {
    label: "Planning",
    dotClass: "bg-blue-400",
    bgClass: "bg-blue-500/10 border-blue-500/20",
    textClass: "text-blue-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dotClass: "bg-primary animate-pulse",
    bgClass: "bg-primary/10 border-primary/20",
    textClass: "text-primary-hover",
  },
  ON_HOLD: {
    label: "On Hold",
    dotClass: "bg-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    textClass: "text-amber-300",
  },
  COMPLETED: {
    label: "Completed",
    dotClass: "bg-semantic-success",
    bgClass: "bg-semantic-success/10 border-semantic-success/20",
    textClass: "text-emerald-400",
  },
  ARCHIVED: {
    label: "Archived",
    dotClass: "bg-ink-tertiary",
    bgClass: "bg-surface-3 border-hairline",
    textClass: "text-ink-subtle",
  },
};

export function ProjectStatusBadge({ status, className }: Props) {
  const config = statusConfig[status] || statusConfig.PLANNING;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono border tracking-tight select-none",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  );
}
