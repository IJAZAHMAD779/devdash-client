export type PetSize = "sm" | "md" | "lg";
export type PetStyle = "default" | "pixel";

export interface PetDefinition {
  id: string;
  name: string;
  species: string;
  emoji: string;
  tagline: string;
  directionsUrl: string;
  reactionsUrl: string;
  hasPixelStyle?: boolean;
  pixelDirectionsUrl?: string;
  pixelReactionsUrl?: string;
}

export interface PetUserSettings {
  enabled: boolean;
  petId: string;
  size: PetSize;
  style: PetStyle;
}

export const DEFAULT_PET_SETTINGS: PetUserSettings = {
  enabled: true,
  petId: "fox",
  size: "md",
  style: "default",
};
