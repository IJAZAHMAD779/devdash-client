"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Bell,
  FileText,
  Code2,
  Bookmark,
  BookmarkCheck,
  BrainCircuit,
  ListTodo,
  FileEdit,
  Search,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { ExecutedAction } from "@/types/ai";
import { cn } from "@/lib/utils";

interface AiActionCardProps {
  action: ExecutedAction;
  className?: string;
}

export function AiActionCard({ action, className }: AiActionCardProps) {
  switch (action.type) {
    case "TASK":
      return (
        <div
          className={cn(
            "p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-start justify-between gap-3 text-xs transition-colors",
            className
          )}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold block">
                Task Created
              </span>
              <p className="font-medium text-ink truncate mt-0.5">{action.title}</p>
              {action.details?.priority && (
                <span className="inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-3 text-ink-muted mt-1 uppercase">
                  {action.details.priority} Priority
                </span>
              )}
            </div>
          </div>

          <Link
            href="/tasks"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary-hover shrink-0 pt-0.5"
          >
            <span>View Board</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      );

    case "REMINDER":
      return (
        <div
          className={cn(
            "p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-start justify-between gap-3 text-xs transition-colors",
            className
          )}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                Reminder Scheduled
              </span>
              <p className="font-medium text-ink truncate mt-0.5">{action.title}</p>
              {action.details?.remindAt && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-ink-muted mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(action.details.remindAt).toLocaleString()}</span>
                </span>
              )}
            </div>
          </div>

          <Link
            href="/reminders"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 shrink-0 pt-0.5"
          >
            <span>Reminders</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      );

    case "NOTE":
      return (
        <div
          className={cn(
            "p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 flex items-start justify-between gap-3 text-xs transition-colors",
            className
          )}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold block">
                Note Saved
              </span>
              <p className="font-medium text-ink truncate mt-0.5">{action.title}</p>
            </div>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 shrink-0 pt-0.5"
          >
            <span>Read</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      );

    case "SNIPPET":
      return (
        <div
          className={cn(
            "p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-start justify-between gap-3 text-xs transition-colors",
            className
          )}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <Code2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                Snippet Saved
              </span>
              <p className="font-medium text-ink truncate mt-0.5">{action.title}</p>
              {action.details?.language && (
                <span className="inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-3 text-ink-muted mt-1">
                  {action.details.language}
                </span>
              )}
            </div>
          </div>

          <Link
            href="/snippets"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 shrink-0 pt-0.5"
          >
            <span>Vault</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      );

    case "BOOKMARK":
    case "UPDATE_BOOKMARK":
      return (
        <div
          className={cn(
            "p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 flex items-start justify-between gap-3 text-xs transition-colors",
            className
          )}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <BookmarkCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold block">
                {action.type === "UPDATE_BOOKMARK" ? "Bookmark Updated" : "Bookmark Added"}
              </span>
              <p className="font-medium text-ink truncate mt-0.5">{action.title}</p>
              {action.details?.notes && (
                <p className="text-[11px] text-ink-muted truncate mt-0.5 line-clamp-1">
                  {action.details.notes}
                </p>
              )}
            </div>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300 shrink-0 pt-0.5"
          >
            <span>Catalog</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      );

    case "ENRICH_BOOKMARKS":
      return (
        <div
          className={cn(
            "p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 flex items-start justify-between gap-3 text-xs transition-colors",
            className
          )}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
                Bookmarks Enriched
              </span>
              <p className="font-medium text-ink truncate mt-0.5">{action.title}</p>
              {action.details?.count && (
                <span className="inline-block text-[10px] font-mono text-ink-muted mt-0.5">
                  Generated notes & tags for {action.details.count} resources
                </span>
              )}
            </div>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 shrink-0 pt-0.5"
          >
            <span>View Catalog</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      );

    case "UPDATE_TASK":
      return (
        <div
          className={cn(
            "p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-start justify-between gap-3 text-xs transition-colors",
            className
          )}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <ListTodo className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold block">
                Task Updated
              </span>
              <p className="font-medium text-ink truncate mt-0.5">{action.title}</p>
              {action.details?.status && (
                <span className="inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-3 text-ink-muted mt-1 uppercase">
                  {action.details.status}
                </span>
              )}
            </div>
          </div>

          <Link
            href="/tasks"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary-hover shrink-0 pt-0.5"
          >
            <span>View Board</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      );

    case "UPDATE_NOTE":
      return (
        <div
          className={cn(
            "p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 flex items-start justify-between gap-3 text-xs transition-colors",
            className
          )}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <FileEdit className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold block">
                Note Updated
              </span>
              <p className="font-medium text-ink truncate mt-0.5">{action.title}</p>
            </div>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 shrink-0 pt-0.5"
          >
            <span>Read</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      );

    case "QUERY":
    default:
      return (
        <div
          className={cn(
            "p-2.5 rounded-lg border border-hairline bg-surface-2/60 flex items-center gap-2 text-xs text-ink-muted",
            className
          )}
        >
          <Search className="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
          <span className="font-mono text-[11px]">{action.title}</span>
        </div>
      );
  }
}
