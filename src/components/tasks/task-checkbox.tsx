"use client";

import { cn } from "@/lib/utils";

interface Props {
  checked: boolean;
  onToggle: (newChecked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function TaskCheckbox({
  checked,
  onToggle,
  className,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!checked);
      }}
      className={cn("t-check", className)}
      title={checked ? "Mark task as incomplete" : "Mark task as complete"}
    >
      <svg viewBox="0 0 10.1668 10.1668" fill="none">
        <path d="M1 5.52L3.92 9.17L9.17 1" />
      </svg>
    </button>
  );
}
