import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("enters the arcade and exposes six playable cabinets", async ({ page }) => {
  await page.goto("./");
  await expect(page).toHaveTitle(/Cathy's Memory Arcade/);
  await expect(page.getByRole("button", { name: /insert two tokens/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /sound off/i })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: /insert two tokens/i }).click();
  await expect(page.locator("#lobby")).toBeInViewport();
  await expect(page.getByRole("button", { name: /play skyline smash/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play token trail/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play dungeon circuit/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play highrise havoc/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play sunset run/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play dragonfire descent/i })).toBeVisible();
});

test("launches, pauses, and exits every game cabinet", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("./#lobby");
  for (const game of ["Skyline Smash", "Token Trail", "Dungeon Circuit", "Highrise Havoc", "Sunset Run", "Dragonfire Descent"]) {
    await page.getByRole("button", { name: `Play ${game}` }).click();
    await expect(page.getByRole("dialog", { name: game })).toBeVisible();
    await expect(page.getByLabel(new RegExp(`${game} game screen`, "i"))).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(page.getByRole("button", { name: /resume/i })).toBeVisible();
    await page.getByRole("button", { name: `Close ${game}` }).click();
    await expect(page.getByRole("dialog", { name: game })).toBeHidden();
  }
  expect(runtimeErrors).toEqual([]);
});

test("shows the corrected admission timeline and jukebox credits", async ({ page }) => {
  await page.goto("./#memory-core");
  await expect(page.locator(".ledger-display").first()).toContainText("1987");
  await expect(page.locator(".ledger-display").first()).toContainText("$5");
  await expect(page.locator(".ledger-prototype")).toContainText("1986 // $2.50 // two hours");
  await expect(page.getByText(/Edvard Grieg composition/i)).toBeVisible();
});

test("opens a shared game URL directly in its cabinet", async ({ page }) => {
  await page.goto("./?game=token-trail#lobby");
  await expect(page.getByRole("dialog", { name: "Token Trail" })).toBeVisible();
  await page.getByRole("button", { name: "Close Token Trail" }).click();
  await expect(page).not.toHaveURL(/game=token-trail/);
});

test("changes the origin terminal locally", async ({ page }) => {
  await page.goto("./#origin-terminal");
  await page.getByRole("button", { name: /why ai/i }).click();
  await expect(page.getByRole("status")).toContainText("first week at Code Platoon");
});

test("renders the authorized photo-booth memory and sourced life details", async ({ page }) => {
  await page.goto("./#memory-core");
  const familyPhoto = page.getByRole("img", { name: /two original photo-booth portraits/i });
  await familyPhoto.scrollIntoViewIfNeeded();
  await expect(familyPhoto).toBeVisible();
  await expect.poll(() => familyPhoto.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText(/moxie, gardens, motorcycles/i)).toBeVisible();
  await expect(page.getByText(/enid, oklahoma/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /read original remembrance/i })).toHaveAttribute("href", "/cathys-memory-arcade/memory/cathy-life-program.jpg");
});

test("has no automatically detectable accessibility violations", async ({ page }) => {
  await page.goto("./");
  const pageResults = await new AxeBuilder({ page }).analyze();
  expect(pageResults.violations).toEqual([]);
  await page.getByRole("button", { name: /play dungeon circuit/i }).click();
  const gameResults = await new AxeBuilder({ page }).analyze();
  expect(gameResults.violations).toEqual([]);
});

test("renders the mobile entrance without horizontal overflow", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile project only");
  await page.goto("./");
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
  await expect(page.getByRole("heading", { name: /cathy's memory arcade/i })).toBeVisible();
});
