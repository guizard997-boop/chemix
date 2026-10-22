import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidRes = join(root, "android", "app", "src", "main", "res");
const srcIcons = join(root, "android-icons");

if (!existsSync(androidRes)) {
  console.error("android/ res not found — run cap add android first");
  process.exit(1);
}
if (!existsSync(srcIcons)) {
  console.error("android-icons/ missing");
  process.exit(1);
}

const densities = ["mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi"];
for (const dens of densities) {
  const from = join(srcIcons, dens);
  const to = join(androidRes, dens);
  if (!existsSync(from)) continue;
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)) {
    cpSync(join(from, f), join(to, f));
  }
  console.log("copied", dens);
}

// adaptive icon XML
const anydpi = join(androidRes, "mipmap-anydpi-v26");
mkdirSync(anydpi, { recursive: true });
cpSync(join(srcIcons, "ic_launcher.xml"), join(anydpi, "ic_launcher.xml"));
cpSync(join(srcIcons, "ic_launcher_round.xml"), join(anydpi, "ic_launcher_round.xml"));

// color resource
const values = join(androidRes, "values");
mkdirSync(values, { recursive: true });
const colorsPath = join(values, "ic_launcher_background.xml");
cpSync(join(srcIcons, "ic_launcher_colors.xml"), colorsPath);

// Also force copy root web icons into www if present
const www = join(root, "www");
for (const f of ["icon.png", "icon-512.png", "favicon.ico", "ICON_KOLBA.png", "apple-touch-icon.png"]) {
  const s = join(root, f);
  if (existsSync(s) && existsSync(www)) {
    cpSync(s, join(www, f));
  }
}

console.log("Android launcher icons applied (flask / колба)");
