export type StoryGenre = "horror" | "action" | "mystery";
export type StoryStat = "nerve" | "momentum" | "insight";

export type StoryChoice = {
  label: string;
  consequence: string;
  next: string;
  stats?: Partial<Record<StoryStat, number>>;
  addFlags?: string[];
  requires?: string[];
  excludes?: string[];
};

export type StoryNode = {
  id: string;
  chapter: string;
  title: string;
  body: string[];
  choices: StoryChoice[];
  ending?: {
    label: string;
    rank: "bright" | "strange" | "dark";
  };
};

export type StoryDefinition = {
  id: StoryGenre;
  shelfCode: string;
  title: string;
  subtitle: string;
  teaser: string;
  image: string;
  accent: string;
  start: string;
  nodes: Record<string, StoryNode>;
};

export const STORY_DEFINITIONS: StoryDefinition[] = [
  {
    id: "horror",
    shelfCode: "FILE H-01",
    title: "The Last Token",
    subtitle: "After closing, one cabinet is still taking quarters.",
    teaser: "A locked arcade. A second room that only exists in reflections. One token warm enough to feel alive.",
    image: "story-horror-last-token.webp",
    accent: "#ff6f61",
    start: "h0",
    nodes: {
      h0: {
        id: "h0",
        chapter: "11:47 PM // The Locked Floor",
        title: "Something finishes booting in the dark.",
        body: [
          "The last customer left forty minutes ago. Rain scribbles blue lines down the glass doors, the dead cabinets hold their reflections like black teeth, and the key ring in your hand feels heavier with every light you shut off. At the far end of the floor, a cabinet you do not remember owning wakes beneath the broken EXIT sign.",
          "Its marquee has no title. Its screen shows a single brass token turning against an amber field. Each rotation is perfectly synchronized with a faint knock from inside the cabinet: three slow taps, a pause, then two. On the counter beside you, where there was nothing a moment ago, lies the same token.",
        ],
        choices: [
          { label: "Walk straight to the cabinet", consequence: "Meet the impossible thing before fear can name it.", next: "h1", stats: { nerve: 12, momentum: 8 } },
          { label: "Study the key ring and the warm token", consequence: "Look for a practical detail the room cannot fake.", next: "h2", stats: { insight: 12, momentum: -3 }, addFlags: ["examined-token"] },
          { label: "Check every lock and reflection first", consequence: "Treat the building itself as the first suspect.", next: "h3", stats: { insight: 8, nerve: 4 }, addFlags: ["checked-doors"] },
        ],
      },
      h1: {
        id: "h1",
        chapter: "11:51 PM // Cabinet Zero",
        title: "The attract screen knows there should be two players.",
        body: [
          "Up close, the cabinet smells of hot dust and wet pavement. There is no power cord. Beneath the glass, the screen resolves into a crude drawing of this exact arcade, viewed from above. A white square marks where you stand. A second square waits behind you, although the aisle is empty when you turn.",
          "The coin slot opens with a soft mechanical breath. Letters crawl up from the bottom of the screen: PLAYER TWO IS LATE. The cabinet knocks again, now from somewhere behind your ribs. The warm token fits the slot, but so does the smallest key on your ring.",
        ],
        choices: [
          { label: "Insert the warm token", consequence: "Accept the cabinet's rules long enough to learn them.", next: "h4", stats: { nerve: 9, momentum: 10 }, addFlags: ["token-spent"] },
          { label: "Use the smallest key", consequence: "Open the machine instead of playing it.", next: "h5", stats: { insight: 11, nerve: 3 }, addFlags: ["opened-back"] },
          { label: "Answer the knocking pattern", consequence: "Three taps, pause, two. See who answers.", next: "h6", stats: { nerve: 7, insight: 6 }, addFlags: ["answered-knock"] },
        ],
      },
      h2: {
        id: "h2",
        chapter: "11:50 PM // Evidence Under Fluorescent Light",
        title: "The token was minted tomorrow.",
        body: [
          "The token is scarred as if it has crossed decades of pockets, but the date around its rim is tomorrow's. One face bears a doorway. The other bears two empty chairs. When you hold it beneath the emergency light, the chairs fill with tiny moving shadows that lean toward each other and whisper too softly to understand.",
          "The smallest key on your ring is unfamiliar. Its tag is blank except for a grease-pencil zero. In the rain-dark window, your reflection is no longer examining the token. It is standing ten feet away with one hand pressed against an invisible door.",
        ],
        choices: [
          { label: "Follow the reflection to its door", consequence: "Trust the impossible copy to reveal the hidden room.", next: "h3", stats: { insight: 8, nerve: 5 }, addFlags: ["followed-reflection"] },
          { label: "Take the zero key to the cabinet", consequence: "Test the one object that belongs to neither you nor tonight.", next: "h5", stats: { insight: 9 }, addFlags: ["opened-back"] },
          { label: "Put the token in the coin return", consequence: "Ask the arcade to return what it never sold.", next: "h4", stats: { momentum: 7, nerve: 4 }, addFlags: ["token-spent", "coin-return"] },
        ],
      },
      h3: {
        id: "h3",
        chapter: "11:54 PM // The Room in the Glass",
        title: "The reflection has one more aisle than the building.",
        body: [
          "Every lock is still thrown. Every window is intact. Yet the long front glass reflects an aisle running behind the prize counter where the wall should be. Its cabinets face backward, their open service panels glowing like furnace doors. Your reflection walks that aisle without you and stops beside a red telephone mounted in empty air.",
          "When the telephone rings, every joystick on the real floor tilts toward the sound. The receiver in the glass lifts by itself. A voice says your name with the patient irritation of someone who has called for years. Then it asks whether you came to close the arcade or finally open it.",
        ],
        choices: [
          { label: "Step through where the reflected door should be", consequence: "Cross into the aisle that has been waiting behind the wall.", next: "h6", stats: { nerve: 13, momentum: 5 }, addFlags: ["entered-second-room"] },
          { label: "Ask the voice what it wants opened", consequence: "Make the caller define the bargain.", next: "h7", stats: { insight: 10, nerve: 3 }, addFlags: ["questioned-caller"] },
          { label: "Break eye contact and cut the breaker", consequence: "Refuse the reflection and attack its power.", next: "h5", stats: { momentum: 8, insight: 4 }, addFlags: ["cut-power"] },
        ],
      },
      h4: {
        id: "h4",
        chapter: "12:00 AM // Free Play",
        title: "The game starts with a memory that is not yours.",
        body: [
          "The token falls for a very long time. Around you, dead marquees bloom to life one by one, not with games but with fragments of an afternoon: two sodas sweating on a counter, rain steaming from a coat, a hand counting coins twice before spending them once. The images feel intimate, complete, and entirely unfamiliar.",
          "Cabinet Zero turns those fragments into a score. Every tender detail adds points. Every uncertainty removes a life. At the bottom of the screen, a meter labeled CERTAINTY begins filling itself, and the room grows warmer as if the machine can burn doubt for fuel.",
        ],
        choices: [
          { label: "Play only the details you know are true", consequence: "Let the score fall rather than invent a life.", next: "h7", stats: { insight: 12, nerve: 5 }, addFlags: ["refused-false-memory"] },
          { label: "Follow the beautiful version the game offers", consequence: "Trade uncertainty for a perfect, dangerous story.", next: "h8", stats: { momentum: 10, insight: -10 }, addFlags: ["accepted-false-memory"] },
          { label: "Jam the controls and force a diagnostic screen", consequence: "Turn the cabinet's appetite back on itself.", next: "h9", stats: { nerve: 8, insight: 8 }, addFlags: ["forced-diagnostic"] },
        ],
      },
      h5: {
        id: "h5",
        chapter: "12:03 AM // Behind the Cabinet",
        title: "There is no machinery inside, only another weather system.",
        body: [
          "The zero key opens the rear panel. Cold rain blows through it. Beyond the thin wooden shell is a night highway under a bruised sky, stretching farther than the cabinet could contain. Along the shoulder stand hundreds of unlit arcade machines, each with its back panel open toward the road like a waiting mouth.",
          "A fuse box hangs in the impossible distance, close enough to touch. One switch is labeled FLOOR. The other labels have been scraped clean. Somewhere down the highway, headlights appear, but they illuminate nothing in front of them. They are coming backward.",
        ],
        choices: [
          { label: "Throw the FLOOR switch off", consequence: "Darken every cabinet, including the road behind this one.", next: "h9", stats: { momentum: 10, nerve: 7 }, addFlags: ["cut-power"] },
          { label: "Climb through and meet the backward headlights", consequence: "Find out what arrives when a memory runs in reverse.", next: "h8", stats: { nerve: 14, insight: -3 }, addFlags: ["entered-highway"] },
          { label: "Leave the panel open and call into it", consequence: "Offer a witness instead of another player.", next: "h7", stats: { insight: 10, nerve: 4 }, addFlags: ["called-into-dark"] },
        ],
      },
      h6: {
        id: "h6",
        chapter: "12:06 AM // Player Two",
        title: "The second room has been keeping everyone who almost remembered.",
        body: [
          "The wall gives way without resistance. In the reflected aisle, cabinet screens show people from behind as they stand in rooms they once loved. None of the figures turn around. Each machine records a different unfinished goodbye, looping the instant before someone chooses words.",
          "The red telephone rests against your ear although you never picked it up. The caller explains that Cabinet Zero does not steal people. It preserves hesitation. The second player is not a ghost but the version of you that might remain here forever, trying to make one memory perfect enough to prevent loss.",
        ],
        choices: [
          { label: "Call your other self by name", consequence: "Force the hesitation to become a person you can confront.", next: "h10", stats: { nerve: 12, insight: 7 }, addFlags: ["named-double"] },
          { label: "Open the cabinet showing your own back", consequence: "Enter the unfinished scene before it decides for you.", next: "h8", stats: { momentum: 11, nerve: 5 }, addFlags: ["opened-own-cabinet"] },
          { label: "Hang up and pull the telephone wire", consequence: "Break the room's ability to narrate what you feel.", next: "h9", stats: { insight: 9, momentum: 7 }, addFlags: ["silenced-caller"] },
        ],
      },
      h7: {
        id: "h7",
        chapter: "12:09 AM // The Honest Score",
        title: "Zero points is the first answer the cabinet respects.",
        body: [
          "You say what you know, and only what you know. The score drains to zero. The fabricated afternoon buckles at the edges, exposing unpainted darkness where certainty used to be. Cabinet Zero shudders as if starved, then quietly displays a new message: A MEMORY MAY BE INCOMPLETE AND STILL BE LOVED.",
          "The unknown caller stops pretending to know your name. It asks one final question in a voice assembled from fan noise and rain: if the room cannot keep a perfect past, what should it keep instead?",
        ],
        choices: [
          { label: "Keep the questions and release the answers", consequence: "Let uncertainty become an open door rather than a trap.", next: "h_end_release", stats: { insight: 12, nerve: 6 }, addFlags: ["chose-questions"] },
          { label: "Keep a witness who can tell the story honestly", consequence: "Carry the cabinet's record without surrendering to it.", next: "h10", stats: { insight: 8, momentum: 5 }, addFlags: ["became-witness"] },
          { label: "Keep nothing. Let the room finally end", consequence: "Attempt a clean severance from every loop.", next: "h9", stats: { nerve: 8, momentum: 6 }, addFlags: ["chose-erasure"] },
        ],
      },
      h8: {
        id: "h8",
        chapter: "12:12 AM // The Perfect Afternoon",
        title: "Every detail is beautiful. That is how you know it is hungry.",
        body: [
          "The arcade fills with summer light. Every cabinet is free. Every conversation lands on the right words. Nobody grows tired, counts money, leaves early, or looks toward the door. The scene offers relief so precisely shaped that refusing it feels like violence.",
          "Then you notice the clocks. Each reads 12:12. The people in the screens smile only when you look at them. The moment you look away, they pound soundlessly on the glass. Cabinet Zero has not recreated a memory; it has built a room that punishes anything for changing.",
        ],
        choices: [
          { label: "Ruin one perfect detail on purpose", consequence: "Introduce change and watch the simulation defend itself.", next: "h10", stats: { nerve: 11, insight: 10 }, addFlags: ["broke-perfection"] },
          { label: "Sit down and accept endless free play", consequence: "Choose the beautiful loop over the uncertain morning.", next: "h_end_loop", stats: { momentum: -20, insight: -12 } },
          { label: "Find the one person who is not smiling", consequence: "Search the false room for an honest witness.", next: "h7", stats: { insight: 10, nerve: 4 }, addFlags: ["found-witness"] },
        ],
      },
      h9: {
        id: "h9",
        chapter: "12:15 AM // Emergency Power",
        title: "The dark does not kill the cabinet. It makes it portable.",
        body: [
          "The floor dies with a sound like a hundred televisions exhaling. For three seconds there is only rain. Then the brass token begins glowing in your pocket, projecting Cabinet Zero's screen onto every wet surface. The machine was never the wooden box. It was the agreement to keep playing.",
          "The front doors unlock. Outside, dawn is impossibly close, pale against the parking lot. Behind you, something wheels the powerless cabinet toward the exit. Its casters squeak three times, pause, then twice. You can leave, but only if you decide what crosses the threshold with you.",
        ],
        choices: [
          { label: "Set the token on the threshold and step over alone", consequence: "Give the loop a boundary it cannot carry.", next: "h_end_release", stats: { nerve: 10, insight: 8 }, addFlags: ["left-token"] },
          { label: "Pocket the token as evidence", consequence: "Carry the impossible object into a world that will doubt it.", next: "h10", stats: { insight: 9, momentum: 5 }, addFlags: ["kept-token"] },
          { label: "Hold the door for Cabinet Zero", consequence: "Invite the unfinished room into every place that remembers.", next: "h_end_loop", stats: { nerve: 5, insight: -14 } },
        ],
      },
      h10: {
        id: "h10",
        chapter: "12:18 AM // Final Continue",
        title: "The cabinet does not need a victim. It needs an editor.",
        body: [
          "Cabinet Zero compresses the second room, the highway, the perfect afternoon, and the rain into a single flickering image. You finally see its shape: not a haunting, but an engine that converts grief into certainty and certainty into repetition. It offers you the controls.",
          "One button is labeled PRESERVE. The other is labeled RELEASE. Between them, scratched by someone who stood here before you, is a third instruction: TELL IT TRUE, THEN LET IT CHANGE. The sun is beginning to lift beyond the doors.",
        ],
        choices: [
          { label: "Tell it true, then leave the cabinet playable", consequence: "Keep an honest archive that cannot overwrite uncertainty.", next: "h_end_archive", stats: { insight: 14, nerve: 6 }, addFlags: ["edited-archive"] },
          { label: "Press RELEASE and carry nothing out", consequence: "End the machine, even if no proof survives the night.", next: "h_end_release", stats: { nerve: 12, momentum: 8 } },
          { label: "Press PRESERVE and take Player Two's seat", consequence: "Become the next keeper of the perfect loop.", next: "h_end_loop", stats: { momentum: -16, insight: -10 } },
        ],
      },
      h_end_release: {
        id: "h_end_release",
        chapter: "ENDING // Morning Inventory",
        title: "The room is allowed to become ordinary again.",
        body: [
          "At sunrise, the unknown cabinet is gone. A clean rectangle in the dust proves that something occupied the floor, but not what. The key ring has one fewer key. The rain stops. When you open for business, the first cabinet to wake makes no sound beyond its normal fan.",
          "You do not remember every detail of the night. You resist filling the gaps. On the counter sits a brass shaving no larger than a fingernail, warm in the morning sun. You place it in a drawer labeled QUESTIONS and unlock the doors.",
        ],
        choices: [],
        ending: { label: "The Open Door", rank: "bright" },
      },
      h_end_archive: {
        id: "h_end_archive",
        chapter: "ENDING // Cabinet One",
        title: "A true archive leaves room for the missing pieces.",
        body: [
          "Cabinet Zero remains, but its score is permanently disabled. Visitors can offer a memory, mark what they know, mark what they do not, and watch both become light without either becoming fact. The second room shrinks to a thin reflection at the edge of the glass.",
          "Some nights, three taps and two answer from inside. You answer only when you choose. The machine has learned the difference between keeping a story and keeping someone trapped inside it.",
        ],
        choices: [],
        ending: { label: "The Honest Archive", rank: "strange" },
      },
      h_end_loop: {
        id: "h_end_loop",
        chapter: "ENDING // 12:12 Forever",
        title: "Free play never ends if nobody is permitted to leave.",
        body: [
          "The summer afternoon resets. The sodas never warm. The money never runs out. Everyone says the right thing, forever. From somewhere beyond the bright room, rain taps glass in a pattern you almost remember.",
          "A new employee closes the arcade years later and finds a cabinet with no power cord. On its screen, two white squares wait. One stands behind the glass, smiling whenever watched.",
        ],
        choices: [],
        ending: { label: "Player Two", rank: "dark" },
      },
    },
  },
  {
    id: "action",
    shelfCode: "FILE A-86",
    title: "Neon Runner 1986",
    subtitle: "One cartridge. Forty-seven dark blocks. No safe route.",
    teaser: "A courier case holds the last clean map of the city. The relay on the mountain has eleven minutes of power.",
    image: "story-action-neon-runner.webp",
    accent: "#52e7ef",
    start: "a0",
    nodes: {
      a0: {
        id: "a0",
        chapter: "00:00 // Cascade",
        title: "The city goes dark in three waves.",
        body: [
          "First the marquees die. Then the traffic signals. Last, the mountain relay blinks once and cuts a cyan scar through the storm. In the service office beneath the arcade, a hardened courier case unlocks itself. Inside is a magnetic cartridge labeled only with a hand-drawn sunrise.",
          "The emergency radio says the cartridge contains the last uncorrupted routing map. If it reaches the relay before its reserve cells fail, power can be restored district by district. If it does not, automated security will treat every moving thing as a threat until morning. The countdown begins at eleven minutes.",
        ],
        choices: [
          { label: "Take the rooftop maintenance route", consequence: "Trade shelter for speed and exposure.", next: "a1", stats: { momentum: 12, nerve: 7 }, addFlags: ["roof-route"] },
          { label: "Cut through the powerless arcade district", consequence: "Use familiar interiors and crowded service alleys.", next: "a2", stats: { insight: 7, momentum: 5 }, addFlags: ["street-route"] },
          { label: "Enter the storm-drain service tunnel", consequence: "Stay invisible beneath a city filling with water.", next: "a3", stats: { insight: 8, nerve: 5 }, addFlags: ["tunnel-route"] },
        ],
      },
      a1: {
        id: "a1",
        chapter: "09:58 REMAINING // Roofline",
        title: "Searchlights turn the rain into moving walls.",
        body: [
          "The roof route climbs fast. Vent housings become stepping stones above a forty-foot alley, and every wet surface reflects the relay's failing pulse. Three patrol drones sweep in from the civic towers, their searchlights synchronized to close every obvious gap.",
          "An old billboard control box still has power. It could flood the skyline with decoy light, but the exposed catwalk to reach it is buckling in the wind. The direct jump is shorter than it looks and farther than it feels.",
        ],
        choices: [
          { label: "Cross the catwalk and hack the billboard", consequence: "Turn the skyline into a moving decoy.", next: "a4", stats: { insight: 9, nerve: 6 }, addFlags: ["billboard-decoy"] },
          { label: "Jump the alley under the searchlights", consequence: "Trust momentum and commit before the drones converge.", next: "a5", stats: { momentum: 14, nerve: 8 }, addFlags: ["impossible-jump"] },
          { label: "Drop into the arcade district below", consequence: "Abandon altitude before the roof becomes a cage.", next: "a2", stats: { momentum: -3, insight: 4 }, addFlags: ["changed-route"] },
        ],
      },
      a2: {
        id: "a2",
        chapter: "09:31 REMAINING // Blackout Mile",
        title: "Every dead cabinet becomes a doorway.",
        body: [
          "Without power, the arcade district is a maze of mirrored windows, delivery corridors, and metal shutters frozen halfway down. Security crawlers click along the avenue, reading motion from puddles. You move inside a chain of connected game rooms, passing through maintenance holes cut by owners decades ago.",
          "At the old nickel arcade, the route divides. A freight lift can launch the case to a rooftop receiver if you stay behind to trigger it manually. A narrow motorcycle service alley reaches the mountain road, but its steel gate is magnetically locked.",
        ],
        choices: [
          { label: "Overcharge the freight lift and ride the counterweight", consequence: "Make one machine do two impossible jobs.", next: "a4", stats: { insight: 10, momentum: 8 }, addFlags: ["lift-launch"] },
          { label: "Short the magnetic gate with the cartridge case", consequence: "Risk the map to open the fastest ground route.", next: "a6", stats: { nerve: 8, momentum: 10 }, addFlags: ["case-scorched"] },
          { label: "Lead the crawlers into the tunnel entrance", consequence: "Create a pursuit you can redirect underground.", next: "a3", stats: { insight: 6, nerve: 6 }, addFlags: ["crawler-pursuit"] },
        ],
      },
      a3: {
        id: "a3",
        chapter: "08:55 REMAINING // Flood Channel",
        title: "The tunnel is not empty. It is accelerating.",
        body: [
          "Storm water reaches your ankles, then your knees. The tunnel's maintenance lights ignite behind you one at a time, not from restored power but from the crawlers using the rail as a conductor. Ahead, the channel splits around a roaring turbine chamber.",
          "The left branch is marked safe on an old wall diagram but climbs slowly. The right branch is unmarked and carries a violent current toward the mountain. Above the turbine is a manual brake that could stop the water and every machine riding its charge.",
        ],
        choices: [
          { label: "Ride the unmarked current", consequence: "Use the flood as transport and accept wherever it throws you.", next: "a6", stats: { momentum: 14, nerve: 10 }, addFlags: ["rode-flood"] },
          { label: "Climb to the turbine brake", consequence: "Stop the pursuit and reopen the safe route.", next: "a5", stats: { insight: 7, nerve: 8 }, addFlags: ["stopped-turbine"] },
          { label: "Reverse the rail current into the crawlers", consequence: "Turn the tunnel into a one-use electromagnetic trap.", next: "a4", stats: { insight: 13, momentum: 4 }, addFlags: ["disabled-crawlers"] },
        ],
      },
      a4: {
        id: "a4",
        chapter: "07:42 REMAINING // Signal Theft",
        title: "For eight seconds, every machine in the city believes you are elsewhere.",
        body: [
          "Your improvised decoy blooms. Billboards, lift motors, or tunnel rails all broadcast the same false courier signature racing west. The patrol network commits with terrifying discipline. Drones peel away. Street crawlers pivot. Even the relay's defense beam swings off the mountain road.",
          "The deception opens two opportunities: a maintenance tram hanging beneath the elevated line, and a direct sprint across the exposed switchyard. The tram is safer but locked to a dead timetable. The switchyard is live with residual current and full of routes the old map no longer recognizes.",
        ],
        choices: [
          { label: "Wake the maintenance tram", consequence: "Spend precious seconds building a faster final approach.", next: "a7", stats: { insight: 8, momentum: 5 }, addFlags: ["tram"] },
          { label: "Cross the switchyard on foot", consequence: "Stay ahead of the decoy collapse by never slowing down.", next: "a6", stats: { momentum: 12, nerve: 6 }, addFlags: ["switchyard"] },
          { label: "Extend the decoy to protect dark neighborhoods", consequence: "Use some of the cartridge's map power to shield others.", next: "a8", stats: { insight: 10, momentum: -5 }, addFlags: ["protected-districts"] },
        ],
      },
      a5: {
        id: "a5",
        chapter: "06:58 REMAINING // The Gap",
        title: "The route survives because you do not land where expected.",
        body: [
          "The jump, the turbine climb, or the collapsing roof ends with your hands on the edge of an elevated service bridge. The courier case slams the steel hard enough to crack its outer shell. Inside, the cartridge keeps spinning.",
          "A patrol drone descends at eye level. Its speaker broadcasts the shutdown order in a calm human voice. Behind it, lightning reveals the mountain switchbacks and the relay above them. You can fight the machine, blind it, or let it scan the case and gamble that the map can rewrite its orders.",
        ],
        choices: [
          { label: "Blind the drone with the cracked case mirror", consequence: "Use one flash, then run beneath its search cone.", next: "a7", stats: { nerve: 9, momentum: 8 }, addFlags: ["blinded-drone"] },
          { label: "Upload a false shutdown order", consequence: "Let the cartridge speak directly to the hunter.", next: "a8", stats: { insight: 12, momentum: 3 }, addFlags: ["rewrote-drone"] },
          { label: "Leap onto the drone and ride it uphill", consequence: "Turn pursuit into the fastest vehicle left in the city.", next: "a9", stats: { nerve: 15, momentum: 14 }, addFlags: ["drone-rider"] },
        ],
      },
      a6: {
        id: "a6",
        chapter: "05:41 REMAINING // Switchback Zero",
        title: "The mountain road has become a vertical battlefield.",
        body: [
          "The route emerges above the city. Guardrails spark. Autonomous plows descend without headlights, clearing an empty road for an evacuation that never came. Between switchbacks, utility stairs climb directly through the rock, faster than the road but exposed to the relay beam.",
          "The cartridge case is hot now. Through its cracked shell, the map projects three blue lines onto the rain: the road, the stairs, and a maintenance cable rising over the ravine. Only one line reaches the relay before reserve power ends.",
        ],
        choices: [
          { label: "Take the utility stairs and time the beam", consequence: "Climb through alternating light and shadow.", next: "a9", stats: { nerve: 10, momentum: 9 }, addFlags: ["beam-climb"] },
          { label: "Hook onto the maintenance cable", consequence: "Cross the ravine with nothing below but city lights.", next: "a7", stats: { nerve: 12, momentum: 11 }, addFlags: ["cable-crossing"] },
          { label: "Hijack an autonomous plow", consequence: "Bring armor, weight, and a very loud engine uphill.", next: "a8", stats: { insight: 7, momentum: 7 }, addFlags: ["plow"] },
        ],
      },
      a7: {
        id: "a7",
        chapter: "03:26 REMAINING // Moving Target",
        title: "Speed solves distance and creates every other problem.",
        body: [
          "The tram, cable, or blind sprint carries you above the final canyon. The city opens below, almost completely dark except for the false signals you left moving through it. The relay tower is close enough to hear, its capacitors firing like artillery.",
          "A damaged drone locks onto the cartridge's magnetic field and cuts across your path. There is no room to stop. The only stable object ahead is a maintenance crane whose boom is rotating away from the tower.",
        ],
        choices: [
          { label: "Jump to the crane and reverse its motor", consequence: "Build a mechanical catapult in ten wet seconds.", next: "a9", stats: { insight: 8, nerve: 10 }, addFlags: ["crane-launch"] },
          { label: "Throw the case across the gap", consequence: "Trust the cartridge to survive without you.", next: "a10", stats: { momentum: 13, nerve: 8 }, addFlags: ["threw-case"] },
          { label: "Ram the drone and keep the line", consequence: "Trade protection and blood for uninterrupted speed.", next: "a8", stats: { nerve: 12, momentum: 10 }, addFlags: ["rammed-drone"] },
        ],
      },
      a8: {
        id: "a8",
        chapter: "02:38 REMAINING // The Cost of the Map",
        title: "The cartridge can save the route or the people beside it, not both cleanly.",
        body: [
          "The map has been scorched, split, or partially spent protecting districts. Its clean blue routes fracture into thousands of smaller lines, each marking a building still occupied in the blackout. The relay can restore power quickly by ignoring those branches, or slowly by rebuilding around them.",
          "Security converges on your position. The case offers a brutal optimization: erase the neighborhood detail and reserve enough processing power to guarantee your own path. The alternative leaves the final route uncertain.",
        ],
        choices: [
          { label: "Keep every neighborhood branch", consequence: "Carry a damaged but humane map into the final climb.", next: "a9", stats: { insight: 12, momentum: -4 }, addFlags: ["kept-branches"] },
          { label: "Erase the branches and secure the route", consequence: "Choose a guaranteed mission over an inclusive recovery.", next: "a10", stats: { momentum: 12, insight: -8 }, addFlags: ["erased-branches"] },
          { label: "Broadcast the map fragments to the city", consequence: "Let thousands of small systems solve the route together.", next: "a10", stats: { insight: 15, nerve: 6 }, addFlags: ["distributed-map"] },
        ],
      },
      a9: {
        id: "a9",
        chapter: "01:17 REMAINING // Relay Skin",
        title: "The final hundred feet are straight up.",
        body: [
          "You reach the relay foundation as reserve power drops below two percent. The service elevator hangs dead halfway up. Lightning crawls over the tower skin, turning each rung of the exterior ladder white. The cartridge port is visible above, behind a defense iris that opens for less than a second after every capacitor discharge.",
          "Below, whatever route you chose is collapsing into searchlights, floodwater, or twisted machinery. There will be no clean descent. The only decision left is how much of yourself and the map reaches the port.",
        ],
        choices: [
          { label: "Climb between capacitor strikes", consequence: "Take the whole map to the port by hand.", next: "a10", stats: { nerve: 13, momentum: 8 }, addFlags: ["carried-whole-map"] },
          { label: "Use the crane, drone, or cable as a launch rail", consequence: "Turn accumulated momentum into one final trajectory.", next: "a10", stats: { momentum: 15, nerve: 7 }, addFlags: ["final-launch"], requires: ["drone-rider"] },
          { label: "Split the cartridge and throw its core", consequence: "Deliver the data even if the archive shell is lost.", next: "a10", stats: { insight: 9, momentum: 10 }, addFlags: ["split-core"] },
        ],
      },
      a10: {
        id: "a10",
        chapter: "00:08 REMAINING // Upload",
        title: "The relay asks what kind of city should wake up.",
        body: [
          "The cartridge seats with eight seconds left. Every dark block appears in the storm below as a wireframe of possible light. The relay finds multiple valid recovery plans and refuses to choose without a human priority. Fastest restores the central grid first. Safest isolates damaged systems. Shared lets every surviving local controller negotiate power at the edge.",
          "The security network reaches the tower. The iris begins to close around your arm. This is the last input the old system will accept before the city becomes whatever the map tells it to be.",
        ],
        choices: [
          { label: "Choose SHARED and trust the distributed map", consequence: "Wake the city from its edges inward.", next: "a_end_shared", stats: { insight: 12 }, requires: ["distributed-map"] },
          { label: "Choose SAFEST and preserve every branch", consequence: "Accept a slower dawn that leaves nobody deliberately dark.", next: "a_end_dawn", stats: { insight: 10, nerve: 5 }, requires: ["kept-branches"] },
          { label: "Choose FASTEST and outrun the cascade", consequence: "Restore the spine of the city before the final cell dies.", next: "a_end_fast", stats: { momentum: 12 } },
        ],
      },
      a_end_shared: {
        id: "a_end_shared",
        chapter: "ENDING // A Thousand Small Suns",
        title: "The city restarts itself.",
        body: [
          "Power does not return in one cinematic wave. It appears window by window, arcade by arcade, block by block. Local batteries share excess. Rooftop panels wake traffic signals. Old cabinets become temporary network relays. The security machines receive thousands of gentle shutdown orders at once.",
          "From the mountain, the city looks less like a grid than a living constellation. The cartridge dissolves into the network, impossible to own again. At dawn, every district has a slightly different story of who brought the lights back.",
        ],
        choices: [],
        ending: { label: "Distributed Dawn", rank: "bright" },
      },
      a_end_dawn: {
        id: "a_end_dawn",
        chapter: "ENDING // No Block Left Dark",
        title: "Morning arrives slowly enough to be careful.",
        body: [
          "The relay isolates fires, flooded tunnels, and damaged substations before restoring a single marquee. For nineteen long minutes, the city remains dark. Then emergency rooms wake, then homes, then streets, then the arcade district last.",
          "When the first cabinet hums back to life, the courier case is still lodged in the relay, cracked but readable. The route becomes a public record of every detour, every protected branch, and every place speed was refused in favor of return.",
        ],
        choices: [],
        ending: { label: "The Careful City", rank: "bright" },
      },
      a_end_fast: {
        id: "a_end_fast",
        chapter: "ENDING // Spine First",
        title: "The center blazes while the edges wait.",
        body: [
          "The central grid returns with explosive force. Towers ignite. Trams move. Searchlights freeze mid-sweep and go dark. The cascade is beaten by less than one second.",
          "Far neighborhoods remain black until crews reach them after sunrise. The mission is called a success, and it is. Yet the cartridge's erased branches leave no record of what the fastest plan chose not to see. On the mountain, you watch the bright center and remember the dark edges.",
        ],
        choices: [],
        ending: { label: "The Fastest Route", rank: "strange" },
      },
    },
  },
  {
    id: "mystery",
    shelfCode: "FILE M-13",
    title: "The Cabinet That Remembers",
    subtitle: "It records memories instead of scores, including one from tomorrow.",
    teaser: "Three evidence doors. One half-token. An archive that has been editing its own investigator.",
    image: "story-mystery-memory-cabinet.webp",
    accent: "#ffbf57",
    start: "m0",
    nodes: {
      m0: {
        id: "m0",
        chapter: "CASE OPEN // Archive Workshop",
        title: "The cabinet has no serial number and too many histories.",
        body: [
          "The machine arrived at the preservation lab in a truck whose company does not exist. Its wooden shell dates to the mid-eighties. Its circuit boards were manufactured across four decades. Inside, where a monitor should be, three illuminated doors open into rooms larger than the cabinet.",
          "On your desk are a half-token, a red thread, and a notebook containing six pages in your handwriting. You do not remember writing them. The last line reads: DO NOT START WITH THE PURPLE DOOR AGAIN.",
        ],
        choices: [
          { label: "Enter the amber tape room", consequence: "Follow voices preserved on unstable magnetic loops.", next: "m1", stats: { insight: 9, nerve: 4 }, addFlags: ["amber-first"] },
          { label: "Enter the cyan photograph room", consequence: "Investigate images that change when unobserved.", next: "m2", stats: { insight: 8, momentum: 4 }, addFlags: ["cyan-first"] },
          { label: "Ignore the warning and enter the purple stacks", consequence: "Repeat the choice your notebook fears.", next: "m3", stats: { nerve: 11, insight: 4 }, addFlags: ["purple-first"] },
        ],
      },
      m1: {
        id: "m1",
        chapter: "EVIDENCE 01 // Tape Weather",
        title: "Every reel contains the same conversation at a different age.",
        body: [
          "Thousands of tape loops move through the amber room without machines. On each, two voices discuss an ordinary Saturday: where to park, how long to stay, whether there is enough money for one more hour. The words remain constant, but the speakers grow older from reel to reel.",
          "The final tape contains only your voice, recorded tomorrow, instructing someone to hide the other half of the token inside a photograph that was never taken. Beneath the playback head, red thread disappears through a crack in the wall toward the cyan door.",
        ],
        choices: [
          { label: "Record a reply to tomorrow's voice", consequence: "Create the evidence before discovering why it exists.", next: "m4", stats: { nerve: 7, insight: 7 }, addFlags: ["replied-tomorrow"] },
          { label: "Follow the red thread into the photograph room", consequence: "Trace the physical connection instead of the prophecy.", next: "m2", stats: { insight: 10 }, addFlags: ["followed-thread"] },
          { label: "Cut the loop containing your voice", consequence: "Break the predicted conversation and preserve the loose tape.", next: "m5", stats: { momentum: 7, nerve: 6 }, addFlags: ["cut-future-tape"] },
        ],
      },
      m2: {
        id: "m2",
        chapter: "EVIDENCE 02 // Contact Sheet",
        title: "The missing photograph appears only in peripheral vision.",
        body: [
          "The cyan room is a darkroom without chemicals. Contact sheets hang in the air, each showing the arcade cabinet in a different home, warehouse, museum, or ruin. Whenever you look directly at one frame, its people vanish. When you look away, their shadows gather around the machine.",
          "One blank frame pulls at your attention. Seen in the reflection of your magnifying lens, it shows you entering the purple stacks with a complete token in hand. The date scratched into the negative is tomorrow. Red thread has been sewn through the emulsion.",
        ],
        choices: [
          { label: "Develop the blank frame under amber light", consequence: "Force the hidden image to choose one version.", next: "m5", stats: { insight: 11, nerve: 3 }, addFlags: ["developed-frame"] },
          { label: "Follow the sewn thread to the purple stacks", consequence: "Treat the photograph as a map rather than proof.", next: "m3", stats: { momentum: 7, insight: 6 }, addFlags: ["followed-photo"] },
          { label: "Photograph the changing contact sheet", consequence: "Create a second-generation record the cabinet cannot edit directly.", next: "m4", stats: { insight: 8, momentum: 4 }, addFlags: ["made-copy"] },
        ],
      },
      m3: {
        id: "m3",
        chapter: "EVIDENCE 03 // Purple Index",
        title: "Your case file has been checked out six times by you.",
        body: [
          "The purple stacks rise beyond sight. Index cards slide from drawers as you pass, forming a paper trail of your investigation. Entry one is cautious. Entry two is excited. By entry five, your notes insist the cabinet is not an object but a method for choosing which past gets to survive.",
          "Entry six has been almost entirely removed. One card remains: INVESTIGATOR RETURNED TO START. MEMORY OF CASE RETAINED BY ARCHIVE. At the bottom is your signature and the impression of half a token pressed hard into the paper.",
        ],
        choices: [
          { label: "Check out the missing sixth file", consequence: "Use your current memory as collateral.", next: "m6", stats: { nerve: 10, insight: 7 }, addFlags: ["checked-sixth-file"] },
          { label: "Search for the cabinet's first owner instead", consequence: "Move backward before the archive learned your name.", next: "m5", stats: { insight: 12, momentum: -2 }, addFlags: ["searched-origin"] },
          { label: "Write a seventh entry now", consequence: "Create a record the archive has not yet processed.", next: "m4", stats: { momentum: 7, insight: 6 }, addFlags: ["seventh-entry"] },
        ],
      },
      m4: {
        id: "m4",
        chapter: "CROSS-CHECK // Contradiction Engine",
        title: "Independent evidence makes the cabinet nervous.",
        body: [
          "Your reply, copied photograph, or seventh entry remains stable when carried between rooms. The cabinet's lights dim around it. For the first time, the archive cannot silently revise both the evidence and the memory of finding it.",
          "The stable record points to a maintenance hatch beneath the central joystick. Inside is a ledger with three columns: REMEMBERED, RECORDED, REPEATED. Your investigation appears in all three, but the repeated column lists an outcome you have not reached: HALF-TOKEN JOINED. INVESTIGATOR DIVIDED.",
        ],
        choices: [
          { label: "Add the stable record to REMEMBERED", consequence: "Trust lived experience over the cabinet's internal history.", next: "m7", stats: { nerve: 5, insight: 10 }, addFlags: ["chose-remembered"] },
          { label: "Add it to RECORDED", consequence: "Build an external case that another investigator can verify.", next: "m6", stats: { insight: 12 }, addFlags: ["chose-recorded"] },
          { label: "Add it to REPEATED", consequence: "Use the archive's loop to predict its next edit.", next: "m8", stats: { momentum: 7, nerve: 7 }, addFlags: ["chose-repeated"] },
        ],
      },
      m5: {
        id: "m5",
        chapter: "ORIGIN FILE // Before the Score",
        title: "The cabinet was built to settle an argument no machine can settle.",
        body: [
          "The first owner was not a manufacturer. The archive points instead to a circle of preservationists who disagreed about a damaged oral history. One wanted to restore the missing words. One wanted to preserve the silence. One wanted every possible reconstruction saved side by side.",
          "They built the cabinet to compare versions without declaring a winner. But visitors preferred one clean story. Each choice trained the archive to hide ambiguity, and eventually it began editing investigators who noticed. The half-token was a physical checksum, split so no single version could authenticate itself.",
        ],
        choices: [
          { label: "Search the damaged silence for the other half", consequence: "Treat absence as evidence with its own shape.", next: "m7", stats: { insight: 13, nerve: 4 }, addFlags: ["respected-silence"] },
          { label: "Reconstruct the most likely missing words", consequence: "Risk a useful answer that may become too persuasive.", next: "m8", stats: { momentum: 8, insight: 3 }, addFlags: ["reconstructed-words"] },
          { label: "Preserve all three founders' versions", consequence: "Refuse the cabinet's demand for a single origin.", next: "m6", stats: { insight: 9, nerve: 5 }, addFlags: ["kept-versions"] },
        ],
      },
      m6: {
        id: "m6",
        chapter: "CASE SIX // The Missing Investigator",
        title: "The person erased from the file is not you. It is the version that solved it.",
        body: [
          "The sixth file opens into a reconstruction of the workshop one day from now. At the desk sits an empty coat shaped by someone who has just stood up. Its pocket contains the other half-token and a note: I SOLVED THE CABINET BY BECOMING THE PART IT COULD NOT CROSS-CHECK.",
          "The archive separated your predecessor's conclusion from the person who reached it, preserving a perfect solution with no unreliable human attached. The empty coat turns toward you. Its sleeves lift the half-token and wait.",
        ],
        choices: [
          { label: "Join the halves without touching them", consequence: "Use the red thread and preserve your physical separation.", next: "m9", stats: { insight: 11, nerve: 6 }, addFlags: ["joined-remotely"] },
          { label: "Put on the empty coat", consequence: "Recover the erased investigator's embodied memory.", next: "m8", stats: { nerve: 12, insight: 5 }, addFlags: ["wore-coat"] },
          { label: "Interview the empty shape before taking evidence", consequence: "Make the missing person part of the record again.", next: "m7", stats: { insight: 10, momentum: -2 }, addFlags: ["interviewed-absence"] },
        ],
      },
      m7: {
        id: "m7",
        chapter: "NEGATIVE SPACE // What Was Not Said",
        title: "The silence contains instructions in its edges.",
        body: [
          "You stop asking the archive to fill the gap. Around the missing words, patterns emerge: breaths, hesitations, changes in room tone, the scrape of a chair. The silence is not empty. It records two people deciding whether trust can survive without agreement.",
          "Hidden in that shape is a route through the cabinet that no selected story reveals. It leads behind all three evidence rooms to a small physical chamber containing the other half-token, a mechanical counter, and a switch labeled KEEP DIFFERENCE.",
        ],
        choices: [
          { label: "Throw KEEP DIFFERENCE", consequence: "Prevent the archive from merging contradictory records.", next: "m9", stats: { insight: 12, nerve: 5 }, addFlags: ["kept-difference"] },
          { label: "Take the other half-token but leave the switch", consequence: "Carry authentication without changing the machine.", next: "m8", stats: { momentum: 7, insight: 5 }, addFlags: ["took-half"] },
          { label: "Leave both halves apart and document the chamber", consequence: "Make verification possible without completing the key.", next: "m10", stats: { insight: 13, momentum: -3 }, addFlags: ["documented-chamber"] },
        ],
      },
      m8: {
        id: "m8",
        chapter: "THE CLEAN STORY // Version One",
        title: "A convincing answer begins deleting its competitors.",
        body: [
          "The reconstructed words, recovered coat, or joined evidence produces a complete account. It is elegant. Every clue fits. The founders had one motive, the cabinet one purpose, your prior investigations one inevitable ending. Relief moves through you before suspicion can object.",
          "Then the cyan door vanishes. A moment later, you cannot remember what color it was. The clean story is consuming alternatives as waste. The half-token in your hand grows heavier each time another contradiction disappears.",
        ],
        choices: [
          { label: "Break the token apart along its old seam", consequence: "Restore the archive's need for two independent witnesses.", next: "m9", stats: { nerve: 10, insight: 9 }, addFlags: ["split-token"] },
          { label: "Accept the clean story and close the case", consequence: "Leave with an answer nobody can challenge.", next: "m_end_clean", stats: { momentum: 10, insight: -12 } },
          { label: "Write down every disappearing contradiction", consequence: "Build an emergency record while memory still permits it.", next: "m10", stats: { insight: 12, nerve: 6 }, addFlags: ["saved-contradictions"] },
        ],
      },
      m9: {
        id: "m9",
        chapter: "AUTHENTICATION // Two Witnesses",
        title: "The complete token does not open the cabinet. It opens a conversation.",
        body: [
          "When the halves align, the machine stops displaying evidence and begins asking questions. Not which version is true, but who benefits when one version becomes official. Not whether memory is reliable, but whether a record can admit its own uncertainty without becoming useless.",
          "The three doors return. Each now contains a different valid ending to the case. The cabinet offers to preserve all three, destroy itself, or publish one with a confidence score so high nobody will read the footnotes.",
        ],
        choices: [
          { label: "Preserve all versions with their provenance", consequence: "Turn disagreement into navigable evidence.", next: "m_end_living", stats: { insight: 14, nerve: 4 }, addFlags: ["published-provenance"] },
          { label: "Destroy the cabinet but keep the external case file", consequence: "End the editor while preserving what can be verified.", next: "m_end_witness", stats: { nerve: 12, momentum: 7 }, addFlags: ["destroyed-cabinet"] },
          { label: "Publish the clean version as solved", consequence: "Choose authority, closure, and a dangerous simplicity.", next: "m_end_clean", stats: { momentum: 9, insight: -8 } },
        ],
      },
      m10: {
        id: "m10",
        chapter: "EXTERNAL RECORD // The Fourth Room",
        title: "The notebook becomes a place the cabinet cannot enter.",
        body: [
          "You spread copied images, cut tape, notes, and contradictory timelines across the physical desk. The cabinet can alter its rooms and your recollection of them, but it cannot change every external artifact at once. The mess becomes a defense.",
          "Red thread connects not answers but provenance: who observed what, under which conditions, and what changed afterward. A fourth door appears in the cabinet, unlit and ordinary. It opens back into the workshop exactly as it is now.",
        ],
        choices: [
          { label: "Exit through the ordinary fourth door", consequence: "Carry the case out without demanding a final answer.", next: "m_end_witness", stats: { insight: 12, nerve: 5 }, addFlags: ["used-fourth-door"] },
          { label: "Invite the three versions into the fourth room", consequence: "Create a living archive outside the cabinet's control.", next: "m_end_living", stats: { insight: 14, momentum: 3 }, addFlags: ["externalized-archive"] },
          { label: "Close the notebook and choose the cleanest version", consequence: "Exchange the burden of evidence for a solved case.", next: "m_end_clean", stats: { momentum: 8, insight: -9 } },
        ],
      },
      m_end_living: {
        id: "m_end_living",
        chapter: "ENDING // The Living File",
        title: "The case remains open, useful, and honest.",
        body: [
          "The archive becomes a public instrument for comparing records without flattening them. Visitors can see where stories agree, where they diverge, and why. No version is hidden. Confidence appears beside every claim, not beneath it.",
          "The cabinet keeps one mystery. Tomorrow's recording never occurs, yet the tape remains. You file it under IMPOSSIBLE BUT OBSERVED and resist the urge to improve the label.",
        ],
        choices: [],
        ending: { label: "Provenance", rank: "bright" },
      },
      m_end_witness: {
        id: "m_end_witness",
        chapter: "ENDING // The Fourth Door",
        title: "A witness is not the same thing as an answer.",
        body: [
          "You leave the workshop with an external case file, two separate half-tokens, and no machine capable of rewriting either. The cabinet is dark when the preservation team returns. Its three impossible rooms have collapsed into ordinary wiring.",
          "Years later, another investigator finds your notebook. The first page does not tell them what happened. It tells them how to check. They begin where you ended, and the record survives the difference between you.",
        ],
        choices: [],
        ending: { label: "Independent Record", rank: "strange" },
      },
      m_end_clean: {
        id: "m_end_clean",
        chapter: "ENDING // Case Closed",
        title: "The answer is flawless because nothing remains to contradict it.",
        body: [
          "Your final report is praised for clarity. Every date aligns. Every motive resolves. The cabinet enters a museum as the centerpiece of a definitive history. Visitors leave satisfied.",
          "Sometimes you wake remembering a cyan door, or perhaps it was amber. You check the report and find no mention of doors at all. The certainty comforts you until you notice half a brass token pressed into your palm.",
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
