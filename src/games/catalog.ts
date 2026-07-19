export type GameId = "skyline-smash" | "token-trail" | "dungeon-circuit";

export type GameDefinition = {
  id: GameId;
  cabinet: string;
  title: string;
  subtitle: string;
  description: string;
  objective: string;
  difficulty: string;
  tone: "cyan" | "coral" | "amber";
  controls: string;
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
    controls: "Move: arrows or A/D // Jump: up or W // Smash: space",
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
    controls: "Move: arrows or A/D // Jump: up or W // Dash: space",
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
  },
];
