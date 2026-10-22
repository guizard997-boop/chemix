import { cpSync, mkdirSync, existsSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const www = join(root, "www");

if (existsSync(www)) {
  rmSync(www, { recursive: true, force: true });
}
mkdirSync(www, { recursive: true });
mkdirSync(join(www, "icons"), { recursive: true });

const files = [
  "index.html",
  "manifest.webmanifest",
  "sw.js",
];

for (const f of files) {
  const src = join(root, f);
  if (!existsSync(src)) {
    console.error("Missing:", f);
    process.exit(1);
  }
  cpSync(src, join(www, f));
}

const iconsDir = join(root, "icons");
if (existsSync(iconsDir)) {
  cpSync(iconsDir, join(www, "icons"), { recursive: true });
}
const photosDir = join(root, "photos");
if (existsSync(photosDir)) {
  cpSync(photosDir, join(www, "photos"), { recursive: true });
  console.log("photos copied");
}

// Capacitor loads from file/https scheme — ensure relative paths stay relative
const indexPath = join(www, "index.html");
let html = readFileSync(indexPath, "utf8");
// Optional: mark that we are in Capacitor (no behavior change required)
if (!html.includes("data-platform")) {
  html = html.replace("<html lang=\"ru\">", "<html lang=\"ru\" data-platform=\"capacitor\">");
  writeFileSync(indexPath, html);
}

console.log("build:mobile OK → www/index.html");
