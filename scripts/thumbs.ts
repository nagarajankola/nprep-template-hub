/**
 * Generate static screenshot thumbnails for templates and store them in a
 * public Supabase Storage bucket ("thumbnails/<id>.jpg"). The gallery uses
 * these instead of booting 20 live iframes; missing ones fall back to a live
 * iframe automatically.
 *
 *   npm run thumbs          # only templates without a thumbnail
 *   npm run thumbs -- --force   # regenerate all
 *
 * Self-hosted (Playwright/Chromium on this machine) — prototype HTML never
 * leaves your infra.
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { listTemplates, getTemplate, usingSupabase } from "../src/lib/db";

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

const BUCKET = "thumbnails";
const WIDTH = 1200;
const HEIGHT = 750;

async function main() {
  if (!usingSupabase()) {
    console.error("Thumbnails need Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
    process.exit(1);
  }
  const force = process.argv.includes("--force");
  const supa = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: buckets } = await supa.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await supa.storage.createBucket(BUCKET, { public: true });
    if (error && !/already exists/i.test(error.message)) throw error;
    console.log(`Created public bucket "${BUCKET}".`);
  }

  const metas = await listTemplates();
  const browser = await chromium.launch();
  let made = 0;
  let skipped = 0;

  for (const m of metas) {
    const key = `${m.id}.jpg`;

    if (!force) {
      const url = supa.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
      const head = await fetch(url, { method: "HEAD" }).catch(() => null);
      if (head && head.ok) {
        skipped++;
        continue;
      }
    }

    const full = await getTemplate(m.id);
    if (!full) continue;

    const page = await browser.newPage();
    await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    try {
      await page.setContent(full.html, { waitUntil: "load", timeout: 20000 });
      await page.waitForTimeout(2000); // let CDN + entrance animations settle
    } catch {
      // render whatever we got
    }

    let buf: Buffer;
    try {
      buf = await page.screenshot({ type: "jpeg", quality: 72 });
    } catch {
      console.error(`  ! screenshot failed: ${m.name}`);
      await page.close();
      continue;
    }
    await page.close();

    const { error } = await supa.storage
      .from(BUCKET)
      .upload(key, buf, { contentType: "image/jpeg", upsert: true });
    if (error) {
      console.error(`  ! upload failed: ${m.name} — ${error.message}`);
      continue;
    }
    made++;
    console.log(`  ✓ ${m.name}`);
  }

  await browser.close();
  console.log(
    `\nDone. ${made} generated, ${skipped} skipped (already had one). Bucket: "${BUCKET}".`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
