"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Code2,
  Component,
  BookOpen,
  LogIn,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { DevDashLogo } from "@/components/ui/devdash-logo";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navigationItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Snippets", href: "/snippets", icon: Code2 },
  { name: "Components", href: "/components", icon: Component },
  { name: "Resources", href: "/resources", icon: BookOpen },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  // Close drawer automatically on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOpenSearch = () => {
    sound.playClick(800);
    setIsOpen(false);
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  const currentRouteName =
    navigationItems.find((item) => pathname?.startsWith(item.href))?.name ||
    "Workspace";

  return (
    <>
      {/* 1. Mobile Sticky Top Header (Hidden on md: and above) */}
      <header className="md:hidden sticky top-0 z-30 h-14 w-full bg-surface-1/95 border-b border-hairline backdrop-blur-md px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick(600);
              setIsOpen(true);
            }}
            aria-label="Open mobile menu"
            className="p-1.5 -ml-1 rounded-lg text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <DevDashLogo size={24} href="" />
            <span className="text-xs font-semibold tracking-tight text-ink">
              DevDash
            </span>
          </Link>
        </div>

        {/* Current section badge & search trigger */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-hairline text-ink-subtle">
            {currentRouteName}
          </span>

          <button
            type="button"
            onClick={handleOpenSearch}
            title="Search (⌘K)"
            aria-label="Search workspace"
            className="p-2 rounded-lg text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {isSignedIn && (
            <div className="flex items-center ml-1">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-7 h-7",
                  },
                }}
              />
            </div>
          )}
        </div>
      </header>

      {/* 2. Slide-over Mobile Drawer with Backdrop */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Dim Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Surface */}
          <div className="relative w-4/5 max-w-xs h-full bg-surface-1 border-r border-hairline-strong shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DevDashLogo size={26} href="" />
                <span className="text-xs font-semibold tracking-tight text-ink">
                  DevDash
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playClick(600);
                  setIsOpen(false);
                }}
                aria-label="Close menu"
                className="p-1.5 rounded-lg text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search Button */}
            <div className="p-3 border-b border-hairline">
              <button
                type="button"
                onClick={handleOpenSearch}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-subtle text-xs transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  <span>Search workspace...</span>
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-3 font-mono text-[10px] text-ink-tertiary">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-tertiary">
                Workspace
              </div>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => sound.playClick(900)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                      isActive
                        ? "bg-primary text-white shadow-xs font-semibold"
                        : "text-ink-muted hover:text-ink hover:bg-surface-2"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isActive ? "text-white" : "text-ink-subtle"
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Footer */}
            <div className="p-3 border-t border-hairline bg-surface-1/80">
              {isSignedIn ? (
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserButton
                      afterSignOutUrl="/sign-in"
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "w-8 h-8",
                        },
                      }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-ink truncate">
                        {user?.fullName || user?.username || "Developer"}
                      </span>
                      <span className="text-[10px] text-ink-tertiary truncate">
                        {user?.primaryEmailAddress?.emailAddress}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
