import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dataPath = resolve(root, "data/apps.json");

const EXPECTED_URLS = new Set([
  "https://guitar-mate.dev-chehok.workers.dev/",
  "https://icebreaker.dev-chehok.workers.dev/",
  "https://chehok.github.io/mini-games/",
  "https://chehok.github.io/spellchecker/",
  "https://chehok.github.io/instagram-manager/",
]);

const FORBIDDEN_URL = "guitar-chord";

const raw = readFileSync(dataPath, "utf8");
const apps = JSON.parse(raw);

const errors = [];
const ids = new Set();
const urls = new Set();

if (!Array.isArray(apps) || apps.length === 0) {
  errors.push("apps must be a non-empty array");
}

for (const app of apps) {
  for (const key of ["id", "name", "description", "url", "category"]) {
    if (app[key] == null || String(app[key]).trim() === "") {
      errors.push(`${app.id ?? "?"}: missing ${key}`);
    }
  }
  if (ids.has(app.id)) errors.push(`duplicate id: ${app.id}`);
  ids.add(app.id);

  if (app.url.includes(FORBIDDEN_URL)) {
    errors.push(`${app.id}: forbidden guitar-chord URL`);
  }
  urls.add(app.url);

  if (app.icon != null) {
    const iconPath = resolve(root, "public", app.icon);
    if (!existsSync(iconPath)) {
      errors.push(`${app.id}: icon file missing at public/${app.icon}`);
    }
  }

  if (app.id === "spellchecker" && !app.icon) {
    errors.push("spellchecker must use the published app icon asset");
  }
}

for (const expected of EXPECTED_URLS) {
  if (!urls.has(expected)) {
    errors.push(`missing expected app URL: ${expected}`);
  }
}

if (apps.length !== EXPECTED_URLS.size) {
  errors.push(`expected exactly ${EXPECTED_URLS.size} apps, got ${apps.length}`);
}

if (errors.length) {
  console.error("Validation failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

console.log(`OK: ${apps.length} apps validated.`);
