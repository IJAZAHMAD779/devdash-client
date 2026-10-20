"use client";

import { useState } from "react";
import {
  Calendar,
  FolderKanban,
  MoreVertical,
  Trash2,
  Edit2,
  ArrowRight,
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

const ALL_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "IN_REVIEW", label: "In Review" },
  { id: "DONE", label: "Done" },
];

export function TaskCard({ task, onEdit }: Props) {
  const patchStatus = usePatchTaskStatus();
  const deleteTask = useDeleteTask();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    patchStatus.mutate({
      id: task.id,
      status: newStatus,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
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

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group relative p-3.5 rounded-lg bg-surface-1 border border-hairline hover:border-hairline-strong hover:bg-surface-2/70 transition-all duration-150 cursor-grab active:cursor-grabbing shadow-sm",
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
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-3 text-ink-subtle hover:text-ink transition-all"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-36 rounded-md bg-surface-2 border border-hairline-strong shadow-xl z-30 py-1 text-xs">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(task);
                      }}
                      className="w-full px-3 py-1.5 text-left text-ink hover:bg-surface-3 flex items-center gap-2"
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
                          className="w-full px-3 py-1 text-left text-ink-muted hover:text-ink hover:bg-surface-3 flex items-center justify-between text-[11px]"
                        >
                          <span>{statusItem.label}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-ink-tertiary" />
                        </button>
                      )
                    )}

                    <div className="border-t border-hairline my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-surface-3 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </>
              )}
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
