"use client";

import React, { useSyncExternalStore, useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { toastStore, ToastData, toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

function ToastIcon({ type, icon }: { type: ToastData["type"]; icon?: React.ReactNode }) {
  if (icon) {
    return <div className="shrink-0 mt-0.5">{icon}</div>;
  }

  switch (type) {
    case "success":
      return (
        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
      );
    case "error":
      return (
        <div className="w-5 h-5 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5 text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      );
    case "warning":
      return (
        <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
      );
    case "info":
      return (
        <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
          <Info className="w-3.5 h-3.5" />
        </div>
      );
    case "loading":
      return (
        <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 text-primary">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        </div>
      );
    default:
      return (
        <div className="w-5 h-5 rounded-full bg-surface-3 border border-hairline flex items-center justify-center shrink-0 mt-0.5 text-ink-muted">
          <Sparkles className="w-3 h-3 text-ink" />
        </div>
      );
  }
}

function ToastItem({ toast: t }: { toast: ToastData }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger transition to .is-open on mount
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const isOpen = mounted && !t.isClosing;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "t-toast relative w-full sm:w-[350px] p-3.5 rounded-xl bg-surface-1/95 backdrop-blur-md border border-hairline shadow-2xl shadow-black/80 flex items-start gap-3 select-none pointer-events-auto transition-colors",
        isOpen && "is-open",
        t.isClosing && "is-closing",
        t.type === "error" && "border-rose-500/30 hover:border-rose-500/50",
        t.type === "success" && "border-emerald-500/20 hover:border-emerald-500/40",
        t.type !== "error" && t.type !== "success" && "hover:border-hairline-strong"
      )}
    >
      {/* Type Icon */}
      <ToastIcon type={t.type} icon={t.icon} />

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="text-xs font-semibold text-ink tracking-tight break-words">
          {t.title}
        </div>
        {t.description && (
          <div className="text-[11px] text-ink-muted leading-relaxed mt-0.5 break-words">
            {t.description}
          </div>
        )}

        {/* Action Button */}
        {t.action && (
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                t.action?.onClick();
                toast.dismiss(t.id);
              }}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-surface-3 hover:bg-surface-4 text-ink border border-hairline transition-colors cursor-pointer"
            >
              {t.action.label}
            </button>
            {t.cancel && (
              <button
                type="button"
                onClick={() => {
                  t.cancel?.onClick?.();
                  toast.dismiss(t.id);
                }}
                className="px-2 py-1 text-[11px] font-medium rounded-md text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                {t.cancel.label}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    () => [] // Server snapshot for SSR hydration safety
  );

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-atomic="true"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[99999] flex flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-md items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
