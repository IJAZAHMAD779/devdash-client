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
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  LogIn,
} from "lucide-react";
import { useState, useEffect } from "react";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";

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
  const [muted, setMuted] = useState(false);
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    setMuted(sound.getMuted());
  }, []);

  const handleToggleSound = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
    if (!isMuted) {
      sound.playClick();
    }
  };

  const handleOpenSearch = () => {
    sound.playClick(950);
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-surface-1 border-r border-hairline flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-hairline">
        <Link
          href="/projects"
          className="flex items-center gap-2.5 group"
          onClick={() => sound.playClick()}
        >
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform duration-150">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-[-0.6px] text-ink leading-tight">
              DevDash
            </span>
            <span className="text-[10px] font-mono text-ink-subtle leading-none">
              Workspace v1.0
            </span>
          </div>
        </Link>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-3 border border-hairline text-ink-subtle">
          <Sparkles className="w-2.5 h-2.5 text-primary" />
          Free
        </span>
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
              onClick={() => {
                if (!item.badge) sound.playClick();
              }}
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
        <div className="flex items-center justify-between px-2 py-1.5 text-xs text-ink-subtle">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
            <span>API Active</span>
          </div>

          <button
            onClick={handleToggleSound}
            title={muted ? "Unmute tactile audio" : "Mute tactile audio"}
            className="p-1 rounded hover:bg-surface-2 text-ink-subtle hover:text-ink transition-colors"
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5 text-ink-tertiary" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-primary" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-hairline/50 px-1">
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
