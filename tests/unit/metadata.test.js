import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const pub = (p) => resolve(root, "public", p);
const meta = (key, value) =>
  html.match(new RegExp(`<meta\\s+${key}="${value}"\\s+content="([^"]*)"`))?.[1];

const SITE = "https://chehok.github.io/chehok-lab/";

function pngSize(file) {
  const b = readFileSync(file);
  expect(b.subarray(1, 4).toString()).toBe("PNG");
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

describe("static share metadata (no JS needed)", () => {
  it("has canonical and og:url on the Pages subpath", () => {
    expect(html).toContain(`<link rel="canonical" href="${SITE}"`);
    expect(meta("property", "og:url")).toBe(SITE);
  });

  it("has Korean title and description for OG and Twitter", () => {
    expect(meta("property", "og:title")).toBe("Chehok Lab — 직접 만든 앱과 실험을 한곳에");
    expect(meta("name", "twitter:title")).toBe(meta("property", "og:title"));
    expect(meta("property", "og:description")).toMatch(/[가-힣]/);
    expect(meta("name", "twitter:card")).toBe("summary_large_image");
  });

  it("points og/twitter image to an absolute https URL of a real 1200x630 PNG", () => {
    const url = meta("property", "og:image");
    expect(url).toMatch(/^https:\/\/chehok\.github\.io\/chehok-lab\/og-chehok-lab-v\d+\.png$/);
    expect(meta("name", "twitter:image")).toBe(url);
    expect(meta("property", "og:image:width")).toBe("1200");
    expect(meta("property", "og:image:height")).toBe("630");
    expect(meta("property", "og:image:type")).toBe("image/png");
    expect(meta("property", "og:image:alt")).toMatch(/Chehok Lab/);
    const file = pub(url.replace(SITE, ""));
    expect(existsSync(file)).toBe(true);
    expect(pngSize(file)).toEqual([1200, 630]);
  });
});

describe("favicon assets", () => {
  it("ships svg, png, ico and touch icon with expected sizes", () => {
    expect(existsSync(pub("favicon.svg"))).toBe(true);
    expect(pngSize(pub("favicon-16.png"))).toEqual([16, 16]);
    expect(pngSize(pub("favicon-32.png"))).toEqual([32, 32]);
    expect(pngSize(pub("apple-touch-icon.png"))).toEqual([180, 180]);
    expect(pngSize(pub("icon-192.png"))).toEqual([192, 192]);
    const ico = readFileSync(pub("favicon.ico"));
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBeGreaterThanOrEqual(2);
  });

  it("links every icon with a cache-busting version", () => {
    const links = [...html.matchAll(/<link rel="(?:icon|shortcut icon|apple-touch-icon)"[^>]*href="([^"]+)"/g)].map(
      (m) => m[1]
    );
    expect(links.length).toBeGreaterThanOrEqual(5);
    for (const href of links) expect(href).toMatch(/\?v=\d+$/);
  });
});
