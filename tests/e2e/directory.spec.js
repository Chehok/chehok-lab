import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const apps = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../data/apps.json"), "utf8")
);

test.describe("Chehok Lab directory", () => {
  test("loads header and all app cards", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByRole("heading", { name: "Chehok Lab", level: 1 })).toBeVisible();

    for (const app of apps) {
      await expect(page.getByRole("link", { name: new RegExp(app.name) })).toBeVisible();
    }
  });

  test("card links point to verified URLs with rel noopener", async ({ page }) => {
    await page.goto("./");
    for (const app of apps) {
      const link = page.locator(`a.card__link[href="${app.url}"]`).first();
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
  });

  test("search filters and shows empty state", async ({ page }) => {
    await page.goto("./");
    await page.getByPlaceholder("예: 기타, 모임, 맞춤법").fill("zzzznotfound");
    await expect(page.getByText("일치하는 앱이 없어요")).toBeVisible();

    await page.getByPlaceholder("예: 기타, 모임, 맞춤법").fill("기타");
    await expect(page.getByText("기타메이트")).toBeVisible();
    await expect(page.getByText("총 1개")).toBeVisible();
  });

  test("category chip filters", async ({ page }) => {
    await page.goto("./");
    await page.getByRole("button", { name: "게임", exact: true }).click();
    await expect(page.getByRole("heading", { name: "미니게임" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "기타메이트" })).toHaveCount(0);
  });

  test("no unexpected console errors", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("./");
    await expect(page.getByRole("heading", { name: "Chehok Lab", level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("no horizontal overflow at viewport", async ({ page }) => {
    await page.goto("./");
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test("screenshot artifact", async ({ page }, testInfo) => {
    await page.goto("./");
    const name = testInfo.project.name;
    await page.screenshot({
      path: resolve(import.meta.dirname, `../../artifacts/screenshot-${name}.png`),
      fullPage: true,
    });
  });
});
