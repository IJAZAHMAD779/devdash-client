"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";

interface ComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[]; // Existing categories
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select category...",
  className,
  disabled = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // Case-insensitive filtering
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, search]);

  const isExactMatch = useMemo(() => {
    const q = search.trim().toLowerCase();
    return options.some((opt) => opt.toLowerCase() === q);
  }, [options, search]);

  const canCreate = Boolean(search.trim()) && !isExactMatch;

  // Keyboard navigation & outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const totalItems = filteredOptions.length + (canCreate ? 1 : 0);

      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(1, totalItems));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (canCreate && activeIndex === filteredOptions.length) {
          handleSelect(search.trim());
        } else if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex]);
        } else if (canCreate && filteredOptions.length === 0) {
          handleSelect(search.trim());
        } else if (filteredOptions.length > 0) {
          handleSelect(filteredOptions[0]);
        }
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, activeIndex, filteredOptions, canCreate, search]);

  const handleSelect = (categoryName: string) => {
    sound.playClick(800);
    // If selecting an existing option case-insensitively, reuse stored casing
    const existing = options.find((o) => o.toLowerCase() === categoryName.toLowerCase());
    onChange(existing || categoryName);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    sound.playClick(600);
    setIsOpen(!isOpen);
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-mono transition-colors border",
          isOpen
            ? "bg-surface-2 text-ink border-hairline-strong"
            : value
            ? "bg-surface-2 text-ink border-hairline hover:border-hairline-strong"
            : "bg-surface-1 text-ink-subtle border-hairline hover:text-ink hover:bg-surface-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="truncate max-w-[130px] capitalize">{value || placeholder}</span>
        <ChevronDown className={cn("w-3 h-3 text-ink-subtle transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 min-w-[200px] max-w-[260px] rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100 left-0"
        >
          {/* Search Input */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-hairline mb-1">
            <Search className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(-1);
              }}
              placeholder="Search or create category..."
              className="w-full bg-transparent text-xs text-ink placeholder:text-ink-subtle/50 focus:outline-none font-mono"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-ink-subtle hover:text-ink p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-0.5">
            {filteredOptions.map((opt, idx) => {
              const isSelected = value.toLowerCase() === opt.toLowerCase();
              const isHovered = idx === activeIndex;

              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left font-mono",
                    isHovered ? "bg-surface-2 text-ink" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                    isSelected && "text-ink font-medium"
                  )}
                >
                  <span className="truncate capitalize">{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                </button>
              );
            })}

            {/* Create option */}
            {canCreate && (
              <button
                type="button"
                role="option"
                onClick={() => handleSelect(search.trim())}
                onMouseEnter={() => setActiveIndex(filteredOptions.length)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-accent hover:bg-accent/10 transition-colors text-left font-mono border-t border-hairline/60 mt-1 pt-1.5",
                  activeIndex === filteredOptions.length && "bg-accent/10"
                )}
              >
                <Plus className="w-3 h-3 shrink-0" />
                <span className="truncate">Create &quot;{search.trim()}&quot;</span>
              </button>
            )}

            {!canCreate && filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-center text-xs text-ink-subtle font-mono">
                No matching categories
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
