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

type Building = {
  x: number;
  width: number;
  floors: number;
  health: number;
  maxHealth: number;
  color: string;
};

type Drone = { x: number; y: number; vx: number; cooldown: number; health: number };
type Bolt = { x: number; y: number; vx: number; vy: number };

type SmashState = {
  player: { x: number; y: number; vx: number; vy: number; width: number; height: number; facing: number; health: number; invulnerable: number };
  buildings: Building[];
  drones: Drone[];
  bolts: Bolt[];
  particles: Particle[];
  score: number;
  combo: number;
  comboTimer: number;
  attackTimer: number;
  attackFlash: number;
  rage: number;
  rageFlash: number;
  time: number;
  shake: number;
  status: GameStatus;
};

const ground = 486;

export function mountSkylineSmash(canvas: HTMLCanvasElement, options: GameMountOptions): GameController {
  const context = prepareCanvas(canvas);
  const input = new InputState();
  const sound = new ArcadeSfx(options.soundEnabled);
  let state = createState();
  let lastHud = "";

  const emitHud = (): void => {
    const hud: GameHud = {
      score: state.score,
      status: state.status,
      message: state.status === "playing" ? `${Math.ceil(state.time)} seconds // ${state.player.health} armor` : undefined,
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
    state.time = Math.max(0, state.time - delta);
    state.attackTimer = Math.max(0, state.attackTimer - delta);
    state.attackFlash = Math.max(0, state.attackFlash - delta);
    state.rageFlash = Math.max(0, state.rageFlash - delta);
    state.comboTimer = Math.max(0, state.comboTimer - delta);
    state.player.invulnerable = Math.max(0, state.player.invulnerable - delta);
    state.shake = Math.max(0, state.shake - delta * 20);
    if (!state.comboTimer) state.combo = 0;

    const direction = Number(input.down("arrowright", "d")) - Number(input.down("arrowleft", "a"));
    state.player.vx += direction * 1100 * delta;
    state.player.vx *= Math.pow(0.0007, delta);
    state.player.vx = clamp(state.player.vx, -250, 250);
    if (direction) state.player.facing = direction;

    const onGround = state.player.y + state.player.height >= ground - 1;
    if (input.take("arrowup", "w") && onGround) {
      state.player.vy = -470;
      sound.play(170, 0.1, "square", 0.05);
    }
    if (input.take("space", "z", "x") && state.attackTimer <= 0) attack();
    if (input.take("shift") && state.rage >= 100) unleashRage();

    state.player.vy += 1050 * delta;
    state.player.x = clamp(state.player.x + state.player.vx * delta, 6, GAME_WIDTH - state.player.width - 6);
    state.player.y = Math.min(ground - state.player.height, state.player.y + state.player.vy * delta);
    if (state.player.y + state.player.height >= ground) state.player.vy = 0;

    for (const drone of state.drones) {
      drone.x += drone.vx * delta;
      if (drone.x < 30 || drone.x > GAME_WIDTH - 65) drone.vx *= -1;
      drone.cooldown -= delta;
      if (drone.cooldown <= 0) {
        const angle = Math.atan2(state.player.y - drone.y, state.player.x - drone.x);
        state.bolts.push({ x: drone.x + 20, y: drone.y + 12, vx: Math.cos(angle) * 180, vy: Math.sin(angle) * 180 });
        drone.cooldown = 1.8 + Math.random() * 1.8;
        sound.play(520, 0.05, "sawtooth", 0.025);
      }
    }
    state.drones = state.drones.filter((drone) => drone.health > 0);

    for (const bolt of state.bolts) {
      bolt.x += bolt.vx * delta;
      bolt.y += bolt.vy * delta;
      if (state.player.invulnerable <= 0 && intersects(state.player, { x: bolt.x - 5, y: bolt.y - 5, width: 10, height: 10 })) {
        state.player.health -= 1;
        state.player.invulnerable = 1.1;
        bolt.x = -100;
        state.shake = 8;
        burst(state.particles, state.player.x + 30, state.player.y + 35, "#ff6f61", 18, 220);
        sound.play(85, 0.2, "sawtooth", 0.09);
      }
    }
    state.bolts = state.bolts.filter((bolt) => bolt.x > -20 && bolt.x < GAME_WIDTH + 20 && bolt.y > -20 && bolt.y < GAME_HEIGHT + 20);
    updateParticles(state.particles, delta);

    const standingBuildings = state.buildings.filter((building) => building.health > 0).length;
    if (standingBuildings === 0) {
      state.score += Math.ceil(state.time) * 25 + state.player.health * 250;
      state.status = "won";
      sound.play(660, 0.4, "square", 0.08);
    } else if (state.time <= 0 || state.player.health <= 0) {
      state.status = "lost";
      sound.play(55, 0.5, "sawtooth", 0.08);
    }
    emitHud();
  };

  const attack = (): void => {
    state.attackTimer = 0.28;
    state.attackFlash = 0.14;
    const fistX = state.player.x + (state.player.facing > 0 ? state.player.width : -72);
    const attackBox = { x: fistX, y: state.player.y + 16, width: 72, height: 62 };
    let hit = false;

    for (const building of state.buildings) {
      const height = building.floors * 45;
      if (building.health > 0 && intersects(attackBox, { x: building.x, y: ground - height, width: building.width, height })) {
        building.health -= 1;
        state.combo += 1;
        state.comboTimer = 1.6;
        state.score += 100 * state.combo;
        state.rage = Math.min(100, state.rage + 11);
        state.shake = 11;
        const hitY = ground - Math.min(height - 20, 35 + building.health * 31);
        burst(state.particles, building.x + building.width / 2, hitY, building.color, 24, 250);
        if (building.health === 0) {
          state.score += 600;
          burst(state.particles, building.x + building.width / 2, ground - 50, "#ffbf57", 42, 340);
        }
        hit = true;
      }
    }
    for (const drone of state.drones) {
      if (intersects(attackBox, { x: drone.x, y: drone.y, width: 44, height: 25 })) {
        drone.health -= 1;
        state.score += 350;
        state.rage = Math.min(100, state.rage + 18);
        burst(state.particles, drone.x + 20, drone.y + 12, "#52e7ef", 22, 260);
        hit = true;
      }
    }
    sound.play(hit ? 92 : 210, hit ? 0.18 : 0.07, hit ? "square" : "triangle", hit ? 0.1 : 0.04);
  };

  const unleashRage = (): void => {
    state.rage = 0;
    state.rageFlash = 0.55;
    state.shake = 18;
    state.bolts = [];
    let hits = 0;
    for (const building of state.buildings) {
      if (building.health <= 0) continue;
      building.health -= 1;
      hits += 1;
      burst(state.particles, building.x + building.width / 2, ground - building.floors * 32, building.color, 20, 300);
      if (building.health === 0) state.score += 600;
    }
    for (const drone of state.drones) {
      drone.health -= 1;
      hits += 1;
      burst(state.particles, drone.x + 20, drone.y + 12, "#52e7ef", 18, 280);
    }
    state.score += hits * 175;
    sound.noise(0.28, 0.1);
    sound.chord([55, 73.42, 110], 0.35, "sawtooth", 0.075);
  };

  const render = (): void => {
    context.save();
    const shakeX = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    context.translate(shakeX, shakeY);
    drawBackground(context);
    for (const building of state.buildings) drawBuilding(context, building);
    drawBolts(context, state.bolts);
    for (const drone of state.drones) drawDrone(context, drone);
    drawMonster(context, state);
    if (state.rageFlash > 0) {
      context.strokeStyle = `rgba(139,229,142,${state.rageFlash})`;
      context.lineWidth = 12;
      context.beginPath();
      context.arc(state.player.x + 32, state.player.y + 38, (0.6 - state.rageFlash) * 900, 0, Math.PI * 2);
      context.stroke();
    }
    drawParticles(context, state.particles);
    context.restore();

    context.fillStyle = "rgba(4, 11, 18, 0.72)";
    context.fillRect(18, 18, 924, 54);
    drawPixelText(context, `SCORE ${String(state.score).padStart(6, "0")}`, 34, 33, 17, "#ffbf57");
    drawPixelText(context, `ARMOR ${"<".repeat(state.player.health)}${".".repeat(4 - state.player.health)}`, 300, 33, 16, state.player.health > 1 ? "#8be58e" : "#ff6f61");
    drawPixelText(context, `RAGE ${String(Math.floor(state.rage)).padStart(3, "0")}%`, 590, 33, 16, state.rage >= 100 ? "#ffbf57" : "#8be58e");
    drawPixelText(context, `TIME ${Math.ceil(state.time)}`, 900, 33, 17, "#52e7ef", "right");
    if (state.combo > 1 && state.comboTimer > 0) drawPixelText(context, `${state.combo}X BLOCK COMBO`, 480, 95, 24, "#ff6f61", "center");

    if (state.status === "paused") drawOverlay(context, "PAUSED", "THE CITY CAN WAIT", "#52e7ef");
    if (state.status === "won") drawOverlay(context, "SKYLINE CLEARED", `FINAL SCORE ${state.score}`, "#ffbf57");
    if (state.status === "lost") drawOverlay(context, "CITY FOUGHT BACK", `FINAL SCORE ${state.score}`, "#ff6f61");
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

function createState(): SmashState {
  const buildingSpecs: Array<[number, number, number, string]> = [
    [70, 92, 5, "#ff6f61"],
    [235, 106, 7, "#52e7ef"],
    [420, 86, 4, "#ffbf57"],
    [574, 112, 6, "#8be58e"],
    [770, 100, 5, "#ef78ff"],
  ];
  return {
    player: { x: 32, y: ground - 76, vx: 0, vy: 0, width: 64, height: 76, facing: 1, health: 4, invulnerable: 0 },
    buildings: buildingSpecs.map(([x, width, floors, color]) => ({ x, width, floors, health: floors, maxHealth: floors, color })),
    drones: [
      { x: 180, y: 115, vx: 70, cooldown: 1.4, health: 1 },
      { x: 650, y: 150, vx: -55, cooldown: 2.5, health: 1 },
      { x: 840, y: 95, vx: -82, cooldown: 3.2, health: 1 },
    ],
    bolts: [],
    particles: [],
    score: 0,
    combo: 0,
    comboTimer: 0,
    attackTimer: 0,
    attackFlash: 0,
    rage: 0,
    rageFlash: 0,
    time: 78,
    shake: 0,
    status: "playing",
  };
}

function drawBackground(context: CanvasRenderingContext2D): void {
  const gradient = context.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, "#091023");
  gradient.addColorStop(0.55, "#17314a");
  gradient.addColorStop(1, "#07131f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.fillStyle = "#ff6f61";
  context.beginPath();
  context.arc(770, 126, 62, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#18213a";
  context.beginPath();
  context.moveTo(0, 345);
  context.lineTo(135, 215);
  context.lineTo(245, 332);
  context.lineTo(410, 175);
  context.lineTo(530, 335);
  context.lineTo(715, 238);
  context.lineTo(960, 356);
  context.lineTo(960, 500);
  context.lineTo(0, 500);
  context.fill();
  context.strokeStyle = "rgba(82, 231, 239, 0.28)";
  context.lineWidth = 2;
  for (let x = -120; x < 1000; x += 110) {
    context.beginPath();
    context.moveTo(480, 350);
    context.lineTo(x, GAME_HEIGHT);
    context.stroke();
  }
  for (let y = 370; y < GAME_HEIGHT; y += 32) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(GAME_WIDTH, y);
    context.stroke();
  }
  context.fillStyle = "#05090e";
  context.fillRect(0, ground, GAME_WIDTH, GAME_HEIGHT - ground);
  context.fillStyle = "#52e7ef";
  context.fillRect(0, ground, GAME_WIDTH, 3);
}

function drawBuilding(context: CanvasRenderingContext2D, building: Building): void {
  const floorHeight = 45;
  const height = building.floors * floorHeight;
  const destroyed = building.maxHealth - Math.max(0, building.health);
  for (let floor = 0; floor < building.floors; floor += 1) {
    const y = ground - (floor + 1) * floorHeight;
    const isDestroyed = floor < destroyed;
    context.fillStyle = isDestroyed ? "#071018" : "#102635";
    context.fillRect(building.x, y, building.width, floorHeight - 2);
    context.strokeStyle = isDestroyed ? "#1d2930" : building.color;
    context.globalAlpha = isDestroyed ? 0.35 : 0.72;
    context.strokeRect(building.x + 1, y + 1, building.width - 2, floorHeight - 4);
    context.globalAlpha = 1;
    if (!isDestroyed) {
      const columns = Math.max(2, Math.floor(building.width / 24));
      for (let column = 0; column < columns; column += 1) {
        context.fillStyle = (column + floor) % 3 === 0 ? building.color : "#1d5260";
        context.fillRect(building.x + 9 + column * 22, y + 12, 10, 15);
      }
    } else {
      context.fillStyle = "#1e3038";
      context.fillRect(building.x + 8, y + 28, building.width - 16, 7);
    }
  }
  if (building.health > 0) {
    context.fillStyle = building.color;
    context.fillRect(building.x + 10, ground - height - 7, building.width - 20, 4);
  }
}

function drawMonster(context: CanvasRenderingContext2D, state: SmashState): void {
  const { player } = state;
  const flash = player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0;
  if (flash) context.globalAlpha = 0.35;
  context.save();
  context.translate(player.x + player.width / 2, player.y);
  context.scale(player.facing, 1);
  context.fillStyle = "#193b33";
  context.fillRect(-25, 20, 50, 48);
  context.fillStyle = "#8be58e";
  context.fillRect(-21, 6, 42, 48);
  context.fillRect(-30, 27, 12, 36);
  context.fillRect(18, 27, state.attackFlash > 0 ? 50 : 12, 18);
  context.fillStyle = "#d8ffc8";
  context.fillRect(-13, 17, 8, 8);
  context.fillRect(7, 17, 8, 8);
  context.fillStyle = "#07131f";
  context.fillRect(-10, 19, 4, 4);
  context.fillRect(8, 19, 4, 4);
  context.fillStyle = "#ffbf57";
  context.fillRect(-18, 39, 36, 7);
  context.fillStyle = "#295948";
  context.fillRect(-24, 66, 18, 10);
  context.fillRect(7, 66, 18, 10);
  context.restore();
  context.globalAlpha = 1;
}

function drawDrone(context: CanvasRenderingContext2D, drone: Drone): void {
  context.fillStyle = "#091018";
  context.fillRect(drone.x, drone.y, 44, 18);
  context.fillStyle = "#52e7ef";
  context.fillRect(drone.x + 8, drone.y + 5, 28, 8);
  context.fillStyle = "#ff6f61";
  context.fillRect(drone.x + 19, drone.y + 8, 7, 7);
  context.strokeStyle = "#52e7ef";
  context.beginPath();
  context.moveTo(drone.x - 12, drone.y + 9);
  context.lineTo(drone.x + 55, drone.y + 9);
  context.stroke();
}

function drawBolts(context: CanvasRenderingContext2D, bolts: Bolt[]): void {
  for (const bolt of bolts) {
    context.fillStyle = "#ff6f61";
    context.fillRect(bolt.x - 4, bolt.y - 4, 8, 8);
    context.strokeStyle = "rgba(255, 111, 97, 0.45)";
    context.strokeRect(bolt.x - 8, bolt.y - 8, 16, 16);
  }
}
