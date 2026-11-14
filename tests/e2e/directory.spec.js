import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const apps = JSON.parse(readFileSync(resolve(root, "data/apps.json"), "utf8"));
const shots = resolve(root, "artifacts");
mkdirSync(shots, { recursive: true });

test.describe("Chehok Lab directory", () => {
  test("loads brand header and all app cards", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByRole("heading", { name: "Chehok Lab", level: 1 })).toBeVisible();
    await expect(page.locator(".hero__brand")).toContainText("Chehok Lab");
    for (const app of apps) {
      await expect(page.getByRole("link", { name: new RegExp(app.name) })).toBeVisible();
    }
  });

  test("card links point to verified URLs with safe rel", async ({ page }) => {
    await page.goto("./");
    for (const app of apps) {
      const link = page.locator(`a.app__link[href="${app.url}"]`);
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
      await expect(link).toHaveAttribute("rel", /noreferrer/);
    }
  });

  test("original icons are served under the project subpath", async ({ page, request }) => {
    await page.goto("./");
    for (const app of apps.filter((a) => a.icon)) {
      const img = page.locator(`img[src$="${app.icon}"]`).first();
      const src = await img.getAttribute("src");
      expect(src).toBe(`/chehok-lab/${app.icon}`);
      const res = await request.get(src);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/png");
    }
    const scIcon = page.locator('a.app__link[href="https://chehok.github.io/spellchecker/"] img.app__icon');
    await expect(scIcon).toHaveAttribute("src", /icons\/spellchecker\/apple-touch-icon\.png$/);
  });

  test("shows every app with no search or filter controls", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("a.app__link")).toHaveCount(apps.length);
    await expect(page.locator('input, [role="search"], .chip')).toHaveCount(0);
    await expect(page.locator("button")).toHaveCount(1);
    await expect(page.locator("main button")).toHaveCount(0);
  });

  test("copy wraps naturally: no truncation, nowrap, or manual breaks", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("br")).toHaveCount(0);
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll(".hero__title, .hero__lead, .app__name, .app__desc")].filter((el) => {
        const cs = getComputedStyle(el);
        return cs.whiteSpace === "nowrap" || cs.textOverflow === "ellipsis" || cs.webkitLineClamp !== "none" && cs.webkitLineClamp !== "";
      }).length
    );
    expect(bad).toBe(0);
    for (const app of apps) {
      await expect(page.locator(".app__desc", { hasText: app.description })).toHaveCount(1);
    }
  });

  test("keyboard can reach and focus a card link", async ({ page }) => {
    await page.goto("./");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "앱 목록으로 건너뛰기" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /앱 설치/ })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("a.app__link").first()).toBeFocused();
  });

  test("head metadata and favicons resolve under /chehok-lab/", async ({ page, request }) => {
    await page.goto("./");
    const attr = (sel, a) => page.locator(sel).first().getAttribute(a);
    expect(await attr('link[rel="canonical"]', "href")).toBe("https://chehok.github.io/chehok-lab/");
    expect(await attr('meta[property="og:url"]', "content")).toBe("https://chehok.github.io/chehok-lab/");
    const ogUrl = await attr('meta[property="og:image"]', "content");
    expect(ogUrl).toMatch(
      /^https:\/\/chehok\.github\.io\/chehok-lab\/og-chehok-lab-v\d+\.png$/
    );
    expect(await attr('meta[name="twitter:card"]', "content")).toBe("summary_large_image");

    const icons = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll(
      (els) => els.map((e) => e.getAttribute("href"))
    );
    expect(icons.length).toBeGreaterThanOrEqual(4);
    for (const href of icons) {
      expect(href.startsWith("/chehok-lab/")).toBe(true);
      expect((await request.get(href)).status()).toBe(200);
    }
    const og = await request.get(new URL(ogUrl).pathname);
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
  });

  test("no console errors or failed requests", async ({ page }) => {
    const problems = [];
    page.on("pageerror", (e) => problems.push(String(e)));
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("requestfailed", (r) => problems.push(`failed: ${r.url()}`));
    page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
    await page.goto("./");
    await page.waitForLoadState("networkidle");
    expect(problems).toEqual([]);
  });

  test("serves the install manifest and shows a message offline", async ({ page, context, request }) => {
    await page.goto("./");
    const manifest = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifest).toBe("/chehok-lab/manifest.webmanifest");
    const response = await request.get(manifest);
    expect(response.ok()).toBe(true);
    const config = await response.json();
    expect(config).toMatchObject({ start_url: "./", scope: "./", display: "standalone" });
    for (const icon of config.icons) {
      const asset = await request.get(new URL(icon.src, response.url()).href);
      expect(asset.ok()).toBe(true);
      expect(asset.headers()["content-type"]).toContain("image/png");
    }

    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "인터넷에 연결해 주세요" })).toBeVisible();
  });

  test("browser shows 앱 설치 and triggers the install prompt", async ({ page }) => {
    await page.goto("./");
    const btn = page.locator("#pwa-action");
    await expect(btn).toHaveText("앱 설치");
    await expect(btn).toHaveAttribute("data-mode", "install");
    await page.evaluate(() => {
      const e = new Event("beforeinstallprompt", { cancelable: true });
      e.prompt = () => { window.__prompted = true; };
      e.userChoice = Promise.resolve({ outcome: "accepted" });
      window.dispatchEvent(e);
    });
    await btn.click();
    expect(await page.evaluate(() => window.__prompted)).toBe(true);
  });

  test("browser without install prompt shows install guidance", async ({ page }) => {
    await page.goto("./");
    await page.locator("#pwa-action").click();
    await expect(page.locator("#pwa-hint")).toBeVisible();
    await expect(page.locator("#pwa-hint")).toContainText("홈 화면에 추가");
  });

  test("installed app shows 링크 공유 and copies the link", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      const real = window.matchMedia.bind(window);
      window.matchMedia = (q) =>
        q === "(display-mode: standalone)"
          ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} }
          : real(q);
    });
    await page.goto("./");
    const btn = page.locator("#pwa-action");
    await expect(btn).toHaveText("링크 공유");
    await expect(btn).toHaveAttribute("data-mode", "share");
    await btn.click();
    await expect(page.locator("#pwa-hint")).toHaveText("링크를 복사했어요.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://chehok.github.io/chehok-lab/");
  });

  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("./");
      const overflow = () =>
        page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(await overflow()).toBe(false);
    });
  }

  test("screenshot artifact", async ({ page }, testInfo) => {
    await page.goto("./");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: resolve(shots, `screenshot-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });
});
