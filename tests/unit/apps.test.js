import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const apps = JSON.parse(readFileSync(resolve(root, "data/apps.json"), "utf8"));

const URLS = [
  "https://guitar-mate.pages.dev/",
  "https://icebreaker-de4.pages.dev/",
  "https://mini-games-69o.pages.dev/",
  "https://chehok.github.io/spellchecker/",
  "https://recreation-cmx.pages.dev/",
];

describe("apps.json", () => {
  it("has the expected number of entries with unique ids", () => {
    expect(apps).toHaveLength(URLS.length);
    const ids = apps.map((a) => a.id);
    expect(new Set(ids).size).toBe(URLS.length);
  });

  it("uses the verified public URLs only", () => {
    const urls = apps.map((a) => a.url).sort();
    expect(urls).toEqual([...URLS].sort());
    for (const app of apps) {
      expect(app.url).not.toMatch(/guitar-chord/);
    }
  });

  it("spellchecker uses the published apple-touch icon", () => {
    const sc = apps.find((a) => a.id === "spellchecker");
    expect(sc?.icon).toBe("icons/spellchecker/apple-touch-icon.png");
    expect(existsSync(resolve(root, "public", sc.icon))).toBe(true);
  });

  it("icons exist on disk for apps that declare them", () => {
    for (const app of apps) {
      if (!app.icon) continue;
      expect(existsSync(resolve(root, "public", app.icon))).toBe(true);
    }
  });
});
