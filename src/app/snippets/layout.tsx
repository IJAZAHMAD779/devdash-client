import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Snippets",
};

export default function SnippetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
