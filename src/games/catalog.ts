export type GameId =
  | "skyline-smash"
  | "token-trail"
  | "dungeon-circuit"
  | "highrise-havoc"
  | "sunset-run"
  | "dragonfire-descent";

export type GameDefinition = {
  id: GameId;
  cabinet: string;
  title: string;
  subtitle: string;
  description: string;
  objective: string;
  difficulty: string;
  tone: "cyan" | "coral" | "amber" | "green";
  controls: string;
  primaryAction: string;
  secondaryAction: string;
  series: "original" | "memory-remix";
};

export const arcadeGames: GameDefinition[] = [
  {
    id: "skyline-smash",
    cabinet: "Cabinet 01",
    title: "Skyline Smash",
    subtitle: "Colorado Kaiju Protocol",
    description: "Level a neon mountain skyline while defense drones turn every block into a risk-reward decision.",
    objective: "Clear all five towers before the clock or your armor runs out.",
    difficulty: "Mayhem",
    tone: "coral",
    controls: "Move: arrows or A/D // Jump: up or W // Smash: space // Rage: shift",
    primaryAction: "Smash",
    secondaryAction: "Rage",
    series: "original",
  },
  {
    id: "token-trail",
    cabinet: "Cabinet 02",
    title: "Token Trail",
    subtitle: "Three Zones, One Continue",
    description: "Run a hand-built mountain route of gaps, patrols, checkpoints, hidden lines, and twenty-four spinning tokens.",
    objective: "Reach the sunrise terminal. Eighteen tokens opens the best ending.",
    difficulty: "Fast",
    tone: "cyan",
    controls: "Move: arrows or A/D // Jump: up or W // Dash: space or shift",
    primaryAction: "Dash",
    secondaryAction: "Dash",
    series: "original",
  },
  {
    id: "dungeon-circuit",
    cabinet: "Cabinet 03",
    title: "Dungeon Circuit",
    subtitle: "No Map. No Mercy.",
    description: "Break a three-room machine dungeon, survive distinct enemy logic, claim each circuit key, and face the Warden.",
    objective: "Clear every room and carry its key through the live exit gate.",
    difficulty: "Brutal",
    tone: "amber",
    controls: "Move: arrows or WASD // Strike: space // Dash: shift",
    primaryAction: "Strike",
    secondaryAction: "Dash",
    series: "original",
  },
  {
    id: "highrise-havoc",
    cabinet: "Cabinet 04",
    title: "Highrise Havoc",
    subtitle: "Climb. Punch. Roar. Repeat.",
    description: "Scale four destructible towers window by window while rooftop cannons, attack craft, and falling debris fight back.",
    objective: "Break every lit window and bring down all four towers before your energy or the clock expires.",
    difficulty: "Wild",
    tone: "green",
    controls: "Move/climb: arrows or WASD // Punch: space // Building leap: shift",
    primaryAction: "Punch",
    secondaryAction: "Leap",
    series: "memory-remix",
  },
  {
    id: "sunset-run",
    cabinet: "Cabinet 05",
    title: "Sunset Run",
    subtitle: "One Long Saturday Continue",
    description: "A hand-built side-scrolling adventure with breakable signal crates, moving lifts, stompable patrols, secret routes, and a final sunrise sprint.",
    objective: "Carry both keepsake tokens through three districts and reach the glowing exit before sunset.",
    difficulty: "Classic",
    tone: "cyan",
    controls: "Move: arrows or A/D // Jump: space, up, or W // Sprint: shift",
    primaryAction: "Jump",
    secondaryAction: "Sprint",
    series: "memory-remix",
  },
  {
    id: "dragonfire-descent",
    cabinet: "Cabinet 06",
    title: "Dragonfire Descent",
    subtitle: "Take the Hoard. Find the Exit.",
    description: "Reveal a lethal castle one chamber at a time, survive traps and guardians, steal the hoard from its deepest chamber, then retrace your path before sunset.",
    objective: "Take the dragon core from the deepest chamber and return to the dawn gate alive before the final bell.",
    difficulty: "Unfair",
    tone: "amber",
    controls: "Move: arrows or WASD // Strike: space // Ward dash: shift",
    primaryAction: "Strike",
    secondaryAction: "Ward dash",
    series: "memory-remix",
  },
];
