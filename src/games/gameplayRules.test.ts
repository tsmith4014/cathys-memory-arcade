import {
  DRAGON_REQUIRED_DEFEATS,
  TOKEN_TRAIL_FINAL_TOKEN_X,
  TOKEN_TRAIL_FINISH_X,
  dragonIntentFor,
  moveWithObstacles,
  nextGridStep,
  registerWardBlock,
  restoreHealth,
  subdivideMovement,
  tokenTrailOutcome,
} from "./gameplayRules";

describe("gameplay rules", () => {
  it("gives Token Trail three honest endings and places the finish beyond the final token", () => {
    expect(tokenTrailOutcome(7)).toBe("keepsake");
    expect(tokenTrailOutcome(18)).toBe("golden");
    expect(tokenTrailOutcome(23)).toBe("golden");
    expect(tokenTrailOutcome(24)).toBe("perfect");
    expect(TOKEN_TRAIL_FINISH_X).toBeGreaterThan(TOKEN_TRAIL_FINAL_TOKEN_X);
  });

  it("never heals above a cabinet's declared maximum", () => {
    expect(restoreHealth(4, 6)).toBe(5);
    expect(restoreHealth(6, 6)).toBe(6);
    expect(restoreHealth(3, 4, 2)).toBe(4);
  });

  it("rewards one ward block per contact instead of one per animation frame", () => {
    const contacts = new Set<string>();
    expect(registerWardBlock(contacts, "guardian-2")).toBe(true);
    expect(registerWardBlock(contacts, "guardian-2")).toBe(false);
    expect(registerWardBlock(contacts, "trap-4:5")).toBe(true);
    expect(contacts).toHaveLength(2);
  });

  it("cycles deterministic Dragon Beat intents and requires real engagement", () => {
    expect([0, 1, 2].map((beat) => dragonIntentFor(0, beat))).toEqual(["charge", "guard", "flank"]);
    expect([0, 1, 2].map((beat) => dragonIntentFor(1, beat))).toEqual(["flank", "charge", "guard"]);
    expect(DRAGON_REQUIRED_DEFEATS).toBe(3);
  });

  it("keeps obstacle-aware movement outside solid geometry", () => {
    const obstacle = { x: 40, y: 20, width: 20, height: 60 };
    expect(moveWithObstacles(
      { x: 10, y: 35, width: 20, height: 20 },
      35,
      0,
      [obstacle],
      { left: 0, right: 100, top: 0, bottom: 100 },
    )).toEqual({ x: 10, y: 35 });
  });

  it("finds the first open maze step toward a target", () => {
    const maze = [
      [true, true, true, true, true],
      [true, false, true, false, true],
      [true, false, true, false, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ];
    expect(nextGridStep(maze, { column: 1, row: 1 }, { column: 3, row: 1 })).toEqual({ column: 1, row: 2 });
  });

  it("subdivides large guardian lunges into wall-safe movement steps", () => {
    const steps = subdivideMovement(104, -52, 12);
    expect(Math.max(...steps.map((step) => Math.max(Math.abs(step.x), Math.abs(step.y))))).toBeLessThanOrEqual(12);
    expect(steps.reduce((total, step) => total + step.x, 0)).toBeCloseTo(104);
    expect(steps.reduce((total, step) => total + step.y, 0)).toBeCloseTo(-52);
  });
});
