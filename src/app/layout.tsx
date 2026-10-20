import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Providers } from "@/components/providers";
import { AppLayout } from "@/components/app-layout";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DevDash . Dashboard",
    template: "DevDash . %s",
  },
  description:
    "Decoupled developer productivity hub for managing projects, tasks, syntax-highlighted snippets, and UI components.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "DevDash — Personal Developer Workspace",
    description:
      "Decoupled developer productivity hub for managing projects, telemetry, Kanban tasks, syntax-highlighted snippets, and UI components.",
    url: "https://devdash.vercel.app",
    siteName: "DevDash",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 675,
        alt: "DevDash — Personal Developer Workspace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevDash — Personal Developer Workspace",
    description:
      "Decoupled developer productivity hub for managing projects, telemetry, Kanban tasks, syntax-highlighted snippets, and UI components.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#2563eb",
          colorBackground: "#0f1011",
          colorInputBackground: "#141516",
          colorInputText: "#f7f8f8",
          colorText: "#f7f8f8",
          colorTextSecondary: "#8a8f98",
          borderRadius: "0.5rem",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="bg-canvas text-ink antialiased">
          <Providers>
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
