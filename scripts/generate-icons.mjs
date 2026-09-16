import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BG = "#FAFAFA";
const INK = "#181010";
const DROP = "#3A6B8C";
const FLAME = "#AF3026";

function artwork() {
  return `
    <g fill="none" fill-rule="evenodd">
      <rect x="48" y="48" width="416" height="416" rx="96" fill="${BG}"/>
      <path fill="${DROP}" d="M256 118c-62 86-96 138-96 186a96 96 0 0 0 192 0c0-48-34-100-96-186Z"/>
      <circle cx="256" cy="304" r="28" fill="${BG}" opacity="0.35"/>
      <path fill="${FLAME}" d="M338 286c18 8 36 28 36 54 0 28-22 50-50 50s-48-22-48-50c0-22 16-40 28-54 4 14 18 24 32 24 6 0 12-2 18-6-8-4-16-10-16-18 0-12 12-22 22-32 6 10 14 20 14 32Z"/>
    </g>
  `;
}

function iconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">${artwork()}</svg>`;
}

function pngToIco(png, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(width >= 256 ? 0 : width, 0);
  entry.writeUInt8(height >= 256 ? 0 : height, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

async function writePng(file, size) {
  const buf = await sharp(Buffer.from(iconSvg(size)))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buf);
  return buf;
}

writeFileSync(join(root, "public/favicon.svg"), iconSvg(32));
mkdirSync(join(root, "public/icons"), { recursive: true });

await writePng(join(root, "public/icon-192.png"), 192);
await writePng(join(root, "public/icon-512.png"), 512);
await writePng(join(root, "public/apple-touch-icon.png"), 180);
await writePng(join(root, "public/icons/icon-192.png"), 192);
await writePng(join(root, "public/icons/icon-512.png"), 512);
await writePng(join(root, "public/icons/icon-maskable-512.png"), 512);
await writePng(join(root, "src/app/icon.png"), 192);
await writePng(join(root, "src/app/apple-icon.png"), 180);

const faviconPng = await writePng(join(root, "public/favicon-32.png"), 32);
writeFileSync(join(root, "src/app/favicon.ico"), pngToIco(faviconPng, 32, 32));

console.log("Icons written");
