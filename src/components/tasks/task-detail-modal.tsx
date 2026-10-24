"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Edit2,
  Trash2,
  Calendar,
  FolderKanban,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { Task, TaskStatus } from "@/types/task";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskCheckbox } from "./task-checkbox";
import { usePatchTaskStatus, useDeleteTask } from "@/hooks/use-tasks";
import { sound } from "@/lib/audio";
import { formatDate, cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

interface Props {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dotColor: string; badgeClass: string }
> = {
  TODO: {
    label: "To Do",
    dotColor: "bg-blue-400",
    badgeClass: "bg-blue-500/10 border-blue-500/25 text-blue-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dotColor: "bg-primary animate-pulse",
    badgeClass: "bg-primary/10 border-primary/25 text-primary",
  },
  IN_REVIEW: {
    label: "In Review",
    dotColor: "bg-amber-400",
    badgeClass: "bg-amber-500/10 border-amber-500/25 text-amber-400",
  },
  DONE: {
    label: "Done",
    dotColor: "bg-semantic-success",
    badgeClass: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
  },
};

const ALL_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export function TaskDetailModal({ task, isOpen, onClose, onEdit }: Props) {
  const patchStatus = usePatchTaskStatus();
  const deleteTask = useDeleteTask();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keyboard shortcut Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sound.playClick(600);
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const isDone = task.status === "DONE";
  const currentStatusConfig = STATUS_CONFIG[task.status];

  const handleCheckboxToggle = (newChecked: boolean) => {
    patchStatus.mutate(
      {
        id: task.id,
        status: newChecked ? "DONE" : "TODO",
      },
      {
        onSuccess: () => {
          if (newChecked) {
            toast.success("Task completed!", {
              description: `"${task.title}" marked as done.`,
            });
          }
        },
      }
    );
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    sound.playClick(800);
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

  const handleCopyTitle = async () => {
    sound.playClick(900);
    try {
      await navigator.clipboard.writeText(task.title);
      setCopied(true);
      toast.success("Task title copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy title");
    }
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success("Task deleted", {
          description: `"${task.title}" has been removed.`,
        });
        setShowDeleteConfirm(false);
        onClose();
      },
    });
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            sound.playClick(600);
            onClose();
          }
        }}
      >
        <div
          className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-canvas border border-hairline-strong shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 select-text"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="px-5 py-3.5 bg-surface-1 border-b border-hairline flex items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {/* Status Badge */}
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                  currentStatusConfig.badgeClass
                )}
              >
                <span
                  className={cn("w-1.5 h-1.5 rounded-full shrink-0", currentStatusConfig.dotColor)}
                />
                <span>{currentStatusConfig.label}</span>
              </div>

              {/* Priority Badge */}
              <TaskPriorityBadge priority={task.priority} />

              {/* Project Badge */}
              {task.project && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-hairline text-xs font-mono text-ink-muted">
                  <FolderKanban className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate max-w-[160px]">{task.project.title}</span>
                </span>
              )}
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(850);
                    onEdit(task);
                  }}
                  title="Edit Task"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  sound.playClick(600);
                  onClose();
                }}
                title="Close (Esc)"
                className="p-1.5 rounded-md hover:bg-surface-2 text-ink-subtle hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* Title Section with Checkbox */}
            <div className="flex items-start gap-3">
              <div className="pt-1 shrink-0">
                <TaskCheckbox checked={isDone} onToggle={handleCheckboxToggle} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 group">
                  <h2
                    className={cn(
                      "text-lg sm:text-xl font-bold tracking-tight text-ink leading-snug break-words",
                      isDone && "line-through text-ink-tertiary"
                    )}
                  >
                    {task.title}
                  </h2>
                  <button
                    type="button"
                    onClick={handleCopyTitle}
                    title="Copy title"
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-2 text-ink-subtle hover:text-ink transition-all shrink-0 cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-semantic-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Status Pill Switcher */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary block mb-2">
                Update Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_STATUSES.map((st) => {
                  const cfg = STATUS_CONFIG[st];
                  const isCurrent = task.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={cn(
                        "py-1.5 px-2.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                        isCurrent
                          ? `${cfg.badgeClass} ring-1 ring-current font-semibold shadow-xs`
                          : "bg-surface-2/70 hover:bg-surface-3 border-hairline text-ink-subtle hover:text-ink"
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dotColor)} />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Task Description */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary block mb-2">
                Description & Notes
              </label>
              {task.description ? (
                <div className="rounded-xl bg-surface-1/70 border border-hairline p-4 sm:p-5 text-xs sm:text-sm text-ink-muted leading-relaxed whitespace-pre-wrap font-sans break-words select-text">
                  {task.description}
                </div>
              ) : (
                <div className="rounded-xl bg-surface-1/40 border border-dashed border-hairline/70 p-6 text-center text-xs text-ink-tertiary font-mono">
                  No additional notes or description provided for this task.
                </div>
              )}
            </div>

            {/* Metadata Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-hairline/60">
              {/* Due Date Card */}
              <div className="rounded-lg bg-surface-2/60 border border-hairline p-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-ink-tertiary" />
                  <span>Due Date</span>
                </span>
                <p className="text-xs font-medium text-ink">
                  {task.dueDate ? formatDate(task.dueDate) : "No due date set"}
                </p>
              </div>

              {/* Created On Card */}
              <div className="rounded-lg bg-surface-2/60 border border-hairline p-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-ink-tertiary" />
                  <span>Created</span>
                </span>
                <p className="text-xs font-medium text-ink">
                  {formatDate(task.createdAt)}
                </p>
              </div>

              {/* Project Card */}
              <div className="rounded-lg bg-surface-2/60 border border-hairline p-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5 mb-1">
                  <FolderKanban className="w-3 h-3 text-ink-tertiary" />
                  <span>Project</span>
                </span>
                <p className="text-xs font-medium text-ink truncate">
                  {task.project?.title || "Independent Task"}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer Bar */}
          <div className="px-5 py-3.5 bg-surface-1 border-t border-hairline flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                sound.playClick(600);
                setShowDeleteConfirm(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 text-xs font-medium text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Task</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(600);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
              >
                Close
              </button>

              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(850);
                    onEdit(task);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm shadow-primary/20 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Details</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        variant="danger"
        isLoading={deleteTask.isPending}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
