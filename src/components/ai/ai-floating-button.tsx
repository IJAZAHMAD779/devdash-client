"use client";

import { useState, useEffect } from "react";
import { Bot, X } from "lucide-react";
import { AiCopilotModal } from "./ai-copilot-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

export function AiFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Global Keyboard Shortcut: ⌘J / Ctrl+J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        sound.playClick(900);
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleOpen = () => {
    sound.playClick(isOpen ? 600 : 900);
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={toggleOpen}
          aria-label={isOpen ? "Close DevDash AI" : "Open DevDash AI (⌘J)"}
          title={isOpen ? "Close DevDash AI" : "DevDash AI (⌘J)"}
          className={cn(
            "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isOpen
              ? "bg-surface-3 text-ink border border-hairline-strong hover:bg-surface-4"
              : "bg-primary text-white hover:bg-primary-hover border border-primary-hover/30 hover:scale-105 active:scale-95"
          )}
        >
          {isOpen ? (
            <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
          ) : (
            <Bot className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* Floating Copilot Modal Window */}
      <AiCopilotModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

