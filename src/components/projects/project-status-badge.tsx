import { ProjectStatus } from "@/types/project";
import { cn } from "@/lib/utils";

interface Props {
  status: ProjectStatus;
  className?: string;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  PLANNING: {
    label: "Planning",
    dotClass: "bg-blue-400",
    textClass: "text-blue-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dotClass: "bg-primary animate-pulse",
    textClass: "text-primary-hover",
  },
  ON_HOLD: {
    label: "On Hold",
    dotClass: "bg-amber-400",
    textClass: "text-amber-300",
  },
  COMPLETED: {
    label: "Completed",
    dotClass: "bg-semantic-success",
    textClass: "text-emerald-400",
  },
  ARCHIVED: {
    label: "Archived",
    dotClass: "bg-ink-tertiary",
    textClass: "text-ink-subtle",
  },
};

export function ProjectStatusBadge({ status, className }: Props) {
  const config = statusConfig[status] || statusConfig.PLANNING;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-mono font-medium tracking-tight select-none",
        config.textClass,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotClass)} />
      {config.label}
    </span>
  );
}
