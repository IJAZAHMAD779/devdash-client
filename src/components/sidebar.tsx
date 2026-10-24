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

  return (
    <aside
      className={cn(
        "hidden md:flex flex-shrink-0 bg-surface-1 border-r border-hairline flex-col h-screen sticky top-0 select-none transition-all duration-200 ease-in-out z-20",
        isCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Brand Header: Just icon logo (no text, no background). When collapsed: shows ONLY logo, and on hover swaps with sidebar expand icon */}
      <div
        className={cn(
          "h-14 flex items-center border-b border-hairline transition-all duration-200",
          isCollapsed ? "justify-center px-0" : "px-4 justify-between"
        )}
      >
        {isCollapsed ? (
          <button
            onClick={toggleCollapsed}
            title="Expand sidebar"
            className="group relative w-10 h-10 rounded-lg flex items-center justify-center hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            aria-label="Expand sidebar"
          >
            {/* Default state: Logo only */}
            <div className="transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 flex items-center justify-center">
              <DevDashLogo size={26} href="" />
            </div>
            {/* Hover state: Sidebar icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200">
              <PanelLeftOpen className="w-4 h-4 text-primary" />
            </div>
          </button>
        ) : (
          <>
            <DevDashLogo size={28} href="/dashboard" />
            <button
              onClick={toggleCollapsed}
              title="Collapse sidebar"
              className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-ink-muted hover:text-ink" />
            </button>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <div className={cn("flex-1 py-4 space-y-1 overflow-y-auto", isCollapsed ? "px-2" : "px-3")}>
        {/* Cmd+K Search Trigger */}
        {isCollapsed ? (
          <button
            onClick={handleOpenSearch}
            title="Search (⌘K)"
            className="w-full flex items-center justify-center p-2 mb-3 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-ink-tertiary" />
          </button>
        ) : (
          <button
            onClick={handleOpenSearch}
            className="w-full flex items-center justify-between px-2.5 py-1.5 mb-3 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink text-xs transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-2 text-ink-tertiary group-hover:text-ink">
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
            </span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-1 border border-hairline text-ink-tertiary">
              ⌘K
            </kbd>
          </button>
        )}

        {!isCollapsed && (
          <div className="px-2 pb-2 text-[11px] font-mono uppercase tracking-wider text-ink-tertiary">
            Core Hub
          </div>
        )}

        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          if (isCollapsed) {
            return (
              <div key={item.name} className="relative group/collapsed">
                <Link
                  href={item.badge ? "#" : item.href}
                  className={cn(
                    "w-full flex items-center justify-center p-2.5 rounded-md text-sm font-medium transition-colors duration-150 group",
                    isActive
                      ? "bg-surface-3 text-ink border border-hairline"
                      : "text-ink-muted hover:text-ink hover:bg-surface-2",
                    item.badge && "opacity-60 cursor-not-allowed hover:bg-transparent"
                  )}
                  aria-label={`${item.name} (${item.keys.join(" + ")})`}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-ink-subtle group-hover:text-ink"
                    )}
                  />
                </Link>

                {/* Floating Tooltip on Hover with Name + Shortcut */}
                <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-surface-2 border border-hairline shadow-xl text-xs font-medium text-ink flex items-center gap-2 opacity-0 group-hover/collapsed:opacity-100 pointer-events-none transition-all duration-150 z-50 whitespace-nowrap">
                  <span>{item.name}</span>
                  <span className="flex items-center gap-0.5 text-ink-tertiary">
                    <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface-3 border border-hairline text-ink-subtle font-semibold">
                      {item.keys[0]}
                    </kbd>
                    <span className="text-[9px] font-mono text-ink-tertiary">+</span>
                    <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface-3 border border-hairline text-ink-subtle font-semibold">
                      {item.keys[1]}
                    </kbd>
                  </span>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.badge ? "#" : item.href}
              className={cn(
                "flex items-center justify-between px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-150 group",
                isActive
                  ? "bg-surface-3 text-ink border border-hairline"
                  : "text-ink-muted hover:text-ink hover:bg-surface-2",
                item.badge && "opacity-60 cursor-not-allowed hover:bg-transparent"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-ink-subtle group-hover:text-ink"
                  )}
                />
                <span className="tracking-[-0.1px] truncate">{item.name}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-hairline text-ink-tertiary">
                    {item.badge}
                  </span>
                )}
                {/* Related shortcut on hover with plus symbol */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 text-ink-tertiary select-none">
                  <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface-2 border border-hairline text-ink-subtle group-hover:text-ink font-semibold shadow-2xs">
                    {item.keys[0]}
                  </kbd>
                  <span className="text-[9px] font-mono text-ink-tertiary">+</span>
                  <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface-2 border border-hairline text-ink-subtle group-hover:text-ink font-semibold shadow-2xs">
                    {item.keys[1]}
                  </kbd>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer Controls & User Profile */}
      <div
        className={cn(
          "border-t border-hairline bg-surface-1/50 flex flex-col gap-2 transition-all duration-200",
          isCollapsed ? "p-2 items-center" : "p-3"
        )}
      >
        <div className={cn("flex items-center justify-between w-full", isCollapsed && "justify-center")}>
          {isSignedIn ? (
            <div className={cn("flex items-center gap-2.5", isCollapsed && "justify-center")}>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-7 h-7 border border-hairline",
                  },
                }}
              />
              {!isCollapsed && (
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-ink truncate max-w-[130px]">
                    {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Developer"}
                  </span>
                  <span className="text-[10px] font-mono text-ink-subtle">
                    Signed In
                  </span>
                </div>
              )}
            </div>
          ) : (
            isCollapsed ? (
              <Link
                href="/sign-in"
                title="Sign In / Register"
                className="p-2 rounded-md bg-primary hover:bg-primary-hover text-white transition-colors shadow-sm shadow-primary/20 flex items-center justify-center"
              >
                <LogIn className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight transition-colors shadow-sm shadow-primary/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </Link>
            )
          )}
        </div>
      </div>
    </aside>
  );
}
