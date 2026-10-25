"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Code2,
  Component,
  BookOpen,
  Search,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
  Gamepad2,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";
import { DevDashLogo } from "@/components/ui/devdash-logo";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  keys: [string, string];
}

const navigationItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keys: ["G", "D"] },
  { name: "Projects", href: "/projects", icon: FolderKanban, keys: ["G", "P"] },
  { name: "Tasks", href: "/tasks", icon: CheckSquare, keys: ["G", "T"] },
  { name: "Snippets", href: "/snippets", icon: Code2, keys: ["G", "S"] },
  { name: "Components", href: "/components", icon: Component, keys: ["G", "C"] },
  { name: "Resources", href: "/resources", icon: BookOpen, keys: ["G", "R"] },
  { name: "Games", href: "/games", icon: Gamepad2, keys: ["G", "A"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Read saved collapsed preference safely after mount
  useEffect(() => {
    const saved = localStorage.getItem("devdash_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("devdash_sidebar_collapsed", String(next));
      return next;
    });
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  const handleOpenAi = () => {
    window.dispatchEvent(new CustomEvent("open-devdash-ai"));
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-shrink-0 bg-surface-1 border-r border-line flex-col h-dvh sticky top-0 select-none transition-[width] duration-200 ease-in-out z-20",
        isCollapsed ? "w-[56px]" : "w-[240px]"
      )}
    >
      {/* 1. Logo Row */}
      <div
        className={cn(
          "h-14 flex items-center border-b border-line shrink-0",
          isCollapsed ? "justify-center px-0" : "px-4 justify-between"
        )}
      >
        {isCollapsed ? (
          <button
            onClick={toggleCollapsed}
            title="Expand sidebar"
            className="group relative w-9 h-9 rounded-[6px] flex items-center justify-center hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            aria-label="Expand sidebar"
          >
            <div className="transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 flex items-center justify-center">
              <DevDashLogo size={24} href="" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200">
              <PanelLeftOpen className="w-4 h-4 text-muted hover:text-text-primary" />
            </div>
          </button>
        ) : (
          <>
            <DevDashLogo size={26} href="/dashboard" />
            <button
              onClick={toggleCollapsed}
              title="Collapse sidebar"
              className="p-1.5 rounded-[6px] text-muted hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-muted hover:text-text-primary" />
            </button>
          </>
        )}
      </div>

      {/* 2. Middle Navigation (Middle with own overflow-y-auto) */}
      <div
        className={cn(
          "flex-1 py-3 space-y-1 no-scrollbar min-h-0",
          isCollapsed ? "px-1.5 overflow-visible" : "px-2.5 overflow-y-auto overflow-x-hidden"
        )}
      >
        {/* Quiet Search Field (32px tall, 6px radius, surface-2 on hover only, mono ⌘K as plain text) */}
        {isCollapsed ? (
          <button
            onClick={handleOpenSearch}
            title="Search (⌘K)"
            className="w-9 h-8 mx-auto flex items-center justify-center mb-2.5 rounded-[6px] hover:bg-surface-2 text-muted hover:text-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            aria-label="Search"
          >
            <Search className="w-4 h-4 stroke-[1.5]" />
          </button>
        ) : (
          <button
            onClick={handleOpenSearch}
            className="w-full h-8 flex items-center justify-between px-2.5 mb-2.5 rounded-[6px] hover:bg-surface-2 text-muted hover:text-text-primary text-xs transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <span className="flex items-center gap-2 text-muted group-hover:text-text-primary">
              <Search className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Search...</span>
            </span>
            <span className="text-[11px] font-mono text-subtle">
              ⌘K
            </span>
          </button>
        )}

        {/* Section Label: CORE HUB */}
        {!isCollapsed && (
          <div className="px-2.5 pt-1 pb-1.5 text-[11px] font-mono uppercase tracking-[0.08em] text-muted">
            CORE HUB
          </div>
        )}

        {/* Nav Items */}
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          if (isCollapsed) {
            return (
              <div key={item.name} className="relative group/collapsed flex justify-center">
                <Link
                  href={item.badge ? "#" : item.href}
                  title={`${item.name} (${item.keys.join(" + ")})`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative w-9 h-8 flex items-center justify-center rounded-[6px] text-xs font-medium transition-colors duration-150 group",
                    isActive
                      ? "bg-surface-2 text-text-primary"
                      : "text-muted hover:text-text-primary hover:bg-surface-2/60",
                    item.badge && "opacity-60 cursor-not-allowed hover:bg-transparent"
                  )}
                  aria-label={`${item.name} (${item.keys.join(" + ")})`}
                >
                  {/* Left Accent Bar on Active Item */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-accent rounded-r" />
                  )}
                  <Icon className="w-[18px] h-[18px] stroke-[1.5] transition-colors" />
                </Link>

                {/* Floating Tooltip on Hover/Focus */}
                <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-[6px] bg-surface-2 border border-line shadow-xl text-xs font-medium text-text-primary flex items-center gap-2 opacity-0 invisible group-hover/collapsed:opacity-100 group-hover/collapsed:visible pointer-events-none transition-all duration-150 z-50 whitespace-nowrap">
                  <span>{item.name}</span>
                  <span className="flex items-center gap-0.5 text-subtle font-mono text-[10px]">
                    <kbd>{item.keys[0]}</kbd>
                    <span>+</span>
                    <kbd>{item.keys[1]}</kbd>
                  </span>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.badge ? "#" : item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center justify-between h-[34px] px-2.5 rounded-[6px] text-xs font-medium transition-colors duration-150 group",
                isActive
                  ? "bg-surface-2 text-text-primary"
                  : "text-muted hover:text-text-primary hover:bg-surface-2/60",
                item.badge && "opacity-60 cursor-not-allowed hover:bg-transparent"
              )}
            >
              {/* Left Accent Bar on Active Item */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-accent rounded-r" />
              )}

              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-[18px] h-[18px] stroke-[1.5] shrink-0 transition-colors" />
                <span className="truncate">{item.name}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-surface-2 border border-line text-subtle">
                    {item.badge}
                  </span>
                )}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 text-subtle select-none font-mono text-[10px]">
                  <span>{item.keys[0]}</span>
                  <span>+</span>
                  <span>{item.keys[1]}</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Profile & Actions Footer (Pinned to bottom, full-height flex column) */}
      <div
        className={cn(
          "border-t border-line bg-surface-1 shrink-0 flex flex-col gap-2 transition-all duration-200",
          isCollapsed ? "p-2 items-center" : "px-3 py-2.5"
        )}
      >
        <div className={cn("flex items-center justify-between w-full gap-2", isCollapsed && "flex-col gap-2 justify-center")}>
          {isSignedIn ? (
            <div className={cn("flex items-center gap-2.5 min-w-0", isCollapsed ? "justify-center flex-none" : "flex-1 min-w-0")}>
              <div className="shrink-0 flex items-center justify-center">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-7 h-7 border border-line rounded-[6px]",
                    },
                  }}
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col text-left min-w-0 flex-1">
                  <span
                    className="text-xs font-medium text-text-primary truncate block w-full"
                    title={user?.fullName || user?.primaryEmailAddress?.emailAddress || "Developer"}
                  >
                    {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Developer"}
                  </span>
                  <span className="text-[10px] font-mono text-muted whitespace-nowrap block">
                    Signed In
                  </span>
                </div>
              )}
            </div>
          ) : (
            isCollapsed ? (
              <Link
                href="/sign-in"
                title="Sign In"
                className="w-8 h-8 rounded-[6px] bg-accent hover:bg-accent-hover text-white transition-colors flex items-center justify-center cursor-pointer"
              >
                <LogIn className="w-4 h-4 stroke-[1.5]" />
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium tracking-tight transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Sign In</span>
              </Link>
            )
          )}

          {/* AI Copilot Trigger Button (Quiet in footer, replaces the floating FAB) */}
          <button
            type="button"
            onClick={handleOpenAi}
            title="DevDash AI Copilot (⌘J)"
            aria-label="DevDash AI Copilot"
            className="p-1.5 rounded-[6px] text-muted hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent shrink-0"
          >
            <Bot className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
