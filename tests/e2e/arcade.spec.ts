import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("enters the arcade and exposes six chapters plus the guest cabinet", async ({ page }) => {
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
  await expect(page.getByRole("button", { name: /play dragon crew: pet arena/i })).toBeVisible();
  const backdropSources = await page.locator(".attract-backdrop").evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src));
  expect(new Set(backdropSources).size).toBe(7);
});

test("keeps free play unlocked after a browser reload", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /insert two tokens/i }).click();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("cathy-arcade:free-play"))).toBe("true");

  await page.reload();
  await expect(page.getByRole("button", { name: /free play unlocked/i })).toBeEnabled();
  await expect(page.getByRole("button", { name: /insert two tokens/i })).toHaveCount(0);
});

test("launches, pauses, and exits every game cabinet", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("./#lobby");
  for (const game of ["Skyline Smash", "Token Trail", "Dungeon Circuit", "Highrise Havoc", "Sunset Run", "Dragonfire Descent", "Dragon Crew: Pet Arena"]) {
    const trigger = page.getByRole("button", { name: `Play ${game}` });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: game })).toBeVisible();
    const start = page.getByRole("button", { name: /begin chapter|enter arena/i });
    await expect(start).toBeFocused();
    await start.click();
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

test("lets the guest cabinet split pilot and gunner controls", async ({ page }) => {
  await page.goto("./?game=pet-arena#lobby");
  await page.getByRole("button", { name: /enter arena/i }).click();
  const canvas = page.getByLabel(/dragon crew: pet arena game screen/i);
  await expect(canvas).toBeVisible();
  await page.keyboard.down("d");
  await page.waitForTimeout(220);
  await page.keyboard.up("d");
  await page.keyboard.press("ArrowUp");
  await expect(page.locator(".game-instructions")).toContainText(/couch gunner linked/i);
  await page.keyboard.down("Space");
  await page.waitForTimeout(4800);
  await page.keyboard.up("Space");
  await expect.poll(async () => Number(await page.locator(".game-stage-score strong").textContent())).toBeGreaterThan(0);
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

test("opens the Signal Theater without contacting Instagram until requested", async ({ page }) => {
  await page.route("https://www.instagram.com/**", (route) => route.abort());
  await page.goto("./#signal-theater");
  await expect(page.getByRole("heading", { name: /one signal we made/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /play signal 86/i })).toBeVisible();
  await expect(page.locator("iframe[title*='Instagram Reel']")).toHaveCount(0);
  await page.getByRole("button", { name: /load official reel/i }).click();
  await expect(page.locator("iframe[title*='Instagram Reel']")).toHaveAttribute("src", "https://www.instagram.com/reel/Dd_tbbsNrvu/embed/");
  await expect(page.getByRole("button", { name: /restart reel here/i })).toBeVisible();
  await page.getByRole("button", { name: /restart reel here/i }).click();
  await expect(page.locator("iframe[title*='Instagram Reel']")).toHaveCount(1);
  await page.getByRole("button", { name: /close reel/i }).click();
  await expect(page.locator("iframe[title*='Instagram Reel']")).toHaveCount(0);
});

test("plays the Cat and Runt fantasy serial without leaving the theater", async ({ page }) => {
  await page.goto("./#road-beyond-free-play");
  await expect(page.getByRole("heading", { name: /road beyond free play/i })).toBeVisible();
  await expect(page.locator(".fantasy-chapter-reel button")).toHaveCount(8);
  await page.getByRole("button", { name: /open chapter iii: cat/i }).click();
  await expect(page.locator(".fantasy-story-stage")).toHaveAttribute("data-effect", "bloom");
  await expect(page.getByRole("img", { name: /young cat.*family likeness/i })).toBeVisible();
  await page.getByRole("button", { name: /play chapter iii/i }).click();
  await expect(page.locator(".fantasy-story-stage")).toHaveClass(/is-playing/);
  await expect(page.getByRole("status").filter({ hasText: /chapter live|running silently/i })).toBeVisible();
  await page.getByRole("button", { name: /stop chapter/i }).click();
  await page.getByRole("button", { name: /open chapter iv: the biggest one was runt/i }).click();
  await expect(page.getByRole("img", { name: /runt.*cat.*shoulder/i })).toBeVisible();
  await page.getByRole("button", { name: /open chapter viii: the six-lamp booth/i }).click();
  await expect(page.getByRole("img", { name: /cat and runt.*authorized family likenesses/i })).toBeVisible();
  await expect(page.getByText("Two lights found.", { exact: false })).toBeVisible();
});

test("plays and restores a branching story file", async ({ page }) => {
  await page.goto("./#story-arcade");
  const horrorCard = page.locator(".story-card").filter({ hasText: "The Last Token" });
  await horrorCard.getByRole("button", { name: /enter story/i }).click();
  await expect(page.locator(".story-stage")).toBeFocused();
  await expect(page.locator(".story-stage")).toHaveAttribute("data-scene-art", "world");
  const briefing = page.getByRole("complementary", { name: /story introduction and objective/i });
  await expect(briefing).toContainText(/you are mae torres/i);
  await expect(briefing).toContainText(/before its 12:30 reset/i);
  await expect(page.locator(".story-act-line")).toContainText(/act i.*lock-in/i);
  await expect(page.getByRole("heading", { name: /one cabinet stays on/i })).toBeVisible();
  await expect(page.locator(".story-scene-beat")).toContainText(/warm token dated tomorrow/i);
  await page.getByRole("button", { name: /walk straight to the cabinet/i }).click();
  await expect(page.getByRole("heading", { name: /player two is late/i })).toBeVisible();
  await page.reload();
  const resumeCard = page.locator(".story-card").filter({ hasText: "The Last Token" });
  await expect(resumeCard).toContainText("save detected");
  await resumeCard.getByRole("button", { name: /resume story/i }).click();
  await expect(page.getByRole("heading", { name: /player two is late/i })).toBeVisible();
  await page.getByRole("button", { name: /story shelf/i }).click();
  await expect(resumeCard.getByRole("button", { name: /resume story/i })).toBeFocused();
});

test("keeps story art in front while the narrative changes scenes", async ({ page, isMobile }) => {
  await page.goto("./#story-arcade");
  const actionCard = page.locator(".story-card").filter({ hasText: "Neon Runner 1986" });
  await expect(actionCard.locator(".story-card-reel img")).toHaveCount(3);
  await actionCard.getByRole("button", { name: /enter story/i }).click();

  const stage = page.locator(".story-stage");
  const art = page.locator(".story-stage-art");
  await expect(stage).toHaveAttribute("data-scene-art", "world");
  await expect(stage).toHaveAttribute("data-art-source", "world");
  await expect(art).toHaveAttribute("src", /story-action-neon-runner\.webp$/);
  await expect.poll(() => art.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(1000);

  const openingBeat = (await page.locator(".story-scene-beat").textContent()) ?? "";
  const openingWords = openingBeat.trim().split(/\s+/).length;
  expect(openingWords).toBeGreaterThanOrEqual(20);
  expect(openingWords).toBeLessThanOrEqual(45);
  await expect(page.locator(".story-drawer[open]")).toHaveCount(0);

  await page.getByRole("button", { name: /take the rooftops/i }).click();
  await page.getByRole("button", { name: /hack the billboard/i }).click();
  await expect(stage).toHaveAttribute("data-scene-art", "cast");
  await expect(stage).toHaveAttribute("data-art-source", "scene");
  await expect(stage).toHaveAttribute("data-effect", "signal");
  await expect(art).toHaveAttribute("src", /story-action-flood-channel-v3\.webp$/);
  await expect(page.getByRole("heading", { name: /eight stolen seconds/i })).toBeVisible();
  await expect(page.getByText(/my objections remain fully operational/i)).toBeVisible();
  await expect(page.getByRole("list", { name: /details visible in this scene/i })).toContainText(/jammed weapon/i);

  await page.getByRole("button", { name: /view artwork/i }).click();
  await expect(stage).toHaveAttribute("data-frame-mode", "open");
  await expect(page.locator(".story-choices")).toBeHidden();
  await expect(page.locator(".story-drawers")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(stage).toHaveAttribute("data-frame-mode", "closed");

  if (isMobile) {
    const focalPoint = await art.evaluate((image) => getComputedStyle(image).objectPosition);
    expect(focalPoint).toBe("50% 50%");
  }
});

test("restores direct section links after the React page mounts", async ({ page }) => {
  await page.goto("./#memory-route");
  await page.waitForTimeout(1_000);
  await expect(page.locator("#memory-route")).toBeInViewport();
  const top = await page.locator("#memory-route").evaluate((element) => element.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(60);

  await page.goto("./?view=serial#road-beyond-free-play");
  await page.waitForTimeout(1_000);
  await expect(page.getByRole("heading", { name: /road beyond free play/i })).toBeInViewport();
  const serialTop = await page.locator("#road-beyond-free-play").evaluate((element) => element.getBoundingClientRect().top);
  expect(serialTop).toBeGreaterThanOrEqual(60);
});

test("uses the floor map as a keyboard-safe route through the arcade", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("cathy-arcade:skyline-smash:complete", "true");
    window.localStorage.setItem("cathy-arcade:story:horror", JSON.stringify({ nodeId: "h1" }));
  });
  await page.goto("./#lobby");
  const trigger = page.getByRole("button", { name: "Floor map", exact: true });

  await trigger.click();
  const map = page.getByRole("dialog", { name: /choose your next room/i });
  await expect(map).toBeVisible();
  await expect(map.getByRole("button", { name: /close map/i })).toBeFocused();
  await expect(map).toContainText("1 chapter kept // 1 story file open");

  await page.keyboard.press("Escape");
  await expect(map).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await map.getByRole("link", { name: /after closing/i }).click();
  await expect(map).toBeHidden();
  await expect(page).toHaveURL(/#story-arcade$/);
  await expect(page.locator("#story-arcade")).toBeInViewport();
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
  await page.getByRole("button", { name: "Floor map", exact: true }).click();
  const mapResults = await new AxeBuilder({ page }).analyze();
  expect(mapResults.violations).toEqual([]);
  await page.keyboard.press("Escape");
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
  for (const hash of ["#lobby", "#memory-route", "#story-arcade", "#jukebox", "#signal-theater", "#memory-core", "#origin-terminal"]) {
    await page.goto(`./${hash}`);
    const sectionDimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(sectionDimensions.scroll).toBeLessThanOrEqual(sectionDimensions.client);
  }
});

test("keeps the mobile floor controls visible and room-aware", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile project only");
  await page.goto("./");
  const floorNav = page.getByRole("navigation", { name: /mobile arcade navigation/i });
  await expect(floorNav).toBeVisible();

  const read = floorNav.getByRole("link", { name: "Read", exact: true });
  await read.click();
  await expect(page.locator("#story-arcade")).toBeInViewport();
  await expect(read).toHaveAttribute("aria-current", "location");

  await floorNav.getByRole("button", { name: /open mobile floor map/i }).click();
  const map = page.getByRole("dialog", { name: /choose your next room/i });
  await expect(map).toBeVisible();
  await expect(map.getByRole("link")).toHaveCount(9);
  await page.keyboard.press("Escape");
  await expect(map).toBeHidden();
});
