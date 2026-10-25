"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";

export interface PopoverOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}

interface SingleSelectProps<T extends string> {
  mode?: "single";
  value: T;
  onChange: (val: T) => void;
  options: PopoverOption<T>[];
  placeholder?: string;
  renderTrigger?: (selected: PopoverOption<T> | undefined, isOpen: boolean) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
  disabled?: boolean;
}

interface MultiSelectProps<T extends string> {
  mode: "multi";
  value: T[];
  onChange: (val: T[]) => void;
  options: PopoverOption<T>[];
  placeholder?: string;
  renderTrigger?: (selected: PopoverOption<T>[], isOpen: boolean) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
  disabled?: boolean;
}

export type PropertyPopoverProps<T extends string> =
  | SingleSelectProps<T>
  | MultiSelectProps<T>;

export function PropertyPopover<T extends string>(props: PropertyPopoverProps<T>) {
  const {
    mode = "single",
    options,
    align = "left",
    className,
    disabled = false,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or blur
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
        setActiveIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
      } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < options.length) {
        e.preventDefault();
        handleSelect(options[activeIndex].value);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, activeIndex, options]);

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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(600);
    if (props.mode === "multi") {
      props.onChange([]);
    }
  };

  const isSelected = (val: T) => {
    if (props.mode === "multi") {
      return props.value.includes(val);
    }
    return props.value === val;
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (disabled) return;
          sound.playClick(700);
          setIsOpen((prev) => !prev);
          setActiveIndex(-1);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          "cursor-pointer focus:outline-none select-none",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        {props.mode === "multi" ? (
          props.renderTrigger ? (
            props.renderTrigger(
              options.filter((o) => props.value.includes(o.value)),
              isOpen
            )
          ) : (
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-mono bg-surface-2 hover:bg-surface-3 border border-line hover:border-line-strong text-muted hover:text-text-primary transition-colors",
                isOpen && "border-line-strong text-text-primary bg-surface-3"
              )}
            >
              <span>
                {props.value.length === 0
                  ? props.placeholder || "All"
                  : `${props.value.length} selected`}
              </span>
              <ChevronDown className="w-3 h-3 text-subtle shrink-0" />
            </button>
          )
        ) : props.renderTrigger ? (
          props.renderTrigger(
            options.find((o) => o.value === props.value),
            isOpen
          )
        ) : (
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-mono bg-surface-2 hover:bg-surface-3 border border-line hover:border-line-strong text-muted hover:text-text-primary transition-colors",
              isOpen && "border-line-strong text-text-primary bg-surface-3"
            )}
          >
            <span>
              {options.find((o) => o.value === props.value)?.label ||
                props.placeholder ||
                "Select"}
            </span>
            <ChevronDown className="w-3 h-3 text-subtle shrink-0" />
          </button>
        )}
      </div>

      {/* Popover Menu Dropdown */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 min-w-[160px] max-w-[280px] rounded-[8px] bg-surface-1 border border-line-strong shadow-2xl py-1 overflow-y-auto max-h-[260px] animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {props.mode === "multi" && props.value.length > 0 && (
            <div className="px-2 py-1 border-b border-line flex items-center justify-between text-[11px] font-mono text-subtle">
              <span>{props.value.length} selected</span>
              <button
                type="button"
                onClick={handleClear}
                className="hover:text-text-primary underline text-[10px]"
              >
                Clear
              </button>
            </div>
          )}

          {options.map((opt, idx) => {
            const selected = isSelected(opt.value);
            const isHighlighted = idx === activeIndex;

            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  "px-2.5 py-1.5 mx-1 rounded-[4px] text-xs font-mono flex items-center justify-between gap-2 cursor-pointer transition-colors select-none",
                  selected
                    ? "text-text-primary font-medium"
                    : "text-muted hover:text-text-primary",
                  isHighlighted ? "bg-surface-2" : "bg-transparent"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                  {opt.hint && (
                    <span className="text-[10px] text-subtle truncate">
                      {opt.hint}
                    </span>
                  )}
                </div>

                {selected && (
                  <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
