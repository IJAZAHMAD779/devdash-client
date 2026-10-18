"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { SpotlightSearch } from "@/components/search/spotlight-search";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

  if (isAuthPage) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-canvas relative overflow-hidden">
        {/* Subtle ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 w-full flex flex-col items-center justify-center p-4">
          {children}
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden flex flex-col">
        {children}
      </main>
      <SpotlightSearch />
    </div>
  );
}
