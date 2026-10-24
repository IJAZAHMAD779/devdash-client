import { Metadata } from "next";
import { ArcadeHub } from "@/components/games/arcade-hub";

export const metadata: Metadata = {
  title: "Games & Relaxation | DevDash",
  description: "Lightweight classic browser games for relaxing in your workspace.",
};

export default function GamesPage() {
  return <ArcadeHub />;
}
