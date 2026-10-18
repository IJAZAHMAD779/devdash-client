"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { Task, TaskStatus, Priority } from "@/types/task";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface Props {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTaskModal({ task, isOpen, onClose }: Props) {
  const updateTask = useUpdateTask();
  const { data: projects } = useProjects();

  const [isClosing, setIsClosing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || "");
      setProjectId(task.projectId || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
      setError(null);
      setIsClosing(false);
    }
  }, [task, isOpen]);

  const handleClose = () => {
    sound.playClick(600);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setError(null);
      await updateTask.mutateAsync({
        id: task.id,
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          projectId: projectId || null,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        },
      });

      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to update task");
    }
  };

  if (!isOpen && !isClosing) return null;
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "t-modal relative w-full max-w-md rounded-xl bg-surface-1 border border-hairline-strong shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]",
          isOpen && !isClosing && "is-open",
          isClosing && "is-closing"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-surface-2/40">
          <span className="text-sm font-semibold tracking-[-0.4px] text-ink">
            Edit Task
          </span>
          <button
            onClick={handleClose}
            className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-mono text-ink-muted">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-ink-muted">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-ink-muted">Assign to Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
            >
              <option value="">No Project (Standalone Task)</option>
              {projects?.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-ink-muted">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-ink-muted">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-ink-muted">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-4 border-t border-hairline flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-md bg-surface-2 border border-hairline text-ink hover:bg-surface-3 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTask.isPending || !title.trim()}
              className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
            >
              {updateTask.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
