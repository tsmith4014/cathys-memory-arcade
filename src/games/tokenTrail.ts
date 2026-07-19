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

type Platform = { x: number; y: number; width: number; height: number; tone: string };
type Token = { x: number; y: number; taken: boolean; phase: number };
type Enemy = { x: number; y: number; minX: number; maxX: number; vx: number; alive: boolean };

type TrailState = {
  player: { x: number; y: number; previousY: number; vx: number; vy: number; width: number; height: number; health: number; invulnerable: number; dash: number; dashCooldown: number };
  tokens: Token[];
  enemies: Enemy[];
  particles: Particle[];
  score: number;
  collected: number;
  checkpoint: number;
  camera: number;
  time: number;
  status: GameStatus;
};

const worldWidth = 3480;
const floorY = 480;
const platforms: Platform[] = [
  { x: 0, y: floorY, width: 560, height: 60, tone: "#1e5660" },
  { x: 650, y: floorY, width: 510, height: 60, tone: "#1e5660" },
  { x: 1220, y: floorY, width: 380, height: 60, tone: "#5a3d65" },
  { x: 1700, y: floorY, width: 600, height: 60, tone: "#5a3d65" },
  { x: 2380, y: floorY, width: 350, height: 60, tone: "#73542c" },
  { x: 2790, y: floorY, width: 690, height: 60, tone: "#73542c" },
  { x: 245, y: 375, width: 145, height: 22, tone: "#2794a0" },
  { x: 475, y: 315, width: 120, height: 22, tone: "#2794a0" },
  { x: 705, y: 390, width: 140, height: 22, tone: "#2794a0" },
  { x: 915, y: 315, width: 150, height: 22, tone: "#2794a0" },
  { x: 1260, y: 360, width: 145, height: 22, tone: "#ba5576" },
  { x: 1480, y: 285, width: 120, height: 22, tone: "#ba5576" },
  { x: 1650, y: 365, width: 120, height: 22, tone: "#ba5576" },
  { x: 1900, y: 300, width: 160, height: 22, tone: "#ba5576" },
  { x: 2175, y: 380, width: 120, height: 22, tone: "#ba5576" },
  { x: 2400, y: 340, width: 140, height: 22, tone: "#d58d3d" },
  { x: 2620, y: 270, width: 120, height: 22, tone: "#d58d3d" },
  { x: 2820, y: 370, width: 150, height: 22, tone: "#d58d3d" },
  { x: 3060, y: 300, width: 155, height: 22, tone: "#d58d3d" },
];

export function mountTokenTrail(canvas: HTMLCanvasElement, options: GameMountOptions): GameController {
  const context = prepareCanvas(canvas);
  const input = new InputState();
  const sound = new ArcadeSfx(options.soundEnabled);
  let state = createState();
  let lastHud = "";

  const emitHud = (): void => {
    const hud: GameHud = {
      score: state.score,
      status: state.status,
      message: state.status === "playing" ? `${state.collected}/24 tokens // ${state.player.health} hearts` : undefined,
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

  const resetToCheckpoint = (): void => {
    state.player.x = state.checkpoint;
    state.player.y = 380;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.invulnerable = 1.4;
    state.camera = clamp(state.checkpoint - 180, 0, worldWidth - GAME_WIDTH);
  };

  const hurt = (): void => {
    if (state.player.invulnerable > 0) return;
    state.player.health -= 1;
    burst(state.particles, state.player.x + 18, state.player.y + 24, "#ff6f61", 24, 240);
    sound.play(74, 0.25, "sawtooth", 0.1);
    if (state.player.health <= 0) {
      state.status = "lost";
      return;
    }
    resetToCheckpoint();
  };

  const update = (delta: number): void => {
    if (state.status !== "playing") return;
    state.time = Math.max(0, state.time - delta);
    state.player.invulnerable = Math.max(0, state.player.invulnerable - delta);
    state.player.dash = Math.max(0, state.player.dash - delta);
    state.player.dashCooldown = Math.max(0, state.player.dashCooldown - delta);
    const direction = Number(input.down("arrowright", "d")) - Number(input.down("arrowleft", "a"));
    const onGround = isStanding(state.player);

    if (input.take("arrowup", "w", "z") && onGround) {
      state.player.vy = -510;
      sound.play(220, 0.1, "square", 0.06);
    }
    if (input.take("space", "x") && state.player.dashCooldown <= 0 && direction !== 0) {
      state.player.dash = 0.18;
      state.player.dashCooldown = 0.85;
      state.player.vx = direction * 610;
      burst(state.particles, state.player.x, state.player.y + 35, "#52e7ef", 14, 160);
      sound.play(390, 0.13, "sawtooth", 0.05);
    }

    if (state.player.dash <= 0) {
      state.player.vx += direction * 1050 * delta;
      state.player.vx *= Math.pow(onGround ? 0.001 : 0.06, delta);
      state.player.vx = clamp(state.player.vx, -285, 285);
      state.player.vy += 1120 * delta;
    }
    state.player.previousY = state.player.y;
    state.player.x = clamp(state.player.x + state.player.vx * delta, 0, worldWidth - state.player.width);
    state.player.y += state.player.vy * delta;

    if (state.player.vy >= 0) {
      for (const platform of platforms) {
        const previousBottom = state.player.previousY + state.player.height;
        const nextBottom = state.player.y + state.player.height;
        const overlapsX = state.player.x + state.player.width > platform.x && state.player.x < platform.x + platform.width;
        if (overlapsX && previousBottom <= platform.y + 5 && nextBottom >= platform.y) {
          state.player.y = platform.y - state.player.height;
          state.player.vy = 0;
          break;
        }
      }
    }

    if (state.player.y > GAME_HEIGHT + 100) hurt();
    if (state.player.x > 1640 && state.checkpoint < 1640) {
      state.checkpoint = 1720;
      state.score += 500;
      sound.play(660, 0.18, "triangle", 0.07);
    }
    if (state.player.x > 2750 && state.checkpoint < 2750) {
      state.checkpoint = 2810;
      state.score += 500;
      sound.play(760, 0.18, "triangle", 0.07);
    }

    for (const token of state.tokens) {
      token.phase += delta * 4;
      if (!token.taken && intersects(state.player, { x: token.x - 12, y: token.y - 12, width: 24, height: 24 })) {
        token.taken = true;
        state.collected += 1;
        state.score += 125 + state.collected * 5;
        burst(state.particles, token.x, token.y, "#ffbf57", 16, 180);
        sound.play(480 + state.collected * 11, 0.1, "square", 0.055);
      }
    }

    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      enemy.x += enemy.vx * delta;
      if (enemy.x < enemy.minX || enemy.x > enemy.maxX) enemy.vx *= -1;
      const enemyBox = { x: enemy.x, y: enemy.y, width: 40, height: 34 };
      if (intersects(state.player, enemyBox)) {
        const playerPreviousBottom = state.player.previousY + state.player.height;
        if (state.player.vy > 100 && playerPreviousBottom <= enemy.y + 12) {
          enemy.alive = false;
          state.player.vy = -300;
          state.score += 300;
          burst(state.particles, enemy.x + 20, enemy.y + 17, "#ef78ff", 22, 220);
          sound.play(115, 0.13, "square", 0.08);
        } else hurt();
      }
    }
    updateParticles(state.particles, delta);
    state.camera += (clamp(state.player.x - 330, 0, worldWidth - GAME_WIDTH) - state.camera) * Math.min(1, delta * 6);

    if (state.player.x >= 3370) {
      state.score += Math.ceil(state.time) * 20 + state.player.health * 250 + state.collected * 50;
      state.status = "won";
      sound.play(880, 0.42, "square", 0.08);
    } else if (state.time <= 0) {
      state.status = "lost";
      sound.play(55, 0.45, "sawtooth", 0.09);
    }
    emitHud();
  };

  const render = (): void => {
    drawTrailBackground(context, state.camera);
    context.save();
    context.translate(-Math.round(state.camera), 0);
    for (const platform of platforms) drawPlatform(context, platform);
    for (const token of state.tokens) if (!token.taken) drawToken(context, token);
    for (const enemy of state.enemies) if (enemy.alive) drawEnemy(context, enemy);
    drawGate(context, 3390, state.collected);
    drawRunner(context, state);
    drawParticles(context, state.particles);
    context.restore();

    context.fillStyle = "rgba(4, 11, 18, 0.76)";
    context.fillRect(18, 18, 924, 54);
    drawPixelText(context, `SCORE ${String(state.score).padStart(6, "0")}`, 34, 33, 17, "#ffbf57");
    drawPixelText(context, `TOKENS ${String(state.collected).padStart(2, "0")}/24`, 360, 33, 17, "#52e7ef");
    drawPixelText(context, `TIME ${Math.ceil(state.time)}`, 900, 33, 17, "#8be58e", "right");
    const zone = state.player.x < 1200 ? "NEON FOOTHILLS" : state.player.x < 2360 ? "MIDNIGHT SWITCHYARD" : "SUNRISE TERMINAL";
    drawPixelText(context, zone, 480, 87, 14, "rgba(234, 246, 242, 0.72)", "center");

    if (state.status === "paused") drawOverlay(context, "PAUSED", "TRAIL POSITION SAVED", "#52e7ef");
    if (state.status === "won") drawOverlay(context, "TRAIL COMPLETE", `${state.collected}/24 TOKENS // SCORE ${state.score}`, "#ffbf57");
    if (state.status === "lost") drawOverlay(context, "OUT OF CONTINUES", `TOKENS BANKED ${state.collected}/24`, "#ff6f61");
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
    setInput: (key, active) => {
      if (active && key.toLowerCase() === "r") restart();
      else if (active && key.toLowerCase() === "p") togglePause();
      else input.set(key, active);
    },
    togglePause,
  };
}

function createState(): TrailState {
  const tokenPositions = [
    [185, 425], [310, 330], [530, 270], [730, 435], [775, 345], [980, 270], [1100, 425], [1290, 315],
    [1535, 240], [1720, 320], [1845, 425], [1970, 255], [2220, 335], [2420, 295], [2500, 425], [2675, 225],
    [2835, 325], [2940, 425], [3100, 255], [3200, 425], [3290, 400], [3350, 365], [3410, 330], [3450, 290],
  ];
  return {
    player: { x: 45, y: 390, previousY: 390, vx: 0, vy: 0, width: 36, height: 48, health: 3, invulnerable: 0, dash: 0, dashCooldown: 0 },
    tokens: tokenPositions.map(([x, y], index) => ({ x, y, taken: false, phase: index * 0.5 })),
    enemies: [
      { x: 720, y: 446, minX: 680, maxX: 1040, vx: 70, alive: true },
      { x: 1320, y: 446, minX: 1260, maxX: 1520, vx: -85, alive: true },
      { x: 1810, y: 446, minX: 1750, maxX: 2200, vx: 92, alive: true },
      { x: 2450, y: 446, minX: 2410, maxX: 2650, vx: -105, alive: true },
      { x: 2920, y: 446, minX: 2830, maxX: 3280, vx: 115, alive: true },
    ],
    particles: [],
    score: 0,
    collected: 0,
    checkpoint: 45,
    camera: 0,
    time: 120,
    status: "playing",
  };
}

function isStanding(player: TrailState["player"]): boolean {
  const bottom = player.y + player.height;
  return platforms.some((platform) => Math.abs(bottom - platform.y) < 3 && player.x + player.width > platform.x && player.x < platform.x + platform.width);
}

function drawTrailBackground(context: CanvasRenderingContext2D, camera: number): void {
  const zone = camera < 1050 ? 0 : camera < 2250 ? 1 : 2;
  const skies = [["#071631", "#155261"], ["#150e2c", "#4a244a"], ["#291128", "#d26f45"]];
  const gradient = context.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, skies[zone][0]);
  gradient.addColorStop(1, skies[zone][1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.fillStyle = zone === 2 ? "#ffbf57" : "#52e7ef";
  context.beginPath();
  context.arc(780, 130, zone === 2 ? 55 : 34, 0, Math.PI * 2);
  context.fill();
  for (let layer = 0; layer < 3; layer += 1) {
    const offset = -((camera * (0.08 + layer * 0.07)) % 380);
    context.fillStyle = ["rgba(8, 22, 38, 0.42)", "rgba(8, 20, 31, 0.64)", "#09131d"][layer];
    context.beginPath();
    context.moveTo(-400, GAME_HEIGHT);
    for (let x = -400; x <= 1400; x += 190) {
      const peak = 250 + layer * 58 + ((x / 190 + layer) % 2) * 55;
      context.lineTo(x + offset, peak);
      context.lineTo(x + 95 + offset, peak - 75 + layer * 18);
    }
    context.lineTo(1400, GAME_HEIGHT);
    context.fill();
  }
  context.fillStyle = "rgba(82, 231, 239, 0.08)";
  for (let x = -(camera * 0.35) % 80; x < GAME_WIDTH; x += 80) context.fillRect(x, 0, 1, GAME_HEIGHT);
}

function drawPlatform(context: CanvasRenderingContext2D, platform: Platform): void {
  context.fillStyle = "#07131f";
  context.fillRect(platform.x, platform.y, platform.width, platform.height);
  context.fillStyle = platform.tone;
  context.fillRect(platform.x, platform.y, platform.width, 7);
  context.fillStyle = "rgba(234, 246, 242, 0.08)";
  for (let x = platform.x + 14; x < platform.x + platform.width; x += 34) context.fillRect(x, platform.y + 14, 18, 5);
}

function drawToken(context: CanvasRenderingContext2D, token: Token): void {
  const width = 8 + Math.abs(Math.sin(token.phase)) * 12;
  context.fillStyle = "rgba(255, 191, 87, 0.2)";
  context.beginPath();
  context.arc(token.x, token.y, 18, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffbf57";
  context.fillRect(token.x - width / 2, token.y - 13, width, 26);
  context.fillStyle = "#ffe09b";
  context.fillRect(token.x - width / 4, token.y - 8, Math.max(2, width / 2), 16);
}

function drawEnemy(context: CanvasRenderingContext2D, enemy: Enemy): void {
  context.fillStyle = "#371542";
  context.fillRect(enemy.x, enemy.y + 8, 40, 26);
  context.fillStyle = "#ef78ff";
  context.fillRect(enemy.x + 5, enemy.y, 30, 25);
  context.fillStyle = "#07131f";
  context.fillRect(enemy.x + 9, enemy.y + 7, 6, 7);
  context.fillRect(enemy.x + 25, enemy.y + 7, 6, 7);
  context.fillStyle = "#ff6f61";
  context.fillRect(enemy.x + 12, enemy.y + 24, 16, 5);
}

function drawRunner(context: CanvasRenderingContext2D, state: TrailState): void {
  const { player } = state;
  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) context.globalAlpha = 0.3;
  context.fillStyle = player.dash > 0 ? "#eaf6f2" : "#52e7ef";
  context.fillRect(player.x + 5, player.y + 3, 26, 35);
  context.fillStyle = "#ff6f61";
  context.fillRect(player.x, player.y + 12, 36, 13);
  context.fillStyle = "#07131f";
  context.fillRect(player.x + 11, player.y + 10, 5, 6);
  context.fillRect(player.x + 22, player.y + 10, 5, 6);
  context.fillStyle = "#ffbf57";
  context.fillRect(player.x + 5, player.y + 38, 10, 10);
  context.fillRect(player.x + 22, player.y + 38, 10, 10);
  if (player.dash > 0) {
    context.fillStyle = "rgba(82, 231, 239, 0.35)";
    context.fillRect(player.x - Math.sign(player.vx) * 60, player.y + 10, 55, 20);
  }
  context.globalAlpha = 1;
}

function drawGate(context: CanvasRenderingContext2D, x: number, collected: number): void {
  context.strokeStyle = "#ffbf57";
  context.lineWidth = 7;
  context.strokeRect(x, 280, 62, 200);
  context.fillStyle = "rgba(255, 191, 87, 0.16)";
  context.fillRect(x + 7, 287, 48, 193);
  drawPixelText(context, collected >= 18 ? "OPEN" : "EXIT", x + 31, 330, 13, "#ffbf57", "center");
}
