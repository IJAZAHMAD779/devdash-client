"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MoreHorizontal,
  Trash2,
  Calendar,
  Check,
  Edit3,
} from "lucide-react";
import { Task, TaskStatus, Priority } from "@/types/task";
import { TaskCheckbox } from "./task-checkbox";
import { StatusDot, STATUS_CONFIG, ALL_TASK_STATUSES } from "./status-dot";
import { PriorityLabel, ALL_PRIORITIES } from "./priority-label";
import { ReminderLabel } from "./reminder-label";
import { PropertyPopover } from "./property-popover";
import { MarkdownContent } from "./markdown-content";
import { usePatchTaskStatus, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { sound } from "@/lib/audio";
import { formatDate, cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
}: TaskDetailModalProps) {
  const patchStatus = usePatchTaskStatus();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: projects } = useProjects();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");

  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync state when task changes
  useEffect(() => {
    if (task && isOpen) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || "");
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      setMenuOpen(false);
    }
  }, [task, isOpen]);

  // Focus title input when edit mode starts
  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  // Focus description textarea when edit mode starts
  useEffect(() => {
    if (isEditingDescription) {
      descTextareaRef.current?.focus();
    }
  }, [isEditingDescription]);

  // Keyboard shortcut: Esc to close, 'E' to edit description when not in an input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput =
        activeTag === "input" || activeTag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === "Escape") {
        if (isEditingTitle) {
          setIsEditingTitle(false);
          setEditedTitle(task?.title || "");
        } else if (isEditingDescription) {
          setIsEditingDescription(false);
          setEditedDescription(task?.description || "");
        } else {
          sound.playClick(600);
          onClose();
        }
      } else if (!isInput && (e.key === "e" || e.key === "E") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsEditingDescription(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isEditingTitle, isEditingDescription, task, onClose]);

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

  if (!isOpen || !task) return null;

  const isDone = task.status === "DONE";

  const triggerSavedFeedback = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 1500);
  };

  const handleCheckboxToggle = (newChecked: boolean) => {
    patchStatus.mutate(
      {
        id: task.id,
        status: newChecked ? "DONE" : "TODO",
      },
      {
        onSuccess: () => {
          triggerSavedFeedback();
          if (newChecked) {
            toast.success("Task completed", {
              description: `"${task.title}" marked as done.`,
            });
          }
        },
      }
    );
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim() || editedTitle.trim() === task.title) {
      setIsEditingTitle(false);
      setEditedTitle(task.title);
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        payload: { title: editedTitle.trim() },
      });
      setIsEditingTitle(false);
      triggerSavedFeedback();
    } catch {
      toast.error("Failed to update title");
    }
  };

  const handleSaveDescription = async () => {
    const trimmed = editedDescription.trim();
    if (trimmed === (task.description || "").trim()) {
      setIsEditingDescription(false);
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        payload: { description: trimmed || null },
      });
      setIsEditingDescription(false);
      triggerSavedFeedback();
    } catch {
      toast.error("Failed to update description");
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    patchStatus.mutate(
      { id: task.id, status: newStatus },
      { onSuccess: triggerSavedFeedback }
    );
  };

  const handlePriorityChange = (newPriority: Priority) => {
    updateTask.mutate(
      { id: task.id, payload: { priority: newPriority } },
      { onSuccess: triggerSavedFeedback }
    );
  };

  const handleProjectChange = (newProjectId: string) => {
    updateTask.mutate(
      { id: task.id, payload: { projectId: newProjectId || null } },
      { onSuccess: triggerSavedFeedback }
    );
  };

  const handleReminderChange = (newDateStr: string) => {
    const formatted = newDateStr ? new Date(newDateStr).toISOString() : null;
    updateTask.mutate(
      { id: task.id, payload: { dueDate: formatted } },
      { onSuccess: triggerSavedFeedback }
    );
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

  // Popover options
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

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            sound.playClick(600);
            onClose();
          }
        }}
      >
        <div
          className="w-full max-w-[720px] max-h-[88vh] rounded-[8px] bg-surface-1 border border-line-strong shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 select-text"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar: Saved status indicator, Context Menu, Close Button */}
          <div className="h-11 px-4 sm:px-5 border-b border-line flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-subtle tracking-[0.08em] uppercase">
                Task
              </span>
              {showSavedFeedback && (
                <span className="text-[11px] font-mono text-ok flex items-center gap-1 animate-in fade-in duration-100">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Context "⋯" Menu (with Delete inside) */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  title="More actions"
                  className={cn(
                    "p-1.5 rounded-[4px] text-subtle hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer",
                    menuOpen && "bg-surface-2 text-text-primary"
                  )}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-8 z-50 w-36 rounded-[6px] bg-surface-1 border border-line-strong shadow-2xl py-1 text-xs font-mono animate-in fade-in zoom-in-95 duration-100 select-none"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-danger hover:bg-danger/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-danger" />
                      <span>Delete task</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick(600);
                  onClose();
                }}
                title="Close (Esc)"
                className="p-1.5 rounded-[4px] text-subtle hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body: Two-Pane Property Rail Layout */}
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-line">
            {/* Left Main Content Pane */}
            <div className="flex-1 p-5 sm:p-6 space-y-5 min-w-0">
              {/* Title Section with Checkbox */}
              <div className="flex items-start gap-3">
                <div className="pt-1 shrink-0">
                  <TaskCheckbox checked={isDone} onToggle={handleCheckboxToggle} />
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingTitle ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") {
                          setIsEditingTitle(false);
                          setEditedTitle(task.title);
                        }
                      }}
                      className="w-full text-base sm:text-lg font-semibold tracking-[-0.3px] text-text-primary bg-surface-2 border border-line-strong rounded-[4px] px-2 py-1 focus:outline-none focus:border-accent"
                    />
                  ) : (
                    <h2
                      id="task-detail-title"
                      onClick={() => setIsEditingTitle(true)}
                      title="Click to edit title"
                      className={cn(
                        "text-base sm:text-lg font-semibold tracking-[-0.3px] text-text-primary leading-snug break-words hover:bg-surface-2/60 rounded px-1 -mx-1 py-0.5 transition-colors cursor-text",
                        isDone && "line-through text-subtle"
                      )}
                    >
                      {task.title}
                    </h2>
                  )}
                </div>
              </div>

              {/* Description Section with Markdown & Inline Edit */}
              <div className="pt-2">
                <div className="flex items-center justify-between pb-1 mb-2 border-b border-line">
                  <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-subtle">
                    Description
                  </span>
                  {!isEditingDescription && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDescription(true)}
                      className="text-[11px] font-mono text-subtle hover:text-text-primary flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit (E)</span>
                    </button>
                  )}
                </div>

                {isEditingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      ref={descTextareaRef}
                      rows={6}
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Add markdown description..."
                      className="w-full p-3 rounded-[6px] bg-surface-2 border border-line-strong text-text-primary text-xs font-mono leading-relaxed focus:outline-none focus:border-accent transition-colors resize-y"
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono text-subtle">
                      <span>Markdown supported</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingDescription(false);
                            setEditedDescription(task.description || "");
                          }}
                          className="px-2 py-1 rounded hover:bg-surface-2 text-subtle hover:text-text-primary transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDescription}
                          className="px-2.5 py-1 rounded bg-surface-3 hover:bg-surface-4 border border-line-strong text-text-primary font-medium transition-colors cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDescription(true)}
                    className="hover:bg-surface-2/30 rounded p-1 -m-1 transition-colors cursor-text min-h-[60px]"
                    title="Click or press E to edit description"
                  >
                    <MarkdownContent content={task.description} />
                  </div>
                )}
              </div>
            </div>

            {/* Right Property Rail Pane (200px width on desktop, 2-col on mobile) */}
            <div className="w-full md:w-[220px] p-4 sm:p-5 shrink-0 bg-surface-1/40 flex flex-col justify-between">
              <div className="space-y-3.5 divide-y divide-line/60">
                {/* Status Row */}
                <div className="pt-2 first:pt-0">
                  <span className="block text-[11px] font-mono uppercase tracking-[0.08em] text-subtle mb-1">
                    Status
                  </span>
                  <PropertyPopover<TaskStatus>
                    value={task.status}
                    onChange={handleStatusChange}
                    options={statusOptions}
                    renderTrigger={(selected) => (
                      <button
                        type="button"
                        className="w-full inline-flex items-center gap-2 py-1 px-1.5 rounded-[4px] hover:bg-surface-2 text-xs font-mono text-text-primary transition-colors text-left"
                      >
                        <StatusDot status={task.status} />
                        <span className="truncate">{STATUS_CONFIG[task.status].label}</span>
                      </button>
                    )}
                  />
                </div>

                {/* Priority Row */}
                <div className="pt-3">
                  <span className="block text-[11px] font-mono uppercase tracking-[0.08em] text-subtle mb-1">
                    Priority
                  </span>
                  <PropertyPopover<Priority>
                    value={task.priority}
                    onChange={handlePriorityChange}
                    options={priorityOptions}
                    renderTrigger={() => (
                      <button
                        type="button"
                        className="w-full inline-flex items-center gap-2 py-1 px-1.5 rounded-[4px] hover:bg-surface-2 text-xs font-mono text-text-primary transition-colors text-left"
                      >
                        <PriorityLabel priority={task.priority} />
                      </button>
                    )}
                  />
                </div>

                {/* Project Row */}
                <div className="pt-3">
                  <span className="block text-[11px] font-mono uppercase tracking-[0.08em] text-subtle mb-1">
                    Project
                  </span>
                  <PropertyPopover
                    value={task.projectId || ""}
                    onChange={handleProjectChange}
                    options={projectOptions}
                    renderTrigger={() => (
                      <button
                        type="button"
                        className="w-full inline-flex items-center gap-2 py-1 px-1.5 rounded-[4px] hover:bg-surface-2 text-xs font-mono text-text-primary transition-colors text-left truncate"
                      >
                        <span className="truncate">
                          {task.project?.title || "No project"}
                        </span>
                      </button>
                    )}
                  />
                </div>

                {/* Reminder Row (Relabeled from Due Date) */}
                <div className="pt-3">
                  <span className="block text-[11px] font-mono uppercase tracking-[0.08em] text-subtle mb-1">
                    Reminder
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={task.dueDate ? task.dueDate.split("T")[0] : ""}
                      onChange={(e) => handleReminderChange(e.target.value)}
                      className="w-full px-2 py-1 rounded-[4px] bg-surface-2 border border-line text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                    />
                    {task.dueDate && (
                      <button
                        type="button"
                        onClick={() => handleReminderChange("")}
                        title="Clear reminder"
                        className="p-1 rounded text-subtle hover:text-text-primary hover:bg-surface-2 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Created Row (Read-only) */}
                <div className="pt-3">
                  <span className="block text-[11px] font-mono uppercase tracking-[0.08em] text-subtle mb-1">
                    Created
                  </span>
                  <span className="block text-xs font-mono text-muted px-1.5 py-1">
                    {formatDate(task.createdAt)}
                  </span>
                </div>
              </div>
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
