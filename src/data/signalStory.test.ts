import {
  FANTASY_STORY_CHAPTERS,
  FANTASY_STORY_DURATION_MS,
  getFantasyStoryMoment,
} from "./signalStory";

describe("The Road Beyond Free Play", () => {
  it("keeps the Cat and Runt season in a deliberate causal order", () => {
    expect(FANTASY_STORY_CHAPTERS.map((chapter) => chapter.id)).toEqual([
      "cabinet",
      "tollkeeper",
      "cat",
      "runt",
      "garden",
      "dragon",
      "dawn",
      "six-lamp",
    ]);
    expect(FANTASY_STORY_CHAPTERS.map((chapter) => chapter.number)).toEqual(["I", "II", "III", "IV", "V", "VI", "VII", "VIII"]);
    expect(FANTASY_STORY_CHAPTERS[2].title).toMatch(/Cat/);
    expect(FANTASY_STORY_CHAPTERS[3].title).toMatch(/Runt/);
    expect(FANTASY_STORY_CHAPTERS.at(-1)?.title).toBe("The Six-Lamp Booth");
  });

  it("gives every chapter a timed beginning, turn, exit, and BUT/THEREFORE bridge", () => {
    for (const chapter of FANTASY_STORY_CHAPTERS) {
      expect(chapter.moments).toHaveLength(4);
      expect(chapter.moments[0].startsAt).toBe(0);
      expect(chapter.moments.map((moment) => moment.startsAt)).toEqual(
        [...chapter.moments].map((moment) => moment.startsAt).sort((left, right) => left - right),
      );
      expect(chapter.moments.at(-1)?.startsAt).toBeLessThan(chapter.durationMs);
      expect(chapter.bridge.but.split(/\s+/).length).toBeGreaterThanOrEqual(6);
      expect(chapter.bridge.therefore.split(/\s+/).length).toBeGreaterThanOrEqual(6);
      expect(chapter.art).toMatch(/^art\/signal-story-.+-v1\.webp$/);
      expect(chapter.alt.split(/\s+/).length).toBeGreaterThanOrEqual(12);
    }
  });

  it("selects authored moments at their boundaries and totals the whole serial", () => {
    const cat = FANTASY_STORY_CHAPTERS[2];
    expect(getFantasyStoryMoment(cat, 0).id).toBe("greenhouse");
    expect(getFantasyStoryMoment(cat, 6_799).id).toBe("greenhouse");
    expect(getFantasyStoryMoment(cat, 6_800).id).toBe("names");
    expect(getFantasyStoryMoment(cat, 20_700).id).toBe("runt");
    expect(FANTASY_STORY_DURATION_MS).toBe(FANTASY_STORY_CHAPTERS.reduce((total, chapter) => total + chapter.durationMs, 0));
  });
});
