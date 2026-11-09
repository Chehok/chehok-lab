import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const apps = JSON.parse(readFileSync(resolve(root, "data/apps.json"), "utf8"));

const URLS = [
  "https://guitar-mate.dev-chehok.workers.dev/",
  "https://icebreaker.dev-chehok.workers.dev/",
  "https://chehok.github.io/mini-games/",
  "https://chehok.github.io/spellchecker/",
  "https://chehok.github.io/instagram-manager/",
];

describe("apps.json", () => {
  it("has exactly five entries with stable ids", () => {
    expect(apps).toHaveLength(5);
    const ids = apps.map((a) => a.id);
    expect(new Set(ids).size).toBe(5);
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
