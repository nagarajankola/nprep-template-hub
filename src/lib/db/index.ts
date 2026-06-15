import { randomUUID } from "node:crypto";
import type { Template, TemplateMeta, NewTemplateInput } from "../types";
import { ensureUniqueSlug, shareToken } from "../slug";
import { localDb } from "./local";
import { supabaseDb } from "./supabase";

/** Supabase when configured, otherwise the local JSON store (dev). */
export function usingSupabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const backend = () => (usingSupabase() ? supabaseDb : localDb);

export function listTemplates(): Promise<TemplateMeta[]> {
  return backend().list();
}
export function getTemplate(id: string): Promise<Template | null> {
  return backend().getById(id);
}
export function getTemplateByToken(token: string): Promise<Template | null> {
  return backend().getByToken(token);
}
export function deleteTemplate(id: string): Promise<boolean> {
  return backend().remove(id);
}
export function updateTemplate(
  id: string,
  patch: Partial<Template>
): Promise<Template | null> {
  return backend().update(id, patch);
}

export async function createTemplate(input: NewTemplateInput): Promise<Template> {
  const slugs = new Set(await backend().slugs());
  const now = new Date().toISOString();
  const row: Template = {
    id: randomUUID(),
    name: input.name.trim() || "Untitled template",
    slug: ensureUniqueSlug(input.name || "template", slugs),
    description: (input.description ?? "").trim(),
    category: (input.category ?? "Uncategorized").trim() || "Uncategorized",
    tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean),
    html: input.html,
    size_bytes: Buffer.byteLength(input.html, "utf-8"),
    source: input.source ?? "upload",
    source_path: input.source_path ?? null,
    share_token: shareToken(),
    share_enabled: true,
    created_at: now,
    updated_at: now,
  };
  return backend().insert(row);
}
