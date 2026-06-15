import { randomUUID } from "node:crypto";
import type {
  Template,
  TemplateMeta,
  NewTemplateInput,
  ShareLink,
  NewShareLinkInput,
  LinkVisit,
} from "../types";
import { ensureUniqueSlug, shareToken } from "../slug";
import { localDb } from "./local";
import { supabaseDb } from "./supabase";

/** Supabase when configured, otherwise the local JSON store (dev). */
export function usingSupabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const backend = () => (usingSupabase() ? supabaseDb : localDb);

// ───────── templates ─────────
export function listTemplates(): Promise<TemplateMeta[]> {
  return backend().list();
}
export function getTemplate(id: string): Promise<Template | null> {
  return backend().getById(id);
}
export function getTemplateByToken(token: string): Promise<Template | null> {
  return backend().getByToken(token);
}
export function getTemplateBySourcePath(p: string): Promise<Template | null> {
  return backend().getBySourcePath(p);
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
    type: (input.type ?? "Other").trim() || "Other",
    project: (input.project ?? "Unsorted").trim() || "Unsorted",
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
  const tpl = await backend().insert(row);
  // Every template starts with one default share link (token == legacy token).
  await createShareLink({ template_id: tpl.id, label: "Default link" }, tpl.share_token);
  return tpl;
}

// ───────── share links ─────────
export function listShareLinks(templateId: string): Promise<ShareLink[]> {
  return backend().linksByTemplate(templateId);
}
export function getShareLinkByToken(token: string): Promise<ShareLink | null> {
  return backend().linkByToken(token);
}
export function updateShareLink(
  id: string,
  patch: Partial<ShareLink>
): Promise<ShareLink | null> {
  return backend().updateLink(id, patch);
}
export function deleteShareLink(id: string): Promise<boolean> {
  return backend().removeLink(id);
}

export async function createShareLink(
  input: NewShareLinkInput,
  forceToken?: string
): Promise<ShareLink> {
  const row: ShareLink = {
    id: randomUUID(),
    template_id: input.template_id,
    token: forceToken ?? shareToken(),
    label: (input.label ?? "Untitled link").trim() || "Untitled link",
    description: (input.description ?? "").trim(),
    shared_with: (input.shared_with ?? "").trim(),
    purpose: (input.purpose ?? "").trim(),
    enabled: true,
    created_at: new Date().toISOString(),
  };
  return backend().insertLink(row);
}

// ───────── visits ─────────
export function recordVisit(
  linkId: string,
  visitorId: string,
  ipHash: string
): Promise<void> {
  const row: LinkVisit = {
    id: randomUUID(),
    link_id: linkId,
    visited_at: new Date().toISOString(),
    visitor_id: visitorId,
    ip_hash: ipHash,
  };
  return backend().insertVisit(row);
}
export function getLinkVisits(linkId: string): Promise<LinkVisit[]> {
  return backend().visitsByLink(linkId);
}
