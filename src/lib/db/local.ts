import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Template, TemplateMeta } from "../types";

// Computed lazily (not at module load) so the bundler doesn't trace the whole
// project root into the serverless function.
function loc() {
  const dir =
    process.env.DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "data");
  return { dir, file: path.join(dir, "templates.json") };
}

function readAll(): Template[] {
  try {
    const { file } = loc();
    if (!existsSync(file)) return [];
    const raw = readFileSync(file, "utf-8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Template[]) : [];
  } catch {
    return [];
  }
}

function writeAll(rows: Template[]): void {
  const { dir, file } = loc();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(rows, null, 2), "utf-8");
}

function stripHtml(t: Template): TemplateMeta {
  const meta = { ...t } as Partial<Template>;
  delete meta.html;
  return meta as TemplateMeta;
}

export const localDb = {
  async list(): Promise<TemplateMeta[]> {
    return readAll()
      .map(stripHtml)
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  },
  async getById(id: string): Promise<Template | null> {
    return readAll().find((t) => t.id === id) ?? null;
  },
  async getByToken(token: string): Promise<Template | null> {
    return readAll().find((t) => t.share_token === token) ?? null;
  },
  async slugs(): Promise<string[]> {
    return readAll().map((t) => t.slug);
  },
  async insert(row: Template): Promise<Template> {
    const rows = readAll();
    rows.push(row);
    writeAll(rows);
    return row;
  },
  async update(id: string, patch: Partial<Template>): Promise<Template | null> {
    const rows = readAll();
    const i = rows.findIndex((t) => t.id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
    writeAll(rows);
    return rows[i];
  },
  async remove(id: string): Promise<boolean> {
    const rows = readAll();
    const next = rows.filter((t) => t.id !== id);
    if (next.length === rows.length) return false;
    writeAll(next);
    return true;
  },
};
