"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  FolderKanban,
  MoreVertical,
  Trash2,
  Edit2,
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
}

export function TaskListRow({ task, onEdit }: Props) {
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

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    patchStatus.mutate({
      id: task.id,
      status: e.target.value as TaskStatus,
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
      const menuHeight = 90;
      const menuWidth = 128;
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

  return (
    <div
      className={cn(
        "group flex items-center justify-between px-4 py-2.5 bg-surface-1 border-b border-hairline hover:bg-surface-2 transition-colors duration-150 text-xs first:rounded-t-lg last:rounded-b-lg last:border-b-0",
        isDone && "opacity-75",
        menuOpen ? "relative z-30" : "relative z-0"
      )}
    >
      {/* Left: Checkbox, Title, Project */}
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
        <TaskCheckbox checked={isDone} onToggle={handleCheckboxToggle} />

        <div className="flex flex-col min-w-0 flex-1">
          <span
            className={cn(
              "font-medium tracking-[-0.1px] text-ink truncate group-hover:text-white",
              isDone && "line-through text-ink-tertiary"
            )}
          >
            {task.title}
          </span>
          {task.description && (
            <span className="text-[11px] text-ink-tertiary truncate">
              {task.description}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Project Pill & Priority */}
      <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0 mr-4">
        {task.project && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-3 border border-hairline font-mono text-[11px] text-ink-muted truncate max-w-[130px]">
            <FolderKanban className="w-2.5 h-2.5 text-primary" />
            <span className="truncate">{task.project.title}</span>
          </span>
        )}
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {/* Right: Status Selector, Due Date, Menu */}
      <div className="flex items-center gap-3 flex-shrink-0 text-ink-subtle">
        {/* Quick Status Select */}
        <select
          value={task.status}
          onChange={handleStatusChange}
          className="text-[11px] font-mono px-2 py-1 rounded bg-surface-2 border border-hairline text-ink focus:outline-none focus:border-primary"
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>

        {task.dueDate && (
          <span className="hidden md:inline-flex items-center gap-1 font-mono text-[11px] text-ink-tertiary">
            <Calendar className="w-3 h-3" />
            {formatDate(task.dueDate)}
          </span>
        )}

        {/* Context Menu */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={handleToggleMenu}
            className={cn(
              "p-1 rounded hover:bg-surface-3 text-ink-subtle hover:text-ink transition-colors cursor-pointer",
              menuOpen && "bg-surface-3 text-ink"
            )}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
              width: "128px",
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg bg-surface-2 border border-hairline-strong shadow-2xl py-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          >
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
