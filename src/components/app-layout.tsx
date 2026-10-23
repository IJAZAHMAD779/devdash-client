"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { SpotlightSearch } from "@/components/search/spotlight-search";
import { AiFloatingButton } from "@/components/ai/ai-floating-button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

  if (isAuthPage) {
    return (
      <main className="h-screen max-h-screen w-screen overflow-hidden bg-canvas">
        {children}
      </main>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-canvas">
      <MobileNav />
      <Sidebar />
      <main className="flex-1 overflow-x-hidden flex flex-col min-w-0">
        {children}
      </main>
      <SpotlightSearch />
      <AiFloatingButton />
    </div>
  );
}
