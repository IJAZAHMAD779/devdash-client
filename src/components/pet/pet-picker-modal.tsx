"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Check, Heart, Shield, RefreshCw } from "lucide-react";
import { PetUserSettings, PetSize, PetStyle } from "@/types/pet";
import { PET_CATALOG, getPetById } from "./pet-catalog";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: PetUserSettings;
  onSave: (newSettings: PetUserSettings) => void;
}

export function PetPickerModal({ isOpen, onClose, settings, onSave }: Props) {
  const [draft, setDraft] = useState<PetUserSettings>(settings);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setIsClosing(false);
    }
  }, [isOpen, settings]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleApply = () => {
    onSave(draft);
    toast.success("Pet preferences saved");
    handleClose();
  };

  if (!isOpen) return null;

  const currentPet = getPetById(draft.petId);

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
          "relative w-full max-w-lg bg-surface-1 border border-hairline rounded-xl shadow-2xl p-5 sm:p-6 overflow-hidden transition-all duration-150 flex flex-col space-y-5 max-h-[90vh] overflow-y-auto",
          isClosing
            ? "opacity-0 scale-95"
            : "opacity-100 scale-100 animate-in fade-in zoom-in-95"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold tracking-[-0.2px] text-ink">
                Developer Pet Companion
              </h2>
              <p className="text-[11px] text-ink-muted">
                Choose an interactive desk companion that sits beside your name.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2/60 border border-hairline">
          <div>
            <span className="text-xs font-medium text-ink block">
              Show Pet on Dashboard
            </span>
            <span className="text-[11px] text-ink-tertiary">
              Tracks your cursor and reacts when clicked
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, enabled: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {draft.enabled && (
          <>
            {/* Gallery Section */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary mb-2 block">
                Select Companion
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PET_CATALOG.map((p) => {
                  const isSelected = draft.petId === p.id;
                  const previewSheet =
                    draft.style === "pixel" && p.hasPixelStyle && p.pixelDirectionsUrl
                      ? p.pixelDirectionsUrl
                      : p.directionsUrl;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, petId: p.id }))
                      }
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all duration-150 flex flex-col items-center justify-between relative group cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border-primary ring-1 ring-primary/40"
                          : "bg-surface-2/50 border-hairline hover:border-hairline-strong hover:bg-surface-2"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Mascot Sprite Preview */}
                      <div
                        className="w-14 h-14 my-1"
                        style={{
                          backgroundImage: `url(${previewSheet})`,
                          backgroundSize: "300% 300%",
                          backgroundPosition: "50% 50%", // Center face
                          backgroundRepeat: "no-repeat",
                          imageRendering:
                            draft.style === "pixel" ? "pixelated" : "auto",
                        }}
                      />

                      <div className="text-center w-full mt-1">
                        <span className="text-xs font-semibold text-ink block truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-ink-tertiary block font-mono truncate">
                          {p.species}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size & Style Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Size Selector */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary mb-1.5 block">
                  Companion Size
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-surface-2/60 border border-hairline">
                  {(["sm", "md", "lg"] as PetSize[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, size: s }))
                      }
                      className={cn(
                        "py-1.5 text-xs font-medium rounded-md text-center transition-colors capitalize cursor-pointer",
                        draft.size === s
                          ? "bg-surface-3 text-ink font-semibold shadow-xs"
                          : "text-ink-tertiary hover:text-ink"
                      )}
                    >
                      {s === "sm" ? "Small" : s === "md" ? "Medium" : "Large"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Selector */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-ink-tertiary mb-1.5 block">
                  Visual Style
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-surface-2/60 border border-hairline">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, style: "default" }))
                    }
                    className={cn(
                      "py-1.5 text-xs font-medium rounded-md text-center transition-colors cursor-pointer",
                      draft.style === "default"
                        ? "bg-surface-3 text-ink font-semibold shadow-xs"
                        : "text-ink-tertiary hover:text-ink"
                    )}
                  >
                    Clean Color
                  </button>
                  <button
                    type="button"
                    disabled={!currentPet.hasPixelStyle}
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, style: "pixel" }))
                    }
                    title={
                      !currentPet.hasPixelStyle
                        ? "Pixel style available for Kitsune Fox"
                        : ""
                    }
                    className={cn(
                      "py-1.5 text-xs font-medium rounded-md text-center transition-colors cursor-pointer",
                      draft.style === "pixel"
                        ? "bg-surface-3 text-ink font-semibold shadow-xs"
                        : currentPet.hasPixelStyle
                        ? "text-ink-tertiary hover:text-ink"
                        : "text-ink-tertiary/40 cursor-not-allowed"
                    )}
                  >
                    Retro Pixel
                  </button>
                </div>
              </div>
            </div>

            {/* Pet Info Banner */}
            <div className="p-3 rounded-lg bg-surface-2/30 border border-hairline flex items-center gap-2.5 text-xs text-ink-muted">
              <span className="text-base">{currentPet.emoji}</span>
              <span className="leading-relaxed">
                <strong>{currentPet.name}:</strong> &quot;{currentPet.tagline}&quot;
              </span>
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-hairline flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-1.5 rounded-lg border border-hairline text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all shadow-sm shadow-primary/25 cursor-pointer"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
