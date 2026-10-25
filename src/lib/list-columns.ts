/**
 * list-columns.ts
 *
 * Ground truth column templates for Components and Snippets list views.
 * Ensures the header row and all data rows share the exact same gridTemplateColumns.
 */

export interface ComponentColumnsVisibility {
  showCategory: boolean;
  hasCategory: boolean;
  hasProject: boolean;
}

export function getComponentGridTemplate(vis: ComponentColumnsVisibility): string {
  // Base: star 40px | name minmax(220px, 1fr) | framework 168px | category 112px | project 120px | updated 88px | actions 88px
  const cols = ["40px", "minmax(220px, 1fr)", "168px"];
  if (vis.showCategory && vis.hasCategory) {
    cols.push("112px");
  }
  if (vis.hasProject) {
    cols.push("120px");
  }
  cols.push("88px", "88px");
  return cols.join(" ");
}

export interface SnippetColumnsVisibility {
  showLanguage: boolean;
  hasTags: boolean;
  hasProject: boolean;
}

export function getSnippetGridTemplate(vis: SnippetColumnsVisibility): string {
  // Base: star 40px | title minmax(220px, 1fr) | language 132px | tags 160px | project 120px | updated 88px | actions 88px
  const cols = ["40px", "minmax(220px, 1fr)"];
  if (vis.showLanguage) {
    cols.push("132px");
  }
  if (vis.hasTags) {
    cols.push("160px");
  }
  if (vis.hasProject) {
    cols.push("120px");
  }
  cols.push("88px", "88px");
  return cols.join(" ");
}

export interface BookmarkColumnsVisibility {
  showCategory: boolean;
  hasTags: boolean;
}

export function getBookmarkGridTemplate(vis: BookmarkColumnsVisibility): string {
  // select 24px | star 32px | name minmax(240px, 1fr) | category 112px | tags 168px | actions 120px
  const cols = ["24px", "32px", "minmax(240px, 1fr)"];
  if (vis.showCategory) {
    cols.push("112px");
  }
  if (vis.hasTags) {
    cols.push("168px");
  }
  cols.push("120px");
  return cols.join(" ");
}
