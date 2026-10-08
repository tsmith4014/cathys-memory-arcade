export type FantasyStoryMoment = {
  id: string;
  startsAt: number;
  timecode: string;
  line: string;
};

export type FantasyStoryChapter = {
  id: "cabinet" | "tollkeeper" | "cat" | "runt" | "garden" | "dragon" | "dawn" | "six-lamp";
  number: string;
  title: string;
  subtitle: string;
  art: string;
  animationFrames?: readonly string[];
  alt: string;
  durationMs: number;
  bpm: number;
  medium: "clay" | "gouache" | "cel" | "miniature";
  effect: "wake" | "rumble" | "bloom" | "storm" | "sunrise";
  bridge: {
    but: string;
    therefore: string;
  };
  moments: readonly FantasyStoryMoment[];
};

export const FANTASY_STORY_TRANSITION_MS = 10_000;
export const FANTASY_NARRATION_VOICE = "Danielle";
export const FANTASY_NARRATION_PREVIEW_PATH = "audio/fantasy/voice-check.mp3";

export function getFantasyMomentNarrationPath(chapterId: FantasyStoryChapter["id"], momentId: string): string {
  return `audio/fantasy/${chapterId}-${momentId}.mp3`;
}

export function getFantasyBridgeNarrationPath(chapterId: FantasyStoryChapter["id"]): string {
  return `audio/fantasy/${chapterId}-bridge.mp3`;
}

export const FANTASY_STORY_CHAPTERS: readonly FantasyStoryChapter[] = [
  {
    id: "cabinet",
    number: "I",
    title: "The Girl in Cabinet 86",
    subtitle: "A door opens from the wrong side.",
    art: "art/signal-story-01-cabinet-v1.webp",
    animationFrames: ["art/signal-story-01-cabinet-v2.webp"],
    alt: "Coda steps from a glowing arcade cabinet onto a moonlit mountain road while her brass raven companion Rook watches above",
    durationMs: 44_000,
    bpm: 96,
    medium: "clay",
    effect: "wake",
    bridge: {
      but: "The moonroad accepts only one honest memory.",
      therefore: "Coda must cross with an empty past.",
    },
    moments: [
      { id: "wake", startsAt: 0, timecode: "00:00", line: "Coda wakes inside Cabinet 86 while rain drums on an arcade forgetting its own name." },
      { id: "tokens", startsAt: 7_200, timecode: "00:07", line: "Two brass tokens wait in her hand. One is warm; the other knocks like a distant heart." },
      { id: "name", startsAt: 14_500, timecode: "00:15", line: "She remembers no name. Rook calls her Coda because every lost song needs one." },
      { id: "vanish", startsAt: 21_800, timecode: "00:22", line: "The EXIT sign dies. Behind them, whole rows of cabinets blink out without a sound." },
      { id: "call", startsAt: 29_200, timecode: "00:29", line: "Across the mountains, somebody plays three notes, pauses, then plays them again." },
      { id: "choice", startsAt: 36_700, timecode: "00:37", line: "Coda follows. Losing an unknown past scares her less than leaving that player unanswered." },
    ],
  },
  {
    id: "tollkeeper",
    number: "II",
    title: "The Tollkeeper of Soft Stone",
    subtitle: "The truth can face forward.",
    art: "art/signal-story-02-tollkeeper-v1.webp",
    animationFrames: ["art/signal-story-02-tollkeeper-v2.webp"],
    alt: "Coda and Rook meet the laughing stone giant Tallow on a tiny brass bridge above a moonlit canyon",
    durationMs: 44_000,
    bpm: 88,
    medium: "clay",
    effect: "rumble",
    bridge: {
      but: "His golden door opens into a frozen greenhouse.",
      therefore: "They follow the only laughter still growing there.",
    },
    moments: [
      { id: "toll", startsAt: 0, timecode: "00:00", line: "Tallow, the bridge keeper, asks for one true memory before he lets Coda pass." },
      { id: "empty", startsAt: 7_200, timecode: "00:07", line: "She reaches for yesterday and finds only static. Stones begin dropping into the dark." },
      { id: "receipt", startsAt: 14_500, timecode: "00:15", line: "Rook presents a forged receipt for one lightly used childhood. Even he looks unconvinced." },
      { id: "forward", startsAt: 21_800, timecode: "00:22", line: "Tallow asks a kinder question: what will she remember if they survive tonight?" },
      { id: "promise", startsAt: 29_200, timecode: "00:29", line: "Coda answers, “That I heard someone calling, and I did not turn away.”" },
      { id: "door", startsAt: 36_700, timecode: "00:37", line: "Tallow laughs open a golden door, then joins them. Honest roads are poor places to walk alone." },
    ],
  },
  {
    id: "cat",
    number: "III",
    title: "Cat, Who Named the Wild Things",
    subtitle: "Nothing living stays a stranger for long.",
    art: "art/signal-story-03-cat-v1.webp",
    animationFrames: ["art/signal-story-03-cat-v2.webp"],
    alt: "A young Cat, created from an authorized family likeness, laughs among glowing plants, friendly animals, fantasy children, Coda, and Rook",
    durationMs: 46_000,
    bpm: 92,
    medium: "clay",
    effect: "bloom",
    bridge: {
      but: "A root gate is falling on a hidden nest.",
      therefore: "Cat leads them to the brother called Runt.",
    },
    moments: [
      { id: "greenhouse", startsAt: 0, timecode: "00:00", line: "Cat sits among foxes, rabbits, children, and impossible flowers. Every living thing leans toward her." },
      { id: "names", startsAt: 7_400, timecode: "00:07", line: "She names Rook “Pocket Trouble” and Coda “Still Becoming.” Both names fit annoyingly well." },
      { id: "frost", startsAt: 15_100, timecode: "00:15", line: "Then silver frost crawls across the glass, and a mother rabbit forgets her young." },
      { id: "silence", startsAt: 22_900, timecode: "00:23", line: "Cat wakes one frozen vine, but the garden beyond has lost the note beneath every song." },
      { id: "choice", startsAt: 30_700, timecode: "00:31", line: "She could seal the greenhouse and save this room. Instead, Cat reaches for her boots." },
      { id: "runt", startsAt: 38_500, timecode: "00:39", line: "“We need my little brother.” Outside, a mountain-sized shadow waves. Rook mutters, “Define little.”" },
    ],
  },
  {
    id: "runt",
    number: "IV",
    title: "The Biggest One Was Runt",
    subtitle: "Real strength notices what is underfoot.",
    art: "art/signal-story-04-runt-v1.webp",
    animationFrames: ["art/signal-story-04-runt-v2.webp"],
    alt: "The enormous imagined fantasy character Runt lifts a root-covered gate while Cat laughs on his shoulder and Coda looks up in surprise",
    durationMs: 46_000,
    bpm: 84,
    medium: "clay",
    effect: "rumble",
    bridge: {
      but: "The cold token grows roots into Coda's palm.",
      therefore: "They hurry into the garden calling it home.",
    },
    moments: [
      { id: "search", startsAt: 0, timecode: "00:00", line: "Coda searches the valley for someone small. Then the mountain stands up and says hello." },
      { id: "joke", startsAt: 7_400, timecode: "00:07", line: "Runt is the youngest of six and the biggest for miles. Cat's nickname won years ago." },
      { id: "gate", startsAt: 15_100, timecode: "00:15", line: "A root gate groans above them while black silence climbs the road toward Cat's greenhouse." },
      { id: "nest", startsAt: 22_900, timecode: "00:23", line: "Runt could throw it aside, but one tiny nest is tucked beneath the hinge." },
      { id: "rescue", startsAt: 30_700, timecode: "00:31", line: "Coda crawls under the weight and carries each trembling hatchling out in her scarf." },
      { id: "lift", startsAt: 38_500, timecode: "00:39", line: "Runt lifts the mountain gently. “Small things first,” he says. “Mountains are patient.”" },
    ],
  },
  {
    id: "garden",
    number: "V",
    title: "The Garden That Hums Back",
    subtitle: "Nothing grows in a closed hand.",
    art: "art/signal-story-03-garden-v1.webp",
    animationFrames: ["art/signal-story-03-garden-v2.webp"],
    alt: "Coda plants a glowing token in a luminous garden as Rook and a gathering of moth-folk watch the musical plant grow",
    durationMs: 46_000,
    bpm: 82,
    medium: "gouache",
    effect: "bloom",
    bridge: {
      but: "Vesper is guarding the song's final note.",
      therefore: "Coda climbs toward the monster everyone misunderstood.",
    },
    moments: [
      { id: "garden", startsAt: 0, timecode: "00:00", line: "Beyond the gate, every song the world forgot is still growing as a luminous plant." },
      { id: "hunger", startsAt: 7_400, timecode: "00:07", line: "Black silence eats one note at a time. The moth-folk's warning bells make no sound." },
      { id: "roots", startsAt: 15_100, timecode: "00:15", line: "Coda's cold token takes root in her hand. It is her only clue to who she was." },
      { id: "lesson", startsAt: 22_900, timecode: "00:23", line: "Cat does not ask for it. She only says, “Nothing grows in a closed hand.”" },
      { id: "memory", startsAt: 30_700, timecode: "00:31", line: "Coda plants the token. Her first memory blooms—not yesterday, but choosing these people now." },
      { id: "chorus", startsAt: 38_500, timecode: "00:39", line: "The garden hums back. Its new chorus wakes something vast beneath the midnight mountain." },
    ],
  },
  {
    id: "dragon",
    number: "VI",
    title: "The Dragon Who Swallowed Midnight",
    subtitle: "The monster is guarding the ending.",
    art: "art/signal-story-04-dragon-v1.webp",
    animationFrames: ["art/signal-story-04-dragon-v2.webp"],
    alt: "Coda reaches toward the enormous midnight dragon Vesper, who gently guards a glowing bass note above a mountain of speakers",
    durationMs: 48_000,
    bpm: 132,
    medium: "cel",
    effect: "storm",
    bridge: {
      but: "The returning note tears the mountain open.",
      therefore: "The whole company races the song toward dawn.",
    },
    moments: [
      { id: "vesper", startsAt: 0, timecode: "00:00", line: "Vesper is not eating the last bass note. She has cupped both claws around its flame." },
      { id: "misread", startsAt: 7_700, timecode: "00:08", line: "The others prepare for a monster. Cat notices the dragon is shielding something small." },
      { id: "truth", startsAt: 15_500, timecode: "00:16", line: "“I did not steal the song,” Vesper whispers. “I stopped it from ending.”" },
      { id: "wound", startsAt: 23_400, timecode: "00:23", line: "The song that raised her ended, and nobody answered. She has guarded its last breath ever since." },
      { id: "offer", startsAt: 31_400, timecode: "00:31", line: "Coda cannot promise endless music. She promises someone will listen through the silence." },
      { id: "release", startsAt: 39_500, timecode: "00:40", line: "Vesper accepts a place in the next verse. The note lands, and the mountain splits beneath them." },
    ],
  },
  {
    id: "dawn",
    number: "VII",
    title: "The Last Token Is a Door",
    subtitle: "No lost song leaves alone.",
    art: "art/signal-story-05-door-v1.webp",
    animationFrames: ["art/signal-story-05-door-v2.webp"],
    alt: "Coda turns two glowing tokens into the hinges of a doorway at dawn while Cat steadies her, Runt holds the collapsing roof, and Vesper guards the final note",
    durationMs: 48_000,
    bpm: 120,
    medium: "miniature",
    effect: "sunrise",
    bridge: {
      but: "Four quiet tones answer above the celebration.",
      therefore: "Cat and Runt climb to the locked projection booth.",
    },
    moments: [
      { id: "escape", startsAt: 0, timecode: "00:00", line: "They race downhill while the mountain folds behind them like a book snapping shut." },
      { id: "arrival", startsAt: 7_700, timecode: "00:08", line: "The song leads to an arcade with no front door, and the silence is close behind." },
      { id: "hinges", startsAt: 15_500, timecode: "00:16", line: "Coda's two tokens fit the empty hinges. They were never admission; they were a choice." },
      { id: "cost", startsAt: 23_400, timecode: "00:23", line: "They are her only proof that someone expected her. Spending them may close the way back." },
      { id: "company", startsAt: 31_400, timecode: "00:31", line: "Runt holds the roof. Cat holds Coda's gaze. Neither tells her what to choose." },
      { id: "free-play", startsAt: 39_500, timecode: "00:40", line: "Coda opens the floor. Vesper finishes the song, and dawn finds nobody standing alone." },
    ],
  },
  {
    id: "six-lamp",
    number: "VIII",
    title: "The Six-Lamp Booth",
    subtitle: "Some doors are opened by waiting well.",
    art: "art/signal-story-06-six-lamp-booth-v1.webp",
    animationFrames: ["art/signal-story-06-six-lamp-booth-v2.webp"],
    alt: "Cat and Runt, created from authorized family likenesses, sit with Coda beneath six signal lamps in a sunlit projection booth",
    durationMs: 46_000,
    bpm: 106,
    medium: "miniature",
    effect: "sunrise",
    bridge: {
      but: "Four stories remain beyond the dark glass.",
      therefore: "The booth keeps their lights warm without guessing names.",
    },
    moments: [
      { id: "tones", startsAt: 0, timecode: "00:00", line: "After the cheering fades, Cat hears four quiet tones above the ceiling." },
      { id: "lamps", startsAt: 7_400, timecode: "00:07", line: "Runt lifts the old projector. Six lamps are waiting; only two know their names." },
      { id: "guess", startsAt: 15_100, timecode: "00:15", line: "Rook offers guesses. Cat shakes her head. “A nickname comes after hello.”" },
      { id: "repair", startsAt: 22_900, timecode: "00:23", line: "Runt repairs four cold circuits, careful as he was with the nest beneath the gate." },
      { id: "waiting", startsAt: 30_700, timecode: "00:31", line: "Coda wants a tidy ending. Instead, she learns that waiting can also be an act of love." },
      { id: "home", startsAt: 38_500, timecode: "00:39", line: "She still cannot remember yesterday. She knows who will meet tomorrow with her." },
    ],
  },
];

export function getFantasyStoryMoment(chapter: FantasyStoryChapter, elapsedMs: number): FantasyStoryMoment {
  return [...chapter.moments].reverse().find((moment) => elapsedMs >= moment.startsAt) ?? chapter.moments[0];
}

export const FANTASY_STORY_DURATION_MS = FANTASY_STORY_CHAPTERS.reduce(
  (total, chapter) => total + chapter.durationMs,
  FANTASY_STORY_TRANSITION_MS * (FANTASY_STORY_CHAPTERS.length - 1),
);
