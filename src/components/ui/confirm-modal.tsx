"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete Permanently",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, isClosing]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    if (isLoading) return;
    sound.playClick(600);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleConfirm = async () => {
    sound.playClick(variant === "danger" ? 450 : 750);
    await onConfirm();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-150",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      {/* Modal Dialog Surface */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className={cn(
          "relative w-full max-w-md bg-surface-1 border border-hairline rounded-xl shadow-2xl overflow-hidden transition-all duration-150 z-10 flex flex-col",
          isClosing
            ? "opacity-0 scale-95"
            : "opacity-100 scale-100 animate-in fade-in zoom-in-95"
        )}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-hairline flex items-start gap-3.5 bg-surface-1/90">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
              variant === "danger"
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            )}
          >
            {variant === "danger" ? (
              <Trash2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h3
              id="confirm-modal-title"
              className="text-sm font-semibold tracking-[-0.3px] text-ink"
            >
              {title}
            </h3>
            <p
              id="confirm-modal-desc"
              className="text-xs text-ink-muted leading-relaxed mt-1"
            >
              {description}
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-2/40 border-t border-hairline flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium text-white transition-all shadow-sm cursor-pointer disabled:opacity-50",
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
