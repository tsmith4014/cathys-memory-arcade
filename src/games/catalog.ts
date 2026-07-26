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
  chapter: string;
  theme: string;
  keepsake: string;
  title: string;
  subtitle: string;
  description: string;
  objective: string;
  briefing: string;
  completion: string;
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
    chapter: "Chapter 01",
    theme: "Grit",
    keepsake: "The strength to keep going",
    title: "Skyline Smash",
    subtitle: "Colorado Kaiju Protocol",
    description: "Level a neon mountain skyline while defense drones turn every block into a risk-reward decision.",
    objective: "Clear all five towers before the clock or your armor runs out.",
    briefing: "Hard work built the days that made the good memories possible. Turn that effort into force and take the skyline apart.",
    completion: "Grit recovered. The city falls; the strength behind the memory remains.",
    difficulty: "Mayhem",
    tone: "coral",
    controls: "Move: arrows or A/D // Jump: up or W // Hold space to smash // Rage: shift",
    primaryAction: "Smash",
    secondaryAction: "Rage",
    series: "original",
  },
  {
    id: "token-trail",
    cabinet: "Cabinet 02",
    chapter: "Chapter 02",
    theme: "Small joys",
    keepsake: "The tokens that became an afternoon",
    title: "Token Trail",
    subtitle: "Three Zones, One Continue",
    description: "Run a hand-built mountain route of gaps, patrols, checkpoints, hidden lines, and twenty-four spinning tokens.",
    objective: "Reach the sunrise terminal. Eighteen tokens opens the best ending.",
    briefing: "A token was never just a token. It was a few more minutes, one more try, and proof that a small thing could open a whole world.",
    completion: "Small joys recovered. What looked like pocket change became a place you can still return to.",
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
    chapter: "Chapter 03",
    theme: "Persistence",
    keepsake: "The continue after a hard loss",
    title: "Dungeon Circuit",
    subtitle: "No Map. No Mercy.",
    description: "Break a three-room machine dungeon, survive distinct enemy logic, claim each circuit key, and face the Warden.",
    objective: "Clear every room and carry its key through the live exit gate.",
    briefing: "Some games were brutally hard. The point was not winning quickly; it was learning the room, trying again, and earning the next door.",
    completion: "Persistence recovered. Every locked room eventually yielded to another attempt.",
    difficulty: "Hard",
    tone: "amber",
    controls: "Move: arrows or WASD // Hold space to strike // Dash: shift",
    primaryAction: "Strike",
    secondaryAction: "Dash",
    series: "original",
  },
  {
    id: "highrise-havoc",
    cabinet: "Cabinet 04",
    chapter: "Chapter 04",
    theme: "Wild heart",
    keepsake: "The part that refused to stay quiet",
    title: "Highrise Havoc",
    subtitle: "Climb. Punch. Roar. Repeat.",
    description: "Scale four destructible towers window by window while rooftop cannons, attack craft, and falling debris fight back.",
    objective: "Break every lit window and bring down all four towers before your energy or the clock expires.",
    briefing: "Cathy loved motorcycles and, in Chad's words, was a wild one. Climb high, make noise, and refuse to leave the world untouched.",
    completion: "Wild heart recovered. The last tower drops, but the noise keeps rolling.",
    difficulty: "Wild",
    tone: "green",
    controls: "Move/climb: arrows or WASD // Hold space to punch // Building leap: shift",
    primaryAction: "Punch",
    secondaryAction: "Leap",
    series: "memory-remix",
  },
  {
    id: "sunset-run",
    cabinet: "Cabinet 05",
    chapter: "Chapter 05",
    theme: "Together",
    keepsake: "Two tokens carried to the same exit",
    title: "Sunset Run",
    subtitle: "One Long Saturday Continue",
    description: "A hand-built side-scrolling adventure with breakable signal crates, moving lifts, stompable patrols, secret routes, and a final sunrise sprint.",
    objective: "Carry both keepsake tokens through three districts and reach the glowing exit before sunset.",
    briefing: "This route only resolves when both keepsakes make it home. The memory was never a solo run.",
    completion: "Together recovered. Two keepsakes reach the gate; neither one had to cross the distance alone.",
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
    chapter: "Chapter 06",
    theme: "Carry it home",
    keepsake: "The memory brought back into daylight",
    title: "Dragonfire Descent",
    subtitle: "Take the Hoard. Find the Exit.",
    description: "Light an irregular ruined citadel with ranged dragon bolts, break its guardians, take the core, then follow a living compass back to dawn.",
    objective: "Take the dragon core from the deepest chamber and follow the dawn signal home before the final bell.",
    briefing: "Going deeper is only half the journey. Find what matters in the dark, then carry it all the way back into the light.",
    completion: "Memory recovered. The treasure was not meant to stay buried.",
    difficulty: "Expedition",
    tone: "amber",
    controls: "Move/aim: arrows or WASD // Hold space to fire // Five-second ward: shift // Ten-second cooldown",
    primaryAction: "Fire dragon bolt",
    secondaryAction: "Activate ward",
    series: "memory-remix",
  },
];
