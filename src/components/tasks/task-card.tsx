"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Trash2,
  Edit2,
  FolderKanban,
} from "lucide-react";
import { Task, TaskStatus } from "@/types/task";
import { TaskCheckbox } from "./task-checkbox";
import { PriorityLabel } from "./priority-label";
import { ReminderLabel } from "./reminder-label";
import { stripMarkdown } from "./task-utils";
import { usePatchTaskStatus, useDeleteTask } from "@/hooks/use-tasks";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onView }: TaskCardProps) {
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

  // Exact HTML5 Drag handler preserved
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking an interactive button, checkbox or menu, ignore
    if ((e.target as HTMLElement).closest("button, input, [role='button'], [role='menu']")) return;
    sound.playClick(800);
    if (onView) {
      onView(task);
    } else {
      onEdit(task);
    }
  };

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

  // If Done: Single dimmed line with strikethrough, hover reveals project
  if (isDone) {
    return (
      <>
        <div
          draggable
          onDragStart={handleDragStart}
          onClick={handleCardClick}
          className="group relative p-2.5 rounded-[8px] bg-surface-1/40 border border-line hover:border-line-strong hover:bg-surface-2 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0">
              <TaskCheckbox checked={true} onToggle={handleCheckboxToggle} />
            </div>

            <span className="flex-1 min-w-0 text-xs text-subtle line-through truncate font-normal">
              {task.title}
            </span>

            {task.project && (
              <span className="hidden group-hover:inline-block text-[10px] font-mono text-subtle shrink-0 truncate max-w-[100px]">
                {task.project.title}
              </span>
            )}
          </div>
        </div>

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

  // Active Card: 8px radius, 12px padding, title + 1 line stripped description + meta line
  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onClick={handleCardClick}
        className="group relative p-3 rounded-[8px] bg-surface-1 border border-line hover:border-line-strong hover:bg-surface-2 transition-colors cursor-pointer select-none shadow-xs"
      >
        <div className="flex items-start gap-2.5">
          {/* Subtle 16px checkbox visible on hover/focus-within and mobile */}
          <div className="shrink-0 pt-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
            <TaskCheckbox checked={false} onToggle={handleCheckboxToggle} />
          </div>

          {/* Main Card Content */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Title (14px, medium weight, max 2 lines) */}
            <div className="flex items-start justify-between gap-1.5">
              <h4 className="text-[13px] sm:text-sm font-medium text-text-primary leading-snug line-clamp-2">
                {task.title}
              </h4>

              {/* Context Menu Trigger */}
              <div ref={menuRef} className="relative shrink-0 -mr-1 -mt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick(600);
                    setMenuOpen((prev) => !prev);
                  }}
                  title="More actions"
                  className={cn(
                    "p-1 rounded-[4px] text-subtle hover:text-text-primary hover:bg-surface-3 transition-colors cursor-pointer opacity-0 group-hover:opacity-100",
                    menuOpen && "opacity-100 bg-surface-3 text-text-primary"
                  )}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-6 z-50 w-32 rounded-[6px] bg-surface-1 border border-line-strong shadow-xl py-1 text-xs font-mono animate-in fade-in zoom-in-95 duration-100 select-none"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick(700);
                        setMenuOpen(false);
                        onEdit(task);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-muted hover:text-text-primary hover:bg-surface-2 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-subtle" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick(600);
                        setMenuOpen(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-danger hover:bg-danger/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-danger" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Description (1 line stripped markdown) */}
            {strippedDescription && (
              <p className="text-xs text-subtle line-clamp-1">
                {strippedDescription}
              </p>
            )}

            {/* Meta Line (Mono 11px, text-3: Priority, Project, Reminder) */}
            <div className="pt-1.5 flex items-center gap-2.5 text-[11px] font-mono text-subtle flex-wrap">
              <PriorityLabel priority={task.priority} />

              {task.project && (
                <>
                  <span className="text-line-strong">•</span>
                  <span className="truncate max-w-[120px] text-muted font-normal">
                    {task.project.title}
                  </span>
                </>
              )}

              {task.dueDate && (
                <>
                  <span className="text-line-strong">•</span>
                  <ReminderLabel date={task.dueDate} />
                </>
              )}
            </div>
          </div>
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
