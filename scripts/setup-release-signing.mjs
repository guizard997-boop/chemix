import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidApp = join(root, "android", "app");
const androidRoot = join(root, "android");
const ksSrc = join(root, "release.keystore");
const ksDst = join(androidApp, "release.keystore");

if (!existsSync(ksSrc)) {
  console.error("FATAL: release.keystore not in repo root");
  process.exit(1);
}
if (!existsSync(androidApp)) {
  console.error("FATAL: android/app missing");
  process.exit(1);
}

copyFileSync(ksSrc, ksDst);

const keyProps = `storePassword=ChemixRelease2026
keyPassword=ChemixRelease2026
keyAlias=chemix
storeFile=release.keystore
`;
writeFileSync(join(androidApp, "key.properties"), keyProps);
writeFileSync(join(androidRoot, "key.properties"), keyProps);

const RELEASE_SIGNING = `
    signingConfigs {
        release {
            storeFile file("\${rootProject.projectDir}/app/release.keystore")
            storePassword "ChemixRelease2026"
            keyAlias "chemix"
            keyPassword "ChemixRelease2026"
        }
    }
`;

// Simpler storeFile relative to app module
const RELEASE_SIGNING_APP = `
    signingConfigs {
        release {
            storeFile file("release.keystore")
            storePassword "ChemixRelease2026"
            keyAlias "chemix"
            keyPassword "ChemixRelease2026"
        }
    }
`;

function patchGroovy(path) {
  let g = readFileSync(path, "utf8");
  writeFileSync(path + ".bak", g);

  // Remove any existing signingConfigs { ... } blocks (non-greedy multi)
  g = g.replace(/signingConfigs\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, "");

  // Insert signingConfigs right after "android {"
  if (!g.includes("android {") && !g.includes("android{")) {
    console.error("no android { in", path);
    process.exit(1);
  }
  g = g.replace(/android\s*\{/, "android {" + RELEASE_SIGNING_APP);

  // Force every release buildType to use signing
  // Remove existing signingConfig lines in release to avoid duplicates
  g = g.replace(/signingConfig\s+signingConfigs\.[a-zA-Z0-9_]+\s*\n/g, "");

  // Target only the release block inside buildTypes. A global replacement
  // also matches signingConfigs.release and causes Gradle evaluation to fail.
  const buildTypesRe = /\bbuildTypes\s*\{/g;
  const buildTypesMatch = buildTypesRe.exec(g);
  const releaseRe = /\brelease\s*\{/g;
  if (!buildTypesMatch) {
    console.error("buildTypes block not found");
    process.exit(1);
  }
  releaseRe.lastIndex = buildTypesRe.lastIndex;
  const releaseMatch = releaseRe.exec(g);
  if (!releaseMatch) {
    console.error("release buildType not found");
    process.exit(1);
  }
  const insertAt = releaseMatch.index + releaseMatch[0].length;
  g = g.slice(0, insertAt) +
    "\n            signingConfig signingConfigs.release\n            debuggable false" +
    g.slice(insertAt);

  writeFileSync(path, g);
  console.log("patched", path);

  // Verify
  if (!g.includes('storePassword "ChemixRelease2026"')) {
    console.error("patch verification failed");
    process.exit(1);
  }
  if (!g.includes("signingConfig signingConfigs.release")) {
    console.error("release buildType not wired");
    process.exit(1);
  }
}

function patchKts(path) {
  let g = readFileSync(path, "utf8");
  writeFileSync(path + ".bak", g);
  g = g.replace(/signingConfigs\s*\{[\s\S]*?\n\s*\}/m, "");
  const block = `
    signingConfigs {
        create("release") {
            storeFile = file("release.keystore")
            storePassword = "ChemixRelease2026"
            keyAlias = "chemix"
            keyPassword = "ChemixRelease2026"
        }
    }
`;
  g = g.replace(/android\s*\{/, "android {" + block);
  g = g.replace(
    /getByName\("release"\)\s*\{/g,
    `getByName("release") {
            signingConfig = signingConfigs.getByName("release")
            isDebuggable = false`
  );
  writeFileSync(path, g);
  console.log("patched kts", path);
}

const groovy = join(androidApp, "build.gradle");
const kts = join(androidApp, "build.gradle.kts");
if (existsSync(groovy)) patchGroovy(groovy);
else if (existsSync(kts)) patchKts(kts);
else {
  console.error("no build.gradle");
  process.exit(1);
}

console.log("files:", readdirSync(androidApp).filter(f => /keystore|properties|gradle/i.test(f)).join(", "));
console.log("OK release signing configured");
