// Rasterize src/app/icon.svg into the PNG/ICO fallbacks Next.js serves.
// Run after editing the icon:  node scripts/gen-favicon.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appDir = resolve(process.cwd(), "src/app");
const svg = readFileSync(resolve(appDir, "icon.svg"));

const render = (size) =>
  sharp(svg, { density: 700 }).resize(size, size).png().toBuffer();

// Pack one or more PNGs into a valid (PNG-embedded) .ico
function buildIco(pngs, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4); // image count
  const entries = Buffer.alloc(16 * pngs.length);
  let offset = 6 + 16 * pngs.length;
  pngs.forEach((buf, i) => {
    const s = sizes[i];
    const e = i * 16;
    entries.writeUInt8(s >= 256 ? 0 : s, e + 0); // width
    entries.writeUInt8(s >= 256 ? 0 : s, e + 1); // height
    entries.writeUInt8(0, e + 2); // palette
    entries.writeUInt8(0, e + 3); // reserved
    entries.writeUInt16LE(1, e + 4); // color planes
    entries.writeUInt16LE(32, e + 6); // bits per pixel
    entries.writeUInt32LE(buf.length, e + 8); // size of image data
    entries.writeUInt32LE(offset, e + 12); // offset
    offset += buf.length;
  });
  return Buffer.concat([header, entries, ...pngs]);
}

const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(icoSizes.map(render));
writeFileSync(resolve(appDir, "favicon.ico"), buildIco(icoPngs, icoSizes));

const apple = await render(180);
writeFileSync(resolve(appDir, "apple-icon.png"), apple);

// preview for visual check
writeFileSync("/tmp/favicon-preview.png", await render(256));

console.log("✓ favicon.ico (16/32/48), apple-icon.png (180) written to src/app/");
