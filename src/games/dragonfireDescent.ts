import {
  ArcadeSfx,
  burst,
  clamp,
  drawGameBackdrop,
  drawOverlay,
  drawParticles,
  drawPixelText,
  drawScreenFinish,
  FrameLoop,
  GAME_HEIGHT,
  GAME_WIDTH,
  InputState,
  intersects,
  loadGameBackdrop,
  prepareCanvas,
  updateParticles,
  type GameController,
  type GameHud,
  type GameMountOptions,
  type GameStatus,
  type Particle,
} from "./runtime";
import {
  DRAGON_REQUIRED_DEFEATS,
  dragonIntentFor,
  nextGridStep,
  registerWardBlock,
  subdivideMovement,
  type DragonIntent,
} from "./gameplayRules";

type Cell = { column: number; row: number };
type Guardian = {
  id: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  speed: number;
  flash: number;
  recoilX: number;
  recoilY: number;
  kind: "shade" | "knight";
  intent: DragonIntent | null;
  intentTimer: number;
  actionCooldown: number;
  beat: number;
  targetX: number;
  targetY: number;
  shield: number;
  stunned: number;
  engaged: boolean;
};
type Trap = { id: string; column: number; row: number; triggered: boolean; cooldown: number };
type PlayerBolt = {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  vx: number;
  vy: number;
  life: number;
};

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
    fireCooldown: number;
    ward: number;
    wardCooldown: number;
  };
  maze: boolean[][];
  revealed: Set<string>;
  guardians: Guardian[];
  traps: Trap[];
  bolts: PlayerBolt[];
  particles: Particle[];
  treasure: boolean;
  defeated: number;
  blockedWardContacts: Set<string>;
  dialogue: { speaker: string; text: string; timer: number } | null;
  encounterBeatShown: boolean;
  returnBeatShown: boolean;
  coreDenied: number;
  score: number;
  combo: number;
  comboTimer: number;
  time: number;
  elapsed: number;
  shake: number;
  status: GameStatus;
};

export const DRAGONFIRE_TUNING = {
  wardDuration: 5,
  wardCooldown: 10,
  timeLimit: 180,
  boltSpeed: 560,
  guardianCount: DRAGON_REQUIRED_DEFEATS,
  trapCount: 4,
  revealRadius: 4,
} as const;

const maximumLight = 6;

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
  const backdrop = loadGameBackdrop("dragonfire-descent-backdrop-v3.webp");
  let state = createState();
  let lastHud = "";

  const emitHud = (): void => {
    const wardMessage = state.player.ward > 0
      ? `ward ${state.player.ward.toFixed(1)}s`
      : state.player.wardCooldown <= 0
        ? "ward ready"
        : `ward ${state.player.wardCooldown.toFixed(1)}s`;
    const hud: GameHud = {
      score: state.score,
      status: state.status,
      message: state.status === "playing"
        ? `${state.treasure ? "core secured // follow dawn" : state.defeated < DRAGON_REQUIRED_DEFEATS ? `${state.defeated}/${DRAGON_REQUIRED_DEFEATS} seals broken` : "the core is open"} // ${state.player.health} light // ${wardMessage}`
        : undefined,
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

  const hurt = (x: number, y: number, contactId: string): void => {
    if (state.player.ward > 0) {
      if (registerWardBlock(state.blockedWardContacts, contactId)) {
        state.score += 25;
        burst(state.particles, state.player.x + 14, state.player.y + 14, "#52e7ef", 9, 150);
        sound.play(610, 0.08, "sine", 0.04, 820);
      }
      return;
    }
    if (state.player.invulnerable > 0) return;
    state.player.health -= 1;
    state.player.invulnerable = 2.1;
    state.shake = 9;
    const angle = Math.atan2(state.player.y - y, state.player.x - x);
    movePlayer(state, Math.cos(angle) * 26, Math.sin(angle) * 26);
    burst(state.particles, state.player.x + 14, state.player.y + 14, "#ff6f61", 22, 230);
    sound.noise(0.13, 0.075);
    sound.play(72, 0.22, "sawtooth", 0.09, 38);
  };

  const fireBolt = (): void => {
    const centerX = state.player.x + state.player.width / 2;
    const centerY = state.player.y + state.player.height / 2;
    const magnitude = Math.hypot(state.player.facingX, state.player.facingY) || 1;
    const directionX = state.player.facingX / magnitude;
    const directionY = state.player.facingY / magnitude;
    const x = centerX + directionX * 24;
    const y = centerY + directionY * 24;
    state.player.fireCooldown = 0.2;
    state.bolts.push({
      x,
      y,
      previousX: centerX,
      previousY: centerY,
      vx: directionX * DRAGONFIRE_TUNING.boltSpeed,
      vy: directionY * DRAGONFIRE_TUNING.boltSpeed,
      life: 1,
    });
    sound.play(330, 0.1, "sawtooth", 0.045, 690);
  };

  const activateWard = (): void => {
    state.player.ward = DRAGONFIRE_TUNING.wardDuration;
    state.player.wardCooldown = DRAGONFIRE_TUNING.wardCooldown;
    state.player.invulnerable = Math.max(state.player.invulnerable, DRAGONFIRE_TUNING.wardDuration);
    state.blockedWardContacts.clear();
    burst(state.particles, state.player.x + 14, state.player.y + 14, "#52e7ef", 34, 245);
    sound.chord([196, 293.66, 440, 587.33], 0.35, "sine", 0.05);
  };

  const hitGuardian = (guardian: Guardian, bolt: PlayerBolt): void => {
    guardian.engaged = true;
    if (guardian.beat === 0 && !guardian.intent) {
      guardian.flash = 0.14;
      guardian.actionCooldown = 0;
      state.score += 10;
      burst(state.particles, bolt.x, bolt.y, "#52e7ef", 8, 120);
      sound.play(540, 0.07, "triangle", 0.035, 330);
      return;
    }
    if (guardian.shield > 0 || (guardian.intent === "guard" && guardian.intentTimer > 0)) {
      guardian.flash = 0.12;
      guardian.actionCooldown = Math.max(guardian.actionCooldown, 0.45);
      state.score += 20;
      burst(state.particles, bolt.x, bolt.y, "#ffbf57", 10, 145);
      sound.play(820, 0.07, "triangle", 0.035, 410);
      return;
    }
    const interruptedCharge = guardian.intent === "charge" && guardian.intentTimer > 0;
    guardian.health -= interruptedCharge ? 2 : 1;
    guardian.flash = 0.16;
    guardian.recoilX = bolt.vx * 0.055;
    guardian.recoilY = bolt.vy * 0.055;
    state.combo += 1;
    state.comboTimer = 1.8;
    state.score += guardian.health <= 0 ? 650 * Math.max(1, state.combo) : (interruptedCharge ? 300 : 125) * Math.max(1, state.combo);
    if (interruptedCharge) {
      guardian.intent = null;
      guardian.stunned = 0.8;
      guardian.actionCooldown = 1.2;
      speak(state, "ROOK", "Nice interruption. Even ancient knights dislike being cut off mid-speech.", 3.2);
    }
    if (guardian.health <= 0) {
      state.defeated += 1;
      state.player.health = Math.min(maximumLight, state.player.health + 1);
      if (state.defeated === DRAGON_REQUIRED_DEFEATS) {
        speak(state, "ROOK", "Three seals down. The lock has reconsidered its career choices.", 4.2);
      } else {
        speak(state, "ROOK", "Seal broken. Take the light it dropped; we have another bad idea ahead.", 3.5);
      }
    }
    state.shake = guardian.kind === "knight" ? 6 : 3;
    burst(
      state.particles,
      guardian.x + guardian.width / 2,
      guardian.y + guardian.height / 2,
      guardian.kind === "knight" ? "#ff6f61" : "#ef78ff",
      guardian.health <= 0 ? 28 : 15,
      guardian.health <= 0 ? 280 : 190,
    );
    sound.play(guardian.health <= 0 ? 98 : 145, 0.14, "square", 0.065, 62);
  };

  const beginDragonBeat = (guardian: Guardian): void => {
    guardian.intent = dragonIntentFor(guardian.index, guardian.beat);
    guardian.beat += 1;
    guardian.intentTimer = guardian.intent === "guard" ? 1.35 : 1.15;
    guardian.targetX = state.player.x + state.player.width / 2;
    guardian.targetY = state.player.y + state.player.height / 2;
    guardian.actionCooldown = 1.3;
    if (!state.encounterBeatShown) {
      state.encounterBeatShown = true;
      speak(state, "ROOK", "Red charge: shoot. Gold guard: wait. Cyan flank: move. Very sporting of it to announce everything.", 5.2);
    }
    sound.play(guardian.intent === "charge" ? 130 : guardian.intent === "guard" ? 240 : 360, 0.16, "sawtooth", 0.04, 92);
  };

  const resolveDragonBeat = (guardian: Guardian): void => {
    if (guardian.intent === "charge") {
      const dx = guardian.targetX - (guardian.x + guardian.width / 2);
      const dy = guardian.targetY - (guardian.y + guardian.height / 2);
      const magnitude = Math.hypot(dx, dy) || 1;
      moveGuardian(state, guardian, (dx / magnitude) * 104, (dy / magnitude) * 104);
      if (intersects(state.player, guardian)) hurt(guardian.x, guardian.y, `${guardian.id}:charge:${guardian.beat}`);
    } else if (guardian.intent === "guard") {
      guardian.shield = 1.25;
    } else if (guardian.intent === "flank") {
      const dx = state.player.x - guardian.x;
      const dy = state.player.y - guardian.y;
      const magnitude = Math.hypot(dx, dy) || 1;
      const side = guardian.index % 2 ? 1 : -1;
      moveGuardian(state, guardian, (-dy / magnitude) * 58 * side, (dx / magnitude) * 58 * side);
    }
    guardian.intent = null;
    guardian.intentTimer = 0;
    guardian.actionCooldown = Math.max(guardian.actionCooldown, 1.1);
  };

  const updateBolts = (delta: number): void => {
    for (const bolt of state.bolts) {
      bolt.previousX = bolt.x;
      bolt.previousY = bolt.y;
      bolt.x += bolt.vx * delta;
      bolt.y += bolt.vy * delta;
      bolt.life -= delta;
      const cell = cellAt(bolt.x, bolt.y);
      if (state.maze[cell.row]?.[cell.column]) {
        bolt.life = 0;
        burst(state.particles, bolt.x, bolt.y, "#52e7ef", 8, 110);
        sound.play(760, 0.05, "triangle", 0.025, 420);
        continue;
      }
      for (const guardian of state.guardians) {
        if (guardian.health <= 0 || !intersects({ x: bolt.x - 7, y: bolt.y - 7, width: 14, height: 14 }, guardian)) continue;
        hitGuardian(guardian, bolt);
        bolt.life = 0;
        break;
      }
    }
    state.bolts = state.bolts.filter((bolt) => bolt.life > 0);
  };

  const update = (delta: number): void => {
    if (state.status !== "playing") return;
    state.elapsed += delta;
    state.time = Math.max(0, state.time - delta);
    state.player.invulnerable = Math.max(0, state.player.invulnerable - delta);
    state.player.fireCooldown = Math.max(0, state.player.fireCooldown - delta);
    state.player.ward = Math.max(0, state.player.ward - delta);
    state.player.wardCooldown = Math.max(0, state.player.wardCooldown - delta);
    state.coreDenied = Math.max(0, state.coreDenied - delta);
    if (state.dialogue) {
      state.dialogue.timer -= delta;
      if (state.dialogue.timer <= 0) state.dialogue = null;
    }
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
    if (input.down("space", "z") && state.player.fireCooldown <= 0) fireBolt();
    if (input.take("shift", "x") && state.player.wardCooldown <= 0) activateWard();

    const magnitude = Math.hypot(horizontal, vertical) || 1;
    const wardBoost = state.player.ward > 0 ? 1.16 : 1;
    movePlayer(state, (horizontal / magnitude) * 218 * wardBoost * delta, (vertical / magnitude) * 218 * wardBoost * delta);
    revealAroundPlayer(state);
    updateBolts(delta);

    const playerCell = cellAt(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2);
    for (const trap of state.traps) {
      trap.cooldown = Math.max(0, trap.cooldown - delta);
      if (trap.column === playerCell.column && trap.row === playerCell.row && trap.cooldown <= 0) {
        trap.triggered = true;
        trap.cooldown = 2.2;
        hurt(trap.column * tile + tile / 2, trap.row * tile + tile / 2, trap.id);
      }
    }

    for (const guardian of state.guardians) {
      if (guardian.health <= 0) continue;
      guardian.flash = Math.max(0, guardian.flash - delta);
      guardian.shield = Math.max(0, guardian.shield - delta);
      guardian.stunned = Math.max(0, guardian.stunned - delta);
      guardian.actionCooldown = Math.max(0, guardian.actionCooldown - delta);
      if (Math.abs(guardian.recoilX) > 0.5 || Math.abs(guardian.recoilY) > 0.5) {
        moveGuardian(state, guardian, guardian.recoilX * delta, guardian.recoilY * delta);
        guardian.recoilX *= Math.pow(0.001, delta);
        guardian.recoilY *= Math.pow(0.001, delta);
      }
      const guardianCell = cellAt(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2);
      const dx = state.player.x - guardian.x;
      const dy = state.player.y - guardian.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (!guardian.engaged && state.revealed.has(keyOf(guardianCell)) && distance < 280) guardian.engaged = true;
      if (!guardian.engaged || guardian.stunned > 0) continue;
      if (guardian.intent) {
        guardian.intentTimer = Math.max(0, guardian.intentTimer - delta);
        if (guardian.intentTimer <= 0) resolveDragonBeat(guardian);
      } else if (guardian.actionCooldown <= 0 && distance < 190) {
        beginDragonBeat(guardian);
      } else if (distance < 330) {
        const speedMultiplier = state.treasure ? 1.1 : 1;
        moveGuardianAlongMaze(state, guardian, guardian.speed * speedMultiplier * delta);
      }
      if (intersects(state.player, guardian)) hurt(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2, guardian.id);
    }
    state.guardians = state.guardians.filter((guardian) => guardian.health > 0);

    if (!state.treasure && playerCell.column === hoardCell.column && playerCell.row === hoardCell.row) {
      if (state.defeated >= DRAGON_REQUIRED_DEFEATS) {
        state.treasure = true;
        state.score += 3000;
        state.time += 18;
        speak(state, "ROOK", "There it is: a sunrise with terrible indoor manners. Let us take it outside.", 5);
        burst(state.particles, state.player.x + 14, state.player.y + 14, "#ffbf57", 52, 310);
        sound.chord([196, 246.94, 293.66, 392], 0.48, "square", 0.055);
      } else if (state.coreDenied <= 0) {
        state.coreDenied = 2.5;
        speak(state, "ROOK", `${DRAGON_REQUIRED_DEFEATS - state.defeated} seal${DRAGON_REQUIRED_DEFEATS - state.defeated === 1 ? "" : "s"} still lit. The core is stubborn, not subtle.`, 3.8);
      }
    }

    const distanceHome = Math.abs(playerCell.column - exitCell.column) + Math.abs(playerCell.row - exitCell.row);
    if (state.treasure && distanceHome <= 4 && !state.returnBeatShown) {
      state.returnBeatShown = true;
      speak(state, "ROOK", "Home is close. Naturally, this is when the floor gets opinions.", 4.2);
    }

    if (state.treasure && playerCell.column === exitCell.column && playerCell.row === exitCell.row) {
      state.score += Math.ceil(state.time) * 40 + state.player.health * 700;
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
    drawBackdrop(context, state, backdrop);
    context.save();
    context.translate(mapX, mapY);
    drawMaze(context, state);
    drawFog(context, state);
    for (const trap of state.traps) drawTrap(context, trap, state.revealed);
    if (!state.treasure) drawHoard(context, state.revealed, state.elapsed, state.defeated);
    drawExit(context, state.treasure, state.revealed, state.elapsed);
    for (const guardian of state.guardians) drawGuardian(context, guardian, state.revealed);
    drawBolts(context, state.bolts);
    drawPlayer(context, state);
    if (state.treasure) drawHomeCompass(context, state);
    drawParticles(context, state.particles);
    context.restore();
    context.restore();
    drawScreenFinish(context, "#ff6f61");
    if (state.dialogue) drawDialogue(context, state.dialogue);

    context.fillStyle = "rgba(2,7,11,0.78)";
    context.fillRect(18, 18, 924, 58);
    drawPixelText(context, `SCORE ${String(state.score).padStart(6, "0")}`, 34, 33, 17, "#ffbf57");
    const mission = state.treasure
      ? "FOLLOW THE DAWN SIGNAL"
      : state.defeated < DRAGON_REQUIRED_DEFEATS
        ? `BREAK THE CORE SEALS ${state.defeated}/${DRAGON_REQUIRED_DEFEATS}`
        : "THE CORE CHAMBER IS OPEN";
    drawPixelText(context, mission, 480, 33, 16, state.treasure ? "#8be58e" : state.defeated >= DRAGON_REQUIRED_DEFEATS ? "#ffbf57" : "#ff6f61", "center");
    drawPixelText(context, `TIME ${Math.ceil(state.time)}`, 900, 33, 17, "#52e7ef", "right");
    const wardCopy = state.player.ward > 0
      ? `WARD ACTIVE ${state.player.ward.toFixed(1)}S`
      : state.player.wardCooldown <= 0
        ? "WARD READY // SHIFT"
        : `WARD RECHARGE ${state.player.wardCooldown.toFixed(1)}S`;
    drawPixelText(context, wardCopy, 34, 82, 13, state.player.ward > 0 ? "#eaf6f2" : state.player.wardCooldown <= 0 ? "#52e7ef" : "#708990");
    drawPixelText(context, `LIGHT ${"<".repeat(state.player.health)}${".".repeat(maximumLight - state.player.health)}`, 900, 82, 13, state.player.health > 2 ? "#8be58e" : "#ff6f61", "right");
    if (state.combo > 1 && state.comboTimer > 0) drawPixelText(context, `${state.combo}X BOLT CHAIN`, 480, 82, 14, "#ef78ff", "center");
    drawActiveDragonBeat(context, state.guardians);

    if (state.status === "paused") drawOverlay(context, "PAUSED", "THE CITADEL IS HOLDING ITS BREATH", "#52e7ef");
    if (state.status === "won") drawOverlay(context, "CORE RETURNED TO DAWN", `FINAL SCORE ${state.score}`, "#ffbf57");
    if (state.status === "lost") drawOverlay(context, "THE LIGHT WENT OUT", state.treasure ? "THE DAWN GATE WAS CLOSE" : `${state.defeated}/${DRAGON_REQUIRED_DEFEATS} SEALS BROKEN`, "#ff6f61");
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
      const distanceFromStart = Math.abs(column - exitCell.column) + Math.abs(row - exitCell.row);
      if (
        !maze[row][column]
        && distanceFromStart > 3
        && !(column === hoardCell.column && row === hoardCell.row)
      ) openCells.push({ column, row });
    }
  }
  const guardianCells = openCells.filter((_, index) => index % 8 === 3).slice(0, DRAGONFIRE_TUNING.guardianCount);
  const occupied = new Set(guardianCells.map(keyOf));
  const trapCells = openCells.filter((cell, index) => index % 9 === 5 && !occupied.has(keyOf(cell))).slice(0, DRAGONFIRE_TUNING.trapCount);
  for (const cell of openCells) {
    if (trapCells.length >= DRAGONFIRE_TUNING.trapCount) break;
    if (!occupied.has(keyOf(cell)) && !trapCells.some((trap) => keyOf(trap) === keyOf(cell))) trapCells.push(cell);
  }
  const start = centerOf(exitCell);
  const state: DescentState = {
    player: {
      x: start.x - 14,
      y: start.y - 14,
      width: 28,
      height: 28,
      health: maximumLight,
      facingX: 1,
      facingY: 0,
      invulnerable: 0,
      fireCooldown: 0,
      ward: 0,
      wardCooldown: 0,
    },
    maze,
    revealed: new Set<string>(),
    guardians: guardianCells.map((cell, index) => {
      const center = centerOf(cell);
      const kind = index % 3 === 2 ? "knight" : "shade";
      return {
        id: `guardian-${index}`,
        index,
        x: center.x - (kind === "knight" ? 18 : 14),
        y: center.y - (kind === "knight" ? 18 : 14),
        width: kind === "knight" ? 36 : 28,
        height: kind === "knight" ? 36 : 28,
        health: kind === "knight" ? 3 : 2,
        speed: kind === "knight" ? 50 : 68,
        flash: 0,
        recoilX: 0,
        recoilY: 0,
        kind,
        intent: null,
        intentTimer: 0,
        actionCooldown: 1.35 + index * 0.2,
        beat: 0,
        targetX: center.x,
        targetY: center.y,
        shield: 0,
        stunned: 0,
        engaged: false,
      };
    }),
    traps: trapCells.map((cell) => ({ ...cell, id: `trap-${cell.column}:${cell.row}`, triggered: false, cooldown: 0 })),
    bolts: [],
    particles: [],
    treasure: false,
    defeated: 0,
    blockedWardContacts: new Set<string>(),
    dialogue: { speaker: "ROOK", text: "Three guardians chained the dawn-core. They seemed very proud of the lock.", timer: 5 },
    encounterBeatShown: false,
    returnBeatShown: false,
    coreDenied: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    time: DRAGONFIRE_TUNING.timeLimit,
    elapsed: 0,
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
  for (let attempt = 0; attempt < 10; attempt += 1) {
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
  for (const step of subdivideMovement(dx, dy, tile / 4)) {
    if (!collidesWithMaze(state.maze, guardian.x + step.x, guardian.y, guardian.width, guardian.height)) guardian.x += step.x;
    if (!collidesWithMaze(state.maze, guardian.x, guardian.y + step.y, guardian.width, guardian.height)) guardian.y += step.y;
  }
}

function moveGuardianAlongMaze(state: DescentState, guardian: Guardian, distance: number): void {
  const current = cellAt(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2);
  const target = cellAt(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2);
  const step = nextGridStep(state.maze, current, target);
  const destination = centerOf(step);
  const dx = destination.x - (guardian.x + guardian.width / 2);
  const dy = destination.y - (guardian.y + guardian.height / 2);
  const magnitude = Math.hypot(dx, dy) || 1;
  moveGuardian(state, guardian, (dx / magnitude) * distance, (dy / magnitude) * distance);
}

function speak(state: DescentState, speaker: string, text: string, timer: number): void {
  state.dialogue = { speaker, text, timer };
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
  for (let row = center.row - DRAGONFIRE_TUNING.revealRadius; row <= center.row + DRAGONFIRE_TUNING.revealRadius; row += 1) {
    for (let column = center.column - DRAGONFIRE_TUNING.revealRadius; column <= center.column + DRAGONFIRE_TUNING.revealRadius; column += 1) {
      const distance = Math.abs(column - center.column) + Math.abs(row - center.row);
      if (distance <= DRAGONFIRE_TUNING.revealRadius && row >= 0 && row < rows && column >= 0 && column < columns) {
        state.revealed.add(keyOf({ column, row }));
      }
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

function drawBackdrop(context: CanvasRenderingContext2D, state: DescentState, backdrop: HTMLImageElement): void {
  const danger = clamp(1 - state.time / DRAGONFIRE_TUNING.timeLimit, 0, 1);
  const gradient = context.createRadialGradient(480, 285, 60, 480, 285, 540);
  gradient.addColorStop(0, `rgb(${Math.round(10 + danger * 28)}, 20, 33)`);
  gradient.addColorStop(1, "#020408");
  context.fillStyle = gradient;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const drift = Math.sin(state.elapsed * 0.08) * 0.28;
  drawGameBackdrop(context, backdrop, 0.92, drift);
  const atmosphere = context.createLinearGradient(0, 0, GAME_WIDTH, 0);
  atmosphere.addColorStop(0, `rgba(82,231,239,${0.08 + Math.sin(state.elapsed * 0.9) * 0.018})`);
  atmosphere.addColorStop(0.46, "rgba(2,4,8,0.08)");
  atmosphere.addColorStop(1, `rgba(255,74,42,${0.08 + danger * 0.1})`);
  context.fillStyle = atmosphere;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.fillStyle = "rgba(255, 151, 73, 0.55)";
  for (let index = 0; index < 24; index += 1) {
    const x = (index * 97 + state.elapsed * (7 + index % 4)) % GAME_WIDTH;
    const y = 95 + ((index * 67 - state.elapsed * (11 + index % 5)) % 390 + 390) % 390;
    const size = 1 + (index % 3);
    context.globalAlpha = 0.22 + (index % 4) * 0.08;
    context.fillRect(x, y, size, size);
  }
  context.globalAlpha = 1;
  const floorLight = context.createLinearGradient(0, 300, 0, GAME_HEIGHT);
  floorLight.addColorStop(0, "rgba(255,151,73,0)");
  floorLight.addColorStop(1, "rgba(255,151,73,0.12)");
  context.fillStyle = floorLight;
  context.beginPath();
  context.moveTo(360, 285);
  context.lineTo(600, 285);
  context.lineTo(820, GAME_HEIGHT);
  context.lineTo(140, GAME_HEIGHT);
  context.closePath();
  context.fill();
  for (const side of [-1, 1]) {
    const x = side < 0 ? 68 : GAME_WIDTH - 102;
    context.fillStyle = "rgba(3,8,13,0.72)";
    context.fillRect(x, 88, 34, 388);
    context.fillStyle = side < 0 ? "rgba(82,231,239,0.1)" : "rgba(255,111,97,0.11)";
    context.fillRect(x + (side < 0 ? 26 : 0), 88, 8, 388);
  }
}

function drawMaze(context: CanvasRenderingContext2D, state: DescentState): void {
  context.fillStyle = "rgba(3, 8, 12, 0.07)";
  context.fillRect(0, 0, columns * tile, rows * tile);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (!state.maze[row][column]) continue;
      const visible = [
        { column, row },
        { column: column + 1, row },
        { column: column - 1, row },
        { column, row: row + 1 },
        { column, row: row - 1 },
      ].some((cell) => state.revealed.has(keyOf(cell)));
      if (!visible) continue;
      const x = column * tile;
      const y = row * tile;
      const northOpen = row > 0 && !state.maze[row - 1][column];
      const westOpen = column > 0 && !state.maze[row][column - 1];
      context.fillStyle = "rgba(8, 17, 23, 0.58)";
      context.fillRect(x + 3, y + 7, tile - 5, tile - 7);
      context.fillStyle = "rgba(38, 54, 59, 0.58)";
      context.beginPath();
      context.moveTo(x + 3, y + 7);
      context.lineTo(x + 10, y);
      context.lineTo(x + tile, y);
      context.lineTo(x + tile - 2, y + 7);
      context.closePath();
      context.fill();
      context.fillStyle = "rgba(1, 5, 8, 0.52)";
      context.beginPath();
      context.moveTo(x + tile - 2, y + 7);
      context.lineTo(x + tile, y);
      context.lineTo(x + tile, y + tile - 8);
      context.lineTo(x + tile - 2, y + tile);
      context.closePath();
      context.fill();
      if (northOpen) {
        context.fillStyle = "rgba(82, 231, 239, 0.14)";
        context.fillRect(x + 5, y, tile - 10, 3);
      }
      if (westOpen) {
        context.fillStyle = "rgba(255, 111, 97, 0.1)";
        context.fillRect(x, y + 5, 3, tile - 10);
      }
      if ((row * 7 + column * 11) % 5 === 0) {
        context.strokeStyle = "rgba(180, 205, 207, 0.09)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x + 9, y + 13);
        context.lineTo(x + 19, y + 22);
        context.lineTo(x + 13, y + 34);
        context.stroke();
      }
    }
  }
}

function drawTrap(context: CanvasRenderingContext2D, trap: Trap, revealed: Set<string>): void {
  if (!revealed.has(keyOf(trap))) return;
  const x = trap.column * tile;
  const y = trap.row * tile;
  context.fillStyle = trap.triggered && trap.cooldown > 1.45 ? "#ff6f61" : "rgba(107, 61, 66, 0.62)";
  for (let offset = 8; offset < tile - 5; offset += 10) {
    context.beginPath();
    context.moveTo(x + offset, y + tile - 7);
    context.lineTo(x + offset + 5, y + (trap.triggered ? 7 : 29));
    context.lineTo(x + offset + 10, y + tile - 7);
    context.fill();
  }
}

function drawHoard(context: CanvasRenderingContext2D, revealed: Set<string>, elapsed: number, defeated: number): void {
  if (!revealed.has(keyOf(hoardCell))) return;
  const center = centerOf(hoardCell);
  const pulse = 30 + Math.sin(elapsed * 4) * 6;
  const glow = context.createRadialGradient(center.x, center.y, 2, center.x, center.y, pulse);
  glow.addColorStop(0, "rgba(255, 238, 174, 0.96)");
  glow.addColorStop(0.28, "rgba(255, 191, 87, 0.72)");
  glow.addColorStop(1, "rgba(255, 111, 97, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(center.x, center.y, pulse, 0, Math.PI * 2);
  context.fill();
  context.save();
  context.translate(center.x, center.y);
  context.rotate(elapsed * 0.7);
  context.fillStyle = "#ffbf57";
  context.beginPath();
  context.moveTo(0, -15);
  context.lineTo(12, 0);
  context.lineTo(0, 15);
  context.lineTo(-12, 0);
  context.closePath();
  context.fill();
  context.fillStyle = "#ff6f61";
  context.fillRect(-5, -5, 10, 10);
  if (defeated < DRAGON_REQUIRED_DEFEATS) {
    context.strokeStyle = "rgba(255,111,97,0.88)";
    context.lineWidth = 3;
    for (let seal = 0; seal < DRAGON_REQUIRED_DEFEATS - defeated; seal += 1) {
      context.beginPath();
      context.arc(0, 0, 24 + seal * 7, elapsed * 0.4 + seal, Math.PI * 1.35 + elapsed * 0.4 + seal);
      context.stroke();
    }
  }
  context.restore();
}

function drawExit(context: CanvasRenderingContext2D, treasure: boolean, revealed: Set<string>, elapsed: number): void {
  if (!revealed.has(keyOf(exitCell))) return;
  const center = centerOf(exitCell);
  const radius = 19 + Math.sin(elapsed * 3.2) * 3;
  context.strokeStyle = treasure ? "#8be58e" : "#52e7ef";
  context.lineWidth = treasure ? 5 : 3;
  context.beginPath();
  context.arc(center.x, center.y, radius, -Math.PI * 0.85, Math.PI * 0.85);
  context.stroke();
  context.fillStyle = treasure ? "rgba(139,229,142,0.28)" : "rgba(82,231,239,0.12)";
  context.beginPath();
  context.arc(center.x, center.y, 13, 0, Math.PI * 2);
  context.fill();
}

function drawGuardian(context: CanvasRenderingContext2D, guardian: Guardian, revealed: Set<string>): void {
  const cell = cellAt(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2);
  if (!revealed.has(keyOf(cell))) return;
  const tone = guardian.kind === "knight" ? "#ff6f61" : "#ef78ff";
  context.fillStyle = "rgba(0,0,0,0.42)";
  context.beginPath();
  context.ellipse(guardian.x + guardian.width / 2 + 5, guardian.y + guardian.height + 7, guardian.width * 0.62, 8, 0, 0, Math.PI * 2);
  context.fill();
  if (guardian.shield > 0 || guardian.intent === "guard") {
    context.strokeStyle = "rgba(255,191,87,0.8)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2, guardian.width * 0.76, 0, Math.PI * 2);
    context.stroke();
  }
  context.fillStyle = guardian.flash > 0 ? "#eaf6f2" : "rgba(4, 9, 14, 0.94)";
  context.beginPath();
  context.roundRect(guardian.x, guardian.y, guardian.width, guardian.height, guardian.kind === "knight" ? 4 : 12);
  context.fill();
  context.strokeStyle = tone;
  context.lineWidth = guardian.kind === "knight" ? 4 : 2;
  context.stroke();
  context.fillStyle = tone;
  context.beginPath();
  context.arc(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2, 5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(234,246,242,0.8)";
  for (let pip = 0; pip < guardian.health; pip += 1) context.fillRect(guardian.x + 5 + pip * 7, guardian.y - 7, 4, 3);
  if (guardian.intent) {
    const intentTone = guardian.intent === "charge" ? "#ff6f61" : guardian.intent === "guard" ? "#ffbf57" : "#52e7ef";
    const targetAngle = Math.atan2(guardian.targetY - (guardian.y + guardian.height / 2), guardian.targetX - (guardian.x + guardian.width / 2));
    context.save();
    context.setLineDash([6, 6]);
    context.strokeStyle = intentTone;
    context.globalAlpha = 0.48 + Math.sin(guardian.intentTimer * 18) * 0.16;
    context.beginPath();
    context.moveTo(guardian.x + guardian.width / 2, guardian.y + guardian.height / 2);
    context.lineTo(
      guardian.x + guardian.width / 2 + Math.cos(targetAngle) * 78,
      guardian.y + guardian.height / 2 + Math.sin(targetAngle) * 78,
    );
    context.stroke();
    context.restore();
    const response = guardian.intent === "charge" ? "BOLT" : guardian.intent === "guard" ? "WAIT" : "MOVE";
    drawPixelText(context, `${guardian.intent.toUpperCase()} > ${response}`, guardian.x + guardian.width / 2, guardian.y - 25, 10, intentTone, "center");
  }
}

function drawActiveDragonBeat(context: CanvasRenderingContext2D, guardians: Guardian[]): void {
  const guardian = guardians.find((candidate) => candidate.intent && candidate.intentTimer > 0);
  if (!guardian?.intent) return;
  const tone = guardian.intent === "charge" ? "#ff6f61" : guardian.intent === "guard" ? "#ffbf57" : "#52e7ef";
  const response = guardian.intent === "charge" ? "FIRE NOW" : guardian.intent === "guard" ? "HOLD FIRE" : "KEEP MOVING";
  context.fillStyle = "rgba(2,7,11,0.88)";
  context.fillRect(332, 101, 296, 44);
  context.strokeStyle = tone;
  context.lineWidth = 2;
  context.strokeRect(332, 101, 296, 44);
  drawPixelText(context, `DRAGON BEAT // ${response}`, 480, 114, 14, tone, "center");
}

function drawBolts(context: CanvasRenderingContext2D, bolts: PlayerBolt[]): void {
  context.save();
  context.globalCompositeOperation = "lighter";
  for (const bolt of bolts) {
    const light = context.createRadialGradient(bolt.x, bolt.y, 2, bolt.x, bolt.y, 42);
    light.addColorStop(0, "rgba(234,246,242,0.44)");
    light.addColorStop(0.35, "rgba(82,231,239,0.2)");
    light.addColorStop(1, "rgba(82,231,239,0)");
    context.fillStyle = light;
    context.beginPath();
    context.arc(bolt.x, bolt.y, 42, 0, Math.PI * 2);
    context.fill();
    const gradient = context.createLinearGradient(bolt.previousX, bolt.previousY, bolt.x, bolt.y);
    gradient.addColorStop(0, "rgba(82, 231, 239, 0)");
    gradient.addColorStop(1, "rgba(234, 246, 242, 0.96)");
    context.strokeStyle = gradient;
    context.lineWidth = 9;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(bolt.previousX, bolt.previousY);
    context.lineTo(bolt.x, bolt.y);
    context.stroke();
    context.fillStyle = "#eaf6f2";
    context.beginPath();
    context.arc(bolt.x, bolt.y, 5, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawPlayer(context: CanvasRenderingContext2D, state: DescentState): void {
  const player = state.player;
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  if (player.ward > 0) {
    const pulse = 29 + Math.sin(state.elapsed * 7) * 4;
    const ward = context.createRadialGradient(centerX, centerY, 9, centerX, centerY, pulse);
    ward.addColorStop(0, "rgba(82,231,239,0.08)");
    ward.addColorStop(0.72, "rgba(82,231,239,0.18)");
    ward.addColorStop(1, "rgba(234,246,242,0)");
    context.fillStyle = ward;
    context.beginPath();
    context.arc(centerX, centerY, pulse, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(234,246,242,0.8)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(centerX, centerY, pulse - 3, 0, Math.PI * 2);
    context.stroke();
  }
  if (player.ward <= 0 && player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0) context.globalAlpha = 0.34;
  context.fillStyle = state.treasure ? "#ffbf57" : "#52e7ef";
  context.beginPath();
  context.roundRect(player.x, player.y, player.width, player.height, 7);
  context.fill();
  context.fillStyle = "#07131f";
  context.fillRect(player.x + 6, player.y + 7, 5, 5);
  context.fillRect(player.x + 17, player.y + 7, 5, 5);
  context.strokeStyle = "#eaf6f2";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(centerX, centerY);
  context.lineTo(centerX + player.facingX * 24, centerY + player.facingY * 24);
  context.stroke();
  context.globalAlpha = 1;
}

function drawHomeCompass(context: CanvasRenderingContext2D, state: DescentState): void {
  const playerX = state.player.x + state.player.width / 2;
  const playerY = state.player.y + state.player.height / 2;
  const exit = centerOf(exitCell);
  const angle = Math.atan2(exit.y - playerY, exit.x - playerX);
  context.save();
  context.translate(playerX, playerY);
  context.rotate(angle);
  context.translate(43 + Math.sin(state.elapsed * 4) * 4, 0);
  context.fillStyle = "rgba(139,229,142,0.92)";
  context.beginPath();
  context.moveTo(12, 0);
  context.lineTo(-8, -8);
  context.lineTo(-4, 0);
  context.lineTo(-8, 8);
  context.closePath();
  context.fill();
  context.restore();
}

function drawFog(context: CanvasRenderingContext2D, state: DescentState): void {
  const centerX = state.player.x + state.player.width / 2;
  const centerY = state.player.y + state.player.height / 2;
  const radius = state.player.ward > 0 ? 205 : 170;
  const light = context.createRadialGradient(centerX, centerY, 45, centerX, centerY, radius);
  light.addColorStop(0, "rgba(0,0,0,0)");
  light.addColorStop(0.48, "rgba(0,0,0,0.01)");
  light.addColorStop(1, "rgba(0,0,0,0.52)");
  context.fillStyle = light;
  context.fillRect(0, 0, columns * tile, rows * tile);
}

function drawDialogue(context: CanvasRenderingContext2D, dialogue: NonNullable<DescentState["dialogue"]>): void {
  context.fillStyle = "rgba(2,7,11,0.91)";
  context.fillRect(172, 424, 616, 82);
  context.strokeStyle = "rgba(255,191,87,0.58)";
  context.lineWidth = 2;
  context.strokeRect(172, 424, 616, 82);
  drawPixelText(context, dialogue.speaker, 192, 442, 13, "#ffbf57");
  const lines = wrapDialogue(context, dialogue.text, 560);
  lines.slice(0, 2).forEach((line, index) => drawPixelText(context, line, 192, 464 + index * 17, 12, "#eaf6f2"));
}

function wrapDialogue(context: CanvasRenderingContext2D, copy: string, width: number): string[] {
  context.save();
  context.font = "700 12px ui-monospace, SFMono-Regular, Menlo, monospace";
  const lines: string[] = [];
  let line = "";
  for (const word of copy.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= width) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  context.restore();
  return lines;
}
