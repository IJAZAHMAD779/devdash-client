"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Trash2,
  Edit2,
  Calendar,
  FolderKanban,
} from "lucide-react";
import { Task, TaskStatus } from "@/types/task";
import { TaskCheckbox } from "./task-checkbox";
import { StatusDot, STATUS_CONFIG, ALL_TASK_STATUSES } from "./status-dot";
import { PriorityLabel } from "./priority-label";
import { ReminderLabel } from "./reminder-label";
import { PropertyPopover } from "./property-popover";
import { stripMarkdown } from "./task-utils";
import { usePatchTaskStatus, useDeleteTask } from "@/hooks/use-tasks";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

interface TaskListRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
}

export function TaskListRow({ task, onEdit, onView }: TaskListRowProps) {
  const patchStatus = usePatchTaskStatus();
  const deleteTask = useDeleteTask();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDone = task.status === "DONE";
  const strippedDescription = stripMarkdown(task.description);

  // Close context menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", handleClick);
    return () => window.removeEventListener("pointerdown", handleClick);
  }, [menuOpen]);

  const handleCheckboxToggle = (newChecked: boolean) => {
    patchStatus.mutate(
      {
        id: task.id,
        status: newChecked ? "DONE" : "TODO",
      },
      {
        onSuccess: () => {
          if (newChecked) {
            toast.success("Task completed", {
              description: `"${task.title}" marked as done.`,
            });
          }
        },
      }
    );
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    patchStatus.mutate(
      {
        id: task.id,
        status: newStatus,
      },
      {
        onSuccess: () => {
          toast.success("Status updated", {
            description: `Moved to ${STATUS_CONFIG[newStatus].label}.`,
          });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success("Task deleted", {
          description: `"${task.title}" has been removed.`,
        });
        setShowDeleteConfirm(false);
      },
    });
  };

  const statusOptions = ALL_TASK_STATUSES.map((st) => ({
    value: st,
    label: STATUS_CONFIG[st].label,
    icon: <StatusDot status={st} />,
  }));

  return (
    <>
      <div
        onClick={(e) => {
          // If clicking an interactive element, ignore row click
          if ((e.target as HTMLElement).closest("button, input, [role='button'], [role='menu']")) return;
          sound.playClick(800);
          onView(task);
        }}
        className={cn(
          "group h-11 px-3 sm:px-4 flex items-center gap-3 border-b border-line hover:bg-surface-2/60 transition-colors cursor-pointer select-none text-xs",
          isDone && "bg-surface-1/30"
        )}
      >
        {/* Checkbox (16px, 4px radius) */}
        <div className="shrink-0 pt-0.5">
          <TaskCheckbox checked={isDone} onToggle={handleCheckboxToggle} />
        </div>

        {/* Title + One-Line Stripped Description */}
        <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "font-medium text-text-primary tracking-[-0.1px] truncate",
                isDone && "line-through text-subtle"
              )}
            >
              {task.title}
            </span>
            {strippedDescription && (
              <span className="hidden lg:inline text-subtle text-[11px] truncate">
                — {strippedDescription}
              </span>
            )}
          </div>
          {/* Mobile subline: project & reminder at narrow widths */}
          <div className="flex sm:hidden items-center gap-2 text-[10px] text-subtle font-mono truncate mt-0.5">
            {task.project && <span>{task.project.title}</span>}
            {task.dueDate && <span>• {task.dueDate.split("T")[0]}</span>}
          </div>
        </div>

        {/* Project Column (Fixed Width: 120px) */}
        <div className="hidden sm:block w-[120px] shrink-0 text-muted font-mono truncate">
          {task.project ? (
            <span className="truncate" title={task.project.title}>
              {task.project.title}
            </span>
          ) : (
            <span className="text-subtle">—</span>
          )}
        </div>

        {/* Priority Column (Fixed Width: 80px) */}
        <div className="hidden sm:block w-[80px] shrink-0">
          <PriorityLabel priority={task.priority} />
        </div>

        {/* Reminder Column (Fixed Width: 100px) */}
        <div className="hidden md:block w-[100px] shrink-0">
          {task.dueDate ? (
            <ReminderLabel date={task.dueDate} />
          ) : (
            <span className="text-subtle font-mono">—</span>
          )}
        </div>

        {/* Status Popover Column (Fixed Width: 110px) */}
        <div className="shrink-0 w-[105px]">
          <PropertyPopover<TaskStatus>
            value={task.status}
            onChange={handleStatusChange}
            options={statusOptions}
            renderTrigger={(selected, isOpen) => (
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] font-mono text-[11px] transition-colors hover:bg-surface-3",
                  isOpen ? "bg-surface-3 text-text-primary" : "text-muted"
                )}
              >
                <StatusDot status={task.status} />
                <span>{STATUS_CONFIG[task.status].label}</span>
              </button>
            )}
          />
        </div>

        {/* Actions Menu (Fixed Width: 28px) */}
        <div ref={menuRef} className="relative shrink-0 w-7 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick(600);
              setMenuOpen((prev) => !prev);
            }}
            title="Task actions"
            className={cn(
              "p-1 rounded-[4px] text-subtle hover:text-text-primary hover:bg-surface-3 transition-colors cursor-pointer",
              menuOpen && "bg-surface-3 text-text-primary"
            )}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-7 z-50 w-36 rounded-[6px] bg-surface-1 border border-line-strong shadow-xl py-1 text-xs font-mono animate-in fade-in zoom-in-95 duration-100 select-none"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick(700);
                  setMenuOpen(false);
                  onEdit(task);
                }}
                className="w-full px-2.5 py-1.5 text-left text-muted hover:text-text-primary hover:bg-surface-2 flex items-center gap-2 cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-subtle" />
                <span>Edit details</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick(600);
                  setMenuOpen(false);
                  setShowDeleteConfirm(true);
                }}
                className="w-full px-2.5 py-1.5 text-left text-danger hover:bg-danger/10 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-danger" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        confirmText="Delete Task"
        variant="danger"
        isLoading={deleteTask.isPending}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
