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
      <main className="h-screen max-h-screen w-screen overflow-hidden bg-canvas">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden flex flex-col min-w-0">
        {children}
      </main>
      <SpotlightSearch />
    </div>
  );
}
