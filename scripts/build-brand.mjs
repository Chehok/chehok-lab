// 파비콘 PNG/ICO와 공유 썸네일(OG)을 다시 만든다. 사용법: npm run brand
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pub = (p) => resolve(root, "public", p);
const apps = JSON.parse(readFileSync(resolve(root, "data/apps.json"), "utf8"));
const svg = readFileSync(pub("favicon.svg"), "utf8");

export const OG_FILE = "og-chehok-lab-v1.png";

function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size, 0);
    e.writeUInt8(size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const browser = await chromium.launch();

async function renderSvg(size, { opaque = false } = {}) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const body = opaque
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#12352b"/><g transform="translate(6.4 6.4) scale(.8)">${svg.replace(/<\/?svg[^>]*>/g, "").replace(/<title>.*?<\/title>/, "")}</g></svg>`
    : svg;
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${body}`
  );
  const data = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  return data;
}

const sizes = { "favicon-16.png": 16, "favicon-32.png": 32, "favicon-48.png": 48, "icon-192.png": 192, "icon-512.png": 512 };
const rendered = {};
for (const [name, size] of Object.entries(sizes)) {
  rendered[size] = await renderSvg(size);
  writeFileSync(pub(name), rendered[size]);
}
writeFileSync(pub("apple-touch-icon.png"), await renderSvg(180, { opaque: true }));
writeFileSync(
  pub("favicon.ico"),
  buildIco([16, 32, 48].map((size) => ({ size, data: rendered[size] })))
);

const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(resolve(root, "scripts/og/og.html")).href);
await page.evaluate((list) => {
  const slots = [
    [0, 52], [190, 148], [0, 242], [190, 338], [0, 432],
  ];
  const host = document.getElementById("tiles");
  list.forEach((app, i) => {
    const el = document.createElement("div");
    el.className = "tile" + (app.icon ? "" : " badge");
    el.style.left = slots[i][0] + "px";
    el.style.top = slots[i][1] + "px";
    if (app.icon) {
      const img = document.createElement("img");
      img.src = app.src;
      img.alt = "";
      el.appendChild(img);
    } else {
      el.textContent = app.label;
    }
    host.appendChild(el);
  });
}, apps.slice(0, 5).map((a) => ({
  icon: !!a.icon,
  src: a.icon ? pathToFileURL(pub(a.icon)).href : "",
  label: a.badge || a.name.slice(0, 3),
})));
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
await page.screenshot({ path: pub(OG_FILE), clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log("brand assets written to public/ (", OG_FILE, ")");
