import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function githubPagesBasePath() {
  if (process.env.GITHUB_PAGES !== "true") {
    return "";
  }
  if (process.env.PAGES_BASE_PATH === "") {
    return "";
  }
  if (process.env.PAGES_BASE_PATH) {
    const value = process.env.PAGES_BASE_PATH;
    return value.startsWith("/") ? value : `/${value}`;
  }
  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    return process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, "");
  }
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (!repo || repo.endsWith(".github.io")) {
    return "";
  }
  return `/${repo}`;
}

const basePath = githubPagesBasePath();

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
