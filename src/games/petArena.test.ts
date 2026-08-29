import { PET_ARENA_TUNING, nearestEnemy } from "./petArena";

describe("Dragon Crew guest cabinet", () => {
  it("auto-locks onto the nearest hostile", () => {
    const near = { id: 1, kind: "wisp" as const, x: 8, y: 6, radius: 12, health: 2, maxHealth: 2, speed: 90, attackCooldown: 0, flash: 0, phase: 0 };
    const far = { ...near, id: 2, x: 120, y: 80 };

    expect(nearestEnemy({ x: 0, y: 0 }, [far, near])).toBe(near);
    expect(nearestEnemy({ x: 0, y: 0 }, [])).toBeNull();
  });

  it("keeps the opening wave lighter than the finale", () => {
    expect(PET_ARENA_TUNING.waves).toHaveLength(3);
    expect(PET_ARENA_TUNING.waves[0]).toBeLessThanOrEqual(PET_ARENA_TUNING.waves[1]);
    expect(PET_ARENA_TUNING.wardDuration).toBeLessThan(PET_ARENA_TUNING.wardCooldown);
  });
});
