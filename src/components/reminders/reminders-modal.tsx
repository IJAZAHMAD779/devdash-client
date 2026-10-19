"use client";

import { useState, useEffect } from "react";
import {
  X,
  Bell,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Loader2,
  Mail,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {
  useReminders,
  useCreateReminder,
  useDeleteReminder,
  useRetryReminder,
  useReminderHealth,
} from "@/hooks/use-reminders";
import { useTasks } from "@/hooks/use-tasks";
import { cn, formatDate } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTaskId?: string;
  defaultTitle?: string;
}

export function RemindersModal({
  isOpen,
  onClose,
  defaultTaskId,
  defaultTitle,
}: Props) {
  const { user } = useUser();
  const { data: reminders, isLoading } = useReminders();
  const { data: health } = useReminderHealth();
  const { data: tasks } = useTasks();
  const createReminder = useCreateReminder();
  const deleteReminder = useDeleteReminder();
  const retryReminder = useRetryReminder();

  const [title, setTitle] = useState(defaultTitle || "");
  const [description, setDescription] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [taskId, setTaskId] = useState<string>(defaultTaskId || "");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-fill user email from Clerk
  useEffect(() => {
    if (user) {
      const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        "";
      setRecipientEmail(email);
    }
  }, [user]);

  // Set default datetime to 1 hour from now formatted for input
  useEffect(() => {
    if (isOpen && !remindAt) {
      const nextHour = new Date(Date.now() + 60 * 60 * 1000);
      nextHour.setMinutes(Math.ceil(nextHour.getMinutes() / 5) * 5, 0, 0);
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const localIso = new Date(nextHour.getTime() - nextHour.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setRemindAt(localIso);
    }
    if (defaultTitle) {
      setTitle(defaultTitle);
    }
    if (defaultTaskId) {
      setTaskId(defaultTaskId);
    }
  }, [isOpen, defaultTitle, defaultTaskId]);

  if (!isOpen) return null;

  const handleApplyPreset = (minutesFromNow: number) => {
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    const localIso = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setRemindAt(localIso);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setFormError("Reminder title is required.");
      return;
    }

    if (!remindAt) {
      setFormError("Please select a date and time for the reminder.");
      return;
    }

    const scheduledDate = new Date(remindAt);
    if (isNaN(scheduledDate.getTime())) {
      setFormError("Invalid date/time selected.");
      return;
    }

    try {
      await createReminder.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        remindAt: scheduledDate.toISOString(),
        taskId: taskId || undefined,
        recipientEmail: recipientEmail.trim() || undefined,
      });

      setSuccessMsg(`Reminder scheduled! An email will be dispatched to ${recipientEmail || "your email"} when the time hits.`);
      setTitle("");
      setDescription("");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err?.message || "Failed to schedule reminder");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder.mutateAsync(id);
    } catch (err: any) {
      setFormError(err?.message || "Failed to delete reminder");
    }
  };

  const handleRetry = async (id: string) => {
    setFormError(null);
    setSuccessMsg(null);
    try {
      await retryReminder.mutateAsync(id);
      setSuccessMsg("Reminder retry dispatched successfully via Resend!");
    } catch (err: any) {
      setFormError(err?.message || "Failed to retry reminder");
    }
  };

  const upcomingReminders = reminders?.filter((r) => !r.isSent || !!r.failureReason) || [];
  const sentReminders = reminders?.filter((r) => r.isSent && !r.failureReason) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-surface-1 border border-hairline rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-surface-1/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-[-0.3px] text-ink">
                Scheduled Email Reminders
              </h2>
              <p className="text-[11px] text-ink-muted">
                Set a time and receive an automated notification email via Resend when due.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Health Warning Banner */}
          {health && !health.isConfigured && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">Live Email Delivery Inactive</p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Your backend environment currently has <code className="px-1.5 py-0.5 rounded bg-surface-2 font-mono text-[10px] text-amber-300 border border-amber-500/30">RESEND_API_KEY</code> set to placeholder. To deliver live notification emails to your inbox, set your free API key from <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="underline font-medium text-amber-300 hover:text-white">resend.com</a> in your Render environment variables.
                </p>
              </div>
            </div>
          )}

          {/* Notification Feedback */}
          {successMsg && (
            <div className="p-3 rounded-lg bg-semantic-success/10 border border-semantic-success/20 flex items-center gap-2.5 text-xs text-semantic-success animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-400 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Create Reminder Form */}
          <form onSubmit={handleCreate} className="space-y-4 bg-surface-2/60 border border-hairline p-4 rounded-xl">
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-primary" />
              Create New Reminder
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Reminder Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Deploy express API update to Render"
                className="w-full px-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            {/* Time Picker & Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-muted mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Date & Time (When to remind) *
                </label>
                <input
                  type="datetime-local"
                  value={remindAt}
                  onChange={(e) => setRemindAt(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  Quick Time Presets
                </label>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(10)}
                    className="px-2 py-1 text-[11px] rounded bg-surface-3 hover:bg-surface-4 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    +10 min
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(60)}
                    className="px-2 py-1 text-[11px] rounded bg-surface-3 hover:bg-surface-4 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    +1 hour
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(24 * 60)}
                    className="px-2 py-1 text-[11px] rounded bg-surface-3 hover:bg-surface-4 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(3 * 24 * 60)}
                    className="px-2 py-1 text-[11px] rounded bg-surface-3 hover:bg-surface-4 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    +3 days
                  </button>
                </div>
              </div>
            </div>

            {/* Recipient Email & Linked Task */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-muted mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-ink-tertiary" />
                  Email Destination *
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  Link to Task (Optional)
                </label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink focus:outline-none focus:border-primary transition-colors truncate"
                >
                  <option value="">No linked task</option>
                  {tasks?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description Notes */}
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Notes / Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional instructions or checklist for when this reminder fires..."
                rows={2}
                className="w-full px-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-primary resize-none transition-colors"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={createReminder.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {createReminder.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Schedule Reminder</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* List of Upcoming Reminders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-ink uppercase tracking-wider font-mono">
                Upcoming Reminders ({upcomingReminders.length})
              </h3>
            </div>

            {isLoading ? (
              <div className="py-6 flex items-center justify-center text-xs text-ink-muted">
                <Loader2 className="w-4 h-4 text-primary animate-spin mr-2" />
                <span>Loading reminders...</span>
              </div>
            ) : upcomingReminders.length === 0 ? (
              <div className="py-6 px-4 rounded-lg border border-dashed border-hairline text-center text-xs text-ink-muted">
                No pending reminders scheduled. Add one above!
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingReminders.map((rem) => {
                  const remDate = new Date(rem.remindAt);
                  const isOverdue = remDate.getTime() <= Date.now();
                  const hasFailed = !!rem.failureReason;

                  return (
                    <div
                      key={rem.id}
                      className={cn(
                        "p-3 rounded-lg border text-xs group transition-colors",
                        hasFailed
                          ? "bg-surface-2 border-rose-500/30 hover:border-rose-500/50"
                          : "bg-surface-2 border-hairline hover:border-hairline-strong"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1 mr-3">
                          {hasFailed ? (
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                          ) : (
                            <Clock className={cn("w-4 h-4 shrink-0 mt-0.5", isOverdue ? "text-amber-400" : "text-primary")} />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink truncate">{rem.title}</span>
                              {hasFailed && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] uppercase">
                                  Delivery Failed
                                </span>
                              )}
                            </div>
                            {rem.description && (
                              <div className="text-[11px] text-ink-muted truncate mt-0.5">
                                {rem.description}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-ink-tertiary">
                              <span className={cn(isOverdue && !hasFailed && "text-amber-400 font-semibold")}>
                                {isOverdue ? "Due now" : `Due: ${formatDate(rem.remindAt)}`}
                              </span>
                              {rem.task && (
                                <span className="px-1.5 py-0.2 rounded bg-surface-3 border border-hairline text-ink-subtle truncate max-w-[150px]">
                                  Task: {rem.task.title}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {hasFailed && (
                            <button
                              type="button"
                              onClick={() => handleRetry(rem.id)}
                              disabled={retryReminder.isPending}
                              title="Retry sending notification email"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              <RotateCcw className={cn("w-3 h-3", retryReminder.isPending && "animate-spin")} />
                              <span>Retry</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(rem.id)}
                            disabled={deleteReminder.isPending}
                            title="Delete reminder"
                            className="p-1.5 rounded hover:bg-surface-3 text-ink-subtle hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {hasFailed && (
                        <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex items-start gap-1.5 text-[11px] text-rose-300/90 leading-tight">
                          <span className="font-semibold text-rose-300 shrink-0">Error:</span>
                          <span className="break-words">{rem.failureReason}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* List of Sent Reminders History */}
          {sentReminders.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold text-ink-subtle uppercase tracking-wider font-mono">
                Recently Dispatched ({sentReminders.length})
              </h3>
              <div className="space-y-2 opacity-75">
                {sentReminders.slice(0, 5).map((rem) => (
                  <div
                    key={rem.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-surface-1 border border-hairline/60 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success shrink-0" />
                      <span className="text-ink truncate">{rem.title}</span>
                      <span className="text-[10px] font-mono text-ink-tertiary">
                        (Sent {rem.sentAt ? formatDate(rem.sentAt) : "Done"})
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(rem.id)}
                      title="Clear from history"
                      className="p-1 rounded text-ink-tertiary hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-hairline bg-surface-1/90 flex items-center justify-between text-[11px] text-ink-muted">
          <span>Background worker checks every 30 seconds for due triggers</span>
          <span className="font-mono text-[10px] text-ink-subtle">
            Powered by Resend
          </span>
        </div>
      </div>
    </div>
  );
}
