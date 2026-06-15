/**
 * Backfill: stamp every existing template with the standard code-side
 * "last updated" badge, dated from its source file's modified time (mtime).
 * Also sets the hub's updated_at to that same date so the card matches.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node_modules/.bin/tsx scripts/add-updated-badge.ts
 */
import { statSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  listTemplates,
  getTemplate,
  updateTemplate,
  usingSupabase,
} from "../src/lib/db";
import { injectUpdatedBadge } from "../src/lib/updated-badge";

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

async function main() {
  console.log(`Backend: ${usingSupabase() ? "Supabase" : "local JSON store"}`);
  const metas = await listTemplates();
  let done = 0;

  for (const m of metas) {
    const full = await getTemplate(m.id);
    if (!full) continue;

    let when = new Date(m.created_at);
    if (m.source_path && existsSync(m.source_path)) {
      try {
        const st = statSync(m.source_path);
        if (!Number.isNaN(st.mtime.getTime())) when = st.mtime;
      } catch {
        // keep created_at fallback
      }
    }

    const html = injectUpdatedBadge(full.html, when);
    await updateTemplate(m.id, {
      html,
      size_bytes: Buffer.byteLength(html, "utf-8"),
      updated_at: when.toISOString(),
    });
    done++;
    console.log(`  ✓ ${m.name} — Updated ${when.toISOString().slice(0, 10)}`);
  }

  console.log(`\nDone. Stamped ${done} templates with a code-side last-updated badge.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
