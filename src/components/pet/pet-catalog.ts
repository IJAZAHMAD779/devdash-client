import { PetDefinition } from "@/types/pet";

export const PET_CATALOG: PetDefinition[] = [
  {
    id: "fox",
    name: "Kitsune",
    species: "Chibi Fox",
    emoji: "🦊",
    tagline: "Sharp, curious, and watchful code companion.",
    directionsUrl: "/mascots/fox-directions.webp",
    reactionsUrl: "/mascots/fox-reactions.webp",
    hasPixelStyle: true,
    pixelDirectionsUrl: "/mascots/fox-pixel-directions.webp",
    pixelReactionsUrl: "/mascots/fox-pixel-reactions.webp",
  },
  {
    id: "cat",
    name: "Mochi",
    species: "Neko Cat",
    emoji: "🐱",
    tagline: "Sits on your desk and observes every commit.",
    directionsUrl: "/mascots/cat-directions.webp",
    reactionsUrl: "/mascots/cat-reactions.webp",
  },
  {
    id: "dino",
    name: "Rex",
    species: "Mini Dino",
    emoji: "🦖",
    tagline: "Stomps runtime bugs before they reach prod.",
    directionsUrl: "/mascots/dino-directions.webp",
    reactionsUrl: "/mascots/dino-reactions.webp",
  },
  {
    id: "gearbot",
    name: "Byte",
    species: "Cyber Bot",
    emoji: "🤖",
    tagline: "Compiles happiness and clean architecture in O(1).",
    directionsUrl: "/mascots/gearbot-directions.webp",
    reactionsUrl: "/mascots/gearbot-reactions.webp",
  },
  {
    id: "bear",
    name: "Barnaby",
    species: "Focus Bear",
    emoji: "🐻",
    tagline: "Steady, calm, and keeps you grounded in deep work.",
    directionsUrl: "/mascots/bear-directions.webp",
    reactionsUrl: "/mascots/bear-reactions.webp",
  },
  {
    id: "frog",
    name: "Kero",
    species: "Zen Frog",
    emoji: "🐸",
    tagline: "Meditates quietly beside your open tasks.",
    directionsUrl: "/mascots/frog-directions.webp",
    reactionsUrl: "/mascots/frog-reactions.webp",
  },
];

export function getPetById(id: string): PetDefinition {
  return PET_CATALOG.find((p) => p.id === id) || PET_CATALOG[0];
}
