"use client";

import { useState } from "react";
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

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskListRow({ task, onEdit }: Props) {
  const patchStatus = usePatchTaskStatus();
  const deleteTask = useDeleteTask();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDone = task.status === "DONE";

  const handleCheckboxToggle = (newChecked: boolean) => {
    patchStatus.mutate({
      id: task.id,
      status: newChecked ? "DONE" : "TODO",
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    patchStatus.mutate({
      id: task.id,
      status: e.target.value as TaskStatus,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (confirm(`Delete task "${task.title}"?`)) {
      deleteTask.mutate(task.id);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between px-4 py-2.5 bg-surface-1 border-b border-hairline hover:bg-surface-2 transition-colors duration-150 text-xs",
        isDone && "opacity-75"
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
            onClick={() => {
              sound.playClick();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded hover:bg-surface-3 text-ink-subtle hover:text-ink transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-32 rounded-md bg-surface-2 border border-hairline-strong shadow-xl z-30 py-1 text-xs">
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
    </div>
  );
}
