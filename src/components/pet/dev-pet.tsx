"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Sparkles, Settings2, Heart } from "lucide-react";
import { PetUserSettings, DEFAULT_PET_SETTINGS, PetSize } from "@/types/pet";
import { getPetById, PET_CATALOG } from "./pet-catalog";
import { PetPickerModal } from "./pet-picker-modal";
import { cn } from "@/lib/utils";

// 3x3 grid index mapping
// 0: up-left,   1: up,   2: up-right
// 3: left,      4: center, 5: right
// 6: down-left, 7: down, 8: down-right

const DIRECTION_CELLS = {
  "up-left": 0,
  up: 1,
  "up-right": 2,
  left: 3,
  center: 4,
  right: 5,
  "down-left": 6,
  down: 7,
  "down-right": 8,
} as const;

type DirectionKey = keyof typeof DIRECTION_CELLS;

// Fun payoffs for boops
const FUN_REACTIONS = [1, 2, 4, 5, 8]; // heart, sparkle, wink, bashful, delighted
const DIZZY_REACTION = 7;
const DEAD_ZONE = 60; // pixels

const SIZE_MAP: Record<PetSize, { px: number; className: string }> = {
  sm: { px: 40, className: "w-10 h-10" },
  md: { px: 52, className: "w-[52px] h-[52px]" },
  lg: { px: 68, className: "w-[68px] h-[68px]" },
};

export function DevPetCompanion() {
  const [settings, setSettings] = useState<PetUserSettings>(DEFAULT_PET_SETTINGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<number>(4); // default: center
  const [isReacting, setIsReacting] = useState(false);
  const [reactionCell, setReactionCell] = useState<number>(0);
  const [boopCount, setBoopCount] = useState(0);
  const [showHeartToast, setShowHeartToast] = useState(false);
  const [isSquashing, setIsSquashing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const boopTimesRef = useRef<number[]>([]);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_active_pet");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch {
          // ignore corrupted json
        }
      }
      const savedBoops = localStorage.getItem("devdash_pet_boops");
      if (savedBoops) {
        setBoopCount(parseInt(savedBoops, 10) || 0);
      }
    }
  }, []);

  const pet = useMemo(() => getPetById(settings.petId), [settings.petId]);

  // Determine active sprite sheets based on style
  const { directionsSheet, reactionsSheet } = useMemo(() => {
    if (settings.style === "pixel" && pet.hasPixelStyle && pet.pixelDirectionsUrl && pet.pixelReactionsUrl) {
      return {
        directionsSheet: pet.pixelDirectionsUrl,
        reactionsSheet: pet.pixelReactionsUrl,
      };
    }
    return {
      directionsSheet: pet.directionsUrl,
      reactionsSheet: pet.reactionsUrl,
    };
  }, [pet, settings.style]);

  // Cursor tracking listener
  useEffect(() => {
    if (!settings.enabled || isReacting) return;

    // Check if device supports fine pointer (mouse/trackpad)
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      setActiveCell(4); // default straight ahead on mobile touch
      return;
    }

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const petCenterX = rect.left + rect.width / 2;
        const petCenterY = rect.top + rect.height / 2;

        const dx = e.clientX - petCenterX;
        const dy = e.clientY - petCenterY;
        const dist = Math.hypot(dx, dy);

        if (dist < DEAD_ZONE) {
          setActiveCell(4); // center gaze
          return;
        }

        const angle = Math.atan2(dy, dx); // [-PI, PI]
        const step = Math.PI / 4; // 45 deg

        let dir: DirectionKey = "center";

        if (angle >= -step / 2 && angle < step / 2) {
          dir = "right";
        } else if (angle >= step / 2 && angle < (3 * step) / 2) {
          dir = "down-right";
        } else if (angle >= (3 * step) / 2 && angle < (5 * step) / 2) {
          dir = "down";
        } else if (angle >= (5 * step) / 2 && angle < (7 * step) / 2) {
          dir = "down-left";
        } else if (angle >= (7 * step) / 2 || angle < (-7 * step) / 2) {
          dir = "left";
        } else if (angle >= (-7 * step) / 2 && angle < (-5 * step) / 2) {
          dir = "up-left";
        } else if (angle >= (-5 * step) / 2 && angle < (-3 * step) / 2) {
          dir = "up";
        } else if (angle >= (-3 * step) / 2 && angle < -step / 2) {
          dir = "up-right";
        }

        setActiveCell(DIRECTION_CELLS[dir]);
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [settings.enabled, isReacting]);

  // Boop handler (click on pet)
  const handleBoop = useCallback(() => {
    const now = Date.now();
    boopTimesRef.current = [...boopTimesRef.current.filter((t) => now - t < 1800), now];

    const newCount = boopCount + 1;
    setBoopCount(newCount);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_pet_boops", newCount.toString());
    }

    // Trigger squash bounce
    setIsSquashing(true);
    setTimeout(() => setIsSquashing(false), 380);

    // Pick reaction
    let reactionIdx: number;
    if (boopTimesRef.current.length >= 4) {
      reactionIdx = DIZZY_REACTION; // too many rapid pokes makes pet dizzy!
    } else {
      reactionIdx = FUN_REACTIONS[Math.floor(Math.random() * FUN_REACTIONS.length)];
    }

    setReactionCell(reactionIdx);
    setIsReacting(true);
    setShowHeartToast(true);

    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = setTimeout(() => {
      setIsReacting(false);
      setShowHeartToast(false);
    }, 550);
  }, [boopCount]);

  const handleUpdateSettings = (newSettings: PetUserSettings) => {
    setSettings(newSettings);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_active_pet", JSON.stringify(newSettings));
    }
  };

  if (!settings.enabled) {
    return (
      <div className="inline-flex items-center">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-[11px] font-mono text-ink-tertiary hover:text-ink px-2 py-1 rounded bg-surface-2/60 hover:bg-surface-2 border border-hairline inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Enable Developer Pet"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span>+ Add Pet</span>
        </button>

        <PetPickerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          settings={settings}
          onSave={handleUpdateSettings}
        />
      </div>
    );
  }

  const sizeCfg = SIZE_MAP[settings.size] || SIZE_MAP.md;
  const currentCell = isReacting ? reactionCell : activeCell;
  const bgPosX = (currentCell % 3) * 50;
  const bgPosY = Math.floor(currentCell / 3) * 50;
  const currentSheet = isReacting ? reactionsSheet : directionsSheet;

  return (
    <>
      <div className="relative inline-flex items-center group select-none">
        {/* The Pet Button */}
        <button
          ref={containerRef as any}
          type="button"
          onClick={handleBoop}
          title={`${pet.name} (${pet.species}) — Click to poke! (Booped ${boopCount} times)`}
          className={cn(
            "relative rounded-xl overflow-hidden cursor-pointer focus:outline-none transition-transform duration-150 p-0 bg-transparent flex items-center justify-center",
            sizeCfg.className,
            isSquashing && "scale-y-[0.82] scale-x-[1.18]"
          )}
          style={{
            touchAction: "manipulation",
          }}
        >
          {/* Sprite renderer */}
          <div
            className="w-full h-full pointer-events-none"
            style={{
              backgroundImage: `url(${currentSheet})`,
              backgroundSize: "300% 300%",
              backgroundPosition: `${bgPosX}% ${bgPosY}%`,
              backgroundRepeat: "no-repeat",
              imageRendering: settings.style === "pixel" ? "pixelated" : "auto",
            }}
          />
        </button>

        {/* Quick Edit Pet Trigger (visible on hover) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          title="Customize Pet"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-2 ml-1 cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>

        {/* Heart Pop Toast on Boop */}
        {showHeartToast && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-rose-400 font-bold flex items-center gap-0.5 animate-bounce pointer-events-none bg-surface-2/90 px-1.5 py-0.5 rounded-full border border-rose-500/30 shadow-md">
            <Heart className="w-2.5 h-2.5 fill-rose-400" />
            <span>+1</span>
          </span>
        )}
      </div>

      <PetPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        settings={settings}
        onSave={handleUpdateSettings}
      />
    </>
  );
}
