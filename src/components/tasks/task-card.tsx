"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  FolderKanban,
  MoreVertical,
  Trash2,
  Edit2,
  ArrowRight,
  Eye,
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
  task: Task;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
}

const ALL_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "IN_REVIEW", label: "In Review" },
  { id: "DONE", label: "Done" },
];

export function TaskCard({ task, onEdit, onView }: Props) {
  const patchStatus = usePatchTaskStatus();
  const deleteTask = useDeleteTask();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close context menu on scroll or resize
  useEffect(() => {
    if (!menuOpen) return;
    const handleClose = () => {
      setMenuOpen(false);
      setMenuPosition(null);
    };
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [menuOpen]);


  const isDone = task.status === "DONE";

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
    setMenuOpen(false);
    setMenuPosition(null);
    patchStatus.mutate({
      id: task.id,
      status: newStatus,
    });
  };

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    if (menuOpen) {
      setMenuOpen(false);
      setMenuPosition(null);
    } else if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 180;
      const menuWidth = 144;
      const openUpwards =
        rect.bottom + menuHeight > window.innerHeight && rect.top > menuHeight;
      const top = openUpwards ? rect.top - menuHeight - 4 : rect.bottom + 4;
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }
      setMenuPosition({ top, left });
      setMenuOpen(true);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setMenuPosition(null);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Task deleted", {
        description: `"${task.title}" has been removed.`,
      });
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking an interactive button, checkbox or menu, ignore
    if ((e.target as HTMLElement).closest("button, input, [role='menu']")) return;
    sound.playClick(800);
    if (onView) {
      onView(task);
    } else {
      onEdit(task);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleCardClick}
      className={cn(
        "group relative p-3.5 rounded-lg bg-surface-1 border border-hairline hover:border-primary/50 hover:shadow-[0_0_20px_-4px_rgba(37,99,235,0.15)] hover:bg-surface-2/70 transition-all duration-150 cursor-pointer shadow-sm select-none",
        isDone && "opacity-75"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Animated Checkbox */}
        <div className="pt-0.5">
          <TaskCheckbox checked={isDone} onToggle={handleCheckboxToggle} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-xs font-medium tracking-[-0.2px] text-ink leading-snug line-clamp-2",
                isDone && "line-through text-ink-tertiary"
              )}
            >
              {task.title}
            </span>

            {/* Context Menu Trigger */}
            <div className="relative flex-shrink-0">
              <button
                ref={buttonRef}
                type="button"
                onClick={handleToggleMenu}
                className={cn(
                  "p-1 rounded hover:bg-surface-3 text-ink-subtle hover:text-ink transition-all cursor-pointer",
                  menuOpen
                    ? "opacity-100 bg-surface-3 text-ink"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-[11px] text-ink-subtle line-clamp-2 mt-1 leading-normal">
              {task.description}
            </p>
          )}

          {/* Footer Metadata: Priority, Project, Due Date */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-hairline/40 text-[10px] text-ink-subtle">
            <TaskPriorityBadge priority={task.priority} />

            {task.project && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-3 border border-hairline font-mono text-ink-muted truncate max-w-[120px]">
                <FolderKanban className="w-2.5 h-2.5 text-primary" />
                <span className="truncate">{task.project.title}</span>
              </span>
            )}

            {task.dueDate && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-ink-subtle ml-auto"
                title={`Due ${formatDate(task.dueDate)}`}
              >
                <Calendar className="w-2.5 h-2.5 text-ink-tertiary" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Portal-based floating context menu: never clipped by Kanban column overflow */}
      {menuOpen && menuPosition && typeof document !== "undefined" && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              setMenuPosition(null);
            }}
          />
          <div
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: "144px",
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-md bg-surface-2 border border-hairline-strong shadow-2xl py-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                setMenuPosition(null);
                sound.playClick(800);
                if (onView) {
                  onView(task);
                } else {
                  onEdit(task);
                }
              }}
              className="w-full px-3 py-1.5 text-left text-ink hover:bg-surface-3 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Eye className="w-3 h-3 text-primary" />
              View Details
            </button>

            <button
              onClick={() => {
                setMenuOpen(false);
                setMenuPosition(null);
                onEdit(task);
              }}
              className="w-full px-3 py-1.5 text-left text-ink hover:bg-surface-3 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Edit2 className="w-3 h-3 text-ink-subtle" />
              Edit
            </button>

            <div className="border-t border-hairline my-1 px-3 py-1 text-[10px] font-mono uppercase text-ink-tertiary">
              Move To:
            </div>
            {ALL_STATUSES.filter((s) => s.id !== task.status).map(
              (statusItem) => (
                <button
                  key={statusItem.id}
                  onClick={() => handleStatusChange(statusItem.id)}
                  className="w-full px-3 py-1 text-left text-ink-muted hover:text-ink hover:bg-surface-3 flex items-center justify-between text-[11px] cursor-pointer transition-colors"
                >
                  <span>{statusItem.label}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-ink-tertiary" />
                </button>
              )
            )}

            <div className="border-t border-hairline my-1" />
            <button
              onClick={handleDelete}
              className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </>,
        document.body
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        description={`Are you sure you want to delete task "${task.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        variant="danger"
        isLoading={deleteTask.isPending}
      />
    </div>
  );
}

