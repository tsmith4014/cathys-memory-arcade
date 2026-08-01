export type TerminalPrompt = {
  command: string;
  label: string;
  response: string;
};

export const memorialCopy = {
  eyebrow: "Memory room // the five-dollar summer",
  title: "The memory was right: five dollars, all you could play.",
  lead: "It started on Fillmore in 1986: $2.50 for two Saturday-morning hours at Nickels & Dimes. By 1987, The Boardwalk at Citadel Mall had gone all the way. Five dollars opened every cabinet until it was time to go home.",
  quote: "Five dollars was not spare change. Cathy turned it into an afternoon Chad still remembers.",
  body: "The surviving history and Chad's memory meet on that five-dollar day. The rest of this room belongs to the person who made it possible: a hardworking, funny, classic-rock-loving mother who gardened, rode motorcycles, adored Moxie, and was, in her son's words, a wild one.",
};

export const lifeDetails = [
  {
    code: "1960 // ENID",
    title: "Enid, Oklahoma",
    body: "Catherine Denise Smith-Fitts was born January 13, 1960, to Charles and Joyce (Suit) Smith. She grew up in Oklahoma and attended Fairview schools.",
  },
  {
    code: "HOME // COMMUNITY",
    title: "Okeene and Canton",
    body: "For her final five years, Okeene was home. She was a homemaker and part of the Church of Christ community in Canton.",
  },
  {
    code: "JOY // OPEN ROAD",
    title: "Moxie, gardens, motorcycles",
    body: "Moxie, a garden, and an open road could each make a good day better. Motorcycles brought her joy for years.",
  },
  {
    code: "2026 // REMEMBERED",
    title: "A caring spirit",
    body: "Cathy died April 14, 2026, at 66. Her family remembers her caring spirit, her love for them, and the ordinary joys she never treated as ordinary.",
  },
];

export const rememberedGames = [
  { title: "Rampage", note: "The first cabinet Chad sees when he closes his eyes and walks back into the room." },
  { title: "Super Mario Bros.", note: "Bright worlds, secret routes, and the dangerous belief that one more try would be enough." },
  { title: "Dungeon Quest", note: "Brutally hard. Naturally, that made getting anywhere feel magnificent." },
];

export const terminalPrompts: TerminalPrompt[] = [
  {
    command: "RUN TWO_TOKENS",
    label: "Why two tokens?",
    response: "Chad remembers the five-dollar free-play days. The paper trail starts with a $2.50, two-hour Fillmore experiment in 1986 and reaches $5 all-you-can-play at The Boardwalk in 1987. The important part is simpler: Cathy worked hard, then chose to spend some of that work on time with her son.",
  },
  {
    command: "OPEN CATHY.LOG",
    label: "Who was Cathy?",
    response: "Catherine Denise Smith-Fitts was a mother, a classic-rock fan, a gardener, a motorcycle lover, and Moxie's favorite person. She worked hard, laughed loudly, cared for her family, and had enough wild in her to keep life interesting.",
  },
  {
    command: "TRACE AI_ORIGIN",
    label: "Why AI?",
    response: "GPT arrived during Chad's first week at Code Platoon. He started asking questions, then calling APIs, then building things he could not have built alone. This arcade uses those new tools to return to an old kindness.",
  },
  {
    command: "LIST NEXT_CONTINUE",
    label: "What happens next?",
    response: "More memories will become rooms. More experiments will become games. Some ideas will be brilliant; a few will probably deserve to be unplugged. The point is to keep making, remembering, and leaving a light on.",
  },
];
