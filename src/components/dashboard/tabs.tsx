"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  extra?: React.ReactNode;
}

export function Tabs({ tabs, activeTab, onChange, className, extra }: TabsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-line px-4 pt-1",
        className
      )}
    >
      <div className="flex items-center gap-6">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative pb-2.5 pt-2 text-xs font-mono uppercase tracking-[0.08em] transition-colors cursor-pointer select-none flex items-center gap-2",
                isActive
                  ? "text-text-primary font-medium"
                  : "text-muted hover:text-text-primary font-normal"
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className="text-[10px] text-subtle">
                  ({tab.count})
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
              )}
            </button>
          );
        })}
      </div>
      {extra && <div className="flex items-center gap-2 pb-2">{extra}</div>}
    </div>
  );
}
