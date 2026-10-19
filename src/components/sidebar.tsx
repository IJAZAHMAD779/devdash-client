"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  CheckSquare,
  Code2,
  Component,
  BookOpen,
  Search,
  Sparkles,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";
import { DevDashLogo } from "@/components/ui/devdash-logo";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navigationItems: NavItem[] = [
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Snippets", href: "/snippets", icon: Code2 },
  { name: "Components", href: "/components", icon: Component },
  { name: "Resources", href: "/resources", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  const handleOpenSearch = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-surface-1 border-r border-hairline flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header: Just icon logo, no text, no background, linked to site */}
      <div className="h-14 px-4 flex items-center border-b border-hairline">
        <DevDashLogo size={28} href="/projects" />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Cmd+K Search Trigger */}
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

        <div className="px-2 pb-2 text-[11px] font-mono uppercase tracking-wider text-ink-tertiary">
          Core Hub
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
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
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-ink-subtle group-hover:text-ink"
                  )}
                />
                <span className="tracking-[-0.1px]">{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-hairline text-ink-tertiary">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Controls & User Profile */}
      <div className="p-3 border-t border-hairline bg-surface-1/50 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          {isSignedIn ? (
            <div className="flex items-center gap-2.5">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-7 h-7 border border-hairline",
                  },
                }}
              />
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-ink truncate max-w-[130px]">
                  {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Developer"}
                </span>
                <span className="text-[10px] font-mono text-ink-subtle">
                  Signed In
                </span>
              </div>
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight transition-colors shadow-sm shadow-primary/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
