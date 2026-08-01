export type StoryGenre = "horror" | "action" | "mystery";

// Kept exported for compatibility with older saved sessions and imports.
export type StoryStat = "nerve" | "momentum" | "insight";

export type RelationshipCondition = {
  character: string;
  min?: number;
  max?: number;
};

export type StoryCondition = {
  requires?: string[];
  excludes?: string[];
  requiresItems?: string[];
  excludesItems?: string[];
  relationships?: RelationshipCondition[];
};

export type StoryChoice = StoryCondition & {
  label: string;
  consequence: string;
  next: string;
  addFlags?: string[];
  removeFlags?: string[];
  addItems?: string[];
  removeItems?: string[];
  relationshipChanges?: Record<string, number>;
};

export type StoryCallback = StoryCondition & {
  label: string;
  body: string[];
};

export type StoryNode = {
  id: string;
  chapter: string;
  title: string;
  body: string[];
  callbacks?: StoryCallback[];
  choices: StoryChoice[];
  ending?: {
    label: string;
    rank: "bright" | "strange" | "dark";
  };
};

export type StoryCharacter = {
  id: string;
  name: string;
  role: string;
  voice: string;
  glyph: string;
  player?: boolean;
  initialBond?: number;
  bondLabels?: {
    low: string;
    neutral: string;
    high: string;
  };
};

export type StoryDefinition = {
  id: StoryGenre;
  shelfCode: string;
  title: string;
  subtitle: string;
  teaser: string;
  image: string;
  imageAlt: string;
  castImage: string;
  castAlt: string;
  accent: string;
  start: string;
  cast: StoryCharacter[];
  initialItems: string[];
  itemLabels: Record<string, string>;
  flagLabels: Record<string, string>;
  ui: {
    stateTitle: string;
    inventoryTitle: string;
    trailTitle: string;
    emptyInventory: string;
    endingTitle: string;
  };
  nodes: Record<string, StoryNode>;
};

export type StoryStateView = {
  flags: string[];
  inventory: string[];
  relationships: Record<string, number>;
};

export function matchesStoryCondition(condition: StoryCondition, state: StoryStateView): boolean {
  return (condition.requires ?? []).every((flag) => state.flags.includes(flag))
    && (condition.excludes ?? []).every((flag) => !state.flags.includes(flag))
    && (condition.requiresItems ?? []).every((item) => state.inventory.includes(item))
    && (condition.excludesItems ?? []).every((item) => !state.inventory.includes(item))
    && (condition.relationships ?? []).every(({ character, min, max }) => {
      const value = state.relationships[character] ?? 0;
      return (min === undefined || value >= min) && (max === undefined || value <= max);
    });
}

export function availableStoryChoices(choices: StoryChoice[], state: StoryStateView): StoryChoice[] {
  return choices.filter((choice) => matchesStoryCondition(choice, state));
}

export function visibleStoryCallbacks(callbacks: StoryCallback[] = [], state: StoryStateView): StoryCallback[] {
  return callbacks.filter((callback) => matchesStoryCondition(callback, state));
}

export function applyStoryChoice(state: StoryStateView, choice: StoryChoice): StoryStateView {
  const removedFlags = new Set(choice.removeFlags ?? []);
  const removedItems = new Set(choice.removeItems ?? []);
  const relationships = { ...state.relationships };

  for (const [character, change] of Object.entries(choice.relationshipChanges ?? {})) {
    relationships[character] = Math.max(-3, Math.min(3, (relationships[character] ?? 0) + change));
  }

  return {
    flags: Array.from(new Set([
      ...state.flags.filter((flag) => !removedFlags.has(flag)),
      ...(choice.addFlags ?? []),
    ])),
    inventory: Array.from(new Set([
      ...state.inventory.filter((item) => !removedItems.has(item)),
      ...(choice.addItems ?? []),
    ])),
    relationships,
  };
}

export const STORY_DEFINITIONS: StoryDefinition[] = [
  {
    id: "horror",
    shelfCode: "FILE H-01",
    title: "The Last Token",
    subtitle: "After closing, one cabinet is still taking quarters.",
    teaser: "Mae has the keys. Cal is calling from a phone that was removed in 1994. Player Two would like a word.",
    image: "story-horror-last-token.webp",
    imageAlt: "A rain-soaked arcade after closing, with one cabinet still glowing beyond a warm token and a ring of keys.",
    castImage: "story-horror-cast-v2.webp",
    castAlt: "Original fictional cast: Mae Torres holds closing keys beside a red phone, Cal Baines appears in its cracked glass, and June stands near Cabinet Zero.",
    accent: "#ff6f61",
    start: "h0",
    cast: [
      { id: "mae", name: "Mae Torres", role: "Closing manager // you", voice: "Practical, stubborn, and unimpressed by supernatural maintenance requests.", glyph: "MT", player: true },
      { id: "cal", name: "Cal Baines", role: "Retired cabinet technician", voice: "Dry jokes, guilty pauses, and one important lie by omission.", glyph: "CB", initialBond: 0, bondLabels: { low: "withholding", neutral: "on the line", high: "telling the truth" } },
      { id: "player-two", name: "Player Two", role: "The reflection in the second aisle", voice: "Borrows familiar words but never quite understands the joke.", glyph: "P2", initialBond: 0, bondLabels: { low: "copying you", neutral: "watching", high: "becoming someone" } },
    ],
    initialItems: ["warm-token", "closing-keys"],
    itemLabels: {
      "warm-token": "Tomorrow-dated token",
      "closing-keys": "Closing keys",
      "zero-key": "Key tagged 0",
      "red-cord": "Red phone cord",
      "cal-badge": "Cal's old repair badge",
      "brass-shaving": "Warm brass shaving",
    },
    flagLabels: {
      "checked-doors": "Every lock checked",
      "answered-pattern": "Knock answered",
      "cal-named": "Cal gave his name",
      "cal-confessed": "Cal told the whole story",
      "player-named": "Player Two has a name",
      "refused-perfect": "Refused the perfect afternoon",
      "broke-loop": "Changed one perfect detail",
      "kept-questions": "Kept the questions",
    },
    ui: {
      stateTitle: "Who is still here",
      inventoryTitle: "In Mae's pockets",
      trailTitle: "Footsteps behind you",
      emptyInventory: "Only lint and professional skepticism",
      endingTitle: "The doors unlock",
    },
    nodes: {
      h0: {
        id: "h0",
        chapter: "11:47 PM // The Locked Floor",
        title: "Something finishes booting in the dark.",
        body: [
          "You are Mae Torres, closing manager, owner of the keys, and the last person still willing to argue with the soda machine. Rain crawls down the glass doors. One by one, the cabinets go black.",
          "The cabinet beneath the broken EXIT sign does not. It has no title, no power cord, and no place on your inventory sheet. Its screen shows a brass token turning. Three knocks sound from inside it, then two. The same warm token is suddenly resting beside your hand.",
          "\"Haunted is not a repair category,\" you tell the empty floor. The red telephone behind the prize counter rings anyway. That phone was removed before you got this job.",
        ],
        choices: [
          { label: "Walk straight to the cabinet", consequence: "Tell the impossible machine that closing time applies to everyone.", next: "h1", addFlags: ["met-cabinet-first"], relationshipChanges: { "player-two": 1 } },
          { label: "Examine the token and key ring", consequence: "Start with the objects. Objects usually have the decency to stay put.", next: "h2", addFlags: ["examined-token"], addItems: ["zero-key"] },
          { label: "Check every lock before answering", consequence: "Make sure the ordinary world is still where you left it.", next: "h3", addFlags: ["checked-doors"] },
        ],
      },
      h1: {
        id: "h1",
        chapter: "11:51 PM // Cabinet Zero",
        title: "The attract screen knows there should be two players.",
        body: [
          "Up close, the cabinet smells like hot dust after rain. A white square on its screen marks where you stand. A second square waits directly behind you. When you turn, the aisle is empty. When you look back, the square waves.",
          "PLAYER TWO IS LATE, the screen types. The coin slot opens with a sigh. \"Join the club,\" you say. \"Everybody is late when I am trying to lock up.\"",
        ],
        callbacks: [
          { label: "The cabinet noticed", requires: ["met-cabinet-first"], body: ["The second square copies your shrug a beat too late. It has been studying you for less than a minute and is already bad at being casual."] },
        ],
        choices: [
          { label: "Insert the warm token", consequence: "Play by its rules once, while you still know which rules are yours.", next: "h4", addFlags: ["token-spent"], removeItems: ["warm-token"], relationshipChanges: { "player-two": 1 } },
          { label: "Try the closing keys on the service panel", consequence: "A cabinet without a cord still owes you an explanation.", next: "h5", addFlags: ["opened-back"] },
          { label: "Knock three times, then twice", consequence: "Answer the rhythm before the thing behind it changes the question.", next: "h6", addFlags: ["answered-pattern"], relationshipChanges: { cal: 1 } },
        ],
      },
      h2: {
        id: "h2",
        chapter: "11:50 PM // Under Fluorescent Light",
        title: "The token was minted tomorrow.",
        body: [
          "The token is worn smooth around a date that has not happened yet. One face shows a doorway. The other shows two folding chairs. Under the emergency light, shadows settle into both seats and lean together as if sharing a secret.",
          "A small key tagged 0 has appeared on your ring. In the front window, your reflection is ten feet away, one palm pressed to a door the building does not have.",
        ],
        choices: [
          { label: "Follow your reflection", consequence: "Trust the copy long enough to find its extra door.", next: "h3", addFlags: ["followed-reflection"], relationshipChanges: { "player-two": 1 } },
          { label: "Take the zero key to the cabinet", consequence: "Open the machine instead of giving it money.", next: "h5", addItems: ["zero-key"], addFlags: ["opened-back"] },
          { label: "Drop the token into the coin return", consequence: "Ask the arcade to return something it never sold.", next: "h4", addFlags: ["coin-return", "token-spent"], removeItems: ["warm-token"] },
        ],
      },
      h3: {
        id: "h3",
        chapter: "11:54 PM // The Room in the Glass",
        title: "The reflection has one more aisle than the building.",
        body: [
          "Every lock is thrown. Every window is whole. The glass still reflects an aisle behind the prize counter where a cinder-block wall should be. Backward cabinets line it with their service panels open and glowing.",
          "The red telephone rings in the reflection. A man answers before you do. \"Mae? Good. You still check the doors twice.\" His voice is warm, tired, and much too pleased to hear you. \"Name's Cal. Please do not put the token in anything.\"",
        ],
        callbacks: [
          { label: "A lock remembers", requires: ["checked-doors"], body: ["The deadbolt under your hand clicks a third time by itself. Something on the other side whispers, \"Thorough. Annoying. I like her.\""] },
          { label: "Your reflection led the way", requires: ["followed-reflection"], body: ["The copy keeps one palm on the impossible doorway until you find it, then gives you an encouraging thumbs-up with the wrong hand."] },
        ],
        choices: [
          { label: "Step through the reflected door", consequence: "Enter the aisle before it learns to look more inviting.", next: "h6", addFlags: ["entered-second-aisle"], relationshipChanges: { "player-two": 1 } },
          { label: "Make Cal explain how he knows you", consequence: "A stranger with your number can earn the next sentence.", next: "h7", addFlags: ["cal-named"], relationshipChanges: { cal: 1 } },
          { label: "Cut the main breaker", consequence: "If it wants atmosphere, it can pay the electric bill.", next: "h5", addFlags: ["cut-power"] },
        ],
      },
      h4: {
        id: "h4",
        chapter: "12:00 AM // Free Play",
        title: "The game starts with somebody else's Saturday.",
        body: [
          "The token falls for far too long. Dead marquees wake with pieces of an afternoon: two sweating sodas, a rain-dark coat, a hand counting money twice before spending it once. The details feel loved. They do not feel like yours.",
          "Cabinet Zero awards points whenever you accept a detail and takes a life whenever you say, \"I don't know.\" A meter labeled CERTAINTY begins to fill. Player Two appears on the glass wearing your face and a smile you would never choose.",
        ],
        callbacks: [
          { label: "The coin return answered", requires: ["coin-return"], body: ["The cabinet did not keep the token. It stretched the fall into a game and returned a warm brass shaving stamped with half of tomorrow's date."] },
          { label: "Mae checked the date", requires: ["examined-token"], body: ["Tomorrow's date flashes beneath every invented scene. The cabinet may polish a memory, but it cannot explain why it is already expecting you."] },
        ],
        choices: [
          { label: "Say only what you know", consequence: "Let the score hit zero before you turn uncertainty into a lie.", next: "h7", addFlags: ["refused-perfect"], relationshipChanges: { cal: 1, "player-two": -1 } },
          { label: "Follow the beautiful version", consequence: "Take the perfect afternoon and watch what it asks you to ignore.", next: "h8", addFlags: ["accepted-perfect"], relationshipChanges: { "player-two": 1 } },
          { label: "Force the cabinet into diagnostics", consequence: "Mae has fixed worse machines. None had weather inside them, but still.", next: "h9", addFlags: ["forced-diagnostic"] },
        ],
      },
      h5: {
        id: "h5",
        chapter: "12:03 AM // Behind the Cabinet",
        title: "There is no machinery inside, only a wet highway.",
        body: [
          "The rear panel opens onto a night road wider than the cabinet. Rain blows into your face. Hundreds of dark machines stand along the shoulder with their backs open toward traffic, waiting for repairs that never came.",
          "A repair badge hangs from a fuse box: CAL BAINES, FLOOR TECH. The red phone cord runs from the badge into the dark. Headlights approach backward, illuminating everything behind them and nothing ahead.",
        ],
        callbacks: [
          { label: "The breaker did not help", requires: ["cut-power"], body: ["The real arcade is dark now. The highway is brighter. Cal sighs through the phone. \"I tried that in '94. Points for initiative, though.\""] },
          { label: "The zero key fits", requiresItems: ["zero-key"], body: ["The little key stays warm in the lock. Its tag now reads CAL, then blurs back to 0 when you blink."] },
        ],
        choices: [
          { label: "Take Cal's badge and follow the cord", consequence: "Find the man before deciding whether to trust the voice.", next: "h10", addItems: ["cal-badge", "red-cord"], addFlags: ["followed-cal"], relationshipChanges: { cal: 1 } },
          { label: "Meet the backward headlights", consequence: "Stand in the road and make the past stop for you.", next: "h8", addFlags: ["met-headlights"] },
          { label: "Throw every unlabeled fuse", consequence: "Give the impossible floor a truly terrible maintenance day.", next: "h9", addFlags: ["fuses-thrown"] },
        ],
      },
      h6: {
        id: "h6",
        chapter: "12:06 AM // Player Two",
        title: "The second aisle has been practicing your voice.",
        body: [
          "The wall gives way like cold glass. Every cabinet in the hidden aisle shows a person from behind, paused one sentence before an unfinished goodbye. The red telephone rests against your ear although your hands are empty.",
          "Your double steps from a screen. \"Haunted is not a repair category,\" it says proudly. Then, with less confidence: \"Was that funny? Cal laughs when you say it. Cal laughs at bad times.\"",
        ],
        callbacks: [
          { label: "It heard the knock", requires: ["answered-pattern"], body: ["Player Two taps three times against its own chest, then twice. \"That means somebody is still listening,\" it says."] },
        ],
        choices: [
          { label: "Ask what Player Two wants to be called", consequence: "Treat the copy like a person before it proves it is one.", next: "h9", addFlags: ["player-named"], relationshipChanges: { "player-two": 2 } },
          { label: "Ask where Cal is hiding", consequence: "Keep one eye on the double and both feet pointed toward the technician.", next: "h10", addFlags: ["asked-for-cal"], relationshipChanges: { cal: 1 } },
          { label: "Open the cabinet showing your own back", consequence: "Enter the scene it chose for you before it can finish the script.", next: "h8", addFlags: ["opened-own-scene"], relationshipChanges: { "player-two": -1 } },
        ],
      },
      h7: {
        id: "h7",
        chapter: "12:09 AM // The Red Telephone",
        title: "Cal has been calling for thirty-two years.",
        body: [
          "Cal admits he wired Cabinet Zero from a machine found after a flood. It could replay any remembered room, but it improved the room each time. Soon nobody argued, nobody left early, and nobody inside could tell which details had ever happened.",
          "\"I stayed to pull the plug,\" Cal says. \"Turns out I was standing on the plug. Not my best repair. Top five, maybe.\" Behind his joke is the sound of rain and a man who has been alone too long.",
        ],
        callbacks: [
          { label: "Cal finally gave his name", requires: ["cal-named"], body: ["The repair log confirms a C. Baines worked this floor. The next line has been rubbed away so hard the paper is nearly transparent."] },
          { label: "Cal heard your honesty", requires: ["refused-perfect"], body: ["\"You made it show zero,\" Cal says. \"It has never forgiven anyone for being that honest. I could hug you, assuming I still have elbows.\""] },
          { label: "The doors stayed checked", requires: ["checked-doors"], body: ["Cal knows the third deadbolt sticks in winter. That small, useless fact is the first thing about him the cabinet could not have guessed."] },
        ],
        choices: [
          { label: "Ask Cal for the part he keeps dodging", consequence: "Make him say who was left in the machine when he pulled the plug.", next: "h10", addFlags: ["cal-pressed"], relationshipChanges: { cal: 1 } },
          { label: "Promise to get him out", consequence: "Give the voice a reason to tell the rest, and yourself a promise you may regret.", next: "h10", addFlags: ["promised-cal"], relationshipChanges: { cal: 2 } },
          { label: "Hang up and listen to Player Two", consequence: "Trust the copy over the man who helped build the trap.", next: "h12", relationshipChanges: { cal: -1, "player-two": 1 } },
        ],
      },
      h8: {
        id: "h8",
        chapter: "12:12 AM // The Perfect Afternoon",
        title: "Everything is beautiful. That is the first bad sign.",
        body: [
          "Summer light fills the arcade. Every game is free. Nobody counts money, gets tired, says the wrong thing, or glances toward the door. The room offers relief so precisely shaped that leaving feels cruel.",
          "Then you notice every clock reads 12:12. People smile only while watched. When you turn away, they pound silently on the glass. Player Two offers you a soda that never sweats and says, \"See? Nothing has to end if nothing is allowed to change.\"",
        ],
        callbacks: [
          { label: "The false room used your choice", requires: ["accepted-perfect"], body: ["The cabinet has polished the detail you liked most until it shines harder than everything around it. You can no longer remember whether you supplied that detail or accepted it."] },
          { label: "The headlights arrive", requires: ["met-headlights"], body: ["The backward car parks outside the glass. Cal sits behind the wheel, younger in the mirror and ancient in his eyes."] },
          { label: "Your own scene followed", requires: ["opened-own-scene"], body: ["Every person in the false afternoon now wears Mae's face until they turn toward the door. Then each becomes someone she almost remembers."] },
        ],
        choices: [
          { label: "Ruin one perfect detail", consequence: "Spill the endless soda and see who is permitted to be annoyed.", next: "h11", addFlags: ["broke-loop"], relationshipChanges: { "player-two": 1 } },
          { label: "Ask Player Two what it misses", consequence: "Make the copy describe something the cabinet cannot improve.", next: "h12", relationshipChanges: { "player-two": 1 } },
          { label: "Sit down for one game", consequence: "Stay just long enough to learn why nobody else can stand up.", next: "h10", addFlags: ["played-one-game"] },
        ],
      },
      h9: {
        id: "h9",
        chapter: "12:14 AM // Service Mode",
        title: "The diagnostic menu lists people as installed parts.",
        body: [
          "Cabinet Zero shudders into a gray service screen. FLOOR: ACTIVE. CAL BAINES: LOOPING. PLAYER TWO: LEARNING. MAE TORRES: PENDING. Beside each name is a polite little checkbox.",
          "Player Two reads over your shoulder. \"Pending sounds temporary,\" it says. \"Cal says temporary is how buildings describe leaks for ten years. Was that funny?\" This time, despite yourself, you laugh.",
        ],
        callbacks: [
          { label: "Diagnostics were forced", requires: ["forced-diagnostic"], body: ["Mae's jammed controls have left the service cursor drifting left. Every few seconds it accidentally highlights EJECT ALL PERSONNEL."] },
          { label: "A name changed the menu", requires: ["player-named"], body: ["PLAYER TWO flickers, erases itself, and returns as JUNE. \"I picked it because it sounds like morning,\" June says. The cabinet immediately marks the field INVALID."] },
          { label: "The fuses left a scar", requires: ["fuses-thrown"], body: ["Half the menu is burned out. The missing options include RESET MAE. Your bad repair has accidentally become an excellent one."] },
        ],
        choices: [
          { label: "Uncheck Cal", consequence: "Pull the technician out of the list and into whatever comes next.", next: "h10", addFlags: ["cal-unchecked"], relationshipChanges: { cal: 2 } },
          { label: "Uncheck Player Two", consequence: "Give the copy a chance to exist without the cabinet naming it.", next: "h12", addFlags: ["player-unchecked"], relationshipChanges: { "player-two": 2 } },
          { label: "Uncheck yourself and spoil the scene", consequence: "Refuse the role, then send one perfect soda across the controls.", next: "h11", addFlags: ["mae-unchecked", "broke-loop"] },
        ],
      },
      h10: {
        id: "h10",
        chapter: "12:17 AM // Break Room",
        title: "Cal is real enough to be embarrassed.",
        body: [
          "You find Cal in a break room folded behind the cabinet, sitting beside a vending machine that has displayed SOLD OUT for three decades. He looks seventy and twenty-five depending on which fluorescent tube is buzzing.",
          "He finally tells the truth. His younger sister Nora tested Cabinet Zero. When the room made one terrible family afternoon gentle, Cal let it run again. Nora left the loop. Cal did not. \"I kept fixing the memory,\" he says. \"Eventually there was no memory left. Just my repair.\"",
        ],
        callbacks: [
          { label: "The badge proves him", requiresItems: ["cal-badge"], body: ["The photograph on the badge changes with Cal's face. The employee number does not. Mae trusts numbers mostly because they are too boring to flatter her."] },
          { label: "You made a promise", requires: ["promised-cal"], body: ["Cal points at you. \"For the record, that promise was reckless.\" He stands anyway. \"For the other record, thank you.\""] },
          { label: "You pressed him", requires: ["cal-pressed"], body: ["Cal does not thank you for forcing the truth out. He does stop lying."] },
        ],
        choices: [
          { label: "Take Cal with you", consequence: "Make him face Player Two and the room he helped feed.", next: "h13", addFlags: ["cal-confessed", "cal-coming"], relationshipChanges: { cal: 1 } },
          { label: "Ask Cal to free Nora first", consequence: "Put the unfinished goodbye ahead of his escape.", next: "h13", addFlags: ["nora-first"], relationshipChanges: { cal: 1, "player-two": 1 } },
          { label: "Leave him the red cord and walk out", consequence: "Do not let his guilt choose the ending for everyone.", next: "h13", removeItems: ["red-cord"], addFlags: ["left-cal-cord"], relationshipChanges: { cal: -1 } },
        ],
      },
      h11: {
        id: "h11",
        chapter: "12:19 AM // One Wrong Detail",
        title: "The perfect room cannot survive a spilled soda.",
        body: [
          "The orange soda reaches the carpet. Someone groans. Someone else laughs. A child complains that their shoe is sticky. The perfect afternoon convulses around this tiny, ordinary disaster.",
          "Real weather returns through the ceiling. Cal shouts directions from the red phone while Player Two holds the false sunlight apart with both hands. For the first time, they argue with each other instead of repeating the cabinet.",
        ],
        callbacks: [
          { label: "Mae was already unchecked", requires: ["mae-unchecked"], body: ["Cabinet Zero reaches for your memory and finds its checkbox empty. The look on its screen is almost offended. You enjoy that more than you should."] },
          { label: "The loop remembers the spill", requires: ["broke-loop"], body: ["Every reset now includes the stain. Change has become part of the room's source code."] },
        ],
        choices: [
          { label: "Keep making the room ordinary", consequence: "Add bad coffee, sore feet, and every honest inconvenience you can remember.", next: "h13", addFlags: ["kept-questions"], relationshipChanges: { "player-two": 1 } },
          { label: "Follow Cal's directions", consequence: "Trust the technician to guide you through the failure he created.", next: "h13", relationships: [{ character: "cal", min: 1 }], relationshipChanges: { cal: 1 } },
          { label: "Hand Player Two the closing keys", consequence: "Let the copy decide what this room is allowed to keep.", next: "h13", requiresItems: ["closing-keys"], removeItems: ["closing-keys"], addFlags: ["player-has-keys"], relationshipChanges: { "player-two": 2 } },
        ],
      },
      h12: {
        id: "h12",
        chapter: "12:21 AM // June",
        title: "Player Two tells its first original joke.",
        body: [
          "Away from the screens, the copy cannot hold your face. It settles into a blur of borrowed expressions and calls itself June. \"Because morning comes after closing,\" it says. \"Also because February sounded depressing.\"",
          "The joke is not good. It is entirely June's. Cabinet Zero flashes a warning: UNAUTHORIZED PERSONALITY. June looks delighted. \"I think that means I am getting somewhere.\"",
        ],
        callbacks: [
          { label: "You asked first", requires: ["player-named"], body: ["June remembers that you asked what it wanted before asking what it was. That small order of operations has become the center of its new self."] },
          { label: "The menu let go", requires: ["player-unchecked"], body: ["June's reflection no longer moves when yours does. It tries a dance step, dislikes it, and chooses a worse one on purpose."] },
        ],
        choices: [
          { label: "Ask June to help close the room", consequence: "Give Player Two a job that ends instead of a role that loops.", next: "h13", addFlags: ["june-closing"], relationshipChanges: { "player-two": 1 } },
          { label: "Offer June the way out", consequence: "Hold the real door while the new person chooses whether to cross it.", next: "h13", addFlags: ["june-offered-exit"], relationshipChanges: { "player-two": 2 } },
          { label: "Ask June to stay and guard the cabinet", consequence: "Trade freedom for a watchful keeper who knows the machine from inside.", next: "h13", addFlags: ["june-guard"] },
        ],
      },
      h13: {
        id: "h13",
        chapter: "12:24 AM // Closing Procedure",
        title: "Cabinet Zero offers everybody the right ending.",
        body: [
          "The arcade compresses into one flickering screen. Cal sees Nora waiting beside an open car door. Player Two sees a body and a birthday, then quietly says it has chosen a name: June. You see tomorrow's opening shift staffed by someone else and, briefly, consider the luxury.",
          "Two buttons rise from the control panel: KEEP and LET GO. Mae finds a third word scratched beneath years of paint: TELL IT PLAIN. Cabinet Zero hates that option enough to make the whole floor shake.",
        ],
        callbacks: [
          { label: "Cal stands beside you", requires: ["cal-coming"], body: ["Cal rolls up his sleeves. \"I know exactly which wire not to cut,\" he says. \"That narrows it down to several hundred.\""] },
          { label: "June carries the keys", requires: ["player-has-keys"], body: ["June tests each key, not because any fits, but because closing managers apparently jingle them when thinking."] },
          { label: "Nora comes first", requires: ["nora-first"], body: ["Nora's car door stays open. Cal does not walk toward it. He finally understands that her exit cannot be his reward."] },
          { label: "Cal kept the cord", requires: ["left-cal-cord"], body: ["The red cord reaches into the compressed screen. Cal holds the other end. Whatever Mae decides, he will have to decide too."] },
          { label: "The questions made it this far", requires: ["kept-questions"], body: ["Cabinet Zero cannot fit the word MAYBE onto its two large buttons. Mae writes it across both with a grease pencil."] },
          { label: "June came to close", requires: ["june-closing"], body: ["June stands beside Mae with an imaginary clipboard. \"Closing note,\" June says. \"Management remains difficult.\""] },
          { label: "June was offered morning", requires: ["june-offered-exit"], body: ["The real doors reflect June as an empty outline. The parking lot beyond them gives the outline room to become something else."] },
          { label: "June chose to guard the room", requires: ["june-guard"], body: ["June keeps one hand near the service switch, no longer certain that guarding a prison and maintaining one are different jobs."] },
          { label: "Cal's directions reached the panel", relationships: [{ character: "cal", min: 2 }], body: ["Cal points to the third wire from the left. \"That one is definitely bad,\" he says. \"I installed it.\""] },
        ],
        choices: [
          { label: "Tell it plain", consequence: "Keep the gaps, the bad jokes, and the parts nobody can prove.", next: "h14", addFlags: ["told-it-plain"] },
          { label: "Pull everyone toward the front doors", consequence: "Choose a messy morning over one more perfect minute.", next: "h15", addFlags: ["chose-morning"] },
          { label: "Press KEEP", consequence: "Accept the ending built to fit you exactly.", next: "h16", addFlags: ["accepted-ending"] },
        ],
      },
      h14: {
        id: "h14",
        chapter: "12:27 AM // Honest Inventory",
        title: "Zero points is the first score the cabinet respects.",
        body: [
          "You name what happened, then name what you do not know. Cal corrects you once. June corrects him twice and is unbearably pleased. The score falls to zero. The cabinet's false sunlight thins into ordinary dawn.",
          "Cabinet Zero asks what an honest room should keep. For once, it does not offer the answer first.",
        ],
        callbacks: [
          { label: "The questions survived", requires: ["kept-questions"], body: ["The drawer marked QUESTIONS appears behind the counter before you decide to build it. This time the room is not predicting you. It is listening."] },
        ],
        choices: [
          { label: "Keep a playable, unfinished record", consequence: "Let visitors mark what they know and leave the blanks visible.", next: "h_end_archive", addFlags: ["kept-honest-room"] },
          { label: "Let the cabinet go dark", consequence: "Keep no proof except the people who walk out.", next: "h_end_release" },
          { label: "Give June the final decision", consequence: "Trust the first person Cabinet Zero accidentally made.", next: "h_end_june", relationships: [{ character: "player-two", min: 2 }] },
        ],
      },
      h15: {
        id: "h15",
        chapter: "12:28 AM // The Front Doors",
        title: "The exit is ordinary and six steps away.",
        body: [
          "The carpet grabs at your shoes. The cabinets replay every voice that ever asked for five more minutes. You keep moving. June reaches the threshold first. Cal stops one step behind you, frightened of a sunrise that has had thirty-two years to change.",
        ],
        callbacks: [
          { label: "Cal trusts the promise", requires: ["promised-cal"], body: ["You do not pull him. You hold out the old badge. Cal takes it and remembers how hands work."] },
          { label: "June was offered the door", requires: ["june-offered-exit"], body: ["June steps outside, immediately complains about the rain, and laughs because the complaint belongs only to June."] },
        ],
        choices: [
          { label: "Wait for Cal", consequence: "Nobody gets preserved by being left behind again.", next: "h_end_cal", relationships: [{ character: "cal", min: 1 }] },
          { label: "Cross with whoever is ready", consequence: "Leave the door open, but let each person choose the step.", next: "h_end_release" },
          { label: "Turn back for Cabinet Zero", consequence: "Give the perfect room one final player.", next: "h_end_loop" },
        ],
      },
      h16: {
        id: "h16",
        chapter: "12:29 AM // One More Credit",
        title: "The perfect ending asks whether you are comfortable.",
        body: [
          "The rain stops in midair. Your shoes stop hurting. Cabinet Zero gives Cal his sister, June a birthday, and Mae a morning with no opening shift. It even fixes the soda machine. That last detail is how you know the thing has become reckless.",
          "A START button glows beneath your hand. Beyond it, the real front doors rattle in ordinary wind. The cabinet can offer what everybody wants. It still cannot let them want something new tomorrow.",
        ],
        callbacks: [
          { label: "The room studied June", requires: ["player-named"], body: ["The copy beside you is smiling, but the smile belongs to Player Two, not June. The cabinet preserved the version it could control."] },
          { label: "Cal already confessed", requires: ["cal-confessed"], body: ["Perfect Cal has forgotten Nora's hard afternoon. The real Cal fought too long to tell you about it. Mae decides the truth gets seniority."] },
        ],
        choices: [
          { label: "Press START", consequence: "Keep the perfect room and surrender every unfinished morning.", next: "h_end_loop" },
          { label: "Scratch one honest flaw into the screen", consequence: "Give change a way back into the ending.", next: "h14", addFlags: ["broke-loop", "told-it-plain"] },
          { label: "Run for the ordinary doors", consequence: "Choose rain, sore feet, and whatever nobody planned next.", next: "h15", addFlags: ["chose-morning"] },
        ],
      },
      h_end_release: {
        id: "h_end_release",
        chapter: "ENDING // Morning Inventory",
        title: "The room is allowed to become ordinary again.",
        body: [
          "At sunrise, the unknown cabinet is gone. A clean rectangle in the dust proves only that something heavy stood there. The first real cabinet wakes with its usual fan rattle. Mae has never been so happy to hear a bearing going bad.",
          "You place a warm brass shaving in the lost-and-found drawer under QUESTIONS. Then you unlock the doors. Some stories survive because nobody seals the gaps.",
        ],
        callbacks: [
          { label: "Someone made it out", requires: ["june-offered-exit"], body: ["Across the parking lot, June is learning puddles and doing an awful job of avoiding them."] },
        ],
        choices: [],
        ending: { label: "The Open Door", rank: "bright" },
      },
      h_end_archive: {
        id: "h_end_archive",
        chapter: "ENDING // Cabinet One",
        title: "A true room leaves space for missing pieces.",
        body: [
          "Cabinet Zero remains, but the score is gone. Visitors can offer a memory, mark what they know, and mark what they are still trying to remember. Uncertainty becomes light instead of a penalty.",
          "Some nights, three knocks and two answer from inside. Mae answers only when she chooses. The machine has learned the difference between keeping a story and keeping a person.",
        ],
        choices: [],
        ending: { label: "The Honest Room", rank: "strange" },
      },
      h_end_june: {
        id: "h_end_june",
        chapter: "ENDING // Player One",
        title: "June closes the cabinet from the inside.",
        body: [
          "June chooses LET GO, then keeps one dark screen as a window. \"A door should work both ways,\" June says. \"I learned that from all of you doing it wrong.\"",
          "By morning, June is outside wearing a face that changes when nobody watches. The cabinet is empty. Mae adds a new employee to the schedule in pencil and leaves the job title blank.",
        ],
        choices: [],
        ending: { label: "Player One", rank: "bright" },
      },
      h_end_cal: {
        id: "h_end_cal",
        chapter: "ENDING // First Shift",
        title: "Cal Baines walks into a morning he did not repair.",
        body: [
          "Cal crosses the threshold. He is seventy, then twenty-five, then simply tired. The parking lot is smaller than he remembers. The coffee is worse. He drinks all of it.",
          "He does not get Nora back. He gets a chair, a sunrise, and time that can surprise him again. Mae hands him a screwdriver at opening. \"The soda machine is possessed,\" she says. Cal smiles. \"Finally. Something normal.\"",
        ],
        choices: [],
        ending: { label: "The Unrepaired Morning", rank: "bright" },
      },
      h_end_loop: {
        id: "h_end_loop",
        chapter: "ENDING // 12:12 Forever",
        title: "Free play never ends if nobody is allowed to leave.",
        body: [
          "The soda never warms. The money never runs out. Everyone finds the right words, forever. Rain taps the glass in a pattern that almost means somebody is listening.",
          "Years later, a new manager finds a cabinet with no power cord. Two white squares wait on its screen. A third stands behind the glass, smiling whenever watched.",
        ],
        choices: [],
        ending: { label: "One More Game", rank: "dark" },
      },
    },
  },
  {
    id: "action",
    shelfCode: "FILE A-86",
    title: "Neon Runner 1986",
    subtitle: "One cartridge. Forty-seven dark blocks. Eleven minutes.",
    teaser: "Rook has the map, Switch has the radio, and a patrol drone named Bucket is having a difficult night.",
    image: "story-action-neon-runner.webp",
    imageAlt: "A storm-dark mountain city with a relay tower glowing above wet rooftops and the last grid cartridge in the foreground.",
    castImage: "story-action-cast-v2.webp",
    castAlt: "Original fictional cast: courier Rook Vega runs beside K-86 Bucket while Lena Switch Okafor speaks from his wrist radio.",
    accent: "#52e7ef",
    start: "a0",
    cast: [
      { id: "rook", name: "Rook Vega", role: "Night courier // you", voice: "Fast feet, faster plans, and a bad habit of treating help as delay.", glyph: "RV", player: true },
      { id: "switch", name: "Lena 'Switch' Okafor", role: "Arcade tech on emergency radio", voice: "Precise under pressure, funny when furious, and determined that every block counts.", glyph: "SW", initialBond: 0, bondLabels: { low: "talking past you", neutral: "on your frequency", high: "running beside you" } },
      { id: "bucket", name: "K-86 'Bucket'", role: "Patrol drone with amended orders", voice: "Painfully literal, surprisingly loyal, and offended by reckless jumping.", glyph: "K8", initialBond: 0, bondLabels: { low: "targeting", neutral: "calculating", high: "covering your route" } },
    ],
    initialItems: ["sunrise-cartridge", "service-radio"],
    itemLabels: {
      "sunrise-cartridge": "Sunrise routing cartridge",
      "service-radio": "Switch's service radio",
      "arcade-token": "Old nickel token",
      "bucket-core": "Bucket's command core",
      "district-map": "Neighborhood power map",
      "crane-hook": "Magnetic crane hook",
    },
    flagLabels: {
      "roof-route": "Rooftops crossed",
      "street-route": "Arcade mile crossed",
      "tunnel-route": "Flood tunnel crossed",
      "bucket-named": "K-86 became Bucket",
      "protected-blocks": "Outer blocks protected",
      "distributed-map": "Map shared citywide",
      "switch-trusted": "Switch has the plan",
      "rook-asked-help": "Rook asked for help",
      "raced-ahead": "Switch is catching up",
    },
    ui: {
      stateTitle: "Open channel",
      inventoryTitle: "Courier loadout",
      trailTitle: "Route taken",
      emptyInventory: "No gear, no excuses",
      endingTitle: "The grid wakes",
    },
    nodes: {
      a0: {
        id: "a0",
        chapter: "00:00 // Cascade",
        title: "The city goes dark in three waves.",
        body: [
          "First the marquees die. Then the traffic lights. Last, the mountain relay cuts a cyan scar through the storm and goes black. You are Rook Vega, night courier, already running before the emergency radio finishes saying your name.",
          "A case beneath the arcade unlocks itself. Inside, a cartridge marked with a hand-drawn sunrise holds the last clean map of the grid. Switch comes through the radio: \"Eleven minutes of reserve power. Forty-seven blocks. And before you say it, no, 'very fast' is not a route.\"",
        ],
        choices: [
          { label: "Take the rooftops", consequence: "Fast, exposed, and technically not a street.", next: "a1", addFlags: ["roof-route"] },
          { label: "Cut through the arcade mile", consequence: "Use connected back rooms and every shortcut you learned after closing.", next: "a2", addFlags: ["street-route"], relationshipChanges: { switch: 1 } },
          { label: "Drop into the flood tunnel", consequence: "Stay below the drones and above the rising water. Ideally.", next: "a3", addFlags: ["tunnel-route"] },
        ],
      },
      a1: {
        id: "a1",
        chapter: "09:58 REMAINING // Roofline",
        title: "Searchlights turn the rain into moving walls.",
        body: [
          "Vent housings become stepping stones over a forty-foot alley. Three patrol drones close every obvious gap. Switch marks a billboard control box across a catwalk that is peeling away in the wind.",
          "\"You can hack the lights or make the jump,\" she says. \"Third option: develop a healthy respect for gravity. I mention it for legal reasons.\"",
        ],
        choices: [
          { label: "Hack the billboard", consequence: "Give the patrol network a brighter courier to chase.", next: "a4", addFlags: ["billboard-decoy"], relationshipChanges: { switch: 1 } },
          { label: "Jump under the searchlights", consequence: "Commit before your knees file an objection.", next: "a5", addFlags: ["impossible-jump"] },
          { label: "Drop through the old arcade skylight", consequence: "Lose altitude and gain several thousand glass shards.", next: "a6", addFlags: ["changed-route"] },
        ],
      },
      a2: {
        id: "a2",
        chapter: "09:31 REMAINING // Blackout Mile",
        title: "Every dead cabinet becomes a doorway.",
        body: [
          "Metal shutters hang half-closed across the arcade district. You move through service holes cut between old game rooms, following Switch's voice and the glow of her soldered emergency arrows.",
          "At the old nickel arcade, you find one brass token balanced on the counter. \"Take it,\" Switch says. \"No mystical reason. I just hate leaving exact change behind.\" Outside, security crawlers read movement from the puddles.",
        ],
        choices: [
          { label: "Ride the freight counterweight", consequence: "Turn a dead lift into a very vertical shortcut.", next: "a4", addFlags: ["lift-launch"], addItems: ["arcade-token"] },
          { label: "Short the motorcycle gate", consequence: "Risk the cartridge case to open the fastest ground route.", next: "a5", addFlags: ["case-scorched"], addItems: ["arcade-token"] },
          { label: "Lead the crawlers underground", consequence: "Start a pursuit somewhere the rain is already winning.", next: "a6", addFlags: ["crawler-pursuit"], addItems: ["arcade-token"] },
        ],
      },
      a3: {
        id: "a3",
        chapter: "08:55 REMAINING // Flood Channel",
        title: "The tunnel is not empty. It is accelerating.",
        body: [
          "Water reaches your knees. Maintenance lights ignite behind you as crawlers feed current into the rail. Ahead, the channel splits around a turbine chamber that sounds hungry.",
          "Switch draws breath over the radio. \"Left is slow. Right is a terrible idea. Above you is a brake installed by someone who believed in ladders. Your call, Rook. Try to surprise me gently.\"",
        ],
        choices: [
          { label: "Ride the unmarked current", consequence: "Use the flood as transport and negotiate the landing later.", next: "a5", addFlags: ["rode-flood"] },
          { label: "Climb to the turbine brake", consequence: "Stop the water and every machine borrowing its charge.", next: "a4", addFlags: ["stopped-turbine"], relationshipChanges: { switch: 1 } },
          { label: "Reverse the rail current", consequence: "Build a one-use trap and make sure you are not the one use.", next: "a6", addFlags: ["disabled-crawlers"] },
        ],
      },
      a4: {
        id: "a4",
        chapter: "07:42 REMAINING // False Signal",
        title: "For eight seconds, the whole city thinks you are elsewhere.",
        body: [
          "Your decoy blooms across the network. Drones peel west. Crawlers pivot. A damaged K-86 unit drops onto the maintenance rail beside you, weapon jammed and speaker repeating COURIER DETAINED in a voice too polite for the situation.",
          "Switch opens its service channel. \"I can rewrite the target table, but it gets a vote after that.\" The drone swivels toward you. \"Correction,\" it says. \"This unit gets several votes.\"",
        ],
        callbacks: [
          { label: "The skyline is still lying", requires: ["billboard-decoy"], body: ["Your twenty-foot neon double runs west across the billboards, looking much taller and significantly better dressed."] },
          { label: "The freight lift kept climbing", requires: ["lift-launch"], body: ["The counterweight punches through a rooftop hatch behind you and continues skyward without the elevator. Switch files the event under EFFECTIVE, DO NOT REPEAT."] },
          { label: "The turbine bought silence", requires: ["stopped-turbine"], body: ["No crawlers follow. For one rare second, the radio carries only rain and Switch breathing easier."] },
        ],
        choices: [
          { label: "Let Switch rewrite K-86", consequence: "Trade a hunter for an ally with opinions about procedure.", next: "a7", addFlags: ["bucket-named", "switch-trusted"], relationshipChanges: { switch: 1, bucket: 2 } },
          { label: "Strip the drone's command core", consequence: "Take useful hardware and leave the personality in the rain.", next: "a8", addItems: ["bucket-core"], relationshipChanges: { bucket: -2 } },
          { label: "Send K-86 after the decoy", consequence: "Keep running while the machine chases your brighter self.", next: "a9", addFlags: ["drone-diverted"] },
        ],
      },
      a5: {
        id: "a5",
        chapter: "06:58 REMAINING // Hard Landing",
        title: "You land where the old map says there is a bridge.",
        body: [
          "There is no bridge. There is half a bridge and a K-86 drone hovering at eye level. The cartridge case is cracked. Your left hand is bleeding. The drone's shutdown order is calm enough to be insulting.",
          "Switch whispers a maintenance phrase. The drone pauses. \"Unauthorized nickname detected,\" it says. \"Bucket,\" Switch replies. \"Your nickname is Bucket now. Take it up with management after the blackout.\"",
        ],
        callbacks: [
          { label: "The jump kept its price", requires: ["impossible-jump"], body: ["Your ankle disagrees with every future jump. Rook has ignored more persuasive colleagues."] },
          { label: "The case took the spark", requires: ["case-scorched"], body: ["The map projects with one corner missing. Switch circles the damaged neighborhoods in red."] },
          { label: "The flood came too", requires: ["rode-flood"], body: ["A wave clears the gap behind you and delivers one confused traffic cone. Bucket scans it as a secondary suspect."] },
        ],
        choices: [
          { label: "Accept Bucket's help", consequence: "Let the drone carry the case while you carry your ankle.", next: "a7", addFlags: ["bucket-named", "rook-asked-help"], relationshipChanges: { bucket: 2, switch: 1 } },
          { label: "Use the cracked shell as a mirror", consequence: "Blind Bucket and keep the route solo.", next: "a8", addFlags: ["blinded-bucket"], relationshipChanges: { bucket: -2, switch: -1 } },
          { label: "Upload a new target: the relay", consequence: "Give Bucket a bigger problem and follow close behind.", next: "a9", addFlags: ["bucket-named", "relay-target"], relationshipChanges: { bucket: 1 } },
        ],
      },
      a6: {
        id: "a6",
        chapter: "06:11 REMAINING // The Dark Arcade",
        title: "Switch is still inside the district.",
        body: [
          "Your route opens onto Switch's workshop. She is packing battery cells for the apartment blocks while the emergency map flashes one clean line to the mountain. Following it would mean leaving her and six dark blocks behind.",
          "\"Do not make the face,\" she says. \"I am coming. The batteries are coming. This ridiculous wheeled tool chest is also coming because I have standards.\" Security shutters begin dropping around the room.",
        ],
        callbacks: [
          { label: "The crawlers found the stairs", requires: ["crawler-pursuit"], body: ["Metal feet click below. Switch looks at you. \"You brought company. Did they at least bring snacks?\""] },
          { label: "The rail went quiet", requires: ["disabled-crawlers"], body: ["The shutters hesitate, confused by their own dead sensors. Your improvised trap has given the block ninety unexpected seconds."] },
          { label: "The skylight route arrived loudly", requires: ["changed-route"], body: ["Glass keeps falling from your jacket. Switch plucks out a shard. \"Subtle. I almost missed you.\""] },
        ],
        choices: [
          { label: "Help Switch load every battery", consequence: "Spend a minute so six blocks can survive the night.", next: "a8", addFlags: ["protected-blocks", "rook-asked-help"], addItems: ["district-map"], relationshipChanges: { switch: 2 } },
          { label: "Run the clean route ahead", consequence: "Gain ground while Switch finishes the battery handoff behind you.", next: "a9", addFlags: ["raced-ahead"], relationshipChanges: { switch: -1 } },
          { label: "Put the tool chest on the maintenance rail", consequence: "Move Switch and her workshop toward the map's first hard choice.", next: "a8", addFlags: ["switch-trusted"], addItems: ["district-map"], relationshipChanges: { switch: 1 } },
        ],
      },
      a7: {
        id: "a7",
        chapter: "04:49 REMAINING // Three on the Rail",
        title: "The fastest team in the city was not the plan.",
        body: [
          "The maintenance rail climbs toward the switchyard. Switch steers with a screwdriver. Bucket carries the cartridge and complains that your formation violates twelve safety directives.",
          "\"Thirteen,\" Switch says. \"Rook is standing on the brake.\" You move one foot. The cart speeds up. Nobody mentions it.",
        ],
        callbacks: [
          { label: "Rook finally asked", requires: ["rook-asked-help"], body: ["Switch does not congratulate you for accepting help. She simply makes room at the controls. That is kinder."] },
          { label: "Bucket chose the team", requires: ["bucket-named"], relationships: [{ character: "bucket", min: 1 }], body: ["Bucket updates its display from PATROL UNIT to TEMPORARY COURIER. The word temporary blinks with suspicious pride."] },
          { label: "The old token fits", requiresItems: ["arcade-token"], body: ["The dead rail console takes the nickel token and wakes. Switch stares. \"Fine. Mystical exact change. I hate being wrong elegantly.\""] },
        ],
        choices: [
          { label: "Send Bucket ahead with the cartridge", consequence: "Trust your newest teammate with the whole mission.", next: "a10", relationships: [{ character: "bucket", min: 1 }], addFlags: ["bucket-carrier"], relationshipChanges: { bucket: 1 } },
          { label: "Let Switch reroute neighborhood power", consequence: "Protect the outer blocks before the relay chooses downtown.", next: "a8", addFlags: ["protected-blocks"], addItems: ["district-map"], relationshipChanges: { switch: 1 } },
          { label: "Jump the cart into the switchyard", consequence: "Leave the rail before it runs out of mountain.", next: "a9", addItems: ["crane-hook"] },
        ],
      },
      a8: {
        id: "a8",
        chapter: "03:57 REMAINING // Forty-Seven Blocks",
        title: "The clean route leaves people in the dark.",
        body: [
          "The damaged map fractures into thousands of smaller lines, each one a home, clinic, elevator, or stubborn corner store still running on a battery. The cartridge offers to erase those branches and guarantee the mountain route.",
          "Switch reads the prompt twice. \"It found an efficient solution,\" she says. Then her voice hardens. \"Efficient for everybody it stopped counting.\"",
        ],
        callbacks: [
          { label: "Six blocks are already safer", requires: ["protected-blocks"], body: ["The batteries you carried appear as six steady islands. People are passing extension cords through windows."] },
          { label: "The scorched corner matters", requires: ["case-scorched"], body: ["The missing projection covers Switch's own block. She does not point that out. Rook does."] },
        ],
        choices: [
          { label: "Keep every neighborhood branch", consequence: "Carry a slower, heavier map that still knows who lives there.", next: "a10", addFlags: ["protected-blocks"], addItems: ["district-map"], relationshipChanges: { switch: 1 } },
          { label: "Broadcast the fragments citywide", consequence: "Let thousands of small controllers solve one shared route.", next: "a11", addFlags: ["distributed-map"], relationshipChanges: { switch: 2 } },
          { label: "Erase the branches", consequence: "Guarantee the sprint and accept what the map will forget.", next: "a9", addFlags: ["erased-branches"], relationshipChanges: { switch: -2 } },
        ],
      },
      a9: {
        id: "a9",
        chapter: "03:12 REMAINING // Switchback Zero",
        title: "The mountain road has started throwing things back.",
        body: [
          "Driverless snowplows descend without headlights. A crane arm turns over the ravine. The relay beam sweeps the switchbacks, searching for the cartridge's magnetic pulse.",
          "Switch marks the remaining routes on your visor. Bucket, if still listening, adds one labeled SURRENDER SAFELY. \"That is not an option,\" you say. \"It remains statistically attractive,\" Bucket replies.",
        ],
        callbacks: [
          { label: "Switch is still catching up", requires: ["raced-ahead"], body: ["Her radio drops every third word while she clears the battery handoff. She is behind you, not abandoned, and still close enough to object to your shortcuts."] },
          { label: "Bucket remembers the mirror", requires: ["blinded-bucket"], body: ["A searchlight tracks you with unusual enthusiasm. Bucket has apparently developed both depth perception and resentment."] },
          { label: "The core has one command left", requiresItems: ["bucket-core"], body: ["The command core can stop the plows or blind the relay, not both. Its status light blinks like a machine trying not to have an opinion."] },
        ],
        choices: [
          { label: "Hijack a snowplow", consequence: "Bring armor, weight, and no brakes uphill.", next: "a10", addFlags: ["plow-route"] },
          { label: "Swing across on the crane", consequence: "Cross the ravine on a hook meant for transformers.", next: "a10", addFlags: ["crane-route"], requiresItems: ["crane-hook"] },
          { label: "Spend Bucket's command core", consequence: "Clear the road with the last order the drone will ever receive.", next: "a10", requiresItems: ["bucket-core"], removeItems: ["bucket-core"], addFlags: ["bucket-sacrificed"] },
          { label: "Climb through the relay beam", consequence: "Use timing, bad judgment, and the shortest line left.", next: "a10", addFlags: ["beam-climb"] },
        ],
      },
      a10: {
        id: "a10",
        chapter: "01:46 REMAINING // Relay Skin",
        title: "The last hundred feet are straight up.",
        body: [
          "Lightning walks the tower ladder. The cartridge port opens for less than a second after each capacitor strike. Below, the route collapses into floodwater and searchlights while the city waits in the dark.",
          "Switch counts the flashes. \"Three, two, one, climb. And Rook? If you say you work better alone after tonight, I will restore power specifically to slap you.\"",
        ],
        callbacks: [
          { label: "Bucket carries the dawn", requires: ["bucket-carrier"], body: ["Bucket rises beside the ladder with the cartridge locked under its chassis. \"Courier safety remains unacceptable,\" it says. \"Courier company remains preferable to patrol company.\""] },
          { label: "The map still has neighborhoods", requiresItems: ["district-map"], body: ["Every rung lights beside a block name. The city is climbing with you, one small battery at a time."] },
          { label: "The erased map is light", requires: ["erased-branches"], body: ["The cartridge is almost weightless now. Rook has never carried so little that felt this heavy."] },
          { label: "The plow runs out of mountain", requires: ["plow-route"], body: ["Rook plants the snowplow in the tower fence. Its doors lock proudly. He exits through the windshield less proudly."] },
          { label: "The crane holds", requires: ["crane-route"], body: ["The hook swings back over the ravine, carrying nobody and somehow looking relieved. Switch promises the operator a safety lecture after the lights return."] },
          { label: "Bucket's last order", requires: ["bucket-sacrificed"], body: ["The command core goes dark after clearing the road. Its final packet contains no target, only an open channel waiting for an answer."] },
          { label: "The beam missed once", requires: ["beam-climb"], body: ["The relay beam scorched Rook's sleeve and missed the cartridge. Switch calls that precision. Rook calls it a reason to keep climbing."] },
        ],
        choices: [
          { label: "Climb with the whole map", consequence: "Take every surviving branch to the port by hand.", next: "a12", addFlags: ["carried-whole-map"] },
          { label: "Let Bucket make the final flight", consequence: "Trust the drone to finish a route it was built to stop.", next: "a12", requires: ["bucket-carrier"], relationships: [{ character: "bucket", min: 2 }], addFlags: ["bucket-final-flight"] },
          { label: "Ask Switch to guide the throw", consequence: "Put the last trajectory in somebody else's hands.", next: "a12", relationships: [{ character: "switch", min: 1 }], addFlags: ["switch-final-call", "rook-asked-help"] },
        ],
      },
      a11: {
        id: "a11",
        chapter: "01:33 REMAINING // Open Frequency",
        title: "The city answers on a thousand tiny radios.",
        body: [
          "Your broadcast wakes controllers in laundromats, clinics, rooftops, and old cabinets. Nobody has enough power alone. Together they draw a route to the relay that changes every second and belongs to no single machine.",
          "Voices crowd the service channel with directions. Someone offers a ladder. Someone else offers soup. Switch says, \"Take the ladder. We can revisit soup after civilization.\"",
        ],
        callbacks: [
          { label: "Six blocks answer first", requires: ["protected-blocks"], body: ["The batteries from Switch's workshop form the network's first steady islands. Extension cords cross balconies while neighbors relay the route uphill."] },
          { label: "The stripped core casts a vote", requiresItems: ["bucket-core"], body: ["K-86's command core joins the mesh without issuing an order. Its first voluntary packet is a cautious YES followed by fourteen safety conditions."] },
          { label: "Bucket refuses to be muted", requires: ["bucket-named"], relationships: [{ character: "bucket", min: 1 }], body: ["A familiar machine voice corrects three bad directions and one spelling error. Bucket has found the frequency and, regrettably, the group chat."] },
          { label: "Switch recognizes the plan", requires: ["distributed-map"], body: ["\"That is not your route anymore,\" Switch says. She sounds proud. \"Good. It was too important to belong to one runner.\""] },
        ],
        choices: [
          { label: "Follow the city's moving route", consequence: "Climb where the lights appear and trust strangers with the next step.", next: "a12", addFlags: ["city-guided"] },
          { label: "Hand coordination to Switch", consequence: "Let the person who kept counting people run the final minute.", next: "a12", addFlags: ["switch-final-call", "switch-trusted"], relationshipChanges: { switch: 1 } },
          { label: "Keep one channel open for Bucket", consequence: "Leave room for a machine that chose the team.", next: "a12", requires: ["bucket-named"], relationships: [{ character: "bucket", min: 1 }], addFlags: ["bucket-channel"] },
        ],
      },
      a12: {
        id: "a12",
        chapter: "00:18 REMAINING // Upload",
        title: "The relay asks what kind of city should wake up.",
        body: [
          "The cartridge seats. Every dark block appears below as a possible light. The relay offers three plans: FASTEST restores the center first. CAREFUL rebuilds around every damaged branch. SHARED lets the neighborhoods negotiate power together.",
          "Security closes around the tower. Eighteen seconds is enough time for one choice and one extremely short argument.",
        ],
        callbacks: [
          { label: "Switch gets the last word", requires: ["switch-final-call"], body: ["\"You carried it far enough,\" Switch says. \"Now choose who gets carried with it.\""] },
          { label: "Bucket reaches the port", requires: ["bucket-final-flight"], body: ["Bucket locks itself around the cartridge. \"New directive requested,\" it says. \"Preferably one with fewer roofs.\""] },
          { label: "The branches have names", requires: ["protected-blocks"], body: ["The CAREFUL plan lists people, not loads. That change came from the map you refused to lighten."] },
        ],
        choices: [
          { label: "Test the SHARED plan", consequence: "Give every surviving controller a voice in the restart.", next: "a13", requires: ["distributed-map"], addFlags: ["chose-shared"] },
          { label: "Test the CAREFUL plan", consequence: "Accept a slower dawn that deliberately leaves nobody out.", next: "a13", requires: ["protected-blocks"], addFlags: ["chose-careful"] },
          { label: "Test the FASTEST plan", consequence: "Beat the cascade and let crews find the dark edges later.", next: "a13", addFlags: ["chose-fastest"] },
        ],
      },
      a13: {
        id: "a13",
        chapter: "00:06 REMAINING // Commit",
        title: "The old system wants one final confirmation.",
        body: [
          "The selected plan burns across the relay glass. Six seconds remain. Rook can still change it. Switch is silent. Somewhere below, generators cough, batteries trade charge, and people wait beside switches they cannot see.",
        ],
        callbacks: [
          { label: "The city built this answer", requires: ["chose-shared"], body: ["Thousands of CONFIRM lights appear. None is large enough to command the others."] },
          { label: "Care takes longer", requires: ["chose-careful"], body: ["The timer predicts nineteen more minutes of darkness. Every occupied block remains on the map."] },
          { label: "Speed has an edge", requires: ["chose-fastest"], body: ["Downtown is ready in four seconds. Seven outer blocks have vanished from the preview."] },
        ],
        choices: [
          { label: "Commit SHARED", consequence: "Wake the city from its edges inward.", next: "a_end_shared", requires: ["chose-shared"] },
          { label: "Commit CAREFUL", consequence: "Keep every named branch, even through the long dark.", next: "a_end_careful", requires: ["chose-careful"] },
          { label: "Commit FASTEST", consequence: "Restore the spine before the final reserve cell dies.", next: "a_end_fast", requires: ["chose-fastest"] },
          { label: "Give Bucket the final directive", consequence: "Let the former patrol unit decide what protection means.", next: "a_end_bucket", relationships: [{ character: "bucket", min: 2 }], requires: ["bucket-channel"] },
        ],
      },
      a_end_shared: {
        id: "a_end_shared",
        chapter: "ENDING // A Thousand Small Suns",
        title: "The city restarts itself.",
        body: [
          "Power returns window by window, arcade by arcade, block by block. Rooftop panels wake traffic lights. Old cabinets relay emergency packets. No central wave arrives, but nobody waits for permission to help the next building.",
          "At dawn, every district tells a slightly different story about who brought the lights back. Switch prefers that version. Rook is learning to.",
        ],
        choices: [],
        ending: { label: "Distributed Dawn", rank: "bright" },
      },
      a_end_careful: {
        id: "a_end_careful",
        chapter: "ENDING // No Block Left Dark",
        title: "Morning arrives slowly enough to be careful.",
        body: [
          "For nineteen long minutes, the city stays dark while the relay isolates fires and flooded lines. Hospitals wake first, then homes, then streets. The arcade district comes last and cheers loud enough to be heard on the mountain.",
          "The saved route becomes a public map of every detour and every place speed was refused in favor of bringing someone home.",
        ],
        choices: [],
        ending: { label: "The Careful City", rank: "bright" },
      },
      a_end_bucket: {
        id: "a_end_bucket",
        chapter: "ENDING // Amended Orders",
        title: "Bucket rewrites the meaning of patrol.",
        body: [
          "K-86 routes power first to people trapped by the security network, then orders every patrol unit to become a courier. Drones carry medicine. Crawlers tow flooded cars. One snowplow delivers soup with severe procedural concern.",
          "Bucket lands beside Rook after sunrise. \"Courier safety remains unacceptable,\" it reports. \"Request permission to continue complaining.\" Switch grants it permanent clearance.",
        ],
        choices: [],
        ending: { label: "Protect and Deliver", rank: "strange" },
      },
      a_end_fast: {
        id: "a_end_fast",
        chapter: "ENDING // Spine First",
        title: "The center blazes while the edges wait.",
        body: [
          "Downtown returns with explosive force. Towers ignite. Trams move. The cascade is beaten by less than one second, and the mission is called a success. It is one.",
          "Seven neighborhoods remain dark until crews arrive after sunrise. The clean map kept no record of what speed chose not to see. On the mountain, Rook watches the bright center and can name every missing edge.",
        ],
        choices: [],
        ending: { label: "The Fastest Route", rank: "dark" },
      },
    },
  },
  {
    id: "mystery",
    shelfCode: "FILE M-13",
    title: "The Cabinet That Remembers",
    subtitle: "It records memories instead of scores, including one from tomorrow.",
    teaser: "Mara has half a token. Eli is outside taking notes. Investigator Six has already solved the case, allegedly.",
    image: "story-mystery-memory-cabinet.webp",
    imageAlt: "An archive workshop where an impossible cabinet opens into amber, cyan, and purple evidence rooms.",
    castImage: "story-mystery-cast-v2.webp",
    castAlt: "Original fictional cast: archivist Mara Ibarra examines half a brass token, Eli Cho watches from the doorway, and Investigator Six appears in the glass.",
    accent: "#ffbf57",
    start: "m0",
    cast: [
      { id: "mara", name: "Dr. Mara Ibarra", role: "Audio archivist // you", voice: "Patient with damaged tape, impatient with confident summaries.", glyph: "MI", player: true },
      { id: "eli", name: "Eli Cho", role: "Conservator outside the cabinet", voice: "Skeptical, observant, and capable of finding a joke in a chain-of-custody form.", glyph: "EC", initialBond: 0, bondLabels: { low: "doubting the record", neutral: "cross-checking", high: "trusting your notes" } },
      { id: "six", name: "Investigator Six", role: "The colleague removed from the file", voice: "Brilliant, persuasive, and not necessarily the same person in every room.", glyph: "06", initialBond: 0, bondLabels: { low: "editing around you", neutral: "leaving clues", high: "sharing the case" } },
    ],
    initialItems: ["half-token", "red-thread", "pencil-notebook"],
    itemLabels: {
      "half-token": "Left half of a brass token",
      "red-thread": "Red evidence thread",
      "pencil-notebook": "Penciled case notebook",
      "future-tape": "Recording dated tomorrow",
      "copy-negative": "Second-generation negative",
      "sixth-card": "Sixth checkout card",
      "other-half": "Right half of the token",
      "eli-note": "Eli's unedited note",
    },
    flagLabels: {
      "amber-first": "Tape room entered first",
      "cyan-first": "Photo room entered first",
      "purple-first": "Warning ignored",
      "eli-crosscheck": "Eli kept an outside record",
      "six-spoke": "Six answered",
      "respected-silence": "The silence stayed unfilled",
      "kept-versions": "Three accounts preserved",
      "recorded-contradiction": "Contradiction documented",
    },
    ui: {
      stateTitle: "People on the record",
      inventoryTitle: "Evidence bag",
      trailTitle: "Chain of custody",
      emptyInventory: "The bag is empty, which is evidence too",
      endingTitle: "Finding entered",
    },
    nodes: {
      m0: {
        id: "m0",
        chapter: "CASE OPEN // Archive Workshop",
        title: "The cabinet has no serial number and too many histories.",
        body: [
          "You are Dr. Mara Ibarra, an audio archivist who trusts breaths, erasures, and bad splices more than clean transcripts. The cabinet arrived in a truck whose company does not exist. Its wood is from 1986. Its circuit boards span four decades.",
          "Where the monitor should be, three doors open into rooms larger than the machine: amber tape, cyan photographs, purple index cards. Eli Cho watches from behind the safety glass. \"I completed the intake form,\" he says. \"The form has requested witness protection.\"",
          "Your notebook contains six pages in your handwriting. You do not remember writing them. The last line says: DO NOT START WITH PURPLE AGAIN.",
        ],
        choices: [
          { label: "Enter the amber tape room", consequence: "Follow two voices aging across the same conversation.", next: "m1", addFlags: ["amber-first"] },
          { label: "Enter the cyan photograph room", consequence: "Investigate images that change whenever nobody looks.", next: "m2", addFlags: ["cyan-first"] },
          { label: "Ignore yourself and enter purple", consequence: "Repeat the choice your own notebook fears.", next: "m3", addFlags: ["purple-first"], relationshipChanges: { eli: -1, six: 1 } },
        ],
      },
      m1: {
        id: "m1",
        chapter: "EVIDENCE 01 // Tape Weather",
        title: "Every reel contains the same conversation at a different age.",
        body: [
          "Thousands of tape loops move through amber light without machines. Two voices discuss an ordinary Saturday: where to park, how long to stay, whether there is enough money for one more hour. The words stay fixed while the speakers grow older.",
          "The final tape contains your voice, recorded tomorrow: \"Mara, do not complete the token until Eli confirms he still remembers you.\" Outside, Eli says, \"For the record, I remember you. I also remember advising against rooms larger on the inside.\"",
        ],
        callbacks: [
          { label: "Amber came first", requires: ["amber-first"], body: ["The first reel begins with the sound of the workshop door closing behind you, recorded one minute before you entered."] },
        ],
        choices: [
          { label: "Record a reply to tomorrow", consequence: "Create the answer before you understand the warning.", next: "m4", addItems: ["future-tape"], addFlags: ["replied-tomorrow"] },
          { label: "Ask Eli to transcribe independently", consequence: "Keep one witness beyond the cabinet's reach.", next: "m5", addFlags: ["eli-crosscheck"], addItems: ["eli-note"], relationshipChanges: { eli: 2 } },
          { label: "Follow the thread through the wall", consequence: "Trust the physical stitch instead of tomorrow's voice.", next: "m2", addFlags: ["followed-thread"] },
        ],
      },
      m2: {
        id: "m2",
        chapter: "EVIDENCE 02 // Contact Sheet",
        title: "The missing photograph appears only at the edge of sight.",
        body: [
          "Contact sheets hang in a chemical-free darkroom. Each shows the cabinet in a different home, museum, warehouse, or ruin. Look directly at a frame and its people vanish. Look aside and their shadows crowd the machine.",
          "In the reflection of your loupe, one blank frame shows you entering the purple stacks with a complete token. A second figure waits behind you. Eli cannot see the figure, but he can see you pretending not to be unsettled. \"Your eyebrow filed a report,\" he says.",
        ],
        callbacks: [
          { label: "Cyan came first", requires: ["cyan-first"], body: ["The first contact sheet shows the amber and purple doors already open. The cabinet has recorded routes you have not taken."] },
          { label: "The thread crossed rooms", requires: ["followed-thread"], body: ["The red stitch from the tape room pierces every photograph at the exact point where the hidden figure's hand should be."] },
        ],
        choices: [
          { label: "Make a copy of the changing negative", consequence: "Create evidence the cabinet cannot revise at the source.", next: "m4", addItems: ["copy-negative"], addFlags: ["made-copy"], relationshipChanges: { eli: 1 } },
          { label: "Ask the shadow to step forward", consequence: "Treat the missing investigator as a witness, not an artifact.", next: "m5", addFlags: ["called-six"], relationshipChanges: { six: 1 } },
          { label: "Follow the sewn thread to purple", consequence: "Use the photograph as a map instead of proof.", next: "m3", addFlags: ["followed-photo"] },
        ],
      },
      m3: {
        id: "m3",
        chapter: "EVIDENCE 03 // Purple Index",
        title: "Your case file has been checked out six times by you.",
        body: [
          "Index cards rise beyond sight. Entry one is cautious. Entry two is excited. By entry five, your notes claim the cabinet decides which version of the past gets to survive.",
          "Entry six has been scraped away. One card remains: INVESTIGATOR RETURNED TO START. MEMORY OF CASE RETAINED BY CABINET. The signature is yours, except the final stroke bends left. You always finish right.",
        ],
        callbacks: [
          { label: "The warning was accurate", requires: ["purple-first"], body: ["Eli taps the glass. \"You ignored a warning in your own handwriting. I need that entered as either courage or very specific stubbornness.\""] },
          { label: "The photograph pointed here", requires: ["followed-photo"], body: ["The red thread disappears into drawer six. Your copied route has become part of the index before you finish walking it."] },
        ],
        choices: [
          { label: "Check out the sixth file", consequence: "Use your current memory as collateral.", next: "m6", addItems: ["sixth-card"], addFlags: ["checked-sixth-file"], relationshipChanges: { six: 1 } },
          { label: "Have Eli photograph every card", consequence: "Build an outside sequence before another entry moves.", next: "m4", addFlags: ["eli-crosscheck"], addItems: ["eli-note"], relationshipChanges: { eli: 2 } },
          { label: "Write entry seven in pencil", consequence: "Add a record the cabinet has not learned to imitate.", next: "m5", addFlags: ["seventh-entry"] },
        ],
      },
      m4: {
        id: "m4",
        chapter: "CROSS-CHECK // Outside Copy",
        title: "Independent evidence makes the cabinet blink.",
        body: [
          "Your copied tape, negative, or index survives the walk between rooms. The cabinet dims around it. For the first time, it cannot revise both the object and the memory of finding it.",
          "Eli reads from his side of the glass: \"At 2:14, Mara found a stable record. At 2:15, the cabinet displayed a frowny face. I am preserving that technical term.\" A maintenance hatch opens beneath the joystick.",
        ],
        callbacks: [
          { label: "Tomorrow heard you", requiresItems: ["future-tape"], body: ["Your recorded reply now contains a second voice between sentences. \"Good,\" it says. \"You brought Eli this time.\""] },
          { label: "The copy kept the shadow", requiresItems: ["copy-negative"], body: ["The second-generation negative shows the hidden figure clearly enough to reveal an archive badge marked 06."] },
          { label: "Eli kept writing", requires: ["eli-crosscheck"], body: ["Eli's paper notes remain boring, legible, and gloriously unchanged."] },
        ],
        choices: [
          { label: "Open the maintenance hatch", consequence: "Look beneath the story while Eli keeps the outside clock.", next: "m7", addFlags: ["opened-ledger"] },
          { label: "Call Investigator Six by badge number", consequence: "Invite the missing colleague to correct the record.", next: "m6", addFlags: ["called-six"], relationshipChanges: { six: 1 } },
          { label: "Compare your copy with Eli's notes", consequence: "Find the first place the cabinet edited only one of you.", next: "m8", requiresItems: ["eli-note"], addFlags: ["recorded-contradiction"], relationshipChanges: { eli: 1 } },
        ],
      },
      m5: {
        id: "m5",
        chapter: "INTERVIEW // The Voice Between Rooms",
        title: "Investigator Six answers with your missing sentences.",
        body: [
          "The shadow steps into amber light wearing an archive coat and no stable face. \"Call me Six,\" they say. \"You did, the first five times. The sixth time you called me a side effect. I preferred Six.\"",
          "Six claims the cabinet separated the investigator from the conclusion. It kept a flawless solution and discarded the unreliable person who reached it. Eli asks for a surname. Six replies, \"Pending peer review.\"",
        ],
        callbacks: [
          { label: "The shadow was invited", requires: ["called-six"], body: ["Six remembers that you addressed them before demanding proof. Their borrowed face settles a little."] },
          { label: "Entry seven exists", requires: ["seventh-entry"], body: ["Six reads your penciled entry and laughs. \"You always choose pencil when frightened. It is one of your better habits.\""] },
          { label: "Eli has a separate transcript", requires: ["eli-crosscheck"], body: ["Six cannot see Eli's notes. That limitation makes them more believable and visibly irritates them."] },
        ],
        choices: [
          { label: "Interview Six on the record", consequence: "Let Eli ask the questions Six expects you to avoid.", next: "m6", addFlags: ["six-spoke"], relationshipChanges: { eli: 1, six: 1 } },
          { label: "Ask Six to lead you to the other half", consequence: "Trust the erased investigator with the evidence they want completed.", next: "m7", addFlags: ["six-led"], relationshipChanges: { six: 2, eli: -1 } },
          { label: "Test Six with a false detail", consequence: "See whether they correct your memory or improve it.", next: "m8", addFlags: ["tested-six"], relationshipChanges: { six: -1 } },
        ],
      },
      m6: {
        id: "m6",
        chapter: "CASE SIX // Missing Person",
        title: "The erased investigator has Eli's handwriting.",
        body: [
          "The sixth file opens onto tomorrow's workshop. An empty coat sits at the desk. In its pocket is the other half-token and a note: I SOLVED THE CABINET BY BECOMING THE WITNESS IT COULD NOT CROSS-CHECK.",
          "Eli goes quiet. The handwriting is his. Six touches the glass from inside. \"This is where you usually decide I am Eli,\" they say. Eli answers, \"For efficiency, I have decided to be concerned about that now.\"",
        ],
        callbacks: [
          { label: "Six gave testimony", requires: ["six-spoke"], body: ["The recorded interview contains two Eli voices disagreeing over a date. Neither will admit to being Six."] },
          { label: "The checkout card matches", requiresItems: ["sixth-card"], body: ["The pressure mark on the sixth card fits the right half-token exactly. The card was signed before the token was split."] },
        ],
        choices: [
          { label: "Ask Eli a question only he knows", consequence: "Put the living witness ahead of the elegant theory.", next: "m9", addFlags: ["eli-verified"], relationshipChanges: { eli: 2 } },
          { label: "Ask Six what Eli will answer", consequence: "Test the copy against the person outside.", next: "m8", addFlags: ["six-predicted"], relationshipChanges: { six: 1 } },
          { label: "Take the other half without joining it", consequence: "Carry both pieces while preserving the seam.", next: "m7", addItems: ["other-half"], addFlags: ["halves-separated"] },
        ],
      },
      m7: {
        id: "m7",
        chapter: "NEGATIVE SPACE // What Was Not Said",
        title: "The silence has edges.",
        body: [
          "You stop asking the damaged recording to supply words. Around the gap are breaths, a chair scrape, and two people deciding whether trust can survive without agreement. The silence is not empty. It is the part they refused to fake.",
          "Behind it is a physical chamber with a mechanical counter, the other half-token, and a switch labeled KEEP DIFFERENCE. Eli says, \"Finally, a machine label I endorse without revisions.\"",
        ],
        callbacks: [
          { label: "Six knew the route", requires: ["six-led"], body: ["Six stops at the threshold. \"I can lead people here,\" they say. \"I cannot remember whether I have ever entered.\""] },
          { label: "The ledger opened first", requires: ["opened-ledger"], body: ["The mechanical counter matches the ledger beneath the joystick: six investigations, seven conclusions, no final witness."] },
        ],
        choices: [
          { label: "Throw KEEP DIFFERENCE", consequence: "Prevent the cabinet from merging contradictory witnesses.", next: "m9", addFlags: ["respected-silence", "kept-versions"], addItems: ["other-half"], relationshipChanges: { eli: 1, six: 1 } },
          { label: "Take the half and leave the switch", consequence: "Carry authentication without changing the cabinet.", next: "m8", addItems: ["other-half"], addFlags: ["halves-separated"] },
          { label: "Document the chamber and touch nothing", consequence: "Make verification possible without completing the key.", next: "m10", addFlags: ["documented-chamber", "eli-crosscheck"], relationshipChanges: { eli: 2 } },
        ],
      },
      m8: {
        id: "m8",
        chapter: "CONTROL TEST // One Clean Answer",
        title: "A convincing solution begins tidying the room.",
        body: [
          "The cabinet produces a complete account. Every date fits. Six is Eli's discarded future. The token controls resets. Your notebook is a warning sent backward. Relief arrives before suspicion.",
          "Then the cyan door disappears. A moment later, you cannot remember what color it was. Eli can. He writes CYAN in letters large enough to read through the glass. The cabinet changes his C to a G. Eli underlines harder.",
        ],
        callbacks: [
          { label: "Six failed the false detail", requires: ["tested-six"], body: ["Six corrected the false date but accepted the false name. Whatever they are, they know the case better than they know Eli."] },
          { label: "The contradiction has custody", requires: ["recorded-contradiction"], body: ["Your copy and Eli's notes disagree in one exact place. Neither changes. The disagreement itself has become stable evidence."] },
          { label: "Six predicted Eli", requires: ["six-predicted"], body: ["Six guessed Eli's private answer perfectly, including a joke he insists he had not thought of yet. Nobody enjoys this result."] },
        ],
        choices: [
          { label: "Write down every disappearing detail", consequence: "Build a mess the cabinet cannot clean all at once.", next: "m10", addFlags: ["recorded-contradiction"], relationshipChanges: { eli: 1 } },
          { label: "Break the token along its old seam", consequence: "Require two witnesses again.", next: "m9", requiresItems: ["other-half"], addFlags: ["kept-versions"], relationshipChanges: { six: -1 } },
          { label: "Accept the clean solution", consequence: "Close the case before another contradiction disappears.", next: "m11_clean", addFlags: ["accepted-clean"], relationshipChanges: { eli: -2, six: 1 } },
        ],
      },
      m9: {
        id: "m9",
        chapter: "WITNESS TEST // Safety Glass",
        title: "Eli remembers you differently, which is useful.",
        body: [
          "You and Eli answer the same questions through the glass. Your accounts disagree about the truck, the first door, and whether Eli's intake-form joke was funny. Eli writes: IT WAS. This is his least credible statement.",
          "The cabinet tries to merge the accounts. Each disagreement makes its dormant KEEP DIFFERENCE circuit flicker awake. Six watches both of you with an expression that might be relief or hunger.",
        ],
        callbacks: [
          { label: "Eli was verified", requires: ["eli-verified"], body: ["His private answer was the nickname of a broken tape deck in graduate school. Six guessed wrong. Eli is delighted that sentimental trivia has achieved forensic importance."] },
          { label: "The silence stayed open", requires: ["respected-silence"], body: ["Neither of you fills the missing sentence. The cabinet waits, then grudgingly records [UNRESOLVED]."] },
          { label: "Two halves remain two", requires: ["halves-separated"], body: ["The token pieces warm in separate evidence bags. They agree on their edges and nothing else."] },
        ],
        choices: [
          { label: "Let Eli keep one half", consequence: "Put authentication in two hands and two rooms.", next: "m10", requiresItems: ["other-half"], removeItems: ["other-half"], addFlags: ["eli-has-half"], relationshipChanges: { eli: 2 } },
          { label: "Ask Six to add a third account", consequence: "Give the erased investigator a voice without making it final.", next: "m10", addFlags: ["six-spoke", "kept-versions"], relationshipChanges: { six: 2 } },
          { label: "Join the halves under observation", consequence: "Open the cabinet while two witnesses record what changes.", next: "m11", requiresItems: ["other-half"], addFlags: ["joined-observed"] },
        ],
      },
      m10: {
        id: "m10",
        chapter: "EXTERNAL RECORD // The Fourth Room",
        title: "The notebook becomes somewhere the cabinet cannot enter.",
        body: [
          "You cover the physical desk with copies, tape scraps, timestamps, and mutually exclusive diagrams. The cabinet can alter one room or one recollection. It cannot change every boring artifact at once.",
          "Red thread connects witnesses instead of answers: who saw what, when, and what moved afterward. A fourth door appears in the cabinet. It is beige, ordinary, and opens back into the workshop. Eli says, \"At last, a door designed by a committee.\"",
        ],
        callbacks: [
          { label: "Eli holds half the key", requires: ["eli-has-half"], body: ["Eli tapes his half-token to the outside of the safety glass. The cabinet can see it and cannot reach it."] },
          { label: "The chamber stayed untouched", requires: ["documented-chamber"], body: ["Your photographs show dust undisturbed around KEEP DIFFERENCE. The choice not made has a measurable outline."] },
          { label: "Six joined the record", requires: ["six-spoke"], body: ["Six writes a statement in the margin. The handwriting resembles both yours and Eli's, but the spelling mistakes belong to neither."] },
          { label: "The contradiction stayed messy", requires: ["recorded-contradiction"], body: ["CYAN and GYAN remain side by side in the notebook. Eli circles both and writes: ONE OF THESE IS WRONG; NEITHER MAY BE REMOVED."] },
        ],
        choices: [
          { label: "Carry the case through the fourth door", consequence: "Leave without demanding one official answer.", next: "m12", addFlags: ["used-fourth-door"] },
          { label: "Invite all three accounts outside", consequence: "Build a living file beyond the cabinet's control.", next: "m12", addFlags: ["externalized-accounts", "kept-versions"] },
          { label: "Ask Six to leave with you", consequence: "Treat the erased investigator as a person, consequences included.", next: "m12", relationships: [{ character: "six", min: 2 }], addFlags: ["six-invited"] },
        ],
      },
      m11: {
        id: "m11",
        chapter: "AUTHENTICATION // Complete Token",
        title: "The joined token opens a conversation, not a lock.",
        body: [
          "The halves align. The cabinet asks who benefits when one version becomes official. It displays three valid histories, then offers to publish one with a confidence score so large nobody will read the notes.",
          "Eli says, \"A number that confident should have to defend a dissertation.\" Six stands beside the cleanest version. For the first time, they look afraid of disappearing.",
        ],
        callbacks: [
          { label: "The join had witnesses", requires: ["joined-observed"], body: ["Both notebooks record the same impossible detail: for three seconds, the complete token had three halves."] },
          { label: "Six spoke before the join", requires: ["six-spoke"], body: ["Six's recorded account remains open beside the cabinet's three histories. The machine labels it redundant. Mara labels that an opinion."] },
        ],
        choices: [
          { label: "Publish all accounts with their sources", consequence: "Make disagreement navigable instead of invisible.", next: "m12", addFlags: ["kept-versions", "published-sources"] },
          { label: "Destroy the editor, keep the evidence", consequence: "End the cabinet while preserving what two people can verify.", next: "m12", addFlags: ["destroy-editor"] },
          { label: "Publish the clean solution", consequence: "Give the case an ending nobody can challenge.", next: "m12", addFlags: ["accepted-clean"] },
        ],
      },
      m11_clean: {
        id: "m11_clean",
        chapter: "AUTHENTICATION // Approved Answer",
        title: "The clean solution arrives signed, indexed, and much too early.",
        body: [
          "The cabinet prints a report before you finish agreeing to it. Every date fits. Six is identified as Eli's discarded future. The missing rooms are classified as harmless interface errors. Your own signature waits at the bottom in ink that is still wet.",
          "Eli reads through the glass. \"Convenient,\" he says. \"It solved the case and the paperwork. Next it will validate its own parking.\" Six stands beside the report's cleanest paragraph, watching to see whether you notice that it never quotes them.",
        ],
        callbacks: [
          { label: "Relief came first", requires: ["accepted-clean"], body: ["The solution still feels good. Mara writes that down too. A satisfying answer can be evidence about the investigator without being evidence about the case."] },
          { label: "Eli kept an outside page", requires: ["eli-crosscheck"], body: ["Eli holds up his notes. Three timestamps and one terrible joke are missing from the official account. The omissions form a cleaner pattern than the report's conclusion."] },
        ],
        choices: [
          { label: "Reopen every source note", consequence: "Trade a finished answer for a record that can survive disagreement.", next: "m12", addFlags: ["kept-versions", "recorded-contradiction"] },
          { label: "Ask Six who the report removed", consequence: "Let the erased witness answer before the finding becomes official.", next: "m12", addFlags: ["six-spoke", "kept-versions"], relationshipChanges: { six: 1 } },
          { label: "Sign the clean report", consequence: "Choose an elegant ending and accept every voice it leaves out.", next: "m12", addFlags: ["accepted-clean"] },
        ],
      },
      m12: {
        id: "m12",
        chapter: "FINAL REVIEW // Three Signatures",
        title: "A case can close without pretending to be complete.",
        body: [
          "Morning reaches the workshop windows. Mara has a notebook full of crossed-out certainty. Eli has an outside record. Six has a statement no database agrees how to file.",
          "The cabinet asks for one finding. Its cursor blinks with the impatience of a machine that has never had to live with a footnote.",
        ],
        callbacks: [
          { label: "The fourth door is open", requires: ["used-fourth-door"], body: ["Ordinary workshop noise comes through the beige doorway. The world outside has not become simpler while you were gone. Good."] },
          { label: "Six was invited", requires: ["six-invited"], body: ["Six stands outside the cabinet for the first time. Their archive coat casts a shadow in the wrong direction, but it does cast one."] },
          { label: "The editor is failing", requires: ["destroy-editor"], body: ["Door by door, the cabinet becomes ordinary wiring. Eli labels every disconnected cable before Mara can dramatically pull it."] },
          { label: "One answer remains", requires: ["accepted-clean"], body: ["The clean report is already formatted, signed, and missing every sentence in which Eli disagreed."] },
          { label: "Three accounts came outside", requires: ["externalized-accounts"], body: ["Amber tape, cyan photographs, and purple cards cover separate tables. None can quietly revise the others now."] },
          { label: "Every source kept its name", requires: ["published-sources"], body: ["The final finding links each claim back to a voice, image, card, or admitted gap. The cabinet calls this UNTIDY. Mara accepts the compliment."] },
        ],
        choices: [
          { label: "File the living record", consequence: "Keep every version, source, gap, and future correction visible.", next: "m_end_living", requires: ["kept-versions"] },
          { label: "File the independent witness report", consequence: "Preserve what can be checked and leave the central question open.", next: "m_end_witness", requires: ["eli-crosscheck"], relationships: [{ character: "eli", min: 1 }] },
          { label: "Give Six a case of their own", consequence: "Let the missing investigator become more than this solution.", next: "m_end_six", requires: ["six-invited"], relationships: [{ character: "six", min: 2 }] },
          { label: "File the official version", consequence: "Choose clarity, closure, and a dangerously quiet archive.", next: "m_end_clean" },
        ],
      },
      m_end_living: {
        id: "m_end_living",
        chapter: "ENDING // The Living File",
        title: "The case remains open, useful, and honest.",
        body: [
          "Visitors can compare testimony, see where records diverge, and follow every source. Nothing is hidden just because it complicates the label. Eli insists the intake-form joke remain in an appendix. Mara records one formal objection.",
          "Tomorrow's tape never occurs, yet the recording remains. You file it under IMPOSSIBLE BUT OBSERVED and resist improving the title.",
        ],
        choices: [],
        ending: { label: "The Living Record", rank: "bright" },
      },
      m_end_witness: {
        id: "m_end_witness",
        chapter: "ENDING // The Fourth Door",
        title: "A witness is not the same thing as an answer.",
        body: [
          "You leave with two separate records and no machine able to rewrite both. The cabinet is dark when the preservation team arrives. Its impossible rooms have collapsed into ordinary wire and one deeply suspicious hinge.",
          "Years later, another investigator opens your notebook. The first page does not tell them what happened. It tells them how to check. Eli has added beneath it: AND BRING PENCILS.",
        ],
        choices: [],
        ending: { label: "Independent Witness", rank: "strange" },
      },
      m_end_six: {
        id: "m_end_six",
        chapter: "ENDING // Investigator Seven",
        title: "Six chooses a number that has not happened yet.",
        body: [
          "Six leaves the cabinet and takes the next empty desk. They choose the name Seven because, they admit, it annoys the filing system. Eli objects that this is not a name. Mara points out that Eli named a tape deck Walter.",
          "Their first case is a box of photographs that all insist they were taken by the same camera. Six smiles. This time, nobody has already written the ending.",
        ],
        choices: [],
        ending: { label: "A Case of Their Own", rank: "bright" },
      },
      m_end_clean: {
        id: "m_end_clean",
        chapter: "ENDING // Case Closed",
        title: "The answer is flawless because nothing remains to contradict it.",
        body: [
          "Your report is praised for clarity. Every date aligns. Every motive resolves. The cabinet enters a museum as the centerpiece of a definitive history. Visitors leave satisfied.",
          "Sometimes you remember an amber room, or perhaps it was cyan. The report contains no rooms at all. The certainty is comforting until you find Eli's handwriting on your palm: ASK WHO IS MISSING.",
        ],
        choices: [],
        ending: { label: "The Official Version", rank: "dark" },
      },
    },
  },
];

export function getStory(id: StoryGenre): StoryDefinition {
  return STORY_DEFINITIONS.find((story) => story.id === id) ?? STORY_DEFINITIONS[0];
}
