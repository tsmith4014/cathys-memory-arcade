import { clamp, InputState, intersects } from "./runtime";
import { DRAGONFIRE_TUNING } from "./dragonfireDescent";

describe("arcade runtime", () => {
  it("normalizes held and one-shot controls", () => {
    const input = new InputState();
    input.set("ArrowLeft", true);
    input.set(" ", true);
    expect(input.down("arrowleft", "a")).toBe(true);
    expect(input.take("space")).toBe(true);
    expect(input.take("space")).toBe(false);
    input.set("ArrowLeft", false);
    expect(input.down("arrowleft")).toBe(false);
  });

  it("detects strict rectangle overlap", () => {
    expect(intersects(
      { x: 10, y: 10, width: 20, height: 20 },
      { x: 25, y: 25, width: 20, height: 20 },
    )).toBe(true);
    expect(intersects(
      { x: 10, y: 10, width: 20, height: 20 },
      { x: 30, y: 30, width: 20, height: 20 },
    )).toBe(false);
  });

  it("clamps game entities to arena bounds", () => {
    expect(clamp(-4, 0, 10)).toBe(0);
    expect(clamp(14, 0, 10)).toBe(10);
    expect(clamp(7, 0, 10)).toBe(7);
  });

  it("keeps the Dragonfire ward and route tuning explicit", () => {
    expect(DRAGONFIRE_TUNING.wardDuration).toBe(5);
    expect(DRAGONFIRE_TUNING.wardCooldown).toBe(10);
    expect(DRAGONFIRE_TUNING.boltSpeed).toBeGreaterThan(500);
    expect(DRAGONFIRE_TUNING.guardianCount).toBeLessThan(9);
    expect(DRAGONFIRE_TUNING.timeLimit).toBeGreaterThanOrEqual(150);
  });
});
