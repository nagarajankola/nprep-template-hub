import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Template, TemplateMeta, ShareLink, LinkVisit } from "../types";

// Computed lazily (not at module load) so the bundler doesn't trace the whole
// project root into the serverless function.
function loc() {
  const dir =
    process.env.DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "data");
  return { dir, file: path.join(dir, "templates.json") };
}

interface Store {
  templates: Template[];
  links: ShareLink[];
  visits: LinkVisit[];
}

function normTemplate(t: Template): Template {
  return {
    ...t,
    type: t.type ?? "Other",
    project: t.project ?? "Unsorted",
    tags: t.tags ?? [],
  };
}

function readStore(): Store {
  try {
    const { file } = loc();
    if (!existsSync(file)) return { templates: [], links: [], visits: [] };
    const raw = readFileSync(file, "utf-8").trim();
    if (!raw) return { templates: [], links: [], visits: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { templates: parsed.map(normTemplate), links: [], visits: [] };
    }
    return {
      templates: (parsed.templates ?? []).map(normTemplate),
      links: parsed.links ?? [],
      visits: parsed.visits ?? [],
    };
  } catch {
    return { templates: [], links: [], visits: [] };
  }
}

function writeStore(s: Store): void {
  const { dir, file } = loc();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(s, null, 2), "utf-8");
}

function stripHtml(t: Template): TemplateMeta {
  const m = { ...t } as Partial<Template>;
  delete m.html;
  return m as TemplateMeta;
}

export const localDb = {
  // ── templates ──
  async list(): Promise<TemplateMeta[]> {
    return readStore()
      .templates.map(stripHtml)
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  },
  async getById(id: string): Promise<Template | null> {
    return readStore().templates.find((t) => t.id === id) ?? null;
  },
  async getByToken(token: string): Promise<Template | null> {
    return readStore().templates.find((t) => t.share_token === token) ?? null;
  },
  async slugs(): Promise<string[]> {
    return readStore().templates.map((t) => t.slug);
  },
  async insert(row: Template): Promise<Template> {
    const s = readStore();
    s.templates.push(row);
    writeStore(s);
    return row;
  },
  async update(id: string, patch: Partial<Template>): Promise<Template | null> {
    const s = readStore();
    const i = s.templates.findIndex((t) => t.id === id);
    if (i === -1) return null;
    s.templates[i] = { ...s.templates[i], ...patch, updated_at: new Date().toISOString() };
    writeStore(s);
    return s.templates[i];
  },
  async remove(id: string): Promise<boolean> {
    const s = readStore();
    const before = s.templates.length;
    s.templates = s.templates.filter((t) => t.id !== id);
    s.links = s.links.filter((l) => l.template_id !== id);
    if (s.templates.length === before) return false;
    writeStore(s);
    return true;
  },

  // ── share links ──
  async linksByTemplate(templateId: string): Promise<ShareLink[]> {
    return readStore()
      .links.filter((l) => l.template_id === templateId)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  },
  async linkByToken(token: string): Promise<ShareLink | null> {
    return readStore().links.find((l) => l.token === token) ?? null;
  },
  async insertLink(row: ShareLink): Promise<ShareLink> {
    const s = readStore();
    s.links.push(row);
    writeStore(s);
    return row;
  },
  async updateLink(id: string, patch: Partial<ShareLink>): Promise<ShareLink | null> {
    const s = readStore();
    const i = s.links.findIndex((l) => l.id === id);
    if (i === -1) return null;
    s.links[i] = { ...s.links[i], ...patch };
    writeStore(s);
    return s.links[i];
  },
  async removeLink(id: string): Promise<boolean> {
    const s = readStore();
    const before = s.links.length;
    s.links = s.links.filter((l) => l.id !== id);
    s.visits = s.visits.filter((v) => v.link_id !== id);
    if (s.links.length === before) return false;
    writeStore(s);
    return true;
  },

  // ── visits ──
  async insertVisit(row: LinkVisit): Promise<void> {
    const s = readStore();
    s.visits.push(row);
    writeStore(s);
  },
  async visitsByLink(linkId: string): Promise<LinkVisit[]> {
    return readStore().visits.filter((v) => v.link_id === linkId);
  },
};
