import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "")
  .replace(/\/$/, "");

const template = fs.readFileSync(
  path.join(__dirname, "sw.template.js"),
  "utf8"
);
const sw = template.replaceAll("__BASE_PATH__", basePath);

fs.writeFileSync(path.join(root, "public", "sw.js"), sw);
fs.writeFileSync(path.join(root, "public", ".nojekyll"), "");

const manifestPath = path.join(root, "public", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.start_url = basePath ? `${basePath}/` : "/";
manifest.scope = basePath ? `${basePath}/` : "/";
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `[prepare-pages] basePath=${basePath || "(root)"} — sw.js e manifest aggiornati`
);
