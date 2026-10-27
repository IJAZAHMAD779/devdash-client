"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Loader2, Calendar } from "lucide-react";
import { useCreateTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { TaskStatus, Priority } from "@/types/task";
import { StatusDot, STATUS_CONFIG, ALL_TASK_STATUSES } from "./status-dot";
import { PriorityLabel, ALL_PRIORITIES } from "./priority-label";
import { PropertyPopover } from "./property-popover";
import { sound } from "@/lib/audio";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface NewTaskModalProps {
  isOpen: boolean;
  defaultStatus?: TaskStatus;
  defaultProjectId?: string;
  onClose: () => void;
}

export function NewTaskModal({
  isOpen,
  defaultStatus = "TODO",
  defaultProjectId,
  onClose,
}: NewTaskModalProps) {
  const createTask = useCreateTask();
  const { data: projects } = useProjects();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [isReminderPickerOpen, setIsReminderPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const reminderDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setProjectId(defaultProjectId || "");
      setStatus(defaultStatus);
      setPriority("MEDIUM");
      setDueDate("");
      setError(null);
      setIsReminderPickerOpen(false);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultStatus, defaultProjectId]);

  // Handle Ctrl+Enter to submit, Esc to cancel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sound.playClick(600);
        onClose();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, title, description, projectId, status, priority, dueDate]);

  // Close reminder picker on click outside
  useEffect(() => {
    if (!isReminderPickerOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (reminderDropdownRef.current && !reminderDropdownRef.current.contains(e.target as Node)) {
        setIsReminderPickerOpen(false);
      }
    };
    window.addEventListener("pointerdown", handleOutside);
    return () => window.removeEventListener("pointerdown", handleOutside);
  }, [isReminderPickerOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setError(null);
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId: projectId || null,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });

      toast.success("Task created", {
        description: `"${title.trim()}" added to ${STATUS_CONFIG[status].label}.`,
      });
      onClose();
    } catch (err: any) {
      const msg = err.message || "Failed to create task";
      setError(msg);
      toast.error("Failed to create task", { description: msg });
    }
  };

  const statusOptions = ALL_TASK_STATUSES.map((st) => ({
    value: st,
    label: STATUS_CONFIG[st].label,
    icon: <StatusDot status={st} />,
  }));

  const priorityOptions = ALL_PRIORITIES.map((p) => ({
    value: p,
    label: p === "URGENT" ? "Urgent" : p === "HIGH" ? "High" : p === "MEDIUM" ? "Medium" : "Low",
    icon: <PriorityLabel priority={p} showLabel={false} />,
  }));

  const projectOptions = [
    { value: "", label: "No project" },
    ...(projects || []).map((p) => ({
      value: p.id,
      label: p.title,
    })),
  ];

  const selectedProjectObj = projects?.find((p) => p.id === projectId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick(600);
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-[560px] max-h-[calc(100dvh-2rem)] rounded-[8px] bg-surface-1 border border-line-strong shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-11 px-5 border-b border-line flex items-center justify-between shrink-0 select-none">
          <span
            id="create-task-heading"
            className="text-xs font-mono uppercase tracking-[0.08em] text-subtle font-medium"
          >
            New Task
          </span>
          <button
            type="button"
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            className="p-1.5 rounded-[4px] text-subtle hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-[6px] bg-danger/10 border border-danger/25 text-danger text-xs font-mono">
              {error}
            </div>
          )}

          {/* Large Title Input (18px, borderless with accent underline on focus) */}
          <div className="relative">
            <input
              ref={titleInputRef}
              type="text"
              required
              placeholder="e.g. Implement Clerk session token injection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base sm:text-lg font-semibold tracking-[-0.3px] text-text-primary bg-transparent placeholder:text-subtle/60 focus:outline-none pb-2 border-b border-line focus:border-accent transition-colors"
            />
          </div>

          {/* Description Textarea (borderless, markdown hint) */}
          <div>
            <textarea
              rows={3}
              placeholder="Description or notes (Markdown supported)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs font-mono text-muted placeholder:text-subtle/50 bg-transparent focus:outline-none resize-none leading-relaxed"
            />
            <div className="text-[10px] font-mono text-subtle/70">
              Markdown supported
            </div>
          </div>

          {/* Properties Row: 4 Popover Triggers on one line */}
          <div className="pt-2 border-t border-line flex flex-wrap items-center gap-2">
            {/* Project Popover */}
            <PropertyPopover
              value={projectId}
              onChange={setProjectId}
              options={projectOptions}
              renderTrigger={() => (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-7 px-2 rounded-[4px] bg-surface-2 hover:bg-surface-3 border border-line text-xs font-mono text-muted hover:text-text-primary transition-colors cursor-pointer truncate max-w-[140px]"
                >
                  <span className="text-subtle">Proj:</span>
                  <span className="truncate">
                    {selectedProjectObj ? selectedProjectObj.title : "No project"}
                  </span>
                </button>
              )}
            />

            {/* Priority Popover */}
            <PropertyPopover<Priority>
              value={priority}
              onChange={setPriority}
              options={priorityOptions}
              renderTrigger={() => (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-7 px-2 rounded-[4px] bg-surface-2 hover:bg-surface-3 border border-line text-xs font-mono text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <PriorityLabel priority={priority} />
                </button>
              )}
            />

            {/* Status Popover */}
            <PropertyPopover<TaskStatus>
              value={status}
              onChange={setStatus}
              options={statusOptions}
              renderTrigger={() => (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-7 px-2 rounded-[4px] bg-surface-2 hover:bg-surface-3 border border-line text-xs font-mono text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <StatusDot status={status} />
                  <span>{STATUS_CONFIG[status].label}</span>
                </button>
              )}
            />

            {/* Reminder Date Trigger (Popover with date picker) */}
            <div ref={reminderDropdownRef} className="relative inline-block">
              <button
                type="button"
                onClick={() => setIsReminderPickerOpen((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-2 rounded-[4px] bg-surface-2 hover:bg-surface-3 border border-line text-xs font-mono text-muted hover:text-text-primary transition-colors cursor-pointer",
                  dueDate && "text-text-primary font-medium"
                )}
              >
                <Calendar className="w-3 h-3 text-subtle" />
                <span>{dueDate ? formatDate(dueDate) : "Set reminder"}</span>
              </button>

              {isReminderPickerOpen && (
                <div className="absolute left-0 bottom-8 z-50 p-2.5 rounded-[6px] bg-surface-1 border border-line-strong shadow-2xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100">
                  <span className="text-[10px] font-mono uppercase text-subtle">
                    Reminder Date
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setIsReminderPickerOpen(false);
                    }}
                    className="px-2 py-1 rounded-[4px] bg-surface-2 border border-line text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setDueDate("");
                        setIsReminderPickerOpen(false);
                      }}
                      className="text-[10px] font-mono text-subtle hover:text-text-primary text-left underline"
                    >
                      Clear reminder
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="pt-3 border-t border-line flex items-center justify-between gap-3">
            <span className="hidden sm:inline-flex text-[11px] font-mono text-subtle">
              Press <kbd className="bg-surface-2 px-1 rounded-[3px] border border-line mx-1">⌘+Enter</kbd> to save
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(600);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-[6px] text-xs font-mono text-subtle hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createTask.isPending || !title.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shadow-sm shadow-accent/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {createTask.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
