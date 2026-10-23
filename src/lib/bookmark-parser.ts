import { Bookmark, ImportedBookmarkItem } from "@/types/bookmark";

/**
 * Universal Chrome / Netscape HTML Bookmark Parser
 * Zero external dependencies: Uses native browser DOMParser.
 * Handles nested folder structures, attributes (HREF, ADD_DATE, ICON),
 * and maps browser folders to DevDash categories.
 */

// Ignored root folder wrappers common across Chromium / Safari / Firefox
const IGNORED_ROOT_FOLDERS = new Set([
  "bookmarks bar",
  "bookmarks",
  "favorites bar",
  "favorites",
  "other bookmarks",
  "mobile bookmarks",
  "quick access",
]);

export interface ParseResult {
  items: ImportedBookmarkItem[];
  folders: string[];
}

export function parseNetscapeBookmarks(htmlContent: string): ParseResult {
  const items: ImportedBookmarkItem[] = [];
  const foldersSet = new Set<string>();

  if (typeof window === "undefined" || !htmlContent.trim()) {
    return { items, folders: [] };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // Recursive traversal function tracking folder breadcrumbs
    const traverse = (node: Element, currentFolders: string[]) => {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const tagName = child.tagName.toUpperCase();

        if (tagName === "DT") {
          // Check if this DT is a Folder header (<H3>)
          const h3 = child.querySelector(":scope > h3");
          if (h3) {
            const rawFolderName = h3.textContent?.trim() || "General";
            const lower = rawFolderName.toLowerCase();
            const isIgnoredRoot = IGNORED_ROOT_FOLDERS.has(lower);

            const nextFolders = isIgnoredRoot
              ? currentFolders
              : [...currentFolders, rawFolderName];

            if (!isIgnoredRoot) {
              foldersSet.add(rawFolderName);
            }

            // The folder's children are inside a sibling or descendant <DL>
            const dl = child.querySelector(":scope > dl") || child.nextElementSibling;
            if (dl && dl.tagName.toUpperCase() === "DL") {
              traverse(dl, nextFolders);
            }
            continue;
          }

          // Check if this DT is a Bookmark link (<A>)
          const anchor = child.querySelector(":scope > a") || (child.tagName === "A" ? child : null);
          if (anchor) {
            const href = anchor.getAttribute("href");
            if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
              const rawTitle = anchor.textContent?.trim();
              let domain = "";
              try {
                domain = new URL(href).hostname.replace(/^www\./, "");
              } catch {
                domain = href;
              }

              const title = rawTitle || domain;
              const effectiveFolder =
                currentFolders.length > 0
                  ? currentFolders[currentFolders.length - 1]
                  : "tools";

              const category = effectiveFolder.toLowerCase();
              foldersSet.add(effectiveFolder);

              items.push({
                id: `import-${items.length + 1}-${Date.now()}`,
                title,
                url: href,
                category,
                folderPath: [...currentFolders],
                addDate: anchor.getAttribute("add_date") || undefined,
                icon: anchor.getAttribute("icon") || undefined,
                selected: true,
              });
            }
          }
        } else if (tagName === "DL" || tagName === "P" || tagName === "BODY") {
          traverse(child, currentFolders);
        }
      }
    }

    const rootDl = doc.querySelector("dl") || doc.body;
    if (rootDl) {
      traverse(rootDl, []);
    }

    // Fallback: If strict DT/DL structure wasn't found, find all <a> tags directly
    if (items.length === 0) {
      const allAnchors = doc.querySelectorAll("a[href]");
      allAnchors.forEach((a, idx) => {
        const href = a.getAttribute("href");
        if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
          let domain = "";
          try {
            domain = new URL(href).hostname.replace(/^www\./, "");
          } catch {
            domain = href;
          }
          items.push({
            id: `import-${idx + 1}-${Date.now()}`,
            title: a.textContent?.trim() || domain,
            url: href,
            category: "tools",
            folderPath: [],
            selected: true,
          });
        }
      });
      if (items.length > 0) {
        foldersSet.add("tools");
      }
    }
  } catch (err) {
    console.error("Failed to parse bookmark HTML file:", err);
  }

  return {
    items,
    folders: Array.from(foldersSet),
  };
}

/**
 * Exports DevDash bookmarks into standard Netscape Bookmark File format (.html)
 * Compatible with Chrome, Arc, Safari, Firefox, and Edge.
 */
export function exportBookmarksToHtml(
  bookmarks: Bookmark[],
  filename = `devdash-bookmarks-${new Date().toISOString().split("T")[0]}.html`
) {
  if (typeof window === "undefined" || !bookmarks.length) return;

  // Group bookmarks by category / folder
  const grouped = new Map<string, Bookmark[]>();
  bookmarks.forEach((bm) => {
    const cat = bm.category ? bm.category.charAt(0).toUpperCase() + bm.category.slice(1) : "General";
    const list = grouped.get(cat) || [];
    list.push(bm);
    grouped.set(cat, list);
  });

  const timestamp = Math.floor(Date.now() / 1000);

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">DevDash Bookmarks</H3>
    <DL><p>
`;

  grouped.forEach((bms, folder) => {
    html += `        <DT><H3 ADD_DATE="${timestamp}">${folder}</H3>\n        <DL><p>\n`;
    bms.forEach((b) => {
      const safeTitle = b.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeUrl = b.url.replace(/"/g, "&quot;");
      const addDate = Math.floor(new Date(b.createdAt).getTime() / 1000) || timestamp;
      html += `            <DT><A HREF="${safeUrl}" ADD_DATE="${addDate}">${safeTitle}</A>\n`;
    });
    html += `        </DL><p>\n`;
  });

  html += `    </DL><p>\n</DL><p>\n`;

  // Trigger browser download
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
