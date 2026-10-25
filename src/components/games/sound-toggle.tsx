"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sounds } from "./sound-manager";
import { cn } from "@/lib/utils";

interface SoundToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function SoundToggle({ className, showLabel = true }: SoundToggleProps) {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    // Initial sync
    setIsMuted(sounds.getMuted());

    // Listen for custom sync event across components
    const handleSoundChange = () => {
      setIsMuted(sounds.getMuted());
    };

    window.addEventListener("devdash_sound_change", handleSoundChange);
    return () => {
      window.removeEventListener("devdash_sound_change", handleSoundChange);
    };
  }, []);

  const handleToggle = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
    window.dispatchEvent(new CustomEvent("devdash_sound_change"));
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={!isMuted}
      aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
      title={isMuted ? "Sound is off (click to unmute)" : "Sound is on (click to mute)"}
      className={cn(
        "h-9 px-3 rounded-[6px] bg-surface-1 hover:bg-surface-2 border border-line hover:border-line-strong text-muted hover:text-text-primary text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent select-none",
        className
      )}
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4 text-subtle shrink-0" />
      ) : (
        <Volume2 className="w-4 h-4 text-muted shrink-0" />
      )}
      {showLabel && (
        <span className="font-mono text-[11px] tracking-wide">
          {isMuted ? "Sound off" : "Sound on"}
        </span>
      )}
    </button>
  );
}
