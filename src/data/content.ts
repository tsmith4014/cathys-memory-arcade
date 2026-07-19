export type Project = {
  code: string;
  title: string;
  description: string;
  tags: string[];
  href?: string;
  status: string;
};

export type TerminalPrompt = {
  command: string;
  label: string;
  response: string;
};

export const memorialCopy = {
  eyebrow: "Memory Core // continue 01",
  title: "She paid to be there, too.",
  lead: "Chad remembered five-dollar unlimited-play days. The surviving history points to $2.50 Saturday sessions. The missing piece may be the best one: two admissions, one for him and one for Cathy.",
  quote: "She cleaned houses, waited tables, managed hotels, and cleaned rooms. Five dollars could be a fifth of a large-house job. She spent it making a memory.",
  body: "This room begins with what is known and leaves space for what returns later. Cathy loved classic rock. She was hardworking, funny, and, as her son puts it, a wild one.",
};

export const rememberedGames = [
  { title: "Rampage", note: "The game that comes back first when Chad remembers those afternoons." },
  { title: "Super Mario Bros.", note: "A bright portal into worlds that kept unfolding one screen at a time." },
  { title: "Dungeon Quest", note: "Remembered for being brutally hard, and for making every small win count." },
];

export const projects: Project[] = [
  {
    code: "SHIP-01",
    title: "Expense Capture Mobile",
    description: "iOS and Android receipt capture, expense assembly, and signed PDF packages backed by AWS Lambda and S3.",
    tags: ["React Native", "Lambda", "S3", "PDF"],
    status: "Field testing",
  },
  {
    code: "AI-OPS",
    title: "Shared Engineering AI",
    description: "Claude in Slack with Jira and Confluence context so senior engineers can work from a shared knowledge surface.",
    tags: ["Claude", "Slack", "Jira", "Confluence"],
    status: "In progress",
  },
  {
    code: "DRIFT-86",
    title: "Configuration Intelligence",
    description: "Trade-server scans stored in Git so AI can expose drift, misalignment, and operational inconsistencies.",
    tags: ["GitOps", "AI", "Systems", "Analysis"],
    status: "In progress",
  },
  {
    code: "NET-MAP",
    title: "Interactive AWS Network",
    description: "A browser-based infrastructure diagram built to explain topology rather than decorate a slide.",
    tags: ["AWS", "SVG", "Networking"],
    status: "Playable",
    href: "https://tsmith4014.github.io/twoge_aws_deployment/",
  },
  {
    code: "DOC-QA",
    title: "Regulatory Q&A Engine",
    description: "A 225-page source turned into more than 800 structured lookups in about 15 minutes for less than $4.",
    tags: ["OpenAI", "Extraction", "Batching"],
    status: "Shipped",
  },
  {
    code: "CIVIC-20K",
    title: "Housing Data Pipeline",
    description: "Automated ingest, SQL storage, geocoding, and API exposure for more than 20,000 residential sales.",
    tags: ["Python", "SQL", "APIs", "Geospatial"],
    status: "Shipped",
  },
];

export const terminalPrompts: TerminalPrompt[] = [
  {
    command: "RUN TWO_TOKENS",
    label: "Why two tokens?",
    response: "The memory is five dollars total: about $2.50 for Chad, and likely another $2.50 for Cathy to be there with him. The real gift was not the credits. It was her time after hard work.",
  },
  {
    command: "OPEN CATHY.LOG",
    label: "Who was Cathy?",
    response: "A hardworking mother, a classic-rock fan, and, in Chad's words, a wild one. This is a living archive. More of her story will arrive as the memories do.",
  },
  {
    command: "TRACE AI_ORIGIN",
    label: "Why AI?",
    response: "GPT arrived during Chad's first week at Code Platoon. Curiosity became API experiments, then production automation, then a new way to build. This arcade connects that future to the person who helped him reach it.",
  },
  {
    command: "LIST NEXT_CONTINUE",
    label: "What happens next?",
    response: "New memories become rooms. New software becomes cabinets. The signal machine keeps moving. Nothing here needs to be finished to remain alive.",
  },
];
