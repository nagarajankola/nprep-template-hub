import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Template, TemplateMeta, ShareLink, LinkVisit } from "../types";

let _client: SupabaseClient | null = null;

function client(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

const META_COLS =
  "id,name,slug,description,category,type,project,tags,size_bytes,source,source_path,share_token,share_enabled,created_at,updated_at";

export const supabaseDb = {
  // ── templates ──
  async list(): Promise<TemplateMeta[]> {
    const { data, error } = await client()
      .from("templates")
      .select(META_COLS)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as TemplateMeta[];
  },
  async getById(id: string): Promise<Template | null> {
    const { data, error } = await client()
      .from("templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Template | null) ?? null;
  },
  async getByToken(token: string): Promise<Template | null> {
    const { data, error } = await client()
      .from("templates")
      .select("*")
      .eq("share_token", token)
      .maybeSingle();
    if (error) throw error;
    return (data as Template | null) ?? null;
  },
  async getBySourcePath(p: string): Promise<Template | null> {
    const { data, error } = await client()
      .from("templates")
      .select("*")
      .eq("source_path", p)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as Template | null) ?? null;
  },
  async slugs(): Promise<string[]> {
    const { data, error } = await client().from("templates").select("slug");
    if (error) throw error;
    return ((data ?? []) as { slug: string }[]).map((r) => r.slug);
  },
  async insert(row: Template): Promise<Template> {
    const { data, error } = await client()
      .from("templates")
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;
    return data as Template;
  },
  async update(id: string, patch: Partial<Template>): Promise<Template | null> {
    const { data, error } = await client()
      .from("templates")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return (data as Template | null) ?? null;
  },
  async remove(id: string): Promise<boolean> {
    const { error, count } = await client()
      .from("templates")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw error;
    return (count ?? 0) > 0;
  },

  // ── share links ──
  async linksByTemplate(templateId: string): Promise<ShareLink[]> {
    const { data, error } = await client()
      .from("share_links")
      .select("*")
      .eq("template_id", templateId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ShareLink[];
  },
  async linkByToken(token: string): Promise<ShareLink | null> {
    const { data, error } = await client()
      .from("share_links")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    return (data as ShareLink | null) ?? null;
  },
  async insertLink(row: ShareLink): Promise<ShareLink> {
    const { data, error } = await client()
      .from("share_links")
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;
    return data as ShareLink;
  },
  async updateLink(id: string, patch: Partial<ShareLink>): Promise<ShareLink | null> {
    const { data, error } = await client()
      .from("share_links")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return (data as ShareLink | null) ?? null;
  },
  async removeLink(id: string): Promise<boolean> {
    const { error, count } = await client()
      .from("share_links")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw error;
    return (count ?? 0) > 0;
  },

  // ── visits ──
  async insertVisit(row: LinkVisit): Promise<void> {
    const { error } = await client().from("link_visits").insert(row);
    if (error) throw error;
  },
  async visitsByLink(linkId: string): Promise<LinkVisit[]> {
    const { data, error } = await client()
      .from("link_visits")
      .select("*")
      .eq("link_id", linkId)
      .order("visited_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as LinkVisit[];
  },
};
