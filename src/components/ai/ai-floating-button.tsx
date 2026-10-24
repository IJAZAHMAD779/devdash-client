"use client";

import { useState, useEffect } from "react";
import { AiCopilotModal } from "./ai-copilot-modal";
import { sound } from "@/lib/audio";

export function AiFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Global Keyboard Shortcut: ⌘J / Ctrl+J & custom event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        sound.playClick(900);
        setIsOpen((prev) => !prev);
      }
    };

    const handleOpenCustom = () => {
      sound.playClick(900);
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-devdash-ai", handleOpenCustom);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-devdash-ai", handleOpenCustom);
    };
  }, []);

  return (
    <AiCopilotModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
  );
}
