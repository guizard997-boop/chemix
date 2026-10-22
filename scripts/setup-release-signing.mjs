import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidApp = join(root, "android", "app");
const gradlePath = join(androidApp, "build.gradle");
const ksSrc = join(root, "release.keystore");
const ksDst = join(androidApp, "release.keystore");

if (!existsSync(gradlePath)) {
  console.error("android/app/build.gradle not found");
  process.exit(1);
}
if (!existsSync(ksSrc)) {
  console.error("release.keystore not found in project root");
  process.exit(1);
}
copyFileSync(ksSrc, ksDst);

let g = readFileSync(gradlePath, "utf8");

// Remove existing signingConfigs/release if re-run
if (!g.includes("ChemixRelease signing")) {
  // Inject signingConfigs before buildTypes
  const signingBlock = `
    // ChemixRelease signing
    signingConfigs {
        release {
            storeFile file("release.keystore")
            storePassword "ChemixRelease2026"
            keyAlias "chemix"
            keyPassword "ChemixRelease2026"
        }
    }
`;
  if (g.includes("buildTypes {")) {
    g = g.replace("buildTypes {", signingBlock + "\n    buildTypes {");
  } else {
    console.error("buildTypes block not found");
    process.exit(1);
  }

  // Ensure release buildType uses signingConfig and is not debuggable
  if (g.includes("release {")) {
    // add signingConfig inside first release {
    g = g.replace(
      /release\s*\{/,
      `release {
            signingConfig signingConfigs.release
            debuggable false`
    );
  }
  writeFileSync(gradlePath, g);
  console.log("signingConfigs.release added to build.gradle");
} else {
  console.log("signing already configured");
}

// Also set version in capacitor / android
const vars = join(androidApp, "build.gradle");
let gv = readFileSync(vars, "utf8");
// bump versionName if present
if (gv.includes("versionName")) {
  gv = gv.replace(/versionName\s+"[^"]*"/, 'versionName "1.0.0"');
}
if (gv.includes("versionCode")) {
  gv = gv.replace(/versionCode\s+\d+/, "versionCode 1");
}
writeFileSync(vars, gv);
console.log("release signing ready");
