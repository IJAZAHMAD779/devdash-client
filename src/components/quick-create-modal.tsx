"use client";

import { useState, useEffect } from "react";
import {
  X,
  CheckSquare,
  FolderKanban,
  Code2,
  Bookmark as BookmarkIcon,
  Sparkles,
  Command,
} from "lucide-react";
import { NewTaskModal } from "@/components/tasks/new-task-modal";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { NewSnippetModal } from "@/components/snippets/new-snippet-modal";
import { NewBookmarkModal } from "@/components/resources/new-bookmark-modal";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type CreateType = "task" | "project" | "snippet" | "bookmark" | null;

export function QuickCreateModal({ isOpen, onClose }: Props) {
  const [activeSubModal, setActiveSubModal] = useState<CreateType>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setActiveSubModal(null);
      setIsClosing(false);
    }
  }, [isOpen]);

  // Handle hotkeys inside the quick create dialog
  useEffect(() => {
    if (!isOpen || activeSubModal !== null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setActiveSubModal("task");
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        setActiveSubModal("project");
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        setActiveSubModal("snippet");
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        setActiveSubModal("bookmark");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeSubModal]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Selector Dialog */}
      {activeSubModal === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={cn(
              "fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-150",
              isClosing ? "opacity-0" : "opacity-100"
            )}
            onClick={handleClose}
          />

          <div
            className={cn(
              "relative w-full max-w-md bg-surface-1 border border-hairline rounded-xl shadow-2xl p-5 overflow-hidden transition-all duration-150 flex flex-col space-y-4",
              isClosing
                ? "opacity-0 scale-95"
                : "opacity-100 scale-100 animate-in fade-in zoom-in-95"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold tracking-[-0.2px] text-ink">
                  Universal Quick Create
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Select what you want to create, or tap the hotkey:
            </p>

            {/* Quick Grid Options */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Task */}
              <button
                onClick={() => setActiveSubModal("task")}
                className="p-3.5 rounded-lg bg-surface-2/70 hover:bg-surface-2 border border-hairline hover:border-primary/50 text-left transition-all duration-150 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <CheckSquare className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-3 border border-hairline text-ink-tertiary group-hover:text-ink">
                    T
                  </kbd>
                </div>
                <div>
                  <span className="text-xs font-semibold text-ink group-hover:text-primary transition-colors block">
                    New Task
                  </span>
                  <span className="text-[10px] text-ink-muted font-mono">
                    Add to board
                  </span>
                </div>
              </button>

              {/* Project */}
              <button
                onClick={() => setActiveSubModal("project")}
                className="p-3.5 rounded-lg bg-surface-2/70 hover:bg-surface-2 border border-hairline hover:border-primary/50 text-left transition-all duration-150 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <FolderKanban className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-3 border border-hairline text-ink-tertiary group-hover:text-ink">
                    P
                  </kbd>
                </div>
                <div>
                  <span className="text-xs font-semibold text-ink group-hover:text-primary transition-colors block">
                    New Project
                  </span>
                  <span className="text-[10px] text-ink-muted font-mono">
                    Workspace hub
                  </span>
                </div>
              </button>

              {/* Snippet */}
              <button
                onClick={() => setActiveSubModal("snippet")}
                className="p-3.5 rounded-lg bg-surface-2/70 hover:bg-surface-2 border border-hairline hover:border-primary/50 text-left transition-all duration-150 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Code2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-3 border border-hairline text-ink-tertiary group-hover:text-ink">
                    S
                  </kbd>
                </div>
                <div>
                  <span className="text-xs font-semibold text-ink group-hover:text-primary transition-colors block">
                    New Snippet
                  </span>
                  <span className="text-[10px] text-ink-muted font-mono">
                    Code vault
                  </span>
                </div>
              </button>

              {/* Bookmark */}
              <button
                onClick={() => setActiveSubModal("bookmark")}
                className="p-3.5 rounded-lg bg-surface-2/70 hover:bg-surface-2 border border-hairline hover:border-primary/50 text-left transition-all duration-150 flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <BookmarkIcon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-3 border border-hairline text-ink-tertiary group-hover:text-ink">
                    B
                  </kbd>
                </div>
                <div>
                  <span className="text-xs font-semibold text-ink group-hover:text-primary transition-colors block">
                    New Bookmark
                  </span>
                  <span className="text-[10px] text-ink-muted font-mono">
                    Save reference
                  </span>
                </div>
              </button>
            </div>

            <div className="pt-2 text-[11px] font-mono text-ink-tertiary text-center flex items-center justify-center gap-1">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-surface-2 border border-hairline">
                Esc
              </kbd>
              <span>to dismiss</span>
            </div>
          </div>
        </div>
      )}

      {/* Specific Modals */}
      <NewTaskModal
        isOpen={activeSubModal === "task"}
        onClose={() => {
          setActiveSubModal(null);
          onClose();
        }}
      />

      <NewProjectModal
        isOpen={activeSubModal === "project"}
        onClose={() => {
          setActiveSubModal(null);
          onClose();
        }}
      />

      <NewSnippetModal
        isOpen={activeSubModal === "snippet"}
        onClose={() => {
          setActiveSubModal(null);
          onClose();
        }}
      />

      <NewBookmarkModal
        isOpen={activeSubModal === "bookmark"}
        onClose={() => {
          setActiveSubModal(null);
          onClose();
        }}
      />
    </>
  );
}
