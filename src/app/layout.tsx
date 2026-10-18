import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { SpotlightSearch } from "@/components/search/spotlight-search";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevDash — Personal Developer Workspace",
  description:
    "Decoupled developer productivity hub for managing projects, tasks, syntax-highlighted snippets, and UI components.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="bg-canvas text-ink antialiased">
          <Providers>
            <div className="flex min-h-screen bg-canvas">
              <Sidebar />
              <main className="flex-1 overflow-x-hidden flex flex-col">
                {children}
              </main>
            </div>
            <SpotlightSearch />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
