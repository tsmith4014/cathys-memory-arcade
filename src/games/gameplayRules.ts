export type TokenTrailOutcome = "keepsake" | "golden" | "perfect";

export const TOKEN_TRAIL_TOTAL = 24;
export const TOKEN_TRAIL_GOLD_THRESHOLD = 18;
export const TOKEN_TRAIL_FINAL_TOKEN_X = 3430;
export const TOKEN_TRAIL_FINISH_X = 3438;
export const DRAGON_REQUIRED_DEFEATS = 3;

export type DragonIntent = "charge" | "guard" | "flank";

export type Rectangle = { x: number; y: number; width: number; height: number };
export type Bounds = { left: number; right: number; top: number; bottom: number };
export type GridCell = { column: number; row: number };

export function tokenTrailOutcome(collected: number): TokenTrailOutcome {
  if (collected >= TOKEN_TRAIL_TOTAL) return "perfect";
  if (collected >= TOKEN_TRAIL_GOLD_THRESHOLD) return "golden";
  return "keepsake";
}

export function restoreHealth(current: number, maximum: number, amount = 1): number {
  return Math.min(maximum, current + amount);
}

export function registerWardBlock(blockedContacts: Set<string>, contactId: string): boolean {
  if (blockedContacts.has(contactId)) return false;
  blockedContacts.add(contactId);
  return true;
}

export function dragonIntentFor(guardianIndex: number, beat: number): DragonIntent {
  const intents: DragonIntent[] = ["charge", "guard", "flank"];
  return intents[(guardianIndex * 2 + beat) % intents.length];
}

export function subdivideMovement(dx: number, dy: number, maximumStep: number): Array<{ x: number; y: number }> {
  const stepCount = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maximumStep));
  return Array.from({ length: stepCount }, () => ({ x: dx / stepCount, y: dy / stepCount }));
}

export function moveWithObstacles(
  entity: Rectangle,
  dx: number,
  dy: number,
  obstacles: Rectangle[],
  bounds: Bounds,
): Pick<Rectangle, "x" | "y"> {
  const overlaps = (candidate: Rectangle): boolean => obstacles.some((obstacle) => intersects(candidate, obstacle));
  const next = { ...entity };
  const nextX = clamp(entity.x + dx, bounds.left, bounds.right - entity.width);
  if (!overlaps({ ...next, x: nextX })) next.x = nextX;
  const nextY = clamp(entity.y + dy, bounds.top, bounds.bottom - entity.height);
  if (!overlaps({ ...next, y: nextY })) next.y = nextY;
  return { x: next.x, y: next.y };
}

export function nextGridStep(maze: boolean[][], start: GridCell, target: GridCell): GridCell {
  const key = (cell: GridCell): string => `${cell.column}:${cell.row}`;
  if (key(start) === key(target)) return start;
  const queue: GridCell[] = [start];
  const previous = new Map<string, GridCell | null>([[key(start), null]]);
  const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;

  while (queue.length) {
    const current = queue.shift()!;
    if (key(current) === key(target)) break;
    for (const [dx, dy] of directions) {
      const next = { column: current.column + dx, row: current.row + dy };
      const nextKey = key(next);
      if (next.row < 0 || next.row >= maze.length || next.column < 0 || next.column >= (maze[0]?.length ?? 0)) continue;
      if (maze[next.row][next.column] || previous.has(nextKey)) continue;
      previous.set(nextKey, current);
      queue.push(next);
    }
  }

  if (!previous.has(key(target))) return start;
  let step = target;
  let parent = previous.get(key(step));
  while (parent && key(parent) !== key(start)) {
    step = parent;
    parent = previous.get(key(step));
  }
  return step;
}

function intersects(first: Rectangle, second: Rectangle): boolean {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
