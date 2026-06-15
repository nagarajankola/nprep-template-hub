/* Update an ALREADY-IMPORTED template in place (keeps id + share token).
 * The CLI `import` is add-only (skips existing source_path); this pushes a new
 * version of an existing prototype to the active backend.
 *   npx tsx scripts/update-one.ts <file>            # dry run (no write)
 *   npx tsx scripts/update-one.ts <file> --write    # commit to the active backend
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { inlineLocalAssets } from "../src/lib/inline-assets";
import { listTemplates, updateTemplate, usingSupabase } from "../src/lib/db";

// Load .env.local manually — Next does this for the app, not for a plain script.
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnv();

const args = process.argv.slice(2);
const write = args.includes("--write");
const file = args.find((a) => !a.startsWith("--"));
if (!file) { console.error("usage: tsx scripts/update-one.ts <file> [--write]"); process.exit(1); }
const abs = path.resolve(file);

(async () => {
  console.log(`Backend: ${usingSupabase() ? "Supabase (LIVE)" : "local JSON (dev)"}`);
  if (!existsSync(abs)) { console.error(`Not found: ${abs}`); process.exit(2); }
  const all = await listTemplates();
  const match = all.find((t) => t.source_path === abs);
  if (!match) {
    console.error(`No existing entry with source_path == ${abs}`);
    all.filter((t) => (t.source_path || "").includes("onboarding")).forEach((t) => console.error(`   onboarding entry: ${t.name}  ::  ${t.source_path}`));
    process.exit(3);
  }
  const raw = readFileSync(abs, "utf-8");
  const { html, inlined } = inlineLocalAssets(raw, path.dirname(abs));
  const bytes = Buffer.byteLength(html, "utf-8");
  console.log(`Match: "${match.name}"  id=${match.id}`);
  console.log(`New HTML: ${bytes} bytes (inlined ${inlined} asset${inlined === 1 ? "" : "s"}).`);
  if (!write) { console.log("\nDRY RUN — re-run with --write to push this update in place (id + share link unchanged)."); return; }
  const updated = await updateTemplate(match.id, { html, size_bytes: bytes, updated_at: new Date().toISOString() } as Partial<typeof match>);
  console.log(updated ? `\n✓ Pushed. "${match.name}" updated in place — id + share link unchanged.` : "\n✗ update returned null");
})().catch((e) => { console.error(e); process.exit(1); });
