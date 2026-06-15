import type { Template, TemplateMeta } from "./types";

/** Drop the heavy `html` field for list/response payloads. */
export function toMeta(t: Template): TemplateMeta {
  const m = { ...t } as Partial<Template>;
  delete m.html;
  return m as TemplateMeta;
}

/** Accept a comma string or an array; return clean tags. */
export function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  if (typeof input === "string") {
    return input.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
