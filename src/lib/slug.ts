import { randomBytes } from "node:crypto";

/** Lowercase, hyphenated, ascii-safe slug capped at 60 chars. */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "template"
  );
}

/** Unguessable, URL-safe share-link id (~22 chars). */
export function shareToken(): string {
  return randomBytes(16).toString("base64url");
}

export function ensureUniqueSlug(base: string, taken: Set<string>): string {
  const s = slugify(base);
  if (!taken.has(s)) return s;
  let i = 2;
  while (taken.has(`${s}-${i}`)) i++;
  return `${s}-${i}`;
}
