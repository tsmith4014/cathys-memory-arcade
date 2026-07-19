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

type EnemyKind = "crawler" | "sentinel" | "warden";
type Enemy = { x: number; y: number; width: number; height: number; health: number; maxHealth: number; speed: number; kind: EnemyKind; cooldown: number; flash: number };
type Projectile = { x: number; y: number; vx: number; vy: number; hostile: boolean; life: number };
type Obstacle = { x: number; y: number; width: number; height: number };

type DungeonState = {
  player: { x: number; y: number; width: number; height: number; health: number; vx: number; vy: number; facingX: number; facingY: number; invulnerable: number; attack: number; attackCooldown: number; dash: number; dashCooldown: number };
  room: number;
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  obstacles: Obstacle[];
  keyReady: boolean;
  keyTaken: boolean;
  score: number;
  combo: number;
  comboTimer: number;
  status: GameStatus;
  roomBanner: number;
  shake: number;
};

export function mountDungeonCircuit(canvas: HTMLCanvasElement, options: GameMountOptions): GameController {
  const context = prepareCanvas(canvas);
  const input = new InputState();
  const sound = new ArcadeSfx(options.soundEnabled);
  let state = createState();
  let lastHud = "";

  const emitHud = (): void => {
    const hud: GameHud = {
      score: state.score,
      status: state.status,
      message: state.status === "playing" ? `room ${state.room + 1}/3 // ${state.player.health} charge // chain x${Math.max(1, state.combo)}` : undefined,
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

  const update = (delta: number): void => {
    if (state.status !== "playing") return;
    state.player.invulnerable = Math.max(0, state.player.invulnerable - delta);
    state.player.attack = Math.max(0, state.player.attack - delta);
    state.player.attackCooldown = Math.max(0, state.player.attackCooldown - delta);
    state.player.dash = Math.max(0, state.player.dash - delta);
    state.player.dashCooldown = Math.max(0, state.player.dashCooldown - delta);
    state.roomBanner = Math.max(0, state.roomBanner - delta);
    state.shake = Math.max(0, state.shake - delta * 18);
    state.comboTimer = Math.max(0, state.comboTimer - delta);
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
      state.player.dashCooldown = 0.9;
      state.player.invulnerable = Math.max(state.player.invulnerable, 0.2);
      sound.play(380, 0.12, "sawtooth", 0.05);
    }

    const speed = state.player.dash > 0 ? 650 : 235;
    const magnitude = Math.hypot(horizontal, vertical) || 1;
    state.player.vx = (horizontal / magnitude) * speed;
    state.player.vy = (vertical / magnitude) * speed;
    movePlayer(state, delta);

    updateEnemies(state, delta, sound);
    updateProjectiles(state, delta, sound);
    updateParticles(state.particles, delta, 0);

    state.enemies = state.enemies.filter((enemy) => enemy.health > 0);
    if (!state.enemies.length && !state.keyReady && !state.keyTaken) {
      state.keyReady = true;
      state.score += 750;
      burst(state.particles, GAME_WIDTH / 2, GAME_HEIGHT / 2, "#ffbf57", 34, 260);
      sound.play(720, 0.3, "triangle", 0.08);
    }

    const keyBox = { x: GAME_WIDTH / 2 - 15, y: GAME_HEIGHT / 2 - 15, width: 30, height: 30 };
    if (state.keyReady && intersects(state.player, keyBox)) {
      state.keyReady = false;
      state.keyTaken = true;
      state.score += 300;
      state.player.health = Math.min(5, state.player.health + 1);
      sound.chord([660, 830, 990], 0.18, "square", 0.045);
    }

    const door = { x: 915, y: 216, width: 35, height: 108 };
    if (state.keyTaken && intersects(state.player, door)) {
      if (state.room === 2) {
        state.score += state.player.health * 500;
        state.status = "won";
        sound.play(880, 0.5, "square", 0.1);
      } else loadRoom(state, state.room + 1);
    }
    if (state.player.health <= 0) {
      state.status = "lost";
      sound.play(48, 0.55, "sawtooth", 0.1);
    }
    emitHud();
  };

  const attack = (): void => {
    state.player.attack = 0.16;
    state.player.attackCooldown = 0.3;
    const centerX = state.player.x + state.player.width / 2;
    const centerY = state.player.y + state.player.height / 2;
    const slashX = centerX + state.player.facingX * 48;
    const slashY = centerY + state.player.facingY * 48;
    const attackBox = { x: slashX - 35, y: slashY - 35, width: 70, height: 70 };
    let hit = false;
    for (const enemy of state.enemies) {
      if (intersects(attackBox, enemy)) {
        const wasAlive = enemy.health > 0;
        enemy.health -= state.player.dash > 0 ? 3 : 1;
        enemy.flash = 0.12;
        if (wasAlive && enemy.health <= 0) {
          state.combo += 1;
          state.comboTimer = 2.6;
          state.score += 350 * state.combo;
          if (state.combo % 4 === 0) state.player.health = Math.min(5, state.player.health + 1);
          sound.chord([210 + state.combo * 22, 315 + state.combo * 24], 0.12, "square", 0.05);
        } else state.score += 85;
        state.shake = enemy.kind === "warden" ? 8 : 4;
        burst(state.particles, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.kind === "warden" ? "#ff6f61" : "#ef78ff", 16, 210);
        hit = true;
      }
    }
    sound.play(hit ? 118 : 270, hit ? 0.16 : 0.07, "square", hit ? 0.09 : 0.04);
  };

  const render = (): void => {
    context.save();
    if (state.shake) context.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    drawDungeon(context, state.room, state.obstacles, state.keyTaken);
    if (state.keyReady) drawCircuitKey(context);
    for (const enemy of state.enemies) drawEnemy(context, enemy);
    for (const projectile of state.projectiles) drawProjectile(context, projectile);
    drawPlayer(context, state);
    drawParticles(context, state.particles);
    context.restore();

    context.fillStyle = "rgba(2, 7, 11, 0.78)";
    context.fillRect(18, 18, 924, 54);
    drawPixelText(context, `SCORE ${String(state.score).padStart(6, "0")}`, 34, 33, 17, "#ffbf57");
    drawPixelText(context, `CHARGE ${"+".repeat(state.player.health)}${".".repeat(5 - state.player.health)}`, 335, 33, 17, state.player.health > 1 ? "#8be58e" : "#ff6f61");
    drawPixelText(context, `ROOM ${state.room + 1}/3`, 900, 33, 17, "#52e7ef", "right");
    if (state.combo > 1) drawPixelText(context, `CIRCUIT CHAIN x${state.combo}`, 480, 112, 17, "#ef78ff", "center");
    if (state.roomBanner > 0) drawPixelText(context, roomName(state.room), 480, 94, 24, "#eaf6f2", "center");

    if (state.status === "paused") drawOverlay(context, "PAUSED", "THE CIRCUIT IS HOLDING", "#52e7ef");
    if (state.status === "won") drawOverlay(context, "CIRCUIT BROKEN", `FINAL SCORE ${state.score}`, "#8be58e");
    if (state.status === "lost") drawOverlay(context, "DUNGEON WINS", `REACHED ROOM ${state.room + 1}`, "#ff6f61");
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

function createState(): DungeonState {
  const state: DungeonState = {
    player: { x: 70, y: 248, width: 34, height: 34, health: 5, vx: 0, vy: 0, facingX: 1, facingY: 0, invulnerable: 0, attack: 0, attackCooldown: 0, dash: 0, dashCooldown: 0 },
    room: 0,
    enemies: [],
    projectiles: [],
    particles: [],
    obstacles: [],
    keyReady: false,
    keyTaken: false,
    score: 0,
    combo: 0,
    comboTimer: 0,
    status: "playing",
    roomBanner: 2,
    shake: 0,
  };
  loadRoom(state, 0);
  return state;
}

function loadRoom(state: DungeonState, room: number): void {
  state.room = room;
  state.player.x = 70;
  state.player.y = 248;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.invulnerable = 1;
  state.projectiles = [];
  state.particles = [];
  state.keyReady = false;
  state.keyTaken = false;
  state.combo = 0;
  state.comboTimer = 0;
  state.roomBanner = 2;

  const roomObstacles: Obstacle[][] = [
    [{ x: 310, y: 150, width: 80, height: 80 }, { x: 570, y: 310, width: 100, height: 70 }],
    [{ x: 260, y: 115, width: 60, height: 170 }, { x: 470, y: 300, width: 70, height: 130 }, { x: 700, y: 105, width: 80, height: 150 }],
    [{ x: 250, y: 170, width: 85, height: 85 }, { x: 250, y: 330, width: 85, height: 85 }, { x: 640, y: 170, width: 85, height: 85 }, { x: 640, y: 330, width: 85, height: 85 }],
  ];
  state.obstacles = roomObstacles[room];
  state.enemies = room === 0 ? [
    enemy(540, 150, "crawler"), enemy(710, 365, "crawler"), enemy(440, 390, "sentinel"),
  ] : room === 1 ? [
    enemy(390, 115, "sentinel"), enemy(605, 410, "sentinel"), enemy(820, 160, "crawler"), enemy(760, 390, "crawler"),
  ] : [
    enemy(455, 232, "warden"), enemy(770, 120, "sentinel"), enemy(770, 410, "sentinel"),
  ];
}

function enemy(x: number, y: number, kind: EnemyKind): Enemy {
  if (kind === "warden") return { x, y, width: 72, height: 72, health: 12, maxHealth: 12, speed: 78, kind, cooldown: 0.8, flash: 0 };
  if (kind === "sentinel") return { x, y, width: 42, height: 42, health: 3, maxHealth: 3, speed: 48, kind, cooldown: 1.2 + Math.random(), flash: 0 };
  return { x, y, width: 38, height: 38, health: 2, maxHealth: 2, speed: 105, kind, cooldown: 0, flash: 0 };
}

function movePlayer(state: DungeonState, delta: number): void {
  const previousX = state.player.x;
  state.player.x = clamp(state.player.x + state.player.vx * delta, 28, GAME_WIDTH - 28 - state.player.width);
  if (state.obstacles.some((obstacle) => intersects(state.player, obstacle))) state.player.x = previousX;
  const previousY = state.player.y;
  state.player.y = clamp(state.player.y + state.player.vy * delta, 92, GAME_HEIGHT - 28 - state.player.height);
  if (state.obstacles.some((obstacle) => intersects(state.player, obstacle))) state.player.y = previousY;
}

function updateEnemies(state: DungeonState, delta: number, sound: ArcadeSfx): void {
  const playerCenterX = state.player.x + state.player.width / 2;
  const playerCenterY = state.player.y + state.player.height / 2;
  for (const enemy of state.enemies) {
    enemy.flash = Math.max(0, enemy.flash - delta);
    enemy.cooldown -= delta;
    const centerX = enemy.x + enemy.width / 2;
    const centerY = enemy.y + enemy.height / 2;
    const angle = Math.atan2(playerCenterY - centerY, playerCenterX - centerX);
    if (enemy.kind === "crawler" || enemy.kind === "warden") {
      const speed = enemy.speed * (enemy.kind === "warden" && enemy.health < enemy.maxHealth / 2 ? 1.5 : 1);
      enemy.x += Math.cos(angle) * speed * delta;
      enemy.y += Math.sin(angle) * speed * delta;
    }
    if ((enemy.kind === "sentinel" || enemy.kind === "warden") && enemy.cooldown <= 0) {
      const spread = enemy.kind === "warden" ? [-0.32, 0, 0.32] : [0];
      for (const offset of spread) {
        state.projectiles.push({ x: centerX, y: centerY, vx: Math.cos(angle + offset) * 205, vy: Math.sin(angle + offset) * 205, hostile: true, life: 4 });
      }
      enemy.cooldown = enemy.kind === "warden" ? 1.05 : 1.65;
      sound.play(enemy.kind === "warden" ? 150 : 310, 0.08, "sawtooth", 0.035);
    }
    if (intersects(state.player, enemy) && state.player.invulnerable <= 0) hurtPlayer(state, sound, centerX, centerY);
  }
}

function updateProjectiles(state: DungeonState, delta: number, sound: ArcadeSfx): void {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * delta;
    projectile.y += projectile.vy * delta;
    projectile.life -= delta;
    if (state.obstacles.some((obstacle) => intersects({ x: projectile.x - 4, y: projectile.y - 4, width: 8, height: 8 }, obstacle))) projectile.life = 0;
    if (projectile.hostile && state.player.invulnerable <= 0 && intersects(state.player, { x: projectile.x - 5, y: projectile.y - 5, width: 10, height: 10 })) {
      projectile.life = 0;
      hurtPlayer(state, sound, projectile.x, projectile.y);
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0 && projectile.x > 15 && projectile.x < GAME_WIDTH - 15 && projectile.y > 80 && projectile.y < GAME_HEIGHT - 15);
}

function hurtPlayer(state: DungeonState, sound: ArcadeSfx, x: number, y: number): void {
  state.player.health -= 1;
  state.player.invulnerable = 1.1;
  state.shake = 9;
  const angle = Math.atan2(state.player.y - y, state.player.x - x);
  state.player.x = clamp(state.player.x + Math.cos(angle) * 35, 30, GAME_WIDTH - 65);
  state.player.y = clamp(state.player.y + Math.sin(angle) * 35, 95, GAME_HEIGHT - 65);
  burst(state.particles, state.player.x + 17, state.player.y + 17, "#ff6f61", 22, 250);
  sound.play(72, 0.22, "sawtooth", 0.1);
}

function drawDungeon(context: CanvasRenderingContext2D, room: number, obstacles: Obstacle[], doorOpen: boolean): void {
  const tones = ["#52e7ef", "#ef78ff", "#ff6f61"];
  const tone = tones[room];
  context.fillStyle = "#03080d";
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.fillStyle = "#07131f";
  context.fillRect(24, 82, GAME_WIDTH - 48, GAME_HEIGHT - 106);
  context.strokeStyle = `${tone}33`;
  context.lineWidth = 1;
  for (let x = 24; x <= GAME_WIDTH - 24; x += 42) {
    context.beginPath();
    context.moveTo(x, 82);
    context.lineTo(x, GAME_HEIGHT - 24);
    context.stroke();
  }
  for (let y = 82; y <= GAME_HEIGHT - 24; y += 42) {
    context.beginPath();
    context.moveTo(24, y);
    context.lineTo(GAME_WIDTH - 24, y);
    context.stroke();
  }
  context.strokeStyle = tone;
  context.lineWidth = 4;
  context.strokeRect(24, 82, GAME_WIDTH - 48, GAME_HEIGHT - 106);
  for (const obstacle of obstacles) {
    context.fillStyle = "#0c1c27";
    context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    context.strokeStyle = `${tone}99`;
    context.strokeRect(obstacle.x + 4, obstacle.y + 4, obstacle.width - 8, obstacle.height - 8);
    context.fillStyle = `${tone}22`;
    context.fillRect(obstacle.x + 12, obstacle.y + 12, obstacle.width - 24, obstacle.height - 24);
  }
  context.fillStyle = doorOpen ? "#8be58e" : "#261923";
  context.fillRect(918, 216, 22, 108);
  context.strokeStyle = doorOpen ? "#8be58e" : "#ff6f61";
  context.strokeRect(913, 210, 32, 120);
}

function drawCircuitKey(context: CanvasRenderingContext2D): void {
  const x = GAME_WIDTH / 2;
  const y = GAME_HEIGHT / 2;
  context.fillStyle = "rgba(255, 191, 87, 0.2)";
  context.beginPath();
  context.arc(x, y, 30, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#ffbf57";
  context.lineWidth = 7;
  context.beginPath();
  context.arc(x - 8, y, 9, 0, Math.PI * 2);
  context.moveTo(x + 1, y);
  context.lineTo(x + 22, y);
  context.lineTo(x + 22, y + 10);
  context.stroke();
}

function drawEnemy(context: CanvasRenderingContext2D, enemy: Enemy): void {
  const tone = enemy.kind === "crawler" ? "#ef78ff" : enemy.kind === "sentinel" ? "#52e7ef" : "#ff6f61";
  context.fillStyle = enemy.flash > 0 ? "#eaf6f2" : "#0c1420";
  context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  context.strokeStyle = tone;
  context.lineWidth = enemy.kind === "warden" ? 5 : 3;
  context.strokeRect(enemy.x + 3, enemy.y + 3, enemy.width - 6, enemy.height - 6);
  context.fillStyle = tone;
  const eye = enemy.kind === "warden" ? 18 : 9;
  context.fillRect(enemy.x + enemy.width / 2 - eye / 2, enemy.y + enemy.height / 2 - eye / 2, eye, eye);
  context.fillStyle = "#02070b";
  context.fillRect(enemy.x + enemy.width / 2 - 3, enemy.y + enemy.height / 2 - 3, 6, 6);
  context.fillStyle = "rgba(2, 7, 11, 0.75)";
  context.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
  context.fillStyle = tone;
  context.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / enemy.maxHealth), 5);
}

function drawProjectile(context: CanvasRenderingContext2D, projectile: Projectile): void {
  context.fillStyle = "#ff6f61";
  context.fillRect(projectile.x - 5, projectile.y - 5, 10, 10);
  context.strokeStyle = "rgba(255, 111, 97, 0.5)";
  context.strokeRect(projectile.x - 10, projectile.y - 10, 20, 20);
}

function drawPlayer(context: CanvasRenderingContext2D, state: DungeonState): void {
  const player = state.player;
  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0) context.globalAlpha = 0.3;
  context.fillStyle = "#ffbf57";
  context.fillRect(player.x + 5, player.y, 24, 34);
  context.fillStyle = "#52e7ef";
  context.fillRect(player.x, player.y + 8, 34, 18);
  context.fillStyle = "#07131f";
  context.fillRect(player.x + 10, player.y + 10, 5, 6);
  context.fillRect(player.x + 21, player.y + 10, 5, 6);
  if (player.attack > 0) {
    const centerX = player.x + 17 + player.facingX * 46;
    const centerY = player.y + 17 + player.facingY * 46;
    context.strokeStyle = "#eaf6f2";
    context.lineWidth = 10;
    context.beginPath();
    context.arc(centerX, centerY, 28, -1.1, 1.1);
    context.stroke();
  }
  context.globalAlpha = 1;
}

function roomName(room: number): string {
  return ["ROOM 01 // STATIC VAULT", "ROOM 02 // FALSE EXIT", "ROOM 03 // THE WARDEN"][room];
}
