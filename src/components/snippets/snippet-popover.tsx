"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";

export interface SnippetPopoverOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}

interface BasePopoverProps<T extends string> {
  options: SnippetPopoverOption<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  align?: "left" | "right";
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

interface SingleSelectProps<T extends string> extends BasePopoverProps<T> {
  mode?: "single";
  value: T;
  onChange: (val: T) => void;
  renderTrigger?: (selected: SnippetPopoverOption<T> | undefined, isOpen: boolean) => React.ReactNode;
}

interface MultiSelectProps<T extends string> extends BasePopoverProps<T> {
  mode: "multi";
  value: T[];
  onChange: (val: T[]) => void;
  renderTrigger?: (selected: SnippetPopoverOption<T>[], isOpen: boolean) => React.ReactNode;
  onClear?: () => void;
}

export type SnippetPopoverProps<T extends string> =
  | SingleSelectProps<T>
  | MultiSelectProps<T>;

export function SnippetPopover<T extends string>(props: SnippetPopoverProps<T>) {
  const {
    mode = "single",
    options,
    align = "left",
    className,
    disabled = false,
    searchable = false,
    placeholder = "Select...",
    searchPlaceholder = "Filter...",
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.hint && opt.hint.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchQuery("");
      setActiveIndex(-1);
    }
  }, [isOpen, searchable]);

  // Keyboard navigation and outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < filteredOptions.length) {
        e.preventDefault();
        handleSelect(filteredOptions[activeIndex].value);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, activeIndex, filteredOptions]);

  const handleSelect = (val: T) => {
    sound.playClick(800);
    if (props.mode === "multi") {
      const exists = props.value.includes(val);
      const next = exists
        ? props.value.filter((v) => v !== val)
        : [...props.value, val];
      props.onChange(next);
    } else {
      props.onChange(val);
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    sound.playClick(600);
    setIsOpen(!isOpen);
  };

  const isSelected = (val: T) => {
    if (props.mode === "multi") {
      return props.value.includes(val);
    }
    return props.value === val;
  };

  const hasActiveSelection =
    props.mode === "multi" ? props.value.length > 0 : Boolean(props.value);

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* Trigger */}
      <div onClick={handleToggle} className="cursor-pointer">
        {props.renderTrigger ? (
          props.mode === "multi" ? (
            props.renderTrigger(
              options.filter((o) => props.value.includes(o.value)),
              isOpen
            )
          ) : (
            props.renderTrigger(
              options.find((o) => o.value === props.value),
              isOpen
            )
          )
        ) : (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-mono transition-colors border",
              isOpen
                ? "bg-surface-2 text-ink border-hairline-strong"
                : hasActiveSelection
                ? "bg-surface-2 text-ink border-accent/40"
                : "bg-surface-1 text-ink-muted border-hairline hover:bg-surface-2 hover:text-ink",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {hasActiveSelection && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
            <span className="truncate">
              {props.mode === "multi"
                ? props.value.length === 0
                  ? placeholder
                  : `${props.value.length} selected`
                : options.find((o) => o.value === props.value)?.label || placeholder}
            </span>
            <ChevronDown className={cn("w-3 h-3 text-ink-subtle transition-transform", isOpen && "rotate-180")} />
          </button>
        )}
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 min-w-[200px] max-w-[280px] rounded-lg bg-surface-1 border border-hairline-strong shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {searchable && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-hairline mb-1">
              <Search className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-ink placeholder:text-ink-subtle/50 focus:outline-none font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-ink-subtle hover:text-ink p-0.5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {props.mode === "multi" && props.value.length > 0 && (
            <div className="flex items-center justify-between px-2 py-1 border-b border-hairline mb-1 text-[11px] font-mono">
              <span className="text-ink-subtle">{props.value.length} selected</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick(500);
                  if (props.onClear) props.onClear();
                  else props.onChange([]);
                }}
                className="text-accent hover:text-accent/80 transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          <div className="max-h-[220px] overflow-y-auto space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-ink-subtle font-mono">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const selected = isSelected(opt.value);
                const isActive = idx === activeIndex;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left",
                      isActive ? "bg-surface-2 text-ink" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                      selected && "text-ink font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.hint && (
                        <span className="text-[10px] font-mono text-ink-subtle">
                          {opt.hint}
                        </span>
                      )}
                      {selected && <Check className="w-3.5 h-3.5 text-accent" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
