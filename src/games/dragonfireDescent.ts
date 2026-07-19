import {
  ArcadeSfx,
  burst,
  clamp,
  drawOverlay,
  drawParticles,
  drawPixelText,
  FrameLoop,
  GAME_HEIGHT,
  GAME_WIDTH,
  InputState,
  intersects,
  prepareCanvas,
  updateParticles,
  type GameController,
  type GameHud,
  type GameMountOptions,
  type GameStatus,
  type Particle,
} from "./runtime";

type Cell = { column: number; row: number };
type Guardian = { x: number; y: number; width: number; height: number; health: number; speed: number; flash: number; kind: "shade" | "knight" };
type Trap = { column: number; row: number; triggered: boolean; cooldown: number };

type DescentState = {
  player: {
    x: number;
    y: number;
    width: number;
    height: number;
    health: number;
    facingX: number;
    facingY: number;
    invulnerable: number;
    attack: number;
    attackCooldown: number;
    dash: number;
    dashCooldown: number;
  };
  maze: boolean[][];
  revealed: Set<string>;
  guardians: Guardian[];
  traps: Trap[];
  particles: Particle[];
  treasure: boolean;
  score: number;
  combo: number;
  comboTimer: number;
  time: number;
  shake: number;
  status: GameStatus;
};

const columns = 15;
const rows = 9;
const tile = 46;
const mapX = 135;
const mapY = 104;
const exitCell = { column: 1, row: 1 };
const hoardCell = { column: columns - 2, row: rows - 2 };

export function mountDragonfireDescent(canvas: HTMLCanvasElement, options: GameMountOptions): GameController {
  const context = prepareCanvas(canvas);
  const input = new InputState();
  const sound = new ArcadeSfx(options.soundEnabled);
  let state = createState();
  let lastHud = "";

  const emitHud = (): void => {
    const hud: GameHud = {
      score: state.score,
      status: state.status,
      message: state.status === "playing" ? `${state.treasure ? "hoard secured" : "find the hoard"} // ${state.player.health} light` : undefined,
    };
    const serialized = JSON.stringify(hud);
    if (serialized !== lastHud) {
      lastHud = serialized;
      options.onHud(hud);
    }
  };

  const restart = (): void => {
    state = createState();
    input.clear();
    lastHud = "";
    emitHud();
  };

  const togglePause = (): void => {
    if (state.status === "playing") state.status = "paused";
    else if (state.status === "paused") state.status = "playing";
    emitHud();
  };

  const hurt = (x: number, y: number): void => {
    if (state.player.invulnerable > 0) return;
    state.player.health -= 1;
    state.player.invulnerable = 1.1;
    state.shake = 10;
    const angle = Math.atan2(state.player.y - y, state.player.x - x);
    movePlayer(state, Math.cos(angle) * 32, Math.sin(angle) * 32);
    burst(state.particles, state.player.x + 14, state.player.y + 14, "#ff6f61", 22, 230);
    sound.noise(0.13, 0.075);
    sound.play(72, 0.22, "sawtooth", 0.09, 38);
  };

  const attack = (): void => {
    state.player.attack = 0.16;
    state.player.attackCooldown = 0.28;
    const centerX = state.player.x + state.player.width / 2;
    const centerY = state.player.y + state.player.height / 2;
    const strike = {
      x: centerX + state.player.facingX * 38 - 30,
      y: centerY + state.player.facingY * 38 - 30,
      width: 60,
      height: 60,
    };
    let hit = false;
    for (const guardian of state.guardians) {
      if (guardian.health <= 0 || !intersects(strike, guardian)) continue;
      guardian.health -= state.player.dash > 0 ? 3 : 1;
      guardian.flash = 0.12;
      state.combo += 1;
      state.comboTimer = 1.5;
      state.score += guardian.health <= 0 ? 500 * Math.max(1, state.combo) : 90 * Math.max(1, state.combo);
      state.shake = guardian.kind === "knight" ? 8 : 4;
      burst(state.particles, guardian.x + guardian.width / 2, guardian.y + guardian.height / 2, guardian.kind === "knight" ? "#ff6f61" : "#ef78ff", 18, 220);
      hit = true;
    }
    if (hit) {
      sound.noise(0.07, 0.04);
      sound.play(118, 0.15, "square", 0.075, 68);
    } else sound.play(280, 0.06, "triangle", 0.03, 210);
  };

  const update = (delta: number): void => {
    if (state.status !== "playing") return;
    state.time = Math.max(0, state.time - delta);
    state.player.invulnerable = Math.max(0, state.player.invulnerable - delta);
    state.player.attack = Math.max(0, state.player.attack - delta);
    state.player.attackCooldown = Math.max(0, state.player.attackCooldown - delta);
    state.player.dash = Math.max(0, state.player.dash - delta);
    state.player.dashCooldown = Math.max(0, state.player.dashCooldown - delta);
    state.comboTimer = Math.max(0, state.comboTimer - delta);
    state.shake = Math.max(0, state.shake - delta * 20);
    if (state.comboTimer <= 0) state.combo = 0;

    const horizontal = Number(input.down("arrowright", "d")) - Number(input.down("arrowleft", "a"));
    const vertical = Number(input.down("arrowdown", "s")) - Number(input.down("arrowup", "w"));
    if (horizontal || vertical) {
      const magnitude = Math.hypot(horizontal, vertical) || 1;
      state.player.facingX = horizontal / magnitude;
      state.player.facingY = vertical / magnitude;
    }
    if (input.take("space", "z") && state.player.attackCooldown <= 0) attack();
    if (input.take("shift", "x") && state.player.dashCooldown <= 0 && (horizontal || vertical)) {
      state.player.dash = 0.16;
      state.player.dashCooldown = 1;
      state.player.invulnerable = Math.max(state.player.invulnerable, 0.22);
      sound.play(360, 0.12, "sawtooth", 0.05, 540);
    }

    const magnitude = Math.hypot(horizontal, vertical) || 1;
    const speed = state.player.dash > 0 ? 620 : 205;
    movePlayer(state, (horizontal / magnitude) * speed * delta, (vertical / magnitude) * speed * delta);
    revealAroundPlayer(state);

    const playerCell = cellAt(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2);
    for (const trap of state.traps) {
      trap.cooldown = Math.max(0, trap.cooldown - delta);
      if (trap.column === playerCell.column && trap.row === playerCell.row && trap.cooldown <= 0) {
        trap.triggered = true;
        trap.cooldown = 1.5;
        hurt(trap.column * tile + tile / 2, trap.row * tile + tile / 2);
      }
    }

    for (const guardian of state.guardians) {
      if (guardian.health <= 0) continue;
      guardian.flash = Math.max(0, guardian.flash - delta);
      const guardianCell = cellAt(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2);
      if (!state.revealed.has(keyOf(guardianCell))) continue;
      const dx = state.player.x - guardian.x;
      const dy = state.player.y - guardian.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < 250) {
        const speedMultiplier = state.treasure ? 1.35 : 1;
        moveGuardian(state, guardian, (dx / distance) * guardian.speed * speedMultiplier * delta, (dy / distance) * guardian.speed * speedMultiplier * delta);
      }
      if (intersects(state.player, guardian)) hurt(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2);
    }
    state.guardians = state.guardians.filter((guardian) => guardian.health > 0);

    if (!state.treasure && playerCell.column === hoardCell.column && playerCell.row === hoardCell.row) {
      state.treasure = true;
      state.score += 2500;
      state.time += 22;
      burst(state.particles, state.player.x + 14, state.player.y + 14, "#ffbf57", 46, 300);
      sound.chord([196, 246.94, 293.66, 392], 0.4, "square", 0.055);
      for (const guardian of state.guardians) guardian.speed *= 1.15;
    }

    if (state.treasure && playerCell.column === exitCell.column && playerCell.row === exitCell.row) {
      state.score += Math.ceil(state.time) * 40 + state.player.health * 600;
      state.status = "won";
      sound.chord([261.63, 329.63, 392, 523.25], 0.55, "square", 0.06);
    } else if (state.player.health <= 0 || state.time <= 0) {
      state.status = "lost";
      sound.play(55, 0.65, "sawtooth", 0.1, 32);
    }

    updateParticles(state.particles, delta, 0);
    emitHud();
  };

  const render = (): void => {
    context.save();
    if (state.shake) context.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    drawBackdrop(context, state.time);
    context.save();
    context.translate(mapX, mapY);
    drawMaze(context, state);
    for (const trap of state.traps) drawTrap(context, trap, state.revealed);
    if (!state.treasure) drawHoard(context, state.revealed);
    drawExit(context, state.treasure, state.revealed);
    for (const guardian of state.guardians) drawGuardian(context, guardian, state.revealed);
    drawPlayer(context, state);
    drawFog(context, state.revealed);
    drawParticles(context, state.particles);
    context.restore();
    context.restore();

    context.fillStyle = "rgba(2,7,11,0.82)";
    context.fillRect(18, 18, 924, 54);
    drawPixelText(context, `SCORE ${String(state.score).padStart(6, "0")}`, 34, 33, 17, "#ffbf57");
    drawPixelText(context, state.treasure ? "RETURN TO DAWN GATE" : "FIND THE DRAGON CORE", 480, 33, 16, state.treasure ? "#8be58e" : "#ff6f61", "center");
    drawPixelText(context, `SUNSET ${Math.ceil(state.time)}`, 900, 33, 17, "#52e7ef", "right");
    if (state.combo > 1 && state.comboTimer > 0) drawPixelText(context, `${state.combo}X GUARDIAN CHAIN`, 480, 78, 14, "#ef78ff", "center");

    if (state.status === "paused") drawOverlay(context, "PAUSED", "THE CASTLE STILL BREATHES", "#52e7ef");
    if (state.status === "won") drawOverlay(context, "ESCAPED WITH THE HOARD", `FINAL SCORE ${state.score}`, "#ffbf57");
    if (state.status === "lost") drawOverlay(context, "THE SUN IS DOWN", state.treasure ? "THE EXIT WAS TOO FAR" : "THE HOARD REMAINS", "#ff6f61");
  };

  const loop = new FrameLoop((delta) => {
    update(delta);
    render();
  });
  emitHud();

  return {
    destroy: () => {
      loop.stop();
      sound.destroy();
      input.clear();
    },
    restart,
    setSoundEnabled: (enabled) => sound.setEnabled(enabled),
    setInput: (key, active) => {
      if (active && key.toLowerCase() === "r") restart();
      else if (active && key.toLowerCase() === "p") togglePause();
      else input.set(key, active);
    },
    togglePause,
  };
}

function createState(): DescentState {
  const maze = generateMaze();
  const openCells: Cell[] = [];
  for (let row = 1; row < rows - 1; row += 1) {
    for (let column = 1; column < columns - 1; column += 1) {
      if (!maze[row][column] && !(column === exitCell.column && row === exitCell.row) && !(column === hoardCell.column && row === hoardCell.row)) openCells.push({ column, row });
    }
  }
  const guardianCells = openCells.filter((_, index) => index % 7 === 3).slice(0, 9);
  const trapCells = openCells.filter((_, index) => index % 6 === 2).slice(0, 10);
  const start = centerOf(exitCell);
  const state: DescentState = {
    player: { x: start.x - 14, y: start.y - 14, width: 28, height: 28, health: 4, facingX: 1, facingY: 0, invulnerable: 0, attack: 0, attackCooldown: 0, dash: 0, dashCooldown: 0 },
    maze,
    revealed: new Set<string>(),
    guardians: guardianCells.map((cell, index) => {
      const center = centerOf(cell);
      const kind = index % 3 === 2 ? "knight" : "shade";
      return { x: center.x - (kind === "knight" ? 18 : 14), y: center.y - (kind === "knight" ? 18 : 14), width: kind === "knight" ? 36 : 28, height: kind === "knight" ? 36 : 28, health: kind === "knight" ? 4 : 2, speed: kind === "knight" ? 62 : 88, flash: 0, kind };
    }),
    traps: trapCells.map((cell) => ({ ...cell, triggered: false, cooldown: 0 })),
    particles: [],
    treasure: false,
    score: 0,
    combo: 0,
    comboTimer: 0,
    time: 102,
    shake: 0,
    status: "playing",
  };
  revealAroundPlayer(state);
  return state;
}

function generateMaze(): boolean[][] {
  const maze = Array.from({ length: rows }, () => Array.from({ length: columns }, () => true));
  let seed = 19860412;
  const random = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const stack: Cell[] = [{ column: 1, row: 1 }];
  maze[1][1] = false;
  while (stack.length) {
    const current = stack[stack.length - 1];
    const neighbors = [
      { column: current.column + 2, row: current.row },
      { column: current.column - 2, row: current.row },
      { column: current.column, row: current.row + 2 },
      { column: current.column, row: current.row - 2 },
    ].filter((cell) => cell.column > 0 && cell.column < columns - 1 && cell.row > 0 && cell.row < rows - 1 && maze[cell.row][cell.column]);
    if (!neighbors.length) {
      stack.pop();
      continue;
    }
    const next = neighbors[Math.floor(random() * neighbors.length)];
    maze[(current.row + next.row) / 2][(current.column + next.column) / 2] = false;
    maze[next.row][next.column] = false;
    stack.push(next);
  }
  maze[hoardCell.row][hoardCell.column] = false;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const column = 2 + Math.floor(random() * (columns - 4));
    const row = 2 + Math.floor(random() * (rows - 4));
    if ((column + row) % 2 === 1) maze[row][column] = false;
  }
  return maze;
}

function movePlayer(state: DescentState, dx: number, dy: number): void {
  const nextX = clamp(state.player.x + dx, tile + 3, columns * tile - tile - state.player.width - 3);
  if (!collidesWithMaze(state.maze, nextX, state.player.y, state.player.width, state.player.height)) state.player.x = nextX;
  const nextY = clamp(state.player.y + dy, tile + 3, rows * tile - tile - state.player.height - 3);
  if (!collidesWithMaze(state.maze, state.player.x, nextY, state.player.width, state.player.height)) state.player.y = nextY;
}

function moveGuardian(state: DescentState, guardian: Guardian, dx: number, dy: number): void {
  if (!collidesWithMaze(state.maze, guardian.x + dx, guardian.y, guardian.width, guardian.height)) guardian.x += dx;
  if (!collidesWithMaze(state.maze, guardian.x, guardian.y + dy, guardian.width, guardian.height)) guardian.y += dy;
}

function collidesWithMaze(maze: boolean[][], x: number, y: number, width: number, height: number): boolean {
  const left = Math.floor(x / tile);
  const right = Math.floor((x + width - 1) / tile);
  const top = Math.floor(y / tile);
  const bottom = Math.floor((y + height - 1) / tile);
  return maze[top]?.[left] || maze[top]?.[right] || maze[bottom]?.[left] || maze[bottom]?.[right] || false;
}

function revealAroundPlayer(state: DescentState): void {
  const center = cellAt(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2);
  for (let row = center.row - 2; row <= center.row + 2; row += 1) {
    for (let column = center.column - 2; column <= center.column + 2; column += 1) {
      if (row >= 0 && row < rows && column >= 0 && column < columns) state.revealed.add(keyOf({ column, row }));
    }
  }
}

function cellAt(x: number, y: number): Cell {
  return { column: Math.floor(x / tile), row: Math.floor(y / tile) };
}

function centerOf(cell: Cell): { x: number; y: number } {
  return { x: cell.column * tile + tile / 2, y: cell.row * tile + tile / 2 };
}

function keyOf(cell: Cell): string {
  return `${cell.column}:${cell.row}`;
}

function drawBackdrop(context: CanvasRenderingContext2D, time: number): void {
  const danger = clamp(1 - time / 102, 0, 1);
  const gradient = context.createRadialGradient(480, 285, 60, 480, 285, 540);
  gradient.addColorStop(0, `rgb(${Math.round(13 + danger * 35)}, 24, 39)`);
  gradient.addColorStop(1, "#020408");
  context.fillStyle = gradient;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawMaze(context: CanvasRenderingContext2D, state: DescentState): void {
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const wall = state.maze[row][column];
      context.fillStyle = wall ? "#13212a" : "#071018";
      context.fillRect(column * tile, row * tile, tile, tile);
      context.strokeStyle = wall ? "#263842" : "rgba(255,191,87,0.12)";
      context.strokeRect(column * tile + 1, row * tile + 1, tile - 2, tile - 2);
      if (wall) {
        context.fillStyle = "rgba(82,231,239,0.04)";
        context.fillRect(column * tile + 7, row * tile + 7, tile - 14, tile - 14);
      }
    }
  }
}

function drawTrap(context: CanvasRenderingContext2D, trap: Trap, revealed: Set<string>): void {
  if (!revealed.has(keyOf(trap))) return;
  const x = trap.column * tile;
  const y = trap.row * tile;
  context.fillStyle = trap.triggered ? "#ff6f61" : "#39272f";
  for (let offset = 8; offset < tile - 5; offset += 10) {
    context.beginPath();
    context.moveTo(x + offset, y + tile - 7);
    context.lineTo(x + offset + 5, y + (trap.triggered ? 7 : 28));
    context.lineTo(x + offset + 10, y + tile - 7);
    context.fill();
  }
}

function drawHoard(context: CanvasRenderingContext2D, revealed: Set<string>): void {
  if (!revealed.has(keyOf(hoardCell))) return;
  const center = centerOf(hoardCell);
  context.fillStyle = "rgba(255,191,87,0.22)";
  context.beginPath();
  context.arc(center.x, center.y, 27, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffbf57";
  context.fillRect(center.x - 13, center.y - 13, 26, 26);
  context.fillStyle = "#ff6f61";
  context.fillRect(center.x - 6, center.y - 6, 12, 12);
}

function drawExit(context: CanvasRenderingContext2D, treasure: boolean, revealed: Set<string>): void {
  if (!revealed.has(keyOf(exitCell))) return;
  const center = centerOf(exitCell);
  context.strokeStyle = treasure ? "#8be58e" : "#52e7ef";
  context.lineWidth = 4;
  context.strokeRect(center.x - 17, center.y - 17, 34, 34);
  context.fillStyle = treasure ? "rgba(139,229,142,0.25)" : "rgba(82,231,239,0.12)";
  context.fillRect(center.x - 12, center.y - 12, 24, 24);
}

function drawGuardian(context: CanvasRenderingContext2D, guardian: Guardian, revealed: Set<string>): void {
  const cell = cellAt(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2);
  if (!revealed.has(keyOf(cell))) return;
  const tone = guardian.kind === "knight" ? "#ff6f61" : "#ef78ff";
  context.fillStyle = guardian.flash > 0 ? "#eaf6f2" : "#0b1119";
  context.fillRect(guardian.x, guardian.y, guardian.width, guardian.height);
  context.strokeStyle = tone;
  context.lineWidth = guardian.kind === "knight" ? 4 : 2;
  context.strokeRect(guardian.x + 3, guardian.y + 3, guardian.width - 6, guardian.height - 6);
  context.fillStyle = tone;
  context.fillRect(guardian.x + guardian.width / 2 - 5, guardian.y + guardian.height / 2 - 5, 10, 10);
}

function drawPlayer(context: CanvasRenderingContext2D, state: DescentState): void {
  const player = state.player;
  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0) context.globalAlpha = 0.3;
  context.fillStyle = state.treasure ? "#ffbf57" : "#52e7ef";
  context.fillRect(player.x, player.y, player.width, player.height);
  context.fillStyle = "#07131f";
  context.fillRect(player.x + 6, player.y + 7, 5, 5);
  context.fillRect(player.x + 17, player.y + 7, 5, 5);
  if (player.attack > 0) {
    const centerX = player.x + player.width / 2 + player.facingX * 38;
    const centerY = player.y + player.height / 2 + player.facingY * 38;
    context.strokeStyle = "#eaf6f2";
    context.lineWidth = 7;
    context.beginPath();
    context.arc(centerX, centerY, 22, 0, Math.PI * 2);
    context.stroke();
  }
  context.globalAlpha = 1;
}

function drawFog(context: CanvasRenderingContext2D, revealed: Set<string>): void {
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (revealed.has(keyOf({ column, row }))) continue;
      context.fillStyle = "rgba(0,0,0,0.94)";
      context.fillRect(column * tile, row * tile, tile + 1, tile + 1);
    }
  }
}
