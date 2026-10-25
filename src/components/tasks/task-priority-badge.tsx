import React from "react";
import { Priority } from "@/types/task";
import { PriorityLabel } from "./priority-label";

interface Props {
  priority: Priority;
  showIcon?: boolean;
  className?: string;
}

export function TaskPriorityBadge({ priority, className }: Props) {
  return <PriorityLabel priority={priority} className={className} />;
}
