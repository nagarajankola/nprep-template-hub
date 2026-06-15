/**
 * Folder importer for the NPrep Template Hub.
 *
 *   npm run import -- <file-or-folder> [...more]
 *   npm run import                      # imports everything in ./templates-inbox/
 *
 * - Recurses folders, picks up *.html (skips *.backup* and asset dirs)
 * - Inlines local images/fonts so each template is self-contained
 * - Skips files already imported (by path) and exact duplicates (by content hash)
 * - Writes to Supabase when configured, otherwise the local JSON store.
 */
import {
  readdirSync,
  statSync,
  readFileSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { inlineLocalAssets } from "../src/lib/inline-assets";
import { createTemplate, listTemplates, usingSupabase } from "../src/lib/db";

// Load .env.local manually — Next does this for the app, not for a plain script.
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnv();

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  "home-assets",
]);

function findHtml(target: string, acc: string[] = []): string[] {
  let st;
  try {
    st = statSync(target);
  } catch {
    return acc;
  }
  if (st.isFile()) {
    if (/\.html?$/i.test(target) && !/\.backup/i.test(target)) acc.push(target);
    return acc;
  }
  if (st.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(target))) return acc;
    for (const entry of readdirSync(target)) {
      findHtml(path.join(target, entry), acc);
    }
  }
  return acc;
}

function titleFrom(html: string, file: string): string {
  const t = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  if (t) return t;
  const h1 = html
    .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?.replace(/<[^>]+>/g, "")
    .trim();
  if (h1) return h1;
  return path
    .basename(file)
    .replace(/\.html?$/i, "")
    .replace(/[-_]+/g, " ");
}

function categoryFrom(file: string): string {
  const parent = path
    .basename(path.dirname(file))
    .replace(/^nprep-/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  if (!parent || parent === "templates") return "Uncategorized";
  return parent.charAt(0).toUpperCase() + parent.slice(1);
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const inbox = path.join(process.cwd(), "templates-inbox");
  const targets = args.length ? args : existsSync(inbox) ? [inbox] : [];

  if (!targets.length) {
    console.log(
      "Nothing to import. Pass a file/folder path, or drop .html files in ./templates-inbox/"
    );
    return;
  }

  console.log(
    `Backend: ${usingSupabase() ? "Supabase" : "local JSON store (./data/templates.json)"}`
  );

  const existing = await listTemplates();
  const existingPaths = new Set(
    existing.map((t) => t.source_path).filter(Boolean) as string[]
  );
  const seenHashes = new Set<string>();

  const files: string[] = [];
  for (const t of targets) {
    if (!existsSync(t)) {
      console.warn(`  ! skip (not found): ${t}`);
      continue;
    }
    files.push(...findHtml(path.resolve(t)));
  }

  let added = 0;
  let skipped = 0;
  for (const file of files.sort()) {
    if (existingPaths.has(file)) {
      skipped++;
      continue;
    }
    let raw: string;
    try {
      raw = readFileSync(file, "utf-8");
    } catch {
      console.warn(`  ! unreadable: ${file}`);
      continue;
    }
    const hash = createHash("sha256").update(raw).digest("hex");
    if (seenHashes.has(hash)) {
      console.log(`  ⤷ duplicate, skipped: ${path.basename(file)}`);
      skipped++;
      continue;
    }
    seenHashes.add(hash);

    const { html, inlined } = inlineLocalAssets(raw, path.dirname(file));
    const name = titleFrom(raw, file);
    const tpl = await createTemplate({
      name,
      description: "",
      category: categoryFrom(file),
      tags: [],
      html,
      source: "import",
      source_path: file,
      code_updated_at: statSync(file).mtime,
    });
    added++;
    console.log(
      `  ✓ ${name}${inlined ? `  (inlined ${inlined} asset${inlined > 1 ? "s" : ""})` : ""}`
    );
  }

  const total = (await listTemplates()).length;
  console.log(
    `\nDone. Added ${added}, skipped ${skipped} (already imported or duplicate). Total now: ${total}.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
