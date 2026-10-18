export type SearchEntityType =
  | "ALL"
  | "PROJECT"
  | "TASK"
  | "SNIPPET"
  | "COMPONENT"
  | "NOTE"
  | "BOOKMARK";

export interface SearchResultItem {
  type: "PROJECT" | "TASK" | "SNIPPET" | "COMPONENT" | "NOTE" | "BOOKMARK";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
}
