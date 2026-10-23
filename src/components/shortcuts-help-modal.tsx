"use client";

import { useEffect, useState } from "react";
import { X, Keyboard, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

const NAVIGATION_SHORTCUTS: ShortcutItem[] = [
  { keys: ["G", "D"], description: "Go to Dashboard" },
  { keys: ["G", "P"], description: "Go to Projects Hub" },
  { keys: ["G", "T"], description: "Go to Tasks Board" },
  { keys: ["G", "S"], description: "Go to Snippets Vault" },
  { keys: ["G", "C"], description: "Go to Components Catalog" },
  { keys: ["G", "R"], description: "Go to Resources Hub" },
];

const ACTION_SHORTCUTS: ShortcutItem[] = [
  { keys: ["⌘", "K"], description: "Global Spotlight Search" },
  { keys: ["C"], description: "Universal Quick Create" },
  { keys: ["?"], description: "Keyboard Shortcuts Cheatsheet" },
  { keys: ["Esc"], description: "Close Modal / Cancel" },
];

export function ShortcutsHelpModal({ isOpen, onClose }: Props) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-150",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          "relative w-full max-w-lg bg-surface-1 border border-hairline rounded-xl shadow-2xl p-6 overflow-hidden transition-all duration-150 flex flex-col space-y-5",
          isClosing
            ? "opacity-0 scale-95"
            : "opacity-100 scale-100 animate-in fade-in zoom-in-95"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-[-0.2px] text-ink">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts Lists */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Navigation Group */}
          <div>
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary mb-2">
              Navigation (Sequence)
            </h3>
            <div className="rounded-lg bg-surface-2/60 border border-hairline divide-y divide-hairline">
              {NAVIGATION_SHORTCUTS.map((item) => (
                <div
                  key={item.description}
                  className="px-3.5 py-2 flex items-center justify-between text-xs"
                >
                  <span className="text-ink-muted">{item.description}</span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((k, idx) => (
                      <span key={k} className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-3 border border-hairline text-ink font-semibold">
                          {k}
                        </kbd>
                        {idx < item.keys.length - 1 && (
                          <span className="text-[10px] text-ink-tertiary">then</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Group */}
          <div>
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary mb-2">
              Global Actions
            </h3>
            <div className="rounded-lg bg-surface-2/60 border border-hairline divide-y divide-hairline">
              {ACTION_SHORTCUTS.map((item) => (
                <div
                  key={item.description}
                  className="px-3.5 py-2 flex items-center justify-between text-xs"
                >
                  <span className="text-ink-muted">{item.description}</span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-3 border border-hairline text-ink font-semibold"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-hairline text-[11px] font-mono text-ink-tertiary text-center">
          Shortcuts are disabled while typing inside inputs and text editors.
        </div>
      </div>
    </div>
  );
}
