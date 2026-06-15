import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import path from "node:path";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

const MAX_BYTES = 3 * 1024 * 1024; // 3MB cap per asset

function toDataUri(absPath: string): string | null {
  try {
    const ext = path.extname(absPath).toLowerCase();
    const mime = MIME[ext];
    if (!mime) return null;
    const buf = readFileSync(absPath);
    if (buf.length > MAX_BYTES) return null;
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const isExternal = (ref: string) =>
  /^(https?:)?\/\//i.test(ref) ||
  ref.startsWith("data:") ||
  ref.startsWith("#") ||
  ref.startsWith("mailto:") ||
  ref.startsWith("tel:") ||
  ref.startsWith("blob:") ||
  ref.startsWith("javascript:");

/**
 * Make an HTML file self-contained by inlining locally-referenced assets
 * (images, fonts, small media) as base64 data URIs. Handles three patterns:
 *   1. attribute refs  — src="x.png", href="x.svg", poster="v.mp4"
 *   2. CSS url(...)     — background: url('x.png')
 *   3. JS string concat — const A='home-assets/'; img.src = A + 'pic.png'
 */
export function inlineLocalAssets(
  html: string,
  baseDir: string
): { html: string; inlined: number } {
  const base = path.resolve(baseDir);
  const cache = new Map<string, string | null>();
  let inlined = 0;

  const resolveRef = (ref: string): string | null => {
    if (!ref || isExternal(ref)) return null;
    const clean = ref.split("?")[0].split("#")[0].replace(/^\.\//, "").trim();
    if (!clean) return null;
    const abs = path.resolve(base, clean);
    if (cache.has(abs)) return cache.get(abs)!;
    const uri =
      abs.startsWith(base) && existsSync(abs) && statSync(abs).isFile()
        ? toDataUri(abs)
        : null;
    cache.set(abs, uri);
    return uri;
  };

  let out = html;

  // 1) attribute references
  out = out.replace(
    /\b(src|href|poster)\s*=\s*(["'])(.*?)\2/gi,
    (m, attr, quote, ref) => {
      const uri = resolveRef(ref);
      if (!uri) return m;
      inlined++;
      return `${attr}=${quote}${uri}${quote}`;
    }
  );

  // 2) CSS url(...) references
  out = out.replace(
    /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
    (m, quote, ref) => {
      const uri = resolveRef(ref);
      if (!uri) return m;
      inlined++;
      return `url(${quote}${uri}${quote})`;
    }
  );

  // 3) directory sweep — for assets pulled in via JS string concatenation
  const dirRefs = new Set<string>();
  for (const match of out.matchAll(/['"`]([\w.\-/]+?\/)['"`]/g)) {
    dirRefs.add(match[1]);
  }
  for (const dir of dirRefs) {
    const absDir = path.resolve(base, dir.replace(/^\.\//, ""));
    if (
      !absDir.startsWith(base) ||
      !existsSync(absDir) ||
      !statSync(absDir).isDirectory()
    ) {
      continue;
    }
    let dirHadInline = false;
    for (const file of readdirSync(absDir)) {
      const uri = toDataUri(path.join(absDir, file));
      if (!uri) continue;
      const before = out;
      out = out
        .split(`'${file}'`).join(`'${uri}'`)
        .split(`"${file}"`).join(`"${uri}"`)
        .split(`\`${file}\``).join(`\`${uri}\``)
        .split(`'${dir}${file}'`).join(`'${uri}'`)
        .split(`"${dir}${file}"`).join(`"${uri}"`);
      if (out !== before) {
        inlined++;
        dirHadInline = true;
      }
    }
    // neutralise the now-redundant directory prefix variable
    if (dirHadInline) {
      out = out
        .split(`'${dir}'`).join("''")
        .split(`"${dir}"`).join('""')
        .split(`\`${dir}\``).join("``");
    }
  }

  return { html: out, inlined };
}
