import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("enters the arcade and exposes six playable cabinets", async ({ page }) => {
  await page.goto("./");
  await expect(page).toHaveTitle(/Cathy's Memory Arcade/);
  await expect(page.getByRole("button", { name: /insert two tokens/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /jukebox off/i })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: /insert two tokens/i }).click();
  await expect(page.locator("#lobby")).toBeInViewport();
  await expect(page.getByRole("button", { name: /play skyline smash/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play token trail/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play dungeon circuit/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play highrise havoc/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play sunset run/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play dragonfire descent/i })).toBeVisible();
  const backdropSources = await page.locator(".attract-backdrop").evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src));
  expect(new Set(backdropSources).size).toBe(6);
});

test("launches, pauses, and exits every game cabinet", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("./#lobby");
  for (const game of ["Skyline Smash", "Token Trail", "Dungeon Circuit", "Highrise Havoc", "Sunset Run", "Dragonfire Descent"]) {
    const trigger = page.getByRole("button", { name: `Play ${game}` });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: game })).toBeVisible();
    await expect(page.getByRole("button", { name: /begin chapter/i })).toBeFocused();
    await page.getByRole("button", { name: /begin chapter/i }).click();
    await expect(page.getByLabel(new RegExp(`${game} game screen`, "i"))).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await page.getByRole("button", { name: /pause/i }).click();
    await expect(page.getByRole("button", { name: /resume/i })).toBeVisible();
    await page.getByRole("button", { name: `Close ${game}` }).click();
    await expect(page.getByRole("dialog", { name: game })).toBeHidden();
    await expect(trigger).toBeFocused();
  }
  expect(runtimeErrors).toEqual([]);
});

test("held keyboard attacks repeat and blur releases the control", async ({ page }) => {
  await page.goto("./#lobby");
  await page.getByRole("button", { name: /play skyline smash/i }).click();
  await page.getByRole("button", { name: /begin chapter/i }).click();
  const score = page.locator(".game-stage-score strong");

  await page.keyboard.down("Space");
  await expect.poll(async () => Number(await score.textContent())).toBeGreaterThan(100);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForTimeout(100);
  const releasedScore = Number(await score.textContent());
  await page.waitForTimeout(750);
  expect(Number(await score.textContent())).toBe(releasedScore);
  await page.keyboard.up("Space");
});

test("on-screen action control can hold a real arcade attack", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile project only");
  await page.goto("./#lobby");
  await page.getByRole("button", { name: /play skyline smash/i }).click();
  await page.getByRole("button", { name: /begin chapter/i }).click();
  const action = page.locator(".touch-actions .action-primary");
  await expect(action).toBeVisible();
  const box = await action.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(420);
  await page.mouse.up();
  await expect.poll(async () => Number(await page.locator(".game-stage-score strong").textContent())).toBeGreaterThan(0);
});

test("shows the corrected admission timeline and jukebox credits", async ({ page }) => {
  await page.goto("./#memory-core");
  const fillmore = page.locator("article").filter({ hasText: "1986 // Fillmore" });
  const boardwalk = page.locator("article").filter({ hasText: "1987 // Boardwalk" });
  await expect(fillmore).toContainText("$2.50");
  await expect(fillmore).toContainText("Two hours");
  await expect(boardwalk).toContainText("$5");
  await expect(boardwalk).toContainText("free play");
  await expect(page.getByText(/Edvard Grieg composition/i)).toBeVisible();
  await expect(page.locator(".jukebox-tracks button")).toHaveCount(6);
  await expect(page.getByRole("button", { name: /free play forever/i })).toBeVisible();
  await expect(page.getByText(/six songs live inside this jukebox/i)).toBeVisible();
  await expect(page.getByText(/long-form arrangements/i)).toBeVisible();
});

test("plays and restores a branching story file", async ({ page }) => {
  await page.goto("./#story-arcade");
  const horrorCard = page.locator(".story-card").filter({ hasText: "The Last Token" });
  await horrorCard.getByRole("button", { name: /enter story/i }).click();
  await expect(page.locator(".story-copy")).toBeFocused();
  await expect(page.getByRole("heading", { name: /something finishes booting in the dark/i })).toBeVisible();
  await page.getByRole("button", { name: /walk straight to the cabinet/i }).click();
  await expect(page.getByRole("heading", { name: /attract screen knows there should be two players/i })).toBeVisible();
  await page.reload();
  const resumeCard = page.locator(".story-card").filter({ hasText: "The Last Token" });
  await expect(resumeCard).toContainText("save detected");
  await resumeCard.getByRole("button", { name: /resume story/i }).click();
  await expect(page.getByRole("heading", { name: /attract screen knows there should be two players/i })).toBeVisible();
  await page.getByRole("button", { name: /story shelf/i }).click();
  await expect(resumeCard.getByRole("button", { name: /resume story/i })).toBeFocused();
});

test("restores direct section links after the React page mounts", async ({ page }) => {
  await page.goto("./#memory-route");
  await expect(page.locator("#memory-route")).toBeInViewport();
  const top = await page.locator("#memory-route").evaluate((element) => element.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(60);
});

test("finishes the token ceremony quickly for reduced-motion visitors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: /insert two tokens/i }).click();
  await expect(page.locator(".site")).toHaveClass(/entry-complete/, { timeout: 1500 });
  await expect(page.locator("#lobby")).toBeFocused();
});

test("opens a shared game URL directly in its cabinet", async ({ page }) => {
  await page.goto("./?game=token-trail#lobby");
  await expect(page.getByRole("dialog", { name: "Token Trail" })).toBeVisible();
  await expect(page.getByRole("button", { name: /begin chapter/i })).toBeVisible();
  await page.getByRole("button", { name: "Close Token Trail" }).click();
  await expect(page).not.toHaveURL(/game=token-trail/);
});

test("restores the six-chapter local save and unlocks the epilogue", async ({ page }) => {
  await page.addInitScript(() => {
    for (const game of ["skyline-smash", "token-trail", "dungeon-circuit", "highrise-havoc", "sunset-run", "dragonfire-descent"]) {
      window.localStorage.setItem(`cathy-arcade:${game}:complete`, "true");
    }
  });
  await page.goto("./#memory-route");
  await expect(page.locator(".route-progress")).toContainText("6/6");
  await expect(page.locator(".route-stop.recovered")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: /lights stay on because the memory changed shape/i })).toBeVisible();
});

test("changes the origin terminal locally", async ({ page }) => {
  await page.goto("./#origin-terminal");
  await page.getByRole("button", { name: /why ai/i }).click();
  await expect(page.getByRole("status").filter({ hasText: "first week at Code Platoon" })).toContainText("first week at Code Platoon");
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
  const briefingResults = await new AxeBuilder({ page }).analyze();
  expect(briefingResults.violations).toEqual([]);
  await page.getByRole("button", { name: /begin chapter/i }).click();
  const playingResults = await new AxeBuilder({ page }).analyze();
  expect(playingResults.violations).toEqual([]);
  await page.getByRole("button", { name: "Close Dungeon Circuit" }).click();
  const horrorCard = page.locator(".story-card").filter({ hasText: "The Last Token" });
  await horrorCard.getByRole("button", { name: /enter story/i }).click();
  const storyResults = await new AxeBuilder({ page }).analyze();
  expect(storyResults.violations).toEqual([]);

  await page.goto("./credits.html");
  const creditsResults = await new AxeBuilder({ page }).analyze();
  expect(creditsResults.violations).toEqual([]);
});

test("renders the mobile entrance without horizontal overflow", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile project only");
  await page.goto("./");
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
  await expect(page.getByRole("heading", { name: /cathy's memory arcade/i })).toBeVisible();
  for (const hash of ["#lobby", "#memory-route", "#story-arcade", "#jukebox", "#memory-core", "#origin-terminal"]) {
    await page.goto(`./${hash}`);
    const sectionDimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(sectionDimensions.scroll).toBeLessThanOrEqual(sectionDimensions.client);
  }
});
