"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { sound } from "@/lib/audio";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: React.ReactNode;
  badgeTooltip?: string;
  hasContent?: boolean;
}

interface TabsUnderlineProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
}

export function TabsUnderline<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: TabsUnderlineProps<T>) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "flex items-center gap-4 border-b border-hairline overflow-x-auto no-scrollbar select-none",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => {
              sound.playClick(850);
              onChange(tab.id);
            }}
            className={cn(
              "relative pb-2.5 pt-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0",
              isActive
                ? "text-ink font-semibold"
                : "text-ink-subtle hover:text-ink-muted"
            )}
          >
            <span>{tab.label}</span>

            {/* Quiet content marker */}
            {tab.badge ? (
              <span title={tab.badgeTooltip}>{tab.badge}</span>
            ) : tab.hasContent ? (
              <span
                title={tab.badgeTooltip || "Content available"}
                className="font-mono text-[10px] text-ink-subtle/80 bg-surface-2 px-1 py-0.2 rounded border border-hairline"
              >
                ✓
              </span>
            ) : null}

            {/* Underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-accent rounded-full animate-in fade-in duration-100" />
            )}
          </button>
        );
      })}
    </div>
  );
}
