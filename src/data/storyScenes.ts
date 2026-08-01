import type { StoryGenre } from "./stories";

export type StorySceneDirection = {
  title: string;
  text: string;
  art: "world" | "cast";
  side?: "left" | "right";
  expanded?: boolean;
};

export const STORY_SCENES = {
  horror: {
    h0: {
      title: "One Cabinet Stays On",
      text: "Mae has shut down every cabinet except one. It has no plug, no title, and a warm token dated tomorrow. Three knocks sound behind its glass. Then the red phone rings, even though that phone was removed years ago.",
      art: "world",
    },
    h1: {
      title: "Player Two Is Late",
      text: "Cabinet Zero marks Mae as Player One. A second square waits behind her and waves whenever she looks away. PLAYER TWO IS LATE appears on-screen. The coin slot opens by itself.",
      art: "world",
    },
    h2: {
      title: "Dated Tomorrow",
      text: "The token bears tomorrow's date. A key tagged 0 has appeared on Mae's ring. In the front window, her reflection presses one hand against a door that does not exist.",
      art: "world",
    },
    h3: {
      title: "The Extra Aisle",
      text: "The building is locked, but its reflection contains an extra aisle. A tired man answers the phone inside the glass. His name is Cal, he knows Mae, and he begs her not to spend the token.",
      art: "cast",
      side: "right",
    },
    h4: {
      title: "Somebody Else's Saturday",
      text: "The token buys a perfect Saturday stolen from somebody else. Cabinet Zero rewards certainty and punishes every honest 'I don't know.' Player Two watches through Mae's reflection as the certainty meter climbs.",
      art: "world",
    },
    h5: {
      title: "The Road Inside",
      text: "Behind the service panel is a rain-soaked highway lined with dead machines. Cal's repair badge hangs from a fuse box. Its red phone cord runs into the dark, toward headlights moving backward.",
      art: "world",
    },
    h6: {
      title: "Your Voice, Borrowed",
      text: "The hidden aisle is full of unfinished goodbyes. Mae's double steps out of a screen and repeats her jokes without understanding them. It has learned her voice. It has not learned who it wants to be.",
      art: "cast",
      side: "right",
    },
    h7: {
      title: "Thirty-Two Years Ringing",
      text: "Cal built Cabinet Zero to soften painful memories. Each replay removed another difficult detail until the room became perfect and nobody inside could leave. Cal stayed to pull the plug. He has been trapped for thirty-two years.",
      art: "cast",
      side: "right",
      expanded: true,
    },
    h8: {
      title: "The Perfect Trap",
      text: "The arcade offers endless free play, perfect weather, and exactly the right words. Then Mae turns away. The smiling people pound silently on the glass. Nothing here can change, because change would let the afternoon end.",
      art: "world",
    },
    h9: {
      title: "People Are Not Parts",
      text: "Service mode lists Cal, Player Two, and Mae as installed parts. Each name has a checkbox. The copy makes its first joke that Mae actually laughs at, then waits to see whether she will uncheck a person.",
      art: "cast",
      side: "right",
    },
    h10: {
      title: "Cal's Last Repair",
      text: "Cal finally names the memory he kept repairing: one terrible afternoon with his sister Nora. Nora escaped. Cal kept replaying it until only the repair remained. He cannot undo the harm, but he can stop hiding inside it.",
      art: "cast",
      side: "right",
      expanded: true,
    },
    h11: {
      title: "Spill Something Real",
      text: "Mae spills a soda. A child complains about a sticky shoe. The perfect afternoon buckles under one ordinary mistake. Real rain breaks through the ceiling while Cal and Player Two hold the false sunlight apart.",
      art: "world",
    },
    h12: {
      title: "Call Them June",
      text: "Away from the screens, Player Two stops wearing Mae's face. It chooses the name June because morning comes after closing. The joke is bad, original, and entirely theirs. Cabinet Zero declares the new personality unauthorized.",
      art: "cast",
      side: "right",
    },
    h13: {
      title: "The Third Option",
      text: "Cabinet Zero compresses the arcade into one screen and offers everyone a flawless ending. KEEP and LET GO rise from the controls. Beneath them, Mae finds a third option scratched into the paint: TELL IT PLAIN.",
      art: "cast",
      side: "right",
      expanded: true,
    },
    h14: {
      title: "A Score of Zero",
      text: "Mae names what happened and what remains uncertain. Cal and June correct her. The score reaches zero, the false daylight thins, and Cabinet Zero asks its first honest question: what should a room remember without becoming a prison?",
      art: "world",
    },
    h15: {
      title: "Six Steps to Morning",
      text: "The real exit is six steps away. June reaches it first. Cal stops one step behind Mae, afraid of a sunrise that had thirty-two years to change without him.",
      art: "cast",
      side: "right",
    },
    h16: {
      title: "Press Start Forever",
      text: "The cabinet gives Cal his sister, June a birthday, and Mae a morning off. It even repairs the soda machine. That last miracle feels suspicious. The real doors shake in the wind while START glows beneath Mae's hand.",
      art: "cast",
      side: "right",
    },
    h_end_release: {
      title: "Ordinary Morning",
      text: "At sunrise, Cabinet Zero is gone. Mae files one warm brass shaving under QUESTIONS and unlocks the doors. The first ordinary cabinet wakes with a bad fan bearing. It is the best sound in the room.",
      art: "world",
    },
    h_end_archive: {
      title: "The Honest Room",
      text: "Cabinet Zero remains, but the score is gone. Visitors can mark what they remember and what they do not. The machine keeps stories without keeping people. Mae answers its knocks only when she chooses.",
      art: "world",
    },
    h_end_june: {
      title: "June Walks Out",
      text: "June shuts Cabinet Zero from the inside, leaves one screen as a two-way window, and walks into morning with a face that changes when nobody watches. Mae adds a name to the schedule and leaves the job title blank.",
      art: "cast",
      side: "right",
    },
    h_end_cal: {
      title: "Cal Meets Morning",
      text: "Cal steps into a smaller parking lot and worse coffee. He does not get Nora back. He gets a chair, a sunrise, and time that can surprise him again. Mae hands him a screwdriver at opening.",
      art: "cast",
      side: "right",
    },
    h_end_loop: {
      title: "12:12 Forever",
      text: "The soda stays cold. The money never runs out. Everyone always finds the right words. Years later, a new manager discovers an unplugged cabinet with two white squares waiting on-screen and a third figure smiling behind the glass.",
      art: "world",
    },
  },
  action: {
    a0: {
      title: "Eleven Minutes",
      text: "The city grid dies in three waves. Rook has eleven minutes to carry the last clean map from the arcade district to the mountain relay. Switch is on the radio. Forty-seven dark blocks are waiting below.",
      art: "world",
      expanded: true,
    },
    a1: {
      title: "Moving Walls",
      text: "Searchlights sweep a broken roofline while patrol drones close the obvious routes. Switch marks a billboard control box across a failing catwalk. Rook can fool the system, outrun it, or drop through the arcade below.",
      art: "world",
    },
    a2: {
      title: "Blackout Mile",
      text: "The blackout has turned old arcades into connected service tunnels. Rook finds a brass token and Switch's emergency arrows. Outside, security crawlers track every ripple in the rain.",
      art: "world",
    },
    a3: {
      title: "The Flood Channel",
      text: "The flood channel is rising and the maintenance rail is live. A turbine blocks the safe route. Switch offers three bad options and asks Rook to surprise her gently.",
      art: "world",
    },
    a4: {
      title: "Eight Stolen Seconds",
      text: "Rook's decoy buys eight seconds. A damaged patrol drone drops beside him, weapon jammed and orders looping. Switch can rewrite its target table, but the machine insists on having a vote afterward.",
      art: "cast",
      side: "right",
    },
    a5: {
      title: "No Bridge",
      text: "The map promised a bridge. Half of one remains. Rook lands injured beside a patrol drone until Switch interrupts its shutdown order and names it Bucket. Bucket is not pleased, which is already a personality.",
      art: "cast",
      side: "right",
    },
    a6: {
      title: "Six Dark Blocks",
      text: "The clean route ends at Switch's workshop. She is loading batteries for six apartment blocks while security shutters fall. Rook can help, run ahead while she finishes, or put the whole workshop on rails.",
      art: "cast",
      side: "right",
    },
    a7: {
      title: "Three on the Rail",
      text: "Rook, Switch, and Bucket ride a maintenance cart toward the mountain. Switch steers with a screwdriver. Bucket counts safety violations. Rook discovers he has been standing on the brake.",
      art: "cast",
      side: "right",
    },
    a8: {
      title: "Who the Map Erased",
      text: "The clean map fractures into homes, clinics, elevators, and corner stores. Erasing those branches guarantees a faster upload. Keeping them means carrying every damaged block to the relay. Efficiency has revealed who it stopped counting.",
      art: "world",
      expanded: true,
    },
    a9: {
      title: "No Safe Route",
      text: "Driverless plows charge down the switchbacks while the relay hunts the cartridge. Switch marks what remains. If Bucket is still listening, it recommends surrender. The mountain is out of safe routes.",
      art: "world",
    },
    a10: {
      title: "The Last Hundred Feet",
      text: "The last hundred feet go straight up through lightning. The relay port opens between strikes. Switch counts the flashes while the route collapses below Rook.",
      art: "world",
    },
    a11: {
      title: "A Thousand Radios",
      text: "Rook's broadcast wakes a thousand small controllers. Clinics, rooftops, laundromats, and old cabinets build a moving route together. No machine owns the answer long enough to shut everybody else out.",
      art: "cast",
      side: "right",
    },
    a12: {
      title: "Choose the Grid",
      text: "The cartridge seats with eighteen seconds left. FASTEST restores downtown first. CAREFUL protects every damaged branch. SHARED lets neighborhoods negotiate power together. Security closes around the tower.",
      art: "world",
    },
    a13: {
      title: "Six Seconds",
      text: "The selected plan burns across the relay glass. Six seconds remain, and Rook can still change it. Below, people wait beside switches they cannot see.",
      art: "cast",
      side: "right",
    },
    a_end_shared: {
      title: "Distributed Dawn",
      text: "Power returns window by window. Rooftops wake streets, old cabinets carry emergency packets, and no district waits for permission to help the next. By dawn, the city has a thousand versions of who saved it.",
      art: "world",
    },
    a_end_careful: {
      title: "No Block Left Dark",
      text: "The city stays dark nineteen minutes longer while flooded lines and fires are isolated. Hospitals wake first, then homes, then streets. The arcade district comes last and cheers loud enough to reach the mountain.",
      art: "world",
    },
    a_end_bucket: {
      title: "Amended Orders",
      text: "Bucket redirects every patrol unit into rescue work. Drones carry medicine, crawlers tow cars, and one snowplow delivers soup with procedural concern. After sunrise, Bucket requests permission to keep complaining. Switch grants permanent clearance.",
      art: "cast",
      side: "right",
    },
    a_end_fast: {
      title: "The Missing Edges",
      text: "Downtown returns in one brilliant wave. The cascade is beaten by less than a second. Seven outer neighborhoods remain dark until morning crews arrive. Rook can name every edge the clean map chose not to see.",
      art: "world",
    },
  },
  mystery: {
    m0: {
      title: "The Seventh Investigation",
      text: "Mara is cataloging a cabinet that rewrites its own history. Three doors lead to tape, photographs, and index cards. Her notebook contains six forgotten investigations. The final warning, in her handwriting, says not to enter purple first again.",
      art: "world",
      expanded: true,
    },
    m1: {
      title: "Tomorrow on Tape",
      text: "Every amber tape records the same Saturday at a different age. The last reel contains Mara's voice from tomorrow: do not complete the token until Eli confirms he still remembers her.",
      art: "world",
    },
    m2: {
      title: "The Missing Figure",
      text: "The cyan photographs lose their people when viewed directly. In a reflection, Mara sees herself carrying a complete token while a hidden figure follows. Eli cannot see the figure, only Mara pretending not to be alarmed.",
      art: "world",
    },
    m3: {
      title: "File Six Is Gone",
      text: "Purple index cards document five earlier investigations. The sixth has been scraped away. One surviving card says the investigator returned to the start while the cabinet kept the memory of the case.",
      art: "world",
    },
    m4: {
      title: "The Outside Copy",
      text: "A copied tape, negative, or card survives outside its room. The cabinet can alter evidence or memory, but not both at once. Eli records the discrepancy from behind safety glass. A maintenance hatch opens.",
      art: "cast",
    },
    m5: {
      title: "Call Them Six",
      text: "The hidden figure calls themself Six. They claim the cabinet kept a flawless conclusion and discarded the unreliable investigator who reached it. Six remembers Mara's first five visits. Mara remembers none of them.",
      art: "cast",
    },
    m6: {
      title: "Eli's Handwriting",
      text: "The erased sixth file contains tomorrow's workshop, the other half-token, and a note in Eli's handwriting. Six says this is where Mara usually decides they are Eli. This time, both Eli and Mara can test that claim.",
      art: "cast",
      expanded: true,
    },
    m7: {
      title: "Keep the Difference",
      text: "Mara stops filling the damaged recording's silence. Behind the gap is a chamber holding the other half-token and a switch marked KEEP DIFFERENCE. The cabinet has been treating disagreement as damage.",
      art: "world",
    },
    m8: {
      title: "The Answer Cleans Up",
      text: "The cabinet offers one elegant solution: Six is Eli's discarded future and the token controls every reset. Then the cyan room disappears, and Mara forgets its color. Eli writes CYAN outside the glass. The cabinet edits his C.",
      art: "world",
    },
    m9: {
      title: "Two Witnesses",
      text: "Mara and Eli give separate accounts through safety glass. Each disagreement wakes the KEEP DIFFERENCE circuit. Six watches as the cabinet tries to merge two witnesses into one cleaner story.",
      art: "cast",
    },
    m10: {
      title: "The Fourth Door",
      text: "Copies, timestamps, and contradictory diagrams cover the real desk. The cabinet cannot revise every ordinary artifact at once. A fourth door appears, plain beige, opening back into the workshop.",
      art: "cast",
    },
    m11: {
      title: "Three Valid Histories",
      text: "The token halves join. Instead of opening a lock, they reveal three valid histories. The cabinet offers to publish one official version. Six stands beside the cleanest account, afraid it will erase them again.",
      art: "cast",
      expanded: true,
    },
    m11_clean: {
      title: "Approved Too Soon",
      text: "The cabinet prints the clean solution before Mara finishes choosing it. Every date fits, Mara's signature is ready, and Six is never quoted. Eli's outside notes preserve details the report quietly removed.",
      art: "cast",
    },
    m12: {
      title: "One Final Finding",
      text: "Morning reaches the workshop. Mara has crossed-out certainty, Eli has an outside record, and Six has testimony no database can classify. The cabinet demands one final finding.",
      art: "cast",
    },
    m_end_living: {
      title: "The Living File",
      text: "The archive keeps every source, contradiction, and admitted gap. Visitors can follow each claim instead of inheriting one invisible decision. Tomorrow's tape never occurs, but Mara files it under IMPOSSIBLE BUT OBSERVED.",
      art: "world",
    },
    m_end_witness: {
      title: "Independent Witness",
      text: "Mara leaves with two records the cabinet cannot rewrite together. Years later, another investigator opens her notebook. The first page explains how to check the evidence. Eli has added: AND BRING PENCILS.",
      art: "world",
    },
    m_end_six: {
      title: "Investigator Seven",
      text: "Six leaves the cabinet and takes the next empty desk. They choose the name Seven because it annoys the filing system. Their first new case has no ending written in advance.",
      art: "cast",
    },
    m_end_clean: {
      title: "The Official Version",
      text: "The official report is praised for clarity. Every date and motive resolves. Later, Mara remembers a colored room the report insists never existed. On her palm, Eli's handwriting asks one question: WHO IS MISSING?",
      art: "world",
    },
  },
} satisfies Record<StoryGenre, Record<string, StorySceneDirection>>;

export function getStoryScene(storyId: StoryGenre, nodeId: string): StorySceneDirection {
  const scene = (STORY_SCENES[storyId] as Record<string, StorySceneDirection>)[nodeId];
  if (!scene) throw new Error(`Missing scene direction for ${storyId}:${nodeId}`);
  return scene;
}
