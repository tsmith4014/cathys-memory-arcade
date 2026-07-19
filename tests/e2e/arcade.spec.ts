import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("enters the arcade and exposes every cabinet", async ({ page }) => {
  await page.goto("./");
  await expect(page).toHaveTitle(/Cathy's Memory Arcade/);
  await expect(page.getByRole("button", { name: /insert two tokens/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /sound off/i })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: /insert two tokens/i }).click();
  await expect(page.locator("#lobby")).toBeInViewport();
  await expect(page.getByRole("link", { name: /memory core/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /project arcade/i })).toBeVisible();
});

test("changes the origin terminal locally", async ({ page }) => {
  await page.goto("./#origin-terminal");
  await page.getByRole("button", { name: /why ai/i }).click();
  await expect(page.getByRole("status")).toContainText("first week at Code Platoon");
});

test("has no automatically detectable accessibility violations", async ({ page }) => {
  await page.goto("./");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("renders the mobile entrance without horizontal overflow", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile project only");
  await page.goto("./");
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
  await expect(page.getByRole("heading", { name: /cathy's memory arcade/i })).toBeVisible();
});
