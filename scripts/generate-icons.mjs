import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "brand/logo-source.png");
const BG = { r: 231, g: 231, b: 219, alpha: 1 };

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

async function raster(size) {
  return sharp(source)
    .flatten({ background: BG })
    .extend({ top: 0, bottom: 0, left: 2, right: 2, background: BG })
    .resize(size, size, { kernel: "lanczos3", fit: "fill" })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writePng(file, size) {
  const buf = await raster(size);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buf);
  return buf;
}

mkdirSync(join(root, "public/icons"), { recursive: true });

const logo512 = await writePng(join(root, "public/logo.png"), 512);
writeFileSync(join(root, "public/icon-512.png"), logo512);
await writePng(join(root, "public/icon-192.png"), 192);
await writePng(join(root, "public/apple-touch-icon.png"), 180);
await writePng(join(root, "public/icons/icon-192.png"), 192);
await writePng(join(root, "public/icons/icon-512.png"), 512);
await writePng(join(root, "public/icons/icon-maskable-512.png"), 512);
await writePng(join(root, "src/app/icon.png"), 192);
await writePng(join(root, "src/app/apple-icon.png"), 180);

const faviconPng = await writePng(join(root, "public/favicon-32.png"), 32);
writeFileSync(join(root, "src/app/favicon.ico"), pngToIco(faviconPng, 32, 32));

const dataUri = `data:image/png;base64,${logo512.toString("base64")}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="${dataUri}" width="512" height="512"/>
</svg>
`;
writeFileSync(join(root, "public/logo.svg"), svg);
writeFileSync(join(root, "public/favicon.svg"), svg);

console.log("Icons written from brand/logo-source.png");
