import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Providers } from "@/components/providers";
import { AppLayout } from "@/components/app-layout";
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
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#5e6ad2",
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
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
