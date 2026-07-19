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
type MovingLift = Platform & { minY: number; maxY: number; vy: number };
type Crate = { x: number; y: number; width: number; height: number; broken: boolean; contains: "spark" | "heart" | "empty" };
type Spark = { x: number; y: number; taken: boolean; phase: number };
type Keepsake = { x: number; y: number; taken: boolean; label: string };
type Patrol = { x: number; y: number; minX: number; maxX: number; vx: number; alive: boolean; kind: "walker" | "hopper"; hop: number };

type SunsetState = {
  player: {
    x: number;
    y: number;
    previousY: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    health: number;
    invulnerable: number;
    coyote: number;
    jumpBuffer: number;
    facing: number;
    checkpoint: number;
  };
  lifts: MovingLift[];
  crates: Crate[];
  sparks: Spark[];
  keepsakes: Keepsake[];
  patrols: Patrol[];
  particles: Particle[];
  camera: number;
  score: number;
  collected: number;
  time: number;
  status: GameStatus;
};

const worldWidth = 4680;
const floorY = 490;
const platforms: Platform[] = [
  { x: 0, y: floorY, width: 650, height: 50, tone: "#1f5d66" },
  { x: 735, y: floorY, width: 540, height: 50, tone: "#1f5d66" },
  { x: 1370, y: floorY, width: 720, height: 50, tone: "#604064" },
  { x: 2170, y: floorY, width: 440, height: 50, tone: "#604064" },
  { x: 2720, y: floorY, width: 610, height: 50, tone: "#9a5834" },
  { x: 3420, y: floorY, width: 440, height: 50, tone: "#9a5834" },
  { x: 3950, y: floorY, width: 730, height: 50, tone: "#9a5834" },
  { x: 250, y: 385, width: 150, height: 18, tone: "#52e7ef" },
  { x: 485, y: 315, width: 120, height: 18, tone: "#52e7ef" },
  { x: 790, y: 395, width: 140, height: 18, tone: "#52e7ef" },
  { x: 1030, y: 320, width: 170, height: 18, tone: "#52e7ef" },
  { x: 1430, y: 375, width: 135, height: 18, tone: "#ef78ff" },
  { x: 1650, y: 295, width: 140, height: 18, tone: "#ef78ff" },
  { x: 1880, y: 365, width: 160, height: 18, tone: "#ef78ff" },
  { x: 2250, y: 350, width: 140, height: 18, tone: "#ef78ff" },
  { x: 2470, y: 275, width: 130, height: 18, tone: "#ef78ff" },
  { x: 2780, y: 370, width: 150, height: 18, tone: "#ffbf57" },
  { x: 3120, y: 300, width: 150, height: 18, tone: "#ffbf57" },
  { x: 3480, y: 365, width: 130, height: 18, tone: "#ffbf57" },
  { x: 3750, y: 285, width: 110, height: 18, tone: "#ffbf57" },
  { x: 4080, y: 355, width: 150, height: 18, tone: "#ffbf57" },
  { x: 4350, y: 290, width: 135, height: 18, tone: "#ffbf57" },
];

export function mountSunsetRun(canvas: HTMLCanvasElement, options: GameMountOptions): GameController {
  const context = prepareCanvas(canvas);
  const input = new InputState();
  const sound = new ArcadeSfx(options.soundEnabled);
  let state = createState();
  let lastHud = "";

  const emitHud = (): void => {
    const keepsakes = state.keepsakes.filter((keepsake) => keepsake.taken).length;
    const hud: GameHud = {
      score: state.score,
      status: state.status,
      message: state.status === "playing" ? `${keepsakes}/2 keepsakes // ${state.collected} sparks // ${state.player.health} hearts` : undefined,
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
    state.player.x = state.player.checkpoint;
    state.player.y = 390;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.invulnerable = 1.5;
    state.camera = clamp(state.player.checkpoint - 220, 0, worldWidth - GAME_WIDTH);
  };

  const hurt = (): void => {
    if (state.player.invulnerable > 0) return;
    state.player.health -= 1;
    burst(state.particles, state.player.x + 18, state.player.y + 22, "#ff6f61", 24, 250);
    sound.noise(0.12, 0.07);
    sound.play(82, 0.22, "sawtooth", 0.09, 44);
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
    state.player.jumpBuffer = Math.max(0, state.player.jumpBuffer - delta);
    const horizontal = Number(input.down("arrowright", "d")) - Number(input.down("arrowleft", "a"));
    const sprinting = input.down("shift", "x");
    const standing = standingPlatform(state);
    state.player.coyote = standing ? 0.11 : Math.max(0, state.player.coyote - delta);
    if (horizontal) state.player.facing = horizontal;

    if (input.take("space", "arrowup", "w", "z")) state.player.jumpBuffer = 0.12;
    if (state.player.jumpBuffer > 0 && state.player.coyote > 0) {
      state.player.vy = -515;
      state.player.jumpBuffer = 0;
      state.player.coyote = 0;
      sound.play(230, 0.1, "square", 0.055, 330);
    }
    if (!input.down("space", "arrowup", "w", "z") && state.player.vy < -180) state.player.vy += 1050 * delta;

    const acceleration = sprinting ? 1450 : 1050;
    const maxSpeed = sprinting ? 385 : 280;
    state.player.vx += horizontal * acceleration * delta;
    state.player.vx *= Math.pow(standing ? 0.0015 : 0.055, delta);
    state.player.vx = clamp(state.player.vx, -maxSpeed, maxSpeed);
    state.player.vy += 1150 * delta;
    state.player.previousY = state.player.y;
    state.player.x = clamp(state.player.x + state.player.vx * delta, 0, worldWidth - state.player.width);
    state.player.y += state.player.vy * delta;

    for (const lift of state.lifts) {
      lift.y += lift.vy * delta;
      if (lift.y < lift.minY || lift.y > lift.maxY) lift.vy *= -1;
    }

    const surfaces: Platform[] = [...platforms, ...state.lifts, ...state.crates.filter((crate) => !crate.broken).map((crate) => ({ ...crate, tone: "#ffbf57" }))];
    if (state.player.vy >= 0) {
      for (const platform of surfaces) {
        const previousBottom = state.player.previousY + state.player.height;
        const nextBottom = state.player.y + state.player.height;
        const overlapsX = state.player.x + state.player.width > platform.x && state.player.x < platform.x + platform.width;
        if (overlapsX && previousBottom <= platform.y + 5 && nextBottom >= platform.y) {
          state.player.y = platform.y - state.player.height;
          state.player.vy = platform instanceof Object && "vy" in platform ? Number(platform.vy) : 0;
          break;
        }
      }
    } else {
      for (const crate of state.crates) {
        if (crate.broken) continue;
        const playerTop = state.player.y;
        const previousTop = state.player.previousY;
        const crateBottom = crate.y + crate.height;
        const overlapsX = state.player.x + state.player.width > crate.x && state.player.x < crate.x + crate.width;
        if (overlapsX && previousTop >= crateBottom - 7 && playerTop <= crateBottom) {
          breakCrate(state, crate, sound);
          state.player.y = crateBottom;
          state.player.vy = 120;
          break;
        }
      }
    }

    if (state.player.y > GAME_HEIGHT + 120) hurt();

    for (const spark of state.sparks) {
      spark.phase += delta * 5;
      if (!spark.taken && intersects(state.player, { x: spark.x - 11, y: spark.y - 11, width: 22, height: 22 })) {
        spark.taken = true;
        state.collected += 1;
        state.score += 110 + state.collected * 4;
        burst(state.particles, spark.x, spark.y, "#ffbf57", 15, 180);
        sound.play(520 + state.collected * 7, 0.09, "square", 0.045, 680 + state.collected * 7);
      }
    }

    for (const keepsake of state.keepsakes) {
      if (!keepsake.taken && intersects(state.player, { x: keepsake.x - 17, y: keepsake.y - 17, width: 34, height: 34 })) {
        keepsake.taken = true;
        state.score += 1000;
        burst(state.particles, keepsake.x, keepsake.y, "#52e7ef", 34, 260);
        sound.chord([261.63, 329.63, 392, 523.25], 0.28, "square", 0.045);
      }
    }

    for (const patrol of state.patrols) {
      if (!patrol.alive) continue;
      patrol.hop = Math.max(0, patrol.hop - delta);
      patrol.x += patrol.vx * delta;
      if (patrol.x < patrol.minX || patrol.x > patrol.maxX) patrol.vx *= -1;
      if (patrol.kind === "hopper" && patrol.hop <= 0) patrol.hop = 1.4;
      const hopOffset = patrol.kind === "hopper" ? Math.sin(Math.min(1, patrol.hop) * Math.PI) * 34 : 0;
      const patrolBox = { x: patrol.x, y: patrol.y - hopOffset, width: 42, height: 34 };
      if (intersects(state.player, patrolBox)) {
        const previousBottom = state.player.previousY + state.player.height;
        if (state.player.vy > 100 && previousBottom <= patrolBox.y + 12) {
          patrol.alive = false;
          state.player.vy = -330;
          state.score += patrol.kind === "hopper" ? 450 : 300;
          burst(state.particles, patrol.x + 21, patrolBox.y + 17, "#ef78ff", 22, 220);
          sound.play(118, 0.13, "square", 0.075, 72);
        } else hurt();
      }
    }

    if (state.player.x > 1420 && state.player.checkpoint < 1400) {
      state.player.checkpoint = 1400;
      state.score += 400;
      sound.chord([440, 554.37], 0.16, "triangle", 0.04);
    }
    if (state.player.x > 2800 && state.player.checkpoint < 2700) {
      state.player.checkpoint = 2740;
      state.score += 400;
      sound.chord([493.88, 659.25], 0.16, "triangle", 0.04);
    }
    if (state.player.x > 3990 && state.player.checkpoint < 3900) {
      state.player.checkpoint = 3980;
      state.score += 400;
      sound.chord([523.25, 698.46], 0.16, "triangle", 0.04);
    }

    updateParticles(state.particles, delta);
    state.camera += (clamp(state.player.x - 300, 0, worldWidth - GAME_WIDTH) - state.camera) * Math.min(1, delta * 6);

    const keepsakeCount = state.keepsakes.filter((keepsake) => keepsake.taken).length;
    if (state.player.x >= 4590 && keepsakeCount === 2) {
      state.score += Math.ceil(state.time) * 24 + state.player.health * 350 + state.collected * 35;
      state.status = "won";
      sound.chord([261.63, 329.63, 392, 523.25], 0.5, "square", 0.055);
    } else if (state.time <= 0) {
      state.status = "lost";
      sound.play(58, 0.55, "sawtooth", 0.09, 34);
    }
    emitHud();
  };

  const render = (): void => {
    drawBackground(context, state.camera);
    context.save();
    context.translate(-Math.round(state.camera), 0);
    for (const platform of platforms) drawPlatform(context, platform);
    for (const lift of state.lifts) drawLift(context, lift);
    for (const crate of state.crates) if (!crate.broken) drawCrate(context, crate);
    for (const spark of state.sparks) if (!spark.taken) drawSpark(context, spark);
    for (const keepsake of state.keepsakes) if (!keepsake.taken) drawKeepsake(context, keepsake);
    for (const patrol of state.patrols) if (patrol.alive) drawPatrol(context, patrol);
    drawExit(context, 4620, state.keepsakes.filter((keepsake) => keepsake.taken).length);
    drawRunner(context, state);
    drawParticles(context, state.particles);
    context.restore();

    context.fillStyle = "rgba(2, 7, 11, 0.78)";
    context.fillRect(18, 18, 924, 54);
    drawPixelText(context, `SCORE ${String(state.score).padStart(6, "0")}`, 34, 33, 17, "#ffbf57");
    drawPixelText(context, `KEEPSAKES ${state.keepsakes.filter((keepsake) => keepsake.taken).length}/2`, 350, 33, 17, "#52e7ef");
    drawPixelText(context, `TIME ${Math.ceil(state.time)}`, 900, 33, 17, "#8be58e", "right");
    const district = state.player.x < 1400 ? "FILLMORE APPROACH" : state.player.x < 2750 ? "MIDNIGHT MARKET" : state.player.x < 3970 ? "SWITCHBACK HEIGHTS" : "SUNRISE EXIT";
    drawPixelText(context, district, 480, 87, 14, "rgba(234,246,242,0.74)", "center");

    if (state.status === "paused") drawOverlay(context, "PAUSED", "SATURDAY IS STILL HERE", "#52e7ef");
    if (state.status === "won") drawOverlay(context, "BOTH TOKENS HOME", `FINAL SCORE ${state.score}`, "#ffbf57");
    if (state.status === "lost") drawOverlay(context, "SUNSET", `${state.keepsakes.filter((keepsake) => keepsake.taken).length}/2 KEEPSAKES FOUND`, "#ff6f61");
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

function createState(): SunsetState {
  const sparkPositions = [
    [170, 440], [325, 340], [545, 270], [810, 350], [1100, 275], [1250, 440], [1470, 330], [1710, 250],
    [1930, 320], [2070, 440], [2280, 305], [2520, 230], [2600, 440], [2810, 325], [3200, 255], [3310, 440],
    [3520, 320], [3800, 240], [3850, 440], [4120, 310], [4400, 245], [4520, 430],
  ];
  return {
    player: { x: 45, y: 390, previousY: 390, vx: 0, vy: 0, width: 36, height: 48, health: 3, invulnerable: 0, coyote: 0, jumpBuffer: 0, facing: 1, checkpoint: 45 },
    lifts: [
      { x: 650, y: 410, width: 85, height: 16, tone: "#52e7ef", minY: 290, maxY: 430, vy: -72 },
      { x: 2610, y: 410, width: 100, height: 16, tone: "#ffbf57", minY: 255, maxY: 430, vy: -84 },
      { x: 3865, y: 400, width: 80, height: 16, tone: "#ff6f61", minY: 240, maxY: 420, vy: -92 },
    ],
    crates: [
      { x: 430, y: 390, width: 46, height: 46, broken: false, contains: "spark" },
      { x: 930, y: 350, width: 46, height: 46, broken: false, contains: "heart" },
      { x: 1570, y: 410, width: 46, height: 46, broken: false, contains: "spark" },
      { x: 2090, y: 345, width: 46, height: 46, broken: false, contains: "empty" },
      { x: 2990, y: 390, width: 46, height: 46, broken: false, contains: "heart" },
      { x: 3650, y: 330, width: 46, height: 46, broken: false, contains: "spark" },
      { x: 4260, y: 390, width: 46, height: 46, broken: false, contains: "spark" },
    ],
    sparks: sparkPositions.map(([x, y], index) => ({ x, y, taken: false, phase: index * 0.4 })),
    keepsakes: [
      { x: 1760, y: 250, taken: false, label: "C" },
      { x: 3810, y: 235, taken: false, label: "C" },
    ],
    patrols: [
      { x: 780, y: 456, minX: 760, maxX: 1180, vx: 75, alive: true, kind: "walker", hop: 0 },
      { x: 1460, y: 456, minX: 1400, maxX: 1980, vx: -92, alive: true, kind: "hopper", hop: 0.8 },
      { x: 2230, y: 456, minX: 2200, maxX: 2520, vx: 105, alive: true, kind: "walker", hop: 0 },
      { x: 2810, y: 456, minX: 2760, maxX: 3260, vx: -112, alive: true, kind: "hopper", hop: 1.2 },
      { x: 3500, y: 456, minX: 3450, maxX: 3800, vx: 118, alive: true, kind: "walker", hop: 0 },
      { x: 4110, y: 456, minX: 4020, maxX: 4510, vx: -125, alive: true, kind: "hopper", hop: 0.5 },
    ],
    particles: [],
    camera: 0,
    score: 0,
    collected: 0,
    time: 165,
    status: "playing",
  };
}

function standingPlatform(state: SunsetState): Platform | null {
  const bottom = state.player.y + state.player.height;
  const surfaces: Platform[] = [
    ...platforms,
    ...state.lifts,
    ...state.crates.filter((crate) => !crate.broken).map((crate) => ({ ...crate, tone: "#ffbf57" })),
  ];
  return surfaces.find((platform) => Math.abs(bottom - platform.y) < 4 && state.player.x + state.player.width > platform.x && state.player.x < platform.x + platform.width) ?? null;
}

function breakCrate(state: SunsetState, crate: Crate, sound: ArcadeSfx): void {
  crate.broken = true;
  state.score += 180;
  burst(state.particles, crate.x + 23, crate.y + 23, "#ffbf57", 20, 210);
  sound.noise(0.08, 0.055);
  if (crate.contains === "spark") {
    state.sparks.push({ x: crate.x + 23, y: crate.y - 18, taken: false, phase: 0 });
  } else if (crate.contains === "heart") {
    state.player.health = Math.min(3, state.player.health + 1);
    sound.chord([523.25, 659.25], 0.14, "square", 0.04);
  }
}

function drawBackground(context: CanvasRenderingContext2D, camera: number): void {
  const district = camera < 1300 ? 0 : camera < 2700 ? 1 : camera < 3900 ? 2 : 3;
  const skies = [
    ["#061a36", "#185a68"],
    ["#150e2c", "#593253"],
    ["#28132f", "#bd5e49"],
    ["#3a1830", "#f09a55"],
  ];
  const gradient = context.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, skies[district][0]);
  gradient.addColorStop(1, skies[district][1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.fillStyle = district >= 2 ? "#ffbf57" : "#52e7ef";
  context.beginPath();
  context.arc(800, 125, 38 + district * 8, 0, Math.PI * 2);
  context.fill();
  for (let layer = 0; layer < 3; layer += 1) {
    const offset = -((camera * (0.07 + layer * 0.08)) % 420);
    context.fillStyle = ["rgba(8,20,38,0.36)", "rgba(8,18,31,0.62)", "#09131d"][layer];
    context.beginPath();
    context.moveTo(-430, GAME_HEIGHT);
    for (let x = -430; x <= 1450; x += 210) {
      const peak = 255 + layer * 54 + ((x / 210 + layer) % 2) * 42;
      context.lineTo(x + offset, peak);
      context.lineTo(x + 105 + offset, peak - 78 + layer * 18);
    }
    context.lineTo(1450, GAME_HEIGHT);
    context.fill();
  }
}

function drawPlatform(context: CanvasRenderingContext2D, platform: Platform): void {
  context.fillStyle = "#07131f";
  context.fillRect(platform.x, platform.y, platform.width, platform.height);
  context.fillStyle = platform.tone;
  context.fillRect(platform.x, platform.y, platform.width, 7);
  context.fillStyle = "rgba(234,246,242,0.08)";
  for (let x = platform.x + 12; x < platform.x + platform.width; x += 30) context.fillRect(x, platform.y + 14, 16, 4);
}

function drawLift(context: CanvasRenderingContext2D, lift: MovingLift): void {
  drawPlatform(context, lift);
  context.strokeStyle = `${lift.tone}66`;
  context.beginPath();
  context.moveTo(lift.x + lift.width / 2, lift.minY);
  context.lineTo(lift.x + lift.width / 2, lift.maxY + lift.height);
  context.stroke();
}

function drawCrate(context: CanvasRenderingContext2D, crate: Crate): void {
  context.fillStyle = "#5d3c25";
  context.fillRect(crate.x, crate.y, crate.width, crate.height);
  context.strokeStyle = "#ffbf57";
  context.lineWidth = 3;
  context.strokeRect(crate.x + 3, crate.y + 3, crate.width - 6, crate.height - 6);
  context.beginPath();
  context.moveTo(crate.x + 7, crate.y + 7);
  context.lineTo(crate.x + crate.width - 7, crate.y + crate.height - 7);
  context.moveTo(crate.x + crate.width - 7, crate.y + 7);
  context.lineTo(crate.x + 7, crate.y + crate.height - 7);
  context.stroke();
}

function drawSpark(context: CanvasRenderingContext2D, spark: Spark): void {
  const size = 7 + Math.abs(Math.sin(spark.phase)) * 5;
  context.fillStyle = "rgba(255,191,87,0.2)";
  context.beginPath();
  context.arc(spark.x, spark.y, 17, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffbf57";
  context.fillRect(spark.x - size / 2, spark.y - size / 2, size, size);
}

function drawKeepsake(context: CanvasRenderingContext2D, keepsake: Keepsake): void {
  context.fillStyle = "rgba(82,231,239,0.2)";
  context.beginPath();
  context.arc(keepsake.x, keepsake.y, 27, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#b89451";
  context.beginPath();
  context.arc(keepsake.x, keepsake.y, 17, 0, Math.PI * 2);
  context.fill();
  drawPixelText(context, keepsake.label, keepsake.x, keepsake.y - 10, 14, "#fff1bd", "center");
}

function drawPatrol(context: CanvasRenderingContext2D, patrol: Patrol): void {
  const hopOffset = patrol.kind === "hopper" ? Math.sin(Math.min(1, patrol.hop) * Math.PI) * 34 : 0;
  const y = patrol.y - hopOffset;
  context.fillStyle = patrol.kind === "hopper" ? "#61306d" : "#3f1b49";
  context.fillRect(patrol.x, y + 8, 42, 26);
  context.fillStyle = patrol.kind === "hopper" ? "#ff6f61" : "#ef78ff";
  context.fillRect(patrol.x + 5, y, 32, 24);
  context.fillStyle = "#07131f";
  context.fillRect(patrol.x + 9, y + 7, 6, 6);
  context.fillRect(patrol.x + 27, y + 7, 6, 6);
}

function drawRunner(context: CanvasRenderingContext2D, state: SunsetState): void {
  const player = state.player;
  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0) context.globalAlpha = 0.3;
  context.save();
  context.translate(player.x + player.width / 2, player.y);
  context.scale(player.facing, 1);
  context.fillStyle = "#52e7ef";
  context.fillRect(-13, 3, 26, 34);
  context.fillStyle = "#ff6f61";
  context.fillRect(-18, 12, 36, 12);
  context.fillStyle = "#07131f";
  context.fillRect(-7, 10, 5, 6);
  context.fillRect(4, 10, 5, 6);
  context.fillStyle = "#ffbf57";
  context.fillRect(-14, 37, 11, 10);
  context.fillRect(4, 37, 11, 10);
  if (Math.abs(player.vx) > 330) {
    context.fillStyle = "rgba(82,231,239,0.35)";
    context.fillRect(-58, 14, 36, 8);
  }
  context.restore();
  context.globalAlpha = 1;
}

function drawExit(context: CanvasRenderingContext2D, x: number, keepsakes: number): void {
  const open = keepsakes === 2;
  context.strokeStyle = open ? "#8be58e" : "#ff6f61";
  context.lineWidth = 7;
  context.strokeRect(x, 278, 48, 212);
  context.fillStyle = open ? "rgba(139,229,142,0.22)" : "rgba(255,111,97,0.14)";
  context.fillRect(x + 7, 285, 34, 205);
  drawPixelText(context, open ? "HOME" : "2 TOKENS", x + 24, 330, 12, open ? "#8be58e" : "#ff6f61", "center");
}
