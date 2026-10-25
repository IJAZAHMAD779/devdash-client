"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Add tags (press Enter or comma)...",
  className,
  maxTags = 10,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (rawText: string) => {
    let clean = rawText.trim().replace(/^#+/, "").toLowerCase();
    if (!clean) return;
    if (tags.includes(clean)) {
      setInputValue("");
      return;
    }
    if (tags.length >= maxTags) return;

    sound.playClick(900);
    onChange([...tags, clean]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    sound.playClick(500);
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      e.preventDefault();
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "flex flex-wrap items-center gap-1.5 p-1.5 min-h-[34px] rounded-md bg-surface-2/60 border border-hairline hover:border-hairline-strong transition-colors cursor-text focus-within:border-accent/60",
        className
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-surface-3 text-ink-muted border border-hairline group"
        >
          <span className="text-ink-subtle">#</span>
          <span>{tag}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            aria-label={`Remove tag ${tag}`}
            className="text-ink-subtle hover:text-ink transition-colors rounded p-0.5"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}

      <div className="flex-1 flex items-center min-w-[120px]">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue);
            }
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="w-full bg-transparent text-xs text-ink placeholder:text-ink-subtle/50 focus:outline-none font-mono"
        />
        {inputValue.trim() && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addTag(inputValue);
            }}
            className="shrink-0 p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors"
            title="Add tag"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
