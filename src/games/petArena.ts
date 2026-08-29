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
  loadGameBackdrop,
  prepareCanvas,
  updateParticles,
  type GameController,
  type GameHud,
  type GameMountOptions,
  type GameStatus,
  type Particle,
} from "./runtime";

type EnemyKind = "wisp" | "ram" | "turret" | "warden";
type PickupKind = "repair" | "overdrive";
type Point = { x: number; y: number };
type Beacon = Point & { id: number; integrity: number; repair: number; pulse: number };
type Enemy = Point & {
  id: number;
  kind: EnemyKind;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  attackCooldown: number;
  flash: number;
  phase: number;
};
type Bolt = Point & { previousX: number; previousY: number; vx: number; vy: number; life: number; power: number };
type EnemyBolt = Point & { vx: number; vy: number; life: number; radius: number };
type Pickup = Point & { kind: PickupKind; life: number; phase: number };
type Dialogue = { speaker: string; text: string; timer: number };

type PetArenaState = {
  dragon: Point & {
    vx: number;
    vy: number;
    facingX: number;
    facingY: number;
    health: number;
    invulnerable: number;
    fireCooldown: number;
    ward: number;
    wardCooldown: number;
    overdrive: number;
    wing: number;
  };
  beacons: Beacon[];
  enemies: Enemy[];
  bolts: Bolt[];
  enemyBolts: EnemyBolt[];
  pickups: Pickup[];
  particles: Particle[];
  stars: Array<Point & { depth: number }>;
  wave: number;
  pendingSpawns: number;
  spawnCooldown: number;
  intermission: number;
  nextEnemyId: number;
  bossSpawned: boolean;
  bossDefeated: boolean;
  score: number;
  combo: number;
  comboTimer: number;
  elapsed: number;
  shake: number;
  status: GameStatus;
  dialogue: Dialogue | null;
  banner: { title: string; subtitle: string; timer: number } | null;
  couchGunner: boolean;
  rng: number;
};

export const PET_ARENA_TUNING = {
  dragonSpeed: 265,
  boltSpeed: 690,
  wardDuration: 4,
  wardCooldown: 12,
  beaconRepairTime: 2.8,
  waves: [8, 12, 8],
} as const;

const beaconColors = ["#52e7ef", "#ffbf57", "#8be58e", "#ff6f61"];
const arenaBounds = { left: 92, right: 868, top: 116, bottom: 470 };

export function mountPetArena(canvas: HTMLCanvasElement, options: GameMountOptions): GameController {
  const context = prepareCanvas(canvas);
  const input = new InputState();
  const sound = new ArcadeSfx(options.soundEnabled);
  const backdrop = loadGameBackdrop("pet-arena-guest-v1.webp");
  let state = createState();
  let lastHud = "";

  const speak = (speaker: string, text: string, seconds = 4): void => {
    state.dialogue = { speaker, text, timer: seconds };
  };

  const showBanner = (title: string, subtitle: string, seconds = 2.4): void => {
    state.banner = { title, subtitle, timer: seconds };
  };

  const emitHud = (): void => {
    const online = state.beacons.filter((beacon) => beacon.integrity > 0).length;
    const ward = state.dragon.ward > 0
      ? `ward ${state.dragon.ward.toFixed(1)}s`
      : state.dragon.wardCooldown <= 0
        ? "ward ready"
        : `ward ${state.dragon.wardCooldown.toFixed(1)}s`;
    const hud: GameHud = {
      score: state.score,
      status: state.status,
      message: state.status === "playing"
        ? `wave ${Math.max(1, state.wave)}/3 // ${online}/4 stations // ${state.dragon.health} armor // ${ward}${state.couchGunner ? " // couch gunner linked" : ""}`
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

  const spawnEnemy = (): void => {
    const edge = Math.floor(random(state) * 4);
    const point = spawnPoint(edge, random(state));
    const roll = random(state);
    const kind: EnemyKind = state.wave === 3 && !state.bossSpawned
      ? "warden"
      : roll < 0.5
        ? "wisp"
        : roll < 0.78
          ? "ram"
          : "turret";
    if (kind === "warden") state.bossSpawned = true;
    const stats = enemyStats(kind, state.wave);
    state.enemies.push({
      id: state.nextEnemyId,
      kind,
      x: point.x,
      y: point.y,
      radius: stats.radius,
      health: stats.health,
      maxHealth: stats.health,
      speed: stats.speed,
      attackCooldown: 0.7 + random(state),
      flash: 0,
      phase: random(state) * Math.PI * 2,
    });
    state.nextEnemyId += 1;
    if (kind === "warden") {
      showBanner("NULL WARDEN", "It has twelve arms and no sense of personal space", 3.2);
      speak("ROOK", "There is the breach keeper. Large, theatrical, and absolutely standing on our extension cord.", 5.2);
      sound.chord([65.41, 98, 130.81], 0.7, "sawtooth", 0.06);
    }
  };

  const fire = (): void => {
    const target = nearestEnemy(state.dragon, state.enemies);
    let directionX = state.dragon.facingX;
    let directionY = state.dragon.facingY;
    const aimingX = Number(input.down("arrowright")) - Number(input.down("arrowleft"));
    const aimingY = Number(input.down("arrowdown")) - Number(input.down("arrowup"));
    if (aimingX || aimingY) {
      const magnitude = Math.hypot(aimingX, aimingY) || 1;
      directionX = aimingX / magnitude;
      directionY = aimingY / magnitude;
      state.couchGunner = true;
    } else if (target) {
      const magnitude = Math.hypot(target.x - state.dragon.x, target.y - state.dragon.y) || 1;
      directionX = (target.x - state.dragon.x) / magnitude;
      directionY = (target.y - state.dragon.y) / magnitude;
    }
    state.dragon.facingX = directionX;
    state.dragon.facingY = directionY;
    const overdrive = state.dragon.overdrive > 0;
    state.dragon.fireCooldown = overdrive ? 0.085 : 0.17;
    const spread = overdrive ? [-0.11, 0, 0.11] : [0];
    for (const offset of spread) {
      const angle = Math.atan2(directionY, directionX) + offset;
      const x = state.dragon.x + Math.cos(angle) * 28;
      const y = state.dragon.y + Math.sin(angle) * 28;
      state.bolts.push({
        x,
        y,
        previousX: state.dragon.x,
        previousY: state.dragon.y,
        vx: Math.cos(angle) * PET_ARENA_TUNING.boltSpeed,
        vy: Math.sin(angle) * PET_ARENA_TUNING.boltSpeed,
        life: 1.1,
        power: overdrive ? 1.25 : 1,
      });
    }
    sound.play(overdrive ? 420 : 330, 0.09, "sawtooth", 0.035, overdrive ? 880 : 620);
  };

  const activateWard = (): void => {
    state.dragon.ward = PET_ARENA_TUNING.wardDuration;
    state.dragon.wardCooldown = PET_ARENA_TUNING.wardCooldown;
    state.dragon.invulnerable = PET_ARENA_TUNING.wardDuration;
    for (const beacon of state.beacons) {
      if (beacon.integrity > 0) beacon.integrity = Math.min(100, beacon.integrity + 16);
    }
    burst(state.particles, state.dragon.x, state.dragon.y, "#52e7ef", 46, 300);
    speak("WARDEN", "Shield is up. Four seconds. Spend them like you found them in the couch.", 3.5);
    sound.chord([146.83, 220, 329.63, 440], 0.48, "sine", 0.055);
  };

  const damageDragon = (amount: number, x: number, y: number): void => {
    if (state.dragon.ward > 0) {
      burst(state.particles, state.dragon.x, state.dragon.y, "#52e7ef", 6, 115);
      return;
    }
    if (state.dragon.invulnerable > 0) return;
    state.dragon.health = Math.max(0, state.dragon.health - amount);
    state.dragon.invulnerable = 1.1;
    const magnitude = Math.hypot(state.dragon.x - x, state.dragon.y - y) || 1;
    state.dragon.vx += ((state.dragon.x - x) / magnitude) * 165;
    state.dragon.vy += ((state.dragon.y - y) / magnitude) * 165;
    state.shake = 10;
    burst(state.particles, state.dragon.x, state.dragon.y, "#ff6f61", 26, 260);
    sound.noise(0.14, 0.075);
    if (state.dragon.health <= 0) {
      state.status = "lost";
      speak("ROOK", "Dragon down. The floor manager has authorized a deeply unofficial do-over.", 8);
    }
  };

  const damageBeacon = (beacon: Beacon, amount: number): void => {
    if (beacon.integrity <= 0) return;
    const protectedByWard = state.dragon.ward > 0;
    beacon.integrity = Math.max(0, beacon.integrity - (protectedByWard ? amount * 0.12 : amount));
    beacon.pulse = 1;
    if (beacon.integrity <= 0) {
      beacon.repair = 0;
      showBanner(`STATION ${beacon.id + 1} DARK`, "Hold the dragon over it to reboot", 2.6);
      sound.play(74, 0.7, "sawtooth", 0.075, 38);
    }
  };

  const destroyEnemy = (enemy: Enemy): void => {
    const index = state.enemies.indexOf(enemy);
    if (index >= 0) state.enemies.splice(index, 1);
    state.combo += 1;
    state.comboTimer = 2.2;
    const multiplier = Math.min(6, Math.max(1, state.combo));
    state.score += (enemy.kind === "warden" ? 8000 : enemy.kind === "ram" ? 420 : enemy.kind === "turret" ? 520 : 260) * multiplier;
    state.shake = enemy.kind === "warden" ? 16 : 4;
    burst(state.particles, enemy.x, enemy.y, enemy.kind === "warden" ? "#ffbf57" : "#52e7ef", enemy.kind === "warden" ? 70 : 22, enemy.kind === "warden" ? 390 : 230);
    sound.play(enemy.kind === "warden" ? 82 : 140, enemy.kind === "warden" ? 0.65 : 0.14, "square", 0.065, 48);
    if (enemy.kind === "warden") {
      state.bossDefeated = true;
      showBanner("BREACH KEEPER DOWN", "Bring every station back online", 3.4);
      speak("MOXIE", "WOOF. (Rook has translated this as: obviously.)", 4.3);
    } else if (random(state) < 0.16) {
      state.pickups.push({
        x: enemy.x,
        y: enemy.y,
        kind: random(state) < 0.55 ? "repair" : "overdrive",
        life: 10,
        phase: random(state) * Math.PI * 2,
      });
    }
  };

  const updateEnemies = (delta: number): void => {
    for (const enemy of [...state.enemies]) {
      enemy.flash = Math.max(0, enemy.flash - delta);
      enemy.attackCooldown -= delta;
      enemy.phase += delta * (enemy.kind === "wisp" ? 5 : 2.4);
      const targetBeacon = nearestOnlineBeacon(enemy, state.beacons);
      const targetsDragon = enemy.kind === "warden" || !targetBeacon || distance(enemy, state.dragon) < 138;
      const target = targetsDragon ? state.dragon : targetBeacon;
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const magnitude = Math.hypot(dx, dy) || 1;
      const desiredDistance = enemy.kind === "turret" ? 185 : enemy.kind === "warden" ? 116 : 28;
      if (magnitude > desiredDistance) {
        const sway = enemy.kind === "wisp" ? Math.sin(enemy.phase) * 32 : 0;
        enemy.x += ((dx / magnitude) * enemy.speed + (-dy / magnitude) * sway) * delta;
        enemy.y += ((dy / magnitude) * enemy.speed + (dx / magnitude) * sway) * delta;
      }
      if (enemy.attackCooldown <= 0) {
        if (enemy.kind === "turret" || enemy.kind === "warden") {
          const speed = enemy.kind === "warden" ? 250 : 205;
          const count = enemy.kind === "warden" ? 5 : 1;
          for (let shot = 0; shot < count; shot += 1) {
            const angle = Math.atan2(dy, dx) + (shot - (count - 1) / 2) * 0.17;
            state.enemyBolts.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 3.2, radius: enemy.kind === "warden" ? 7 : 5 });
          }
          enemy.attackCooldown = enemy.kind === "warden" ? 1.15 : 1.75;
          sound.play(105, 0.12, "triangle", 0.025, 70);
        } else if (magnitude < 42) {
          if (targetsDragon) damageDragon(enemy.kind === "ram" ? 2 : 1, enemy.x, enemy.y);
          else if (targetBeacon) damageBeacon(targetBeacon, enemy.kind === "ram" ? 24 : 10);
          enemy.attackCooldown = enemy.kind === "ram" ? 1.25 : 0.72;
        }
      }
      if (distance(enemy, state.dragon) < enemy.radius + 22) damageDragon(enemy.kind === "warden" ? 2 : 1, enemy.x, enemy.y);
    }
  };

  const updateProjectiles = (delta: number): void => {
    for (const bolt of state.bolts) {
      bolt.previousX = bolt.x;
      bolt.previousY = bolt.y;
      bolt.x += bolt.vx * delta;
      bolt.y += bolt.vy * delta;
      bolt.life -= delta;
      for (const enemy of [...state.enemies]) {
        if (bolt.life <= 0 || distance(bolt, enemy) > enemy.radius + 7) continue;
        enemy.health -= bolt.power;
        enemy.flash = 0.09;
        bolt.life = 0;
        burst(state.particles, bolt.x, bolt.y, enemy.kind === "warden" ? "#ffbf57" : "#8be58e", 7, 120);
        if (enemy.health <= 0) destroyEnemy(enemy);
      }
    }
    state.bolts = state.bolts.filter((bolt) => bolt.life > 0 && bolt.x > 20 && bolt.x < 940 && bolt.y > 50 && bolt.y < 520);

    for (const bolt of state.enemyBolts) {
      bolt.x += bolt.vx * delta;
      bolt.y += bolt.vy * delta;
      bolt.life -= delta;
      if (distance(bolt, state.dragon) < bolt.radius + 20) {
        damageDragon(1, bolt.x, bolt.y);
        bolt.life = 0;
        continue;
      }
      for (const beacon of state.beacons) {
        if (beacon.integrity <= 0 || distance(bolt, beacon) > bolt.radius + 22) continue;
        damageBeacon(beacon, 8);
        bolt.life = 0;
        break;
      }
    }
    state.enemyBolts = state.enemyBolts.filter((bolt) => bolt.life > 0 && bolt.x > 30 && bolt.x < 930 && bolt.y > 70 && bolt.y < 510);
  };

  const updateBeacons = (delta: number): void => {
    for (const beacon of state.beacons) {
      beacon.pulse = Math.max(0, beacon.pulse - delta * 2.6);
      if (beacon.integrity > 0) {
        beacon.repair = 0;
        continue;
      }
      if (distance(beacon, state.dragon) < 66) {
        beacon.repair += delta;
        if (beacon.repair >= PET_ARENA_TUNING.beaconRepairTime) {
          beacon.integrity = 42;
          beacon.repair = 0;
          state.score += 1200;
          burst(state.particles, beacon.x, beacon.y, beaconColors[beacon.id], 38, 270);
          showBanner(`STATION ${beacon.id + 1} ONLINE`, "Crew link restored", 2.2);
          sound.chord([220, 329.63, 493.88], 0.35, "triangle", 0.05);
        }
      } else {
        beacon.repair = Math.max(0, beacon.repair - delta * 0.45);
      }
    }
  };

  const updatePickups = (delta: number): void => {
    for (const pickup of state.pickups) {
      pickup.life -= delta;
      pickup.phase += delta * 4;
      if (distance(pickup, state.dragon) > 33) continue;
      pickup.life = 0;
      if (pickup.kind === "repair") {
        state.dragon.health = Math.min(10, state.dragon.health + 2);
        for (const beacon of state.beacons) if (beacon.integrity > 0) beacon.integrity = Math.min(100, beacon.integrity + 8);
        speak("ROOK", "Repair capsule caught. It is mostly tape, optimism, and one legally distinct mushroom.", 3.6);
      } else {
        state.dragon.overdrive = 7;
        speak("GUNNER", "Three barrels, seven seconds. The safety committee has left the building.", 3.6);
      }
      state.score += 350;
      burst(state.particles, pickup.x, pickup.y, pickup.kind === "repair" ? "#8be58e" : "#ffbf57", 28, 220);
      sound.chord(pickup.kind === "repair" ? [261.63, 329.63, 392] : [196, 293.66, 440], 0.3, "square", 0.04);
    }
    state.pickups = state.pickups.filter((pickup) => pickup.life > 0);
  };

  const advanceWave = (delta: number): void => {
    if (state.pendingSpawns > 0) {
      state.spawnCooldown -= delta;
      if (state.spawnCooldown <= 0) {
        spawnEnemy();
        state.pendingSpawns -= 1;
        state.spawnCooldown = state.wave === 3 ? 0.72 : Math.max(0.48, 1.05 - state.wave * 0.13);
      }
      return;
    }
    if (state.enemies.length > 0) return;
    if (state.wave >= 3 && state.bossDefeated) {
      if (state.beacons.every((beacon) => beacon.integrity > 0)) {
        state.status = "won";
        state.score += 12000 + Math.round(state.beacons.reduce((sum, beacon) => sum + beacon.integrity, 0) * 20);
        speak("ROOK", "Breach closed. Crew counted. Dog unrepentant. That is a clean enough landing for tonight.", 10);
        sound.chord([130.81, 196, 261.63, 329.63, 392, 523.25], 1.2, "triangle", 0.055);
      }
      return;
    }
    state.intermission -= delta;
    if (state.intermission > 0) return;
    state.wave += 1;
    state.pendingSpawns = PET_ARENA_TUNING.waves[state.wave - 1];
    state.spawnCooldown = 0.35;
    state.intermission = 3.2;
    const subtitles = ["THE PORTAL NOTICED US", "THE FLOOR STARTS FIGHTING BACK", "KEEPER OF THE LAST EXIT"];
    showBanner(`WAVE ${state.wave}`, subtitles[state.wave - 1], 2.7);
    if (state.wave === 2) speak("PILOT", "Second wave. Same plan, except now the plan has teeth.", 4.2);
  };

  const update = (delta: number): void => {
    if (state.status !== "playing") return;
    state.elapsed += delta;
    state.dragon.invulnerable = Math.max(0, state.dragon.invulnerable - delta);
    state.dragon.fireCooldown = Math.max(0, state.dragon.fireCooldown - delta);
    state.dragon.ward = Math.max(0, state.dragon.ward - delta);
    state.dragon.wardCooldown = Math.max(0, state.dragon.wardCooldown - delta);
    state.dragon.overdrive = Math.max(0, state.dragon.overdrive - delta);
    state.comboTimer = Math.max(0, state.comboTimer - delta);
    state.shake = Math.max(0, state.shake - delta * 22);
    state.dragon.wing += delta * (state.dragon.overdrive > 0 ? 10 : 7);
    if (state.comboTimer <= 0) state.combo = 0;
    if (state.dialogue) {
      state.dialogue.timer -= delta;
      if (state.dialogue.timer <= 0) state.dialogue = null;
    }
    if (state.banner) {
      state.banner.timer -= delta;
      if (state.banner.timer <= 0) state.banner = null;
    }

    const moveX = Number(input.down("d")) - Number(input.down("a"));
    const moveY = Number(input.down("s")) - Number(input.down("w"));
    const moveMagnitude = Math.hypot(moveX, moveY) || 1;
    const speed = PET_ARENA_TUNING.dragonSpeed * (state.dragon.ward > 0 ? 1.15 : 1);
    state.dragon.vx += ((moveX / moveMagnitude) * speed - state.dragon.vx) * Math.min(1, delta * 9);
    state.dragon.vy += ((moveY / moveMagnitude) * speed - state.dragon.vy) * Math.min(1, delta * 9);
    state.dragon.x = clamp(state.dragon.x + state.dragon.vx * delta, arenaBounds.left, arenaBounds.right);
    state.dragon.y = clamp(state.dragon.y + state.dragon.vy * delta, arenaBounds.top, arenaBounds.bottom);

    const aimX = Number(input.down("arrowright")) - Number(input.down("arrowleft"));
    const aimY = Number(input.down("arrowdown")) - Number(input.down("arrowup"));
    if (aimX || aimY) {
      const aimMagnitude = Math.hypot(aimX, aimY) || 1;
      state.dragon.facingX = aimX / aimMagnitude;
      state.dragon.facingY = aimY / aimMagnitude;
      state.couchGunner = true;
    } else if (moveX || moveY) {
      state.dragon.facingX = moveX / moveMagnitude;
      state.dragon.facingY = moveY / moveMagnitude;
    }
    if (input.down("space", "z") && state.dragon.fireCooldown <= 0) fire();
    if (input.take("shift", "x") && state.dragon.wardCooldown <= 0) activateWard();

    updateProjectiles(delta);
    updateEnemies(delta);
    updateBeacons(delta);
    updatePickups(delta);
    updateParticles(state.particles, delta, 36);
    advanceWave(delta);
    emitHud();
  };

  const draw = (): void => {
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    drawGameBackdrop(context, backdrop, 0.92, Math.sin(state.elapsed * 0.07) * 0.3);
    context.save();
    if (state.shake > 0) context.translate(Math.sin(state.elapsed * 137) * state.shake * 0.5, Math.cos(state.elapsed * 173) * state.shake * 0.5);
    drawAtmosphere(context, state);
    drawArenaRim(context, state);
    for (const beacon of state.beacons) drawBeacon(context, beacon, state.elapsed);
    for (const pickup of state.pickups) drawPickup(context, pickup);
    for (const bolt of state.enemyBolts) drawEnemyBolt(context, bolt);
    for (const enemy of state.enemies) drawEnemy(context, enemy, state.elapsed);
    for (const bolt of state.bolts) drawBolt(context, bolt);
    drawDragon(context, state);
    drawParticles(context, state.particles);
    context.restore();
    drawHUD(context, state);
    if (state.dialogue && state.status === "playing") drawDialogue(context, state.dialogue);
    if (state.banner && state.status === "playing") drawBanner(context, state.banner);
    if (state.status === "won") drawOverlay(context, "BREACH SEALED", "FOUR STATIONS ANSWER // Moxie takes credit", "#8be58e");
    if (state.status === "lost") drawOverlay(context, "DRAGON DOWN", "THE ROOM KEPT YOUR PLACE", "#ff6f61");
    drawScreenFinish(context, "#52e7ef");
  };

  const loop = new FrameLoop((delta) => {
    update(delta);
    draw();
  });
  emitHud();

  return {
    destroy: () => { loop.stop(); sound.destroy(); input.clear(); },
    restart,
    setSoundEnabled: (enabled) => sound.setEnabled(enabled),
    setInput: (key, active) => {
      if (active && ["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key.toLowerCase())) {
        state.couchGunner = true;
      }
      input.set(key, active);
    },
    togglePause,
  };
}

function createState(): PetArenaState {
  const stars: PetArenaState["stars"] = [];
  let seed = 0x86cafe;
  for (let index = 0; index < 52; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const x = (seed / 0x100000000) * GAME_WIDTH;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const y = 70 + (seed / 0x100000000) * 390;
    stars.push({ x, y, depth: 0.25 + ((index * 37) % 100) / 100 });
  }
  return {
    dragon: { x: 480, y: 365, vx: 0, vy: 0, facingX: 0, facingY: -1, health: 10, invulnerable: 1.4, fireCooldown: 0, ward: 0, wardCooldown: 0, overdrive: 0, wing: 0 },
    beacons: [
      { id: 0, x: 185, y: 190, integrity: 100, repair: 0, pulse: 0 },
      { id: 1, x: 775, y: 190, integrity: 100, repair: 0, pulse: 0 },
      { id: 2, x: 205, y: 410, integrity: 100, repair: 0, pulse: 0 },
      { id: 3, x: 755, y: 410, integrity: 100, repair: 0, pulse: 0 },
    ],
    enemies: [],
    bolts: [],
    enemyBolts: [],
    pickups: [],
    particles: [],
    stars,
    wave: 0,
    pendingSpawns: 0,
    spawnCooldown: 0,
    intermission: 2.8,
    nextEnemyId: 1,
    bossSpawned: false,
    bossDefeated: false,
    score: 0,
    combo: 0,
    comboTimer: 0,
    elapsed: 0,
    shake: 0,
    status: "playing",
    dialogue: { speaker: "ROOK", text: "Four stations fell through the breach. Keep them talking while I find the part of the manual that is not on fire.", timer: 5.5 },
    banner: { title: "DRAGON CREW", subtitle: "PILOT + GUNNER // OR ONE VERY BUSY PERSON", timer: 3.6 },
    couchGunner: false,
    rng: 0x86cafe,
  };
}

function random(state: PetArenaState): number {
  state.rng = (state.rng * 1664525 + 1013904223) >>> 0;
  return state.rng / 0x100000000;
}

function spawnPoint(edge: number, position: number): Point {
  if (edge === 0) return { x: arenaBounds.left, y: arenaBounds.top + position * (arenaBounds.bottom - arenaBounds.top) };
  if (edge === 1) return { x: arenaBounds.right, y: arenaBounds.top + position * (arenaBounds.bottom - arenaBounds.top) };
  if (edge === 2) return { x: arenaBounds.left + position * (arenaBounds.right - arenaBounds.left), y: arenaBounds.top };
  return { x: arenaBounds.left + position * (arenaBounds.right - arenaBounds.left), y: arenaBounds.bottom };
}

function enemyStats(kind: EnemyKind, wave: number): { radius: number; health: number; speed: number } {
  if (kind === "warden") return { radius: 43, health: 42, speed: 48 };
  if (kind === "ram") return { radius: 22, health: 4 + wave, speed: 66 + wave * 4 };
  if (kind === "turret") return { radius: 18, health: 3 + wave, speed: 42 };
  return { radius: 13, health: 2 + Math.floor(wave / 2), speed: 92 + wave * 8 };
}

function distance(first: Point, second: Point): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function nearestEnemy(point: Point, enemies: Enemy[]): Enemy | null {
  let best: Enemy | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const enemy of enemies) {
    const candidate = distance(point, enemy);
    if (candidate < bestDistance) {
      best = enemy;
      bestDistance = candidate;
    }
  }
  return best;
}

function nearestOnlineBeacon(point: Point, beacons: Beacon[]): Beacon | null {
  let best: Beacon | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const beacon of beacons) {
    if (beacon.integrity <= 0) continue;
    const candidate = distance(point, beacon);
    if (candidate < bestDistance) {
      best = beacon;
      bestDistance = candidate;
    }
  }
  return best;
}

function drawAtmosphere(context: CanvasRenderingContext2D, state: PetArenaState): void {
  const wash = context.createLinearGradient(0, 70, 0, GAME_HEIGHT);
  wash.addColorStop(0, "rgba(2, 8, 20, 0.05)");
  wash.addColorStop(1, "rgba(1, 5, 12, 0.46)");
  context.fillStyle = wash;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  for (const star of state.stars) {
    const alpha = 0.16 + (Math.sin(state.elapsed * (0.6 + star.depth) + star.x) + 1) * 0.08;
    context.globalAlpha = alpha;
    context.fillStyle = star.depth > 0.72 ? "#52e7ef" : "#eaf6f2";
    context.fillRect(star.x, star.y, star.depth > 0.7 ? 2 : 1, star.depth > 0.7 ? 2 : 1);
  }
  context.globalAlpha = 1;
  const portal = context.createRadialGradient(480, 166, 12, 480, 166, 122);
  portal.addColorStop(0, "rgba(255, 255, 255, 0.42)");
  portal.addColorStop(0.18, "rgba(82, 231, 239, 0.26)");
  portal.addColorStop(0.5, "rgba(255, 111, 97, 0.11)");
  portal.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = portal;
  context.beginPath();
  context.ellipse(480, 166, 130 + Math.sin(state.elapsed) * 5, 55 + Math.cos(state.elapsed * 1.2) * 3, 0, 0, Math.PI * 2);
  context.fill();
}

function drawArenaRim(context: CanvasRenderingContext2D, state: PetArenaState): void {
  context.save();
  context.strokeStyle = "rgba(82, 231, 239, 0.3)";
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(480, 304, 405, 205, 0, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = "rgba(255, 191, 87, 0.13)";
  context.lineWidth = 7;
  context.setLineDash([14, 28]);
  context.lineDashOffset = -state.elapsed * 18;
  context.beginPath();
  context.ellipse(480, 304, 390, 191, 0, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawBeacon(context: CanvasRenderingContext2D, beacon: Beacon, elapsed: number): void {
  const color = beaconColors[beacon.id];
  const online = beacon.integrity > 0;
  context.save();
  context.translate(beacon.x, beacon.y);
  context.globalAlpha = online ? 1 : 0.42;
  const glow = context.createRadialGradient(0, 0, 3, 0, 0, 42);
  glow.addColorStop(0, `${color}aa`);
  glow.addColorStop(0.35, `${color}32`);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(0, 0, 42 + Math.sin(elapsed * 3 + beacon.id) * 3, 0, Math.PI * 2);
  context.fill();
  context.rotate(elapsed * 0.35 * (beacon.id % 2 ? -1 : 1));
  context.strokeStyle = online ? color : "#61737b";
  context.lineWidth = beacon.pulse > 0 ? 5 : 2;
  context.setLineDash([7, 6]);
  context.strokeRect(-22, -22, 44, 44);
  context.rotate(-elapsed * 0.7 * (beacon.id % 2 ? -1 : 1));
  context.fillStyle = online ? color : "#283841";
  context.fillRect(-6, -6, 12, 12);
  context.restore();
  context.fillStyle = "rgba(3, 10, 15, 0.78)";
  context.fillRect(beacon.x - 25, beacon.y + 29, 50, 5);
  context.fillStyle = online ? color : "#ff6f61";
  const progress = online ? beacon.integrity / 100 : beacon.repair / PET_ARENA_TUNING.beaconRepairTime;
  context.fillRect(beacon.x - 25, beacon.y + 29, 50 * clamp(progress, 0, 1), 5);
  if (!online && beacon.repair > 0) drawPixelText(context, "REBOOT", beacon.x, beacon.y + 39, 9, color, "center");
}

function drawDragon(context: CanvasRenderingContext2D, state: PetArenaState): void {
  const dragon = state.dragon;
  const angle = Math.atan2(dragon.facingY, dragon.facingX) + Math.PI / 2;
  const wing = Math.sin(dragon.wing) * 8;
  context.save();
  context.translate(dragon.x + 7, dragon.y + 10);
  context.scale(1, 0.48);
  context.fillStyle = "rgba(0, 0, 0, 0.5)";
  context.beginPath();
  context.arc(0, 0, 34, 0, Math.PI * 2);
  context.fill();
  context.restore();
  context.save();
  context.translate(dragon.x, dragon.y);
  context.rotate(angle);
  if (dragon.invulnerable > 0 && Math.floor(dragon.invulnerable * 12) % 2 === 0) context.globalAlpha = 0.6;
  if (dragon.ward > 0) {
    context.strokeStyle = "rgba(82, 231, 239, 0.76)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, 39 + Math.sin(state.elapsed * 9) * 3, 0, Math.PI * 2);
    context.stroke();
  }
  context.fillStyle = "#112b43";
  context.strokeStyle = "#52e7ef";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-8, 2);
  context.lineTo(-35 - wing, 20);
  context.lineTo(-24, -5);
  context.closePath();
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(8, 2);
  context.lineTo(35 + wing, 20);
  context.lineTo(24, -5);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = "#071827";
  context.beginPath();
  context.ellipse(0, 2, 14, 27, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = dragon.overdrive > 0 ? "#ffbf57" : "#52e7ef";
  context.beginPath();
  context.arc(0, -2, 5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#1b3f58";
  context.beginPath();
  context.moveTo(0, -31);
  context.lineTo(-11, -17);
  context.lineTo(11, -17);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function drawEnemy(context: CanvasRenderingContext2D, enemy: Enemy, elapsed: number): void {
  const color = enemy.kind === "warden" ? "#ffbf57" : enemy.kind === "ram" ? "#ff6f61" : enemy.kind === "turret" ? "#ef78ff" : "#8be58e";
  context.save();
  context.translate(enemy.x, enemy.y);
  context.rotate(enemy.kind === "turret" ? elapsed * 0.9 : Math.sin(enemy.phase) * 0.15);
  context.shadowColor = color;
  context.shadowBlur = enemy.kind === "warden" ? 24 : 12;
  context.fillStyle = enemy.flash > 0 ? "#ffffff" : "rgba(4, 13, 23, 0.92)";
  context.strokeStyle = color;
  context.lineWidth = enemy.kind === "warden" ? 4 : 2;
  if (enemy.kind === "wisp") {
    context.beginPath();
    context.moveTo(0, -enemy.radius);
    context.lineTo(enemy.radius, 0);
    context.lineTo(0, enemy.radius);
    context.lineTo(-enemy.radius, 0);
    context.closePath();
  } else if (enemy.kind === "ram") {
    context.beginPath();
    context.moveTo(-enemy.radius, -enemy.radius * 0.6);
    context.lineTo(enemy.radius * 0.65, -enemy.radius);
    context.lineTo(enemy.radius, enemy.radius * 0.6);
    context.lineTo(-enemy.radius * 0.7, enemy.radius);
    context.closePath();
  } else {
    context.beginPath();
    const points = enemy.kind === "warden" ? 12 : 6;
    for (let index = 0; index < points; index += 1) {
      const angle = (index / points) * Math.PI * 2 - Math.PI / 2;
      const radius = index % 2 ? enemy.radius * 0.62 : enemy.radius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
  }
  context.fill();
  context.stroke();
  context.fillStyle = color;
  context.beginPath();
  context.arc(0, 0, enemy.kind === "warden" ? 9 : 4, 0, Math.PI * 2);
  context.fill();
  context.restore();
  if (enemy.health < enemy.maxHealth) {
    const width = enemy.radius * 2;
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, width, 4);
    context.fillStyle = color;
    context.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, width * (enemy.health / enemy.maxHealth), 4);
  }
}

function drawBolt(context: CanvasRenderingContext2D, bolt: Bolt): void {
  const gradient = context.createLinearGradient(bolt.previousX, bolt.previousY, bolt.x, bolt.y);
  gradient.addColorStop(0, "rgba(82, 231, 239, 0)");
  gradient.addColorStop(1, bolt.power > 1 ? "#ffbf57" : "#52e7ef");
  context.strokeStyle = gradient;
  context.lineWidth = bolt.power > 1 ? 5 : 3;
  context.beginPath();
  context.moveTo(bolt.previousX, bolt.previousY);
  context.lineTo(bolt.x, bolt.y);
  context.stroke();
}

function drawEnemyBolt(context: CanvasRenderingContext2D, bolt: EnemyBolt): void {
  context.fillStyle = "#ff6f61";
  context.shadowColor = "#ff6f61";
  context.shadowBlur = 12;
  context.beginPath();
  context.arc(bolt.x, bolt.y, bolt.radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
}

function drawPickup(context: CanvasRenderingContext2D, pickup: Pickup): void {
  const color = pickup.kind === "repair" ? "#8be58e" : "#ffbf57";
  const bob = Math.sin(pickup.phase) * 5;
  context.save();
  context.translate(pickup.x, pickup.y + bob);
  context.rotate(pickup.phase * 0.4);
  context.strokeStyle = color;
  context.fillStyle = "rgba(3, 13, 20, 0.85)";
  context.lineWidth = 3;
  context.strokeRect(-12, -12, 24, 24);
  context.fillRect(-10, -10, 20, 20);
  context.fillStyle = color;
  if (pickup.kind === "repair") {
    context.fillRect(-3, -8, 6, 16);
    context.fillRect(-8, -3, 16, 6);
  } else {
    context.beginPath();
    context.moveTo(2, -9);
    context.lineTo(-7, 2);
    context.lineTo(-1, 2);
    context.lineTo(-4, 10);
    context.lineTo(8, -3);
    context.lineTo(2, -3);
    context.closePath();
    context.fill();
  }
  context.restore();
}

function drawHUD(context: CanvasRenderingContext2D, state: PetArenaState): void {
  context.fillStyle = "rgba(2, 8, 14, 0.82)";
  context.fillRect(18, 17, 270, 74);
  context.fillRect(672, 17, 270, 74);
  context.strokeStyle = "rgba(82, 231, 239, 0.32)";
  context.strokeRect(18, 17, 270, 74);
  context.strokeRect(672, 17, 270, 74);
  drawPixelText(context, `WAVE ${Math.max(1, state.wave)} // ${state.pendingSpawns + state.enemies.length} HOSTILES`, 32, 29, 14, "#52e7ef");
  drawPixelText(context, `DRAGON ARMOR ${state.dragon.health}/10`, 32, 55, 12, state.dragon.health > 2 ? "#eaf6f2" : "#ff6f61");
  drawPixelText(context, state.dragon.overdrive > 0 ? `OVERDRIVE ${state.dragon.overdrive.toFixed(1)}s` : `COMBO x${Math.max(1, state.combo)}`, 32, 73, 10, state.dragon.overdrive > 0 ? "#ffbf57" : "#9eb7bd");
  drawPixelText(context, "CREW STATIONS", 686, 29, 12, "#9eb7bd");
  state.beacons.forEach((beacon, index) => {
    const x = 686 + index * 58;
    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    context.fillRect(x, 55, 48, 7);
    context.fillStyle = beacon.integrity > 0 ? beaconColors[index] : "#ff6f61";
    context.fillRect(x, 55, 48 * (beacon.integrity > 0 ? beacon.integrity / 100 : beacon.repair / PET_ARENA_TUNING.beaconRepairTime), 7);
    drawPixelText(context, String(index + 1), x + 24, 69, 9, beaconColors[index], "center");
  });
  if (state.dragon.ward <= 0 && state.dragon.wardCooldown <= 0) drawPixelText(context, "SHIFT // WARD READY", 480, 493, 11, "#52e7ef", "center");
  else if (state.dragon.ward > 0) drawPixelText(context, `WARD ${state.dragon.ward.toFixed(1)}s`, 480, 493, 11, "#52e7ef", "center");
  else drawPixelText(context, `WARD RECHARGE ${state.dragon.wardCooldown.toFixed(1)}s`, 480, 493, 10, "#75929a", "center");
  drawPixelText(context, state.couchGunner ? "GUNNER LINKED" : "AUTO-LOCK ACTIVE", 480, 511, 9, state.couchGunner ? "#8be58e" : "#9eb7bd", "center");
}

function drawDialogue(context: CanvasRenderingContext2D, dialogue: Dialogue): void {
  context.fillStyle = "rgba(2, 7, 12, 0.9)";
  context.fillRect(116, 424, 728, 52);
  context.strokeStyle = "rgba(82, 231, 239, 0.42)";
  context.strokeRect(116, 424, 728, 52);
  drawPixelText(context, dialogue.speaker, 132, 435, 11, "#ffbf57");
  drawPixelText(context, dialogue.text, 132, 454, 11, "#eaf6f2");
}

function drawBanner(context: CanvasRenderingContext2D, banner: NonNullable<PetArenaState["banner"]>): void {
  const alpha = clamp(banner.timer, 0, 1);
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = "rgba(2, 7, 12, 0.78)";
  context.fillRect(220, 202, 520, 92);
  context.strokeStyle = "#ffbf57";
  context.strokeRect(220, 202, 520, 92);
  drawPixelText(context, banner.title, 480, 222, 28, "#ffbf57", "center");
  drawPixelText(context, banner.subtitle, 480, 261, 12, "#eaf6f2", "center");
  context.restore();
}
