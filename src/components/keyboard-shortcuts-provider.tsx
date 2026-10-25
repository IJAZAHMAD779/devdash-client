"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { QuickCreateModal } from "./quick-create-modal";
import { ShortcutsHelpModal } from "./shortcuts-help-modal";

export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Buffer for two-key sequence tracking (e.g. 'g' then 'p')
  const gSequenceRef = useRef<boolean>(false);
  const gTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 0. Disable all global shortcuts on any games routes so gameplay inputs are never intercepted
      if (pathname?.startsWith("/games")) {
        return;
      }

      // 1. Ignore if user is currently typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ignore if Cmd, Ctrl, or Alt is held
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();

      // 2. Handle 'g' sequence prefix
      if (key === "g" && !gSequenceRef.current) {
        gSequenceRef.current = true;
        if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
        gTimeoutRef.current = setTimeout(() => {
          gSequenceRef.current = false;
        }, 1200);
        return;
      }

      // 3. Handle second key of 'g' sequence
      if (gSequenceRef.current) {
        gSequenceRef.current = false;
        if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);

        switch (key) {
          case "d":
            e.preventDefault();
            router.push("/dashboard");
            return;
          case "p":
            e.preventDefault();
            router.push("/projects");
            return;
          case "t":
            e.preventDefault();
            router.push("/tasks");
            return;
          case "s":
            e.preventDefault();
            router.push("/snippets");
            return;
          case "c":
            e.preventDefault();
            router.push("/components");
            return;
          case "r":
            e.preventDefault();
            router.push("/resources");
            return;
          case "a":
            e.preventDefault();
            router.push("/games");
            return;
          default:
            break;
        }
      }

      // 4. Standalone hotkeys
      // 'c' -> Universal Quick Create
      if (key === "c" && !e.shiftKey) {
        e.preventDefault();
        setIsQuickCreateOpen(true);
        return;
      }

      // '?' -> Shortcuts Help Cheatsheet
      if (e.key === "?") {
        e.preventDefault();
        setIsHelpOpen(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
    };
  }, [router, pathname]);

  return (
    <>
      {children}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />
      <ShortcutsHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </>
  );
}
