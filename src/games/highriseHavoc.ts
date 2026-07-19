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

type WindowCell = { row: number; column: number; intact: boolean };
type Tower = { x: number; width: number; floors: number; tone: string; windows: WindowCell[]; collapse: number };
type Craft = { x: number; y: number; vx: number; cooldown: number; health: number };
type Shell = { x: number; y: number; vx: number; vy: number; life: number };
type Pickup = { x: number; y: number; taken: boolean };

type HavocState = {
  player: {
    x: number;
    y: number;
    previousY: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    facing: number;
    health: number;
    invulnerable: number;
    climbing: number | null;
    attack: number;
    attackCooldown: number;
    leapCooldown: number;
  };
  towers: Tower[];
  crafts: Craft[];
  shells: Shell[];
  pickups: Pickup[];
  particles: Particle[];
  score: number;
  combo: number;
  comboTimer: number;
  broken: number;
  time: number;
  shake: number;
  status: GameStatus;
};

const ground = 502;
const totalWindows = 54;

export function mountHighriseHavoc(canvas: HTMLCanvasElement, options: GameMountOptions): GameController {
  const context = prepareCanvas(canvas);
  const input = new InputState();
  const sound = new ArcadeSfx(options.soundEnabled);
  let state = createState();
  let lastHud = "";

  const emitHud = (): void => {
    const hud: GameHud = {
      score: state.score,
      status: state.status,
      message: state.status === "playing" ? `${state.broken}/${totalWindows} windows // ${state.player.health} energy` : undefined,
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
    state.player.invulnerable = 1.2;
    state.player.climbing = null;
    state.player.vx = state.player.x < x ? -260 : 260;
    state.player.vy = -240;
    state.shake = 9;
    burst(state.particles, state.player.x + 21, state.player.y + 28, "#ff6f61", 24, 250);
    sound.noise(0.14, 0.08);
    sound.play(74, 0.22, "sawtooth", 0.09, 42);
  };

  const attack = (): void => {
    state.player.attack = 0.14;
    state.player.attackCooldown = 0.2;
    const playerCenter = { x: state.player.x + 21, y: state.player.y + 27 };
    let target: { tower: Tower; window: WindowCell; x: number; y: number } | null = null;
    let targetDistance = Number.POSITIVE_INFINITY;

    for (const tower of state.towers) {
      for (const window of tower.windows) {
        if (!window.intact) continue;
        const position = windowPosition(tower, window);
        const distance = Math.hypot(position.x - playerCenter.x, position.y - playerCenter.y);
        const facingTarget = (position.x - playerCenter.x) * state.player.facing > -18;
        if (facingTarget && distance < 84 && distance < targetDistance) {
          target = { tower, window, ...position };
          targetDistance = distance;
        }
      }
    }

    for (const craft of state.crafts) {
      if (craft.health <= 0) continue;
      const craftBox = { x: craft.x, y: craft.y, width: 52, height: 24 };
      const fist = {
        x: state.player.x + (state.player.facing > 0 ? state.player.width : -58),
        y: state.player.y + 8,
        width: 58,
        height: 46,
      };
      if (intersects(fist, craftBox)) {
        craft.health -= 1;
        state.score += 450;
        state.shake = 6;
        burst(state.particles, craft.x + 26, craft.y + 12, "#52e7ef", 22, 260);
        sound.chord([110, 82.41], 0.16, "square", 0.06);
        return;
      }
    }

    if (!target) {
      sound.play(240, 0.06, "triangle", 0.03, 180);
      return;
    }

    target.window.intact = false;
    state.broken += 1;
    state.combo += 1;
    state.comboTimer = 1.4;
    state.score += 100 * Math.min(8, state.combo);
    state.shake = 7;
    burst(state.particles, target.x, target.y, target.tower.tone, 18, 220);
    sound.noise(0.08, 0.055);
    sound.play(105, 0.12, "square", 0.07, 62);

    if (state.broken % 9 === 0) state.pickups.push({ x: target.x - 12, y: target.y - 12, taken: false });
    if (target.tower.windows.every((window) => !window.intact) && target.tower.collapse === 0) {
      target.tower.collapse = 0.01;
      state.player.climbing = null;
      state.score += 1200;
      state.shake = 14;
      burst(state.particles, target.tower.x + target.tower.width / 2, ground - 80, "#ffbf57", 52, 360);
      sound.chord([73.42, 92.5, 110], 0.32, "sawtooth", 0.07);
    }
  };

  const update = (delta: number): void => {
    if (state.status !== "playing") return;
    state.time = Math.max(0, state.time - delta);
    state.player.invulnerable = Math.max(0, state.player.invulnerable - delta);
    state.player.attack = Math.max(0, state.player.attack - delta);
    state.player.attackCooldown = Math.max(0, state.player.attackCooldown - delta);
    state.player.leapCooldown = Math.max(0, state.player.leapCooldown - delta);
    state.comboTimer = Math.max(0, state.comboTimer - delta);
    state.shake = Math.max(0, state.shake - delta * 22);
    if (state.comboTimer <= 0) state.combo = 0;

    const horizontal = Number(input.down("arrowright", "d")) - Number(input.down("arrowleft", "a"));
    const vertical = Number(input.down("arrowdown", "s")) - Number(input.down("arrowup", "w"));
    if (horizontal) state.player.facing = horizontal;

    if (input.take("space", "z") && state.player.attackCooldown <= 0) attack();

    if (state.player.climbing !== null) {
      const tower = state.towers[state.player.climbing];
      if (!tower || tower.collapse > 0) {
        state.player.climbing = null;
      } else {
        state.player.vx = horizontal * 155;
        state.player.vy = vertical * 185;
        state.player.x = clamp(state.player.x + state.player.vx * delta, tower.x - 15, tower.x + tower.width - state.player.width + 15);
        const towerTop = ground - tower.floors * 66;
        state.player.y = clamp(state.player.y + state.player.vy * delta, towerTop - 10, ground - state.player.height);
        if (input.take("shift", "x") && state.player.leapCooldown <= 0) {
          state.player.climbing = null;
          state.player.vx = state.player.facing * 430;
          state.player.vy = -310;
          state.player.leapCooldown = 0.65;
          sound.play(330, 0.13, "sawtooth", 0.05, 510);
        }
      }
    }

    if (state.player.climbing === null) {
      const onGround = state.player.y + state.player.height >= ground - 1;
      state.player.vx += horizontal * 920 * delta;
      state.player.vx *= Math.pow(onGround ? 0.002 : 0.08, delta);
      state.player.vx = clamp(state.player.vx, -270, 270);
      if (input.take("arrowup", "w")) {
        const towerIndex = state.towers.findIndex((tower) => tower.collapse === 0 && state.player.x + state.player.width > tower.x - 18 && state.player.x < tower.x + tower.width + 18);
        if (towerIndex >= 0) {
          state.player.climbing = towerIndex;
          state.player.vx = 0;
          sound.play(190, 0.09, "square", 0.04, 250);
        } else if (onGround) {
          state.player.vy = -410;
          sound.play(190, 0.09, "square", 0.04, 250);
        }
      }
      state.player.vy += 980 * delta;
      state.player.previousY = state.player.y;
      state.player.x = clamp(state.player.x + state.player.vx * delta, 8, GAME_WIDTH - state.player.width - 8);
      state.player.y = Math.min(ground - state.player.height, state.player.y + state.player.vy * delta);
      if (state.player.y + state.player.height >= ground) state.player.vy = 0;
    }

    for (const tower of state.towers) if (tower.collapse > 0) tower.collapse = Math.min(1, tower.collapse + delta * 0.8);

    for (const craft of state.crafts) {
      if (craft.health <= 0) continue;
      craft.x += craft.vx * delta;
      if (craft.x < 20 || craft.x > GAME_WIDTH - 70) craft.vx *= -1;
      craft.cooldown -= delta;
      if (craft.cooldown <= 0) {
        const angle = Math.atan2(state.player.y - craft.y, state.player.x - craft.x);
        state.shells.push({ x: craft.x + 26, y: craft.y + 18, vx: Math.cos(angle) * 205, vy: Math.sin(angle) * 205, life: 5 });
        craft.cooldown = 1.4 + Math.random() * 1.5;
        sound.play(520, 0.05, "sawtooth", 0.025, 390);
      }
    }

    for (const shell of state.shells) {
      shell.x += shell.vx * delta;
      shell.y += shell.vy * delta;
      shell.life -= delta;
      if (intersects(state.player, { x: shell.x - 5, y: shell.y - 5, width: 10, height: 10 })) {
        shell.life = 0;
        hurt(shell.x, shell.y);
      }
    }
    state.shells = state.shells.filter((shell) => shell.life > 0 && shell.x > -20 && shell.x < GAME_WIDTH + 20 && shell.y > 60 && shell.y < GAME_HEIGHT + 20);

    for (const pickup of state.pickups) {
      pickup.y = Math.min(ground - 24, pickup.y + 120 * delta);
      if (!pickup.taken && intersects(state.player, { x: pickup.x, y: pickup.y, width: 24, height: 24 })) {
        pickup.taken = true;
        state.player.health = Math.min(5, state.player.health + 1);
        state.score += 250;
        sound.chord([523.25, 659.25, 783.99], 0.16, "square", 0.04);
      }
    }

    updateParticles(state.particles, delta);
    state.crafts = state.crafts.filter((craft) => craft.health > 0);
    if (state.broken >= totalWindows) {
      state.score += Math.ceil(state.time) * 30 + state.player.health * 400;
      state.status = "won";
      sound.chord([261.63, 329.63, 392, 523.25], 0.5, "square", 0.055);
    } else if (state.player.health <= 0 || state.time <= 0) {
      state.status = "lost";
      sound.play(62, 0.6, "sawtooth", 0.09, 35);
    }
    emitHud();
  };

  const render = (): void => {
    context.save();
    if (state.shake) context.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    drawBackground(context);
    for (const tower of state.towers) drawTower(context, tower);
    for (const pickup of state.pickups) if (!pickup.taken) drawPickup(context, pickup);
    for (const craft of state.crafts) drawCraft(context, craft);
    for (const shell of state.shells) drawShell(context, shell);
    drawMonster(context, state);
    drawParticles(context, state.particles);
    context.restore();

    context.fillStyle = "rgba(2, 7, 11, 0.78)";
    context.fillRect(18, 18, 924, 54);
    drawPixelText(context, `SCORE ${String(state.score).padStart(6, "0")}`, 34, 33, 17, "#ffbf57");
    drawPixelText(context, `WINDOWS ${String(state.broken).padStart(2, "0")}/${totalWindows}`, 330, 33, 17, "#8be58e");
    drawPixelText(context, `TIME ${Math.ceil(state.time)}`, 900, 33, 17, "#52e7ef", "right");
    if (state.combo > 1 && state.comboTimer > 0) drawPixelText(context, `${state.combo}X HAVOC`, 480, 87, 22, "#ff6f61", "center");

    if (state.status === "paused") drawOverlay(context, "PAUSED", "HANG ONTO THE BUILDING", "#52e7ef");
    if (state.status === "won") drawOverlay(context, "BLOCK PARTY OVER", `FINAL SCORE ${state.score}`, "#8be58e");
    if (state.status === "lost") drawOverlay(context, "CITY SURVIVES", `${state.broken}/${totalWindows} WINDOWS BROKEN`, "#ff6f61");
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

function createState(): HavocState {
  const towerSpecs: Array<[number, number, number, string]> = [
    [52, 165, 4, "#ff6f61"],
    [266, 176, 5, "#52e7ef"],
    [500, 170, 4, "#ffbf57"],
    [728, 176, 5, "#8be58e"],
  ];
  const towers = towerSpecs.map(([x, width, floors, tone]) => ({
    x,
    width,
    floors,
    tone,
    collapse: 0,
    windows: Array.from({ length: floors * 3 }, (_, index) => ({ row: Math.floor(index / 3), column: index % 3, intact: true })),
  }));
  return {
    player: { x: 12, y: ground - 54, previousY: ground - 54, vx: 0, vy: 0, width: 42, height: 54, facing: 1, health: 5, invulnerable: 0, climbing: null, attack: 0, attackCooldown: 0, leapCooldown: 0 },
    towers,
    crafts: [
      { x: 130, y: 105, vx: 78, cooldown: 1.1, health: 2 },
      { x: 700, y: 145, vx: -92, cooldown: 2.2, health: 2 },
    ],
    shells: [],
    pickups: [],
    particles: [],
    score: 0,
    combo: 0,
    comboTimer: 0,
    broken: 0,
    time: 115,
    shake: 0,
    status: "playing",
  };
}

function windowPosition(tower: Tower, window: WindowCell): { x: number; y: number } {
  const floorHeight = 66;
  const columnWidth = tower.width / 3;
  return {
    x: tower.x + columnWidth * window.column + columnWidth / 2,
    y: ground - floorHeight * (window.row + 1) + floorHeight / 2,
  };
}

function drawBackground(context: CanvasRenderingContext2D): void {
  const gradient = context.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, "#10102e");
  gradient.addColorStop(0.55, "#4d244b");
  gradient.addColorStop(1, "#08131b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.fillStyle = "#ff8b67";
  context.beginPath();
  context.arc(820, 120, 68, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#152038";
  context.beginPath();
  context.moveTo(0, 345);
  context.lineTo(150, 230);
  context.lineTo(285, 355);
  context.lineTo(430, 190);
  context.lineTo(590, 350);
  context.lineTo(760, 240);
  context.lineTo(960, 360);
  context.lineTo(960, ground);
  context.lineTo(0, ground);
  context.fill();
  context.fillStyle = "#03090e";
  context.fillRect(0, ground, GAME_WIDTH, GAME_HEIGHT - ground);
  context.fillStyle = "#52e7ef";
  context.fillRect(0, ground, GAME_WIDTH, 3);
}

function drawTower(context: CanvasRenderingContext2D, tower: Tower): void {
  const floorHeight = 66;
  const height = tower.floors * floorHeight;
  const sink = tower.collapse * (height + 20);
  context.save();
  context.translate(0, sink);
  context.fillStyle = tower.collapse > 0 ? "#10171d" : "#0a1c27";
  context.fillRect(tower.x, ground - height, tower.width, height);
  context.strokeStyle = tower.tone;
  context.lineWidth = 3;
  context.strokeRect(tower.x, ground - height, tower.width, height);
  for (const window of tower.windows) {
    const position = windowPosition(tower, window);
    context.fillStyle = window.intact ? tower.tone : "#03080d";
    context.fillRect(position.x - 15, position.y - 18, 30, 36);
    if (window.intact) {
      context.fillStyle = "rgba(255,255,255,0.38)";
      context.fillRect(position.x - 11, position.y - 14, 8, 12);
    } else {
      context.strokeStyle = "#24333a";
      context.beginPath();
      context.moveTo(position.x - 13, position.y - 14);
      context.lineTo(position.x + 13, position.y + 14);
      context.moveTo(position.x + 13, position.y - 14);
      context.lineTo(position.x - 13, position.y + 14);
      context.stroke();
    }
  }
  context.fillStyle = tower.tone;
  context.fillRect(tower.x + 12, ground - height - 8, tower.width - 24, 5);
  context.restore();
}

function drawMonster(context: CanvasRenderingContext2D, state: HavocState): void {
  const player = state.player;
  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0) context.globalAlpha = 0.3;
  context.save();
  context.translate(player.x + player.width / 2, player.y);
  context.scale(player.facing, 1);
  context.fillStyle = "#183b33";
  context.fillRect(-18, 14, 36, 34);
  context.fillStyle = "#8be58e";
  context.fillRect(-16, 2, 32, 35);
  context.fillRect(-23, 20, player.attack > 0 ? 54 : 10, 13);
  context.fillStyle = "#07131f";
  context.fillRect(-9, 11, 5, 5);
  context.fillRect(5, 11, 5, 5);
  context.fillStyle = "#ffbf57";
  context.fillRect(-12, 25, 24, 5);
  context.fillStyle = "#285c48";
  context.fillRect(-17, 47, 13, 7);
  context.fillRect(5, 47, 13, 7);
  context.restore();
  context.globalAlpha = 1;
}

function drawCraft(context: CanvasRenderingContext2D, craft: Craft): void {
  context.fillStyle = "#040a10";
  context.fillRect(craft.x, craft.y, 52, 18);
  context.fillStyle = "#52e7ef";
  context.fillRect(craft.x + 9, craft.y + 5, 34, 8);
  context.fillStyle = "#ff6f61";
  context.fillRect(craft.x + 23, craft.y + 10, 7, 8);
  context.strokeStyle = "#52e7ef";
  context.beginPath();
  context.moveTo(craft.x - 14, craft.y + 8);
  context.lineTo(craft.x + 66, craft.y + 8);
  context.stroke();
}

function drawShell(context: CanvasRenderingContext2D, shell: Shell): void {
  context.fillStyle = "#ff6f61";
  context.fillRect(shell.x - 5, shell.y - 5, 10, 10);
  context.strokeStyle = "rgba(255,111,97,0.45)";
  context.strokeRect(shell.x - 9, shell.y - 9, 18, 18);
}

function drawPickup(context: CanvasRenderingContext2D, pickup: Pickup): void {
  context.fillStyle = "#ffbf57";
  context.fillRect(pickup.x, pickup.y, 24, 24);
  context.fillStyle = "#ff6f61";
  context.fillRect(pickup.x + 4, pickup.y + 8, 16, 8);
  context.fillStyle = "#eaf6f2";
  context.fillRect(pickup.x + 9, pickup.y + 4, 6, 16);
}
