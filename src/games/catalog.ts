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
    subtitle: "Five Towers. One Very Large Problem.",
    description: "Stomp through a neon mountain town, swat low-flying drones, and find each tower's bright weak floor.",
    objective: "Drop all five towers before the clock runs out. Jumping smashes hit harder; Rage clears the sky.",
    briefing: "Some days take more strength than they should. Today that strength is sixty-four pixels tall and extremely bad for property values.",
    completion: "The dust settles. The part of you that kept going is still standing.",
    difficulty: "Loud",
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
    subtitle: "Three Zones. Twenty-Four Chances.",
    description: "Dash across a mountain route of gaps, patrols, boost strips, hidden ledges, and twenty-four tokens that can all be reached.",
    objective: "Cross the sunrise gate. Under eighteen gets you home, eighteen earns the golden trail, and all twenty-four gets the soda-money ending.",
    briefing: "A token bought a few more minutes and one more try. That is a lot of world to fit inside something smaller than a quarter.",
    completion: "The sunrise gate clicks behind you. Whatever you carried out was worth more than pocket change.",
    difficulty: "Brisk",
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
    subtitle: "Three Rooms That Learn Your Name.",
    description: "Read the warning lines, use cover that actually works, and break three rooms before the Warden gets dramatic.",
    objective: "Clear each room, pocket its circuit key, and take it through the live door. The cyan ring in room two recharges your dash.",
    briefing: "The old hard games rarely explained themselves. This one gives you a fair warning, then tries its luck anyway.",
    completion: "The last door opens. Persistence looks less heroic up close; mostly it looks like trying once more.",
    difficulty: "Tough but fair",
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
    subtitle: "Climb High. Punch the Shiny Parts.",
    description: "Scale four towers window by window, watch the cannon sights, and stick around for the collapse instead of skipping the best bit.",
    objective: "Break all fifty-four lit windows. The white reticle shows what your next punch can reach.",
    briefing: "Cathy loved motorcycles and, in Chad's words, was a wild one. This cabinet takes that as permission to make some noise.",
    completion: "The last tower takes its sweet time falling. Good. Some moments deserve the extra second.",
    difficulty: "Rowdy",
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
    subtitle: "Two Tokens and the Long Way Home.",
    description: "Run four changing districts, crack crates from below, ride the lifts, and bring both keepsakes to the sunrise door.",
    objective: "Carry both keepsake tokens home before sunset. If one is missing, the exit will point you back instead of sulking.",
    briefing: "This route only makes sense when both keepsakes reach the same door. The memory was never a solo run.",
    completion: "Two tokens reach the gate together. Neither one had to cross the whole distance alone.",
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
    subtitle: "Three Seals. One Stolen Sunrise.",
    description: "Read each guardian's Dragon Beat, answer with bolt, ward, or movement, and carry a badly behaved dawn-core back outside.",
    objective: "Break three guardian seals, take the core, and follow the living compass home before the final bell.",
    briefing: "Rook says the core is a sunrise someone locked indoors. Break three seals, pay attention when a guardian announces itself, and bring the morning home.",
    completion: "The core reaches daylight. Apparently even a sunrise can need directions home.",
    difficulty: "Adventure",
    tone: "amber",
    controls: "Move/aim: arrows or WASD // Hold space to fire // Five-second ward: shift // Ten-second cooldown",
    primaryAction: "Fire dragon bolt",
    secondaryAction: "Activate ward",
    series: "memory-remix",
  },
];
