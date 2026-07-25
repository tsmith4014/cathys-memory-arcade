export type TerminalPrompt = {
  command: string;
  label: string;
  response: string;
};

export const memorialCopy = {
  eyebrow: "Memory Core // the five-dollar summer",
  title: "The memory was right: five dollars, all you could play.",
  lead: "The idea began at Nickels & Dimes on Fillmore in 1986 with $2.50 Saturday parties for two hours. In 1987, the experiment became The Boardwalk at Citadel Mall: first unlimited-play parties, then an entire arcade on free play for a $5 admission.",
  quote: "She cleaned houses, waited tables, managed hotels, and cleaned rooms. Five dollars could be a fifth of a large-house job. She spent it making a memory.",
  body: "That documented timeline matches Chad's memory of five-dollar unlimited-play days. This room holds the record and the recollection together, while leaving space for more details to return. Cathy loved classic rock. She was hardworking, funny, a motorcycle enthusiast, and, as her son puts it, a wild one.",
};

export const lifeDetails = [
  {
    code: "1960 // ROOTS",
    title: "Enid, Oklahoma",
    body: "Catherine Denise Smith-Fitts was born January 13, 1960, to Charles and Joyce (Suit) Smith. She attended Fairview schools.",
  },
  {
    code: "HOME // COMMUNITY",
    title: "Okeene and Canton",
    body: "She spent her final five years in the Okeene community as a homemaker and was a member of the Church of Christ in Canton.",
  },
  {
    code: "JOY // OPEN ROAD",
    title: "Moxie, gardens, motorcycles",
    body: "She deeply loved her dog Moxie, found joy in gardening, and carried a lasting passion for motorcycles.",
  },
  {
    code: "2026 // CONTINUE",
    title: "A caring spirit",
    body: "Cathy died April 14, 2026, at 66. Her program remembers her love of family, caring spirit, and the simple joys that gave life meaning.",
  },
];

export const rememberedGames = [
  { title: "Rampage", note: "The game that comes back first when Chad remembers those afternoons." },
  { title: "Super Mario Bros.", note: "A bright portal into worlds that kept unfolding one screen at a time." },
  { title: "Dungeon Quest", note: "Remembered for being brutally hard, and for making every small win count." },
];

export const terminalPrompts: TerminalPrompt[] = [
  {
    command: "RUN TWO_TOKENS",
    label: "Why two tokens?",
    response: "The memory is the five-dollar unlimited-play days. The documented history begins with a $2.50 two-hour Fillmore prototype in 1986, then reaches $5 all-you-can-play at The Boardwalk in 1987. The real gift was not a guessed admission split. It was Cathy's time after hard work.",
  },
  {
    command: "OPEN CATHY.LOG",
    label: "Who was Cathy?",
    response: "Catherine Denise Smith-Fitts was a hardworking mother, classic-rock fan, gardener, motorcycle enthusiast, and devoted human to her dog Moxie. Born in Enid and rooted in Oklahoma, she is remembered for family, a caring spirit, simple joys, and, in Chad's words, being a wild one.",
  },
  {
    command: "TRACE AI_ORIGIN",
    label: "Why AI?",
    response: "GPT arrived during Chad's first week at Code Platoon. Curiosity became API experiments, then production automation, then a new way to build. This arcade connects that future to the person who helped him reach it.",
  },
  {
    command: "LIST NEXT_CONTINUE",
    label: "What happens next?",
    response: "New memories become rooms. New games become chapters. The signal booth keeps moving after closing time. Nothing here needs to be finished to remain alive.",
  },
];
