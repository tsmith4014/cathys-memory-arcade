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

export const FANTASY_STORY_CHAPTERS: readonly FantasyStoryChapter[] = [
  {
    id: "cabinet",
    number: "I",
    title: "The Girl in Cabinet 86",
    subtitle: "A door opens from the wrong side.",
    art: "art/signal-story-01-cabinet-v1.webp",
    alt: "Coda steps from a glowing arcade cabinet onto a moonlit mountain road while her brass raven companion Rook watches above",
    durationMs: 26_000,
    bpm: 96,
    medium: "clay",
    effect: "wake",
    bridge: {
      but: "The road charges one true memory, and Coda has none.",
      therefore: "She must bargain with the tollkeeper.",
    },
    moments: [
      { id: "wake", startsAt: 0, timecode: "00:00", line: "Coda wakes inside Cabinet 86 with two tokens and no past." },
      { id: "answer", startsAt: 6_200, timecode: "00:06", line: "One token beats like a heart. The other answers beyond the mountains." },
      { id: "rook", startsAt: 12_700, timecode: "00:13", line: "Rook clears his brass throat. “Good news: you’re alive. Bad news: we owe a dragon.”" },
      { id: "road", startsAt: 19_300, timecode: "00:19", line: "They take the moonroad before the arcade can change its mind." },
    ],
  },
  {
    id: "tollkeeper",
    number: "II",
    title: "The Tollkeeper of Soft Stone",
    subtitle: "Every crossing asks for something true.",
    art: "art/signal-story-02-tollkeeper-v1.webp",
    alt: "Coda and Rook meet the laughing stone giant Tallow on a tiny brass bridge above a moonlit canyon",
    durationMs: 26_000,
    bpm: 88,
    medium: "clay",
    effect: "rumble",
    bridge: {
      but: "Tallow’s new door ignores the road entirely.",
      therefore: "Coda steps into Cat’s wild greenhouse.",
    },
    moments: [
      { id: "toll", startsAt: 0, timecode: "00:00", line: "At the clay bridge, Tallow asks Coda for one true memory." },
      { id: "empty", startsAt: 6_300, timecode: "00:06", line: "She has none. Rook offers a forged receipt and absolutely no shame." },
      { id: "laugh", startsAt: 12_800, timecode: "00:13", line: "Tallow laughs until his stone chest cracks into a golden door." },
      { id: "company", startsAt: 19_400, timecode: "00:19", line: "He joins them. Apparently that was the toll." },
    ],
  },
  {
    id: "cat",
    number: "III",
    title: "Cat, Who Named the Wild Things",
    subtitle: "Nothing living stays a stranger for long.",
    art: "art/signal-story-03-cat-v1.webp",
    alt: "A young Cat, created from an authorized family likeness, laughs among glowing plants, friendly animals, fantasy children, Coda, and Rook",
    durationMs: 28_000,
    bpm: 92,
    medium: "clay",
    effect: "bloom",
    bridge: {
      but: "Even Cat cannot wake a garden whose song was stolen.",
      therefore: "She sends Coda after the brother called Runt.",
    },
    moments: [
      { id: "greenhouse", startsAt: 0, timecode: "00:00", line: "Tallow’s door should cross the canyon, but it opens into Cat’s impossible greenhouse." },
      { id: "names", startsAt: 6_800, timecode: "00:07", line: "She has named every child, beast, and vine. Rook becomes “Pocket Trouble” before he can object." },
      { id: "silence", startsAt: 13_700, timecode: "00:14", line: "Cat can wake anything that grows, but the garden beyond her gate has forgotten its song." },
      { id: "runt", startsAt: 20_700, timecode: "00:21", line: "Therefore they need her youngest brother. “Ask for Runt,” she says, already laughing." },
    ],
  },
  {
    id: "runt",
    number: "IV",
    title: "The Biggest One Was Runt",
    subtitle: "The nickname survived the evidence.",
    art: "art/signal-story-04-runt-v1.webp",
    alt: "The enormous imagined fantasy character Runt lifts a root-covered gate while Cat laughs on his shoulder and Coda looks up in surprise",
    durationMs: 27_000,
    bpm: 84,
    medium: "clay",
    effect: "rumble",
    bridge: {
      but: "The gate can rise only after its smallest life is safe.",
      therefore: "Coda moves the nest, and Runt moves the mountain.",
    },
    moments: [
      { id: "search", startsAt: 0, timecode: "00:00", line: "Coda searches for somebody small. Then the mountain stands up." },
      { id: "joke", startsAt: 6_400, timecode: "00:06", line: "Runt is the youngest of six and the biggest by a country mile. Cat’s joke won." },
      { id: "nest", startsAt: 13_100, timecode: "00:13", line: "He can lift the gate, but not while one tiny nest is still beneath it." },
      { id: "lift", startsAt: 20_000, timecode: "00:20", line: "Coda moves the nest. Therefore Runt moves the mountain." },
    ],
  },
  {
    id: "garden",
    number: "V",
    title: "The Garden That Hums Back",
    subtitle: "Forgotten songs are still growing.",
    art: "art/signal-story-03-garden-v1.webp",
    alt: "Coda plants a glowing token in a luminous garden as Rook and a gathering of moth-folk watch the musical plant grow",
    durationMs: 28_000,
    bpm: 82,
    medium: "gouache",
    effect: "bloom",
    bridge: {
      but: "The new chorus wakes the thing that swallowed midnight.",
      therefore: "The whole strange family climbs toward Vesper.",
    },
    moments: [
      { id: "garden", startsAt: 0, timecode: "00:00", line: "Beyond Runt’s gate grows every song the world forgot." },
      { id: "warning", startsAt: 6_800, timecode: "00:07", line: "The moth-folk warn them: midnight is being eaten one note at a time." },
      { id: "memory", startsAt: 13_700, timecode: "00:14", line: "Coda plants the silent token. It sprouts her first memory: choosing to stay." },
      { id: "chorus", startsAt: 20_600, timecode: "00:21", line: "The garden gives them a chorus sharp enough to wake a dragon." },
    ],
  },
  {
    id: "dragon",
    number: "VI",
    title: "The Dragon Who Swallowed Midnight",
    subtitle: "The monster is guarding the ending.",
    art: "art/signal-story-04-dragon-v1.webp",
    alt: "Coda reaches toward the enormous midnight dragon Vesper, who gently guards a glowing bass note above a mountain of speakers",
    durationMs: 28_000,
    bpm: 132,
    medium: "cel",
    effect: "storm",
    bridge: {
      but: "Vesper will release the note only if endings can continue.",
      therefore: "Coda brings the dragon home for the final verse.",
    },
    moments: [
      { id: "vesper", startsAt: 0, timecode: "00:00", line: "Vesper coils around the last bass note, enormous and terribly lonely." },
      { id: "truth", startsAt: 6_700, timecode: "00:07", line: "“I didn’t steal the song,” she says. “I stopped it from ending.”" },
      { id: "offer", startsAt: 13_600, timecode: "00:14", line: "Coda spends neither token. She offers Vesper a place in the next verse." },
      { id: "drop", startsAt: 20_500, timecode: "00:21", line: "One impossible drop later, the whole mountain starts dancing." },
    ],
  },
  {
    id: "dawn",
    number: "VII",
    title: "The Last Token Is a Door",
    subtitle: "No lost song leaves alone.",
    art: "art/signal-story-05-dawn-v1.webp",
    alt: "Coda welcomes a joyful gathering of wanderers, moth-folk, Tallow, Rook, and Vesper into an open-air arcade at sunrise",
    durationMs: 30_000,
    bpm: 120,
    medium: "miniature",
    effect: "sunrise",
    bridge: {
      but: "Four unanswered tones pulse above the music.",
      therefore: "Cat and Runt follow them to the old projection booth.",
    },
    moments: [
      { id: "arrival", startsAt: 0, timecode: "00:00", line: "At dawn, the road ends at an arcade with no front door." },
      { id: "hinges", startsAt: 7_300, timecode: "00:07", line: "The tokens fit side by side. They were never fare. They were hinges." },
      { id: "welcome", startsAt: 14_800, timecode: "00:15", line: "Cat names Vesper “Nightlight.” Runt lifts the roof. Coda opens the floor." },
      { id: "free-play", startsAt: 22_400, timecode: "00:22", line: "Free play lights the sky. For once, no one has to leave alone." },
    ],
  },
  {
    id: "six-lamp",
    number: "VIII",
    title: "The Six-Lamp Booth",
    subtitle: "Two names glow. Four wait without being guessed.",
    art: "art/signal-story-06-six-lamp-booth-v1.webp",
    alt: "Cat and Runt, created from authorized family likenesses, sit with Coda beneath six signal lamps in a sunlit projection booth",
    durationMs: 30_000,
    bpm: 106,
    medium: "miniature",
    effect: "sunrise",
    bridge: {
      but: "Four sibling signals still have no names in this world.",
      therefore: "The booth stays warm until their own stories can arrive.",
    },
    moments: [
      { id: "tones", startsAt: 0, timecode: "00:00", line: "After the dance, Cat hears four unanswered tones above the ceiling." },
      { id: "lamps", startsAt: 7_200, timecode: "00:07", line: "Runt lifts the old projector. Six lamps are waiting; only two know their names." },
      { id: "gift", startsAt: 14_600, timecode: "00:15", line: "Cat will not name voices before they arrive. A nickname is a gift, not a guess." },
      { id: "ready", startsAt: 22_200, timecode: "00:22", line: "They wire the four dark lamps and leave them safe. The road opens when the family is ready." },
    ],
  },
];

export function getFantasyStoryMoment(chapter: FantasyStoryChapter, elapsedMs: number): FantasyStoryMoment {
  return [...chapter.moments].reverse().find((moment) => elapsedMs >= moment.startsAt) ?? chapter.moments[0];
}

export const FANTASY_STORY_DURATION_MS = FANTASY_STORY_CHAPTERS.reduce(
  (total, chapter) => total + chapter.durationMs,
  0,
);
