export type ComponentFramework =
  | "REACT"
  | "NEXTJS"
  | "VUE"
  | "SVELTE"
  | "HTML_CSS";

export type ComponentStyling =
  | "TAILWIND"
  | "CSS_MODULES"
  | "VANILLA_CSS"
  | "STYLED_COMPONENTS";

export interface ComponentProjectRef {
  id: string;
  title: string;
}

export interface UIComponentItem {
  id: string;
  userId: string;
  projectId: string | null;
  name: string;
  description: string | null;
  category?: string;
  framework: ComponentFramework;
  styling: ComponentStyling;
  code: string;
  previewCode: string | null;
  tags: string[];
  favorite: boolean;
  aiAgentPrompt?: string | null;
  howToUse?: string | null;
  dependencies?: string[];
  propsSchema?: ComponentPropItem[] | null;
  createdAt: string;
  updatedAt: string;
  project?: ComponentProjectRef | null;
}

export interface CreateComponentPayload {
  name: string;
  description?: string;
  category?: string;
  framework?: ComponentFramework;
  styling?: ComponentStyling;
  code: string;
  previewCode?: string;
  tags?: string[];
  projectId?: string | null;
  favorite?: boolean;
  aiAgentPrompt?: string | null;
  howToUse?: string | null;
  dependencies?: string[];
  propsSchema?: ComponentPropItem[] | null;
}

export interface UpdateComponentPayload {
  name?: string;
  description?: string | null;
  category?: string;
  framework?: ComponentFramework;
  styling?: ComponentStyling;
  code?: string;
  previewCode?: string | null;
  tags?: string[];
  projectId?: string | null;
  favorite?: boolean;
  aiAgentPrompt?: string | null;
  howToUse?: string | null;
  dependencies?: string[];
  propsSchema?: ComponentPropItem[] | null;
}

export interface ComponentPropItem {
  prop: string;
  type: string;
  default?: string;
  description: string;
}

export interface SynthesizedComponentResult {
  name: string;
  category: string;
  description: string;
  framework: ComponentFramework;
  styling: ComponentStyling;
  dependencies: string[];
  propsSchema: ComponentPropItem[];
  howToUse: string;
  aiAgentPrompt: string;
  code: string;
}

