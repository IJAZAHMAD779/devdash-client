/**
 * Strips common markdown formatting to produce clean, plain text
 * for single-line previews in cards and list rows without visual syntax artifacts.
 */
export function stripMarkdown(text: string | null | undefined): string {
  if (!text) return "";

  return text
    // Replace headings (# Heading)
    .replace(/^#{1,6}\s+/gm, "")
    // Replace bold/italic markers (***text***, **text**, *text*, ___text___, __text__, _text_)
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, "$2")
    // Replace inline code (`code`)
    .replace(/`([^`]+)`/g, "$1")
    // Replace fenced code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Replace markdown links ([text](url)) with just text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Replace image tags (![alt](url))
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // Replace strikethrough (~~text~~)
    .replace(/~~(.*?)~~/g, "$1")
    // Replace unordered and ordered list markers (- item, * item, 1. item)
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Replace blockquotes (> quote)
    .replace(/^>\s+/gm, "")
    // Replace horizontal rules (---, ***, ___)
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Collapse multiple whitespace/newlines into single space
    .replace(/\s+/g, " ")
    .trim();
}
