# Cathy's Memory Arcade

Two tokens. One memory. Infinite continues.

This is a living 1986-meets-AI memorial for Cathy and a real browser arcade. It begins with a memory of the Nickels & Dimes arcade at 710 E. Fillmore Street in Colorado Springs and is designed to grow as more memories and games arrive.

## Experience

- A sourced admission timeline: the $2.50 Fillmore prototype in 1986 and the $5 all-you-can-play Boardwalk arcade in 1987
- A two-token entrance ceremony with original coin, relay, marquee, and cabinet-wake sound design
- Six original memorial games plus a separate Guest Cabinet, each full-canvas with enemies, scoring, win/loss states, keyboard controls, and mobile controls
- A six-chapter memory route with distinct save-slot art, metaphorical story keepsakes, local completion saves, and an unlockable epilogue
- A separate cinematic branching-fiction cabinet with scene-specific painted frames, in-character dialogue, environmental clues, animated atmosphere, a distraction-free artwork view, optional long reads at pivotal moments, persistent decisions, conditional callbacks, relationship state, inventory, page rewind, local saves, and multiple endings
- Local high scores and story progress that never leave the visitor's browser
- A memory core that separates personal recollection from sourced historical context
- The real Cathy-and-Chad photo-booth portraits and a life file sourced from her family-authorized program
- Seven unique AI-assisted game backplates, sixteen branching-story paintings, and sixteen paired Signal Theater chapter frames
- An after-hours signal booth refreshed daily by GitHub Actions from a small set of respected sources
- A Signal Theater with an original 24-second micro-film, an eight-chapter fantasy music serial, and an opt-in, attributed Instagram guest Reel
- A six-track adaptive browser score with a visible live transport, forms up to 32 bars, a patient rave build, synthetic formant voice, drums, sub-bass, pads, leads, echo, generated reverb, room ambience, and game effects synthesized locally with the Web Audio API
- Keyboard, touch, focus restoration, direct section links, reduced-motion, and screen-reader support

## Playable floor

| Cabinet | Genre | Objective |
| --- | --- | --- |
| Skyline Smash | Destruction brawler | Clear five towers while defense drones attack |
| Token Trail | Three-zone platform run | Reach the sunrise terminal and collect 24 tokens |
| Dungeon Circuit | Top-down action dungeon | Clear three rooms, carry each key, defeat the Warden |
| Highrise Havoc | Facade-climbing destruction game | Break 54 windows and collapse four defended towers |
| Sunset Run | Long-form platform adventure | Find two keepsakes and reach the exit before sunset |
| Dragonfire Descent | Tactical ranged citadel expedition | Read three guardian tells, answer with bolt, ward, or movement, then follow the dawn compass home |
| Dragon Crew: Pet Arena | Solo/couch co-op sky-arena defense | Split Pilot and Gunner controls, defend four crew stations through three waves, and close the breach |

The first six games form the memorial route. Dragon Crew is deliberately labeled as a Guest Cabinet and does not alter its six-chapter save file. It is an authorized, clean web adaptation of Chad's private native Desktop Pet Arena project: no private repository source, Codey reference artifact, launcher configuration, credential helper, or native resource ships in this public site.

All browser game systems, collision geometry, characters, and foreground graphics are code-native. Seven unique AI-assisted original environment backplates add atmosphere without reproducing commercial game art. No commercial sprites, cabinet art, characters, or sound recordings are included.

The jukebox contains five original procedural compositions and a Web Audio arrangement of Edvard Grieg's public-domain composition "In the Hall of the Mountain King." Fillmore After Dark uses a restrained lower lead and a single low last-light note. Moxie's Midnight Run takes 32 bars and more than 25 seconds to reach its first 12-bar, sub-heavy drop. Free Play Forever uses six formant call-and-response phrases for a deliberately artificial club voice. Garden Static's approved arrangement remains unchanged. No human voice recording, music recording, or commercial game sound is included.

Every track exposes its named sections and current bar while it plays. The analyser drives the jukebox meter from the actual browser mix, record changes fade through the shared music bus, and the score ducks while a cabinet is open.

Signal 86: The Room Remembers is an original 24-second browser micro-film and the prologue to **The Road Beyond Free Play: Season One: Cat & Runt**. The eight following chapter films use sixteen paired 1672-by-941 paintings, timed story beats, scene-specific camera and atmosphere choreography, and a richer adaptive score with recurring motifs, chord movement, bells, air, bass, and a deliberate dawn arc. Full-story mode carries one chapter into the next through audible key changes and six-second comic-book `BUT / THEREFORE` page turns. Captions sit in a dedicated banner below the artwork so the paintings remain unobstructed.

All 56 story lines and page turns, plus one voice-check clip, were prerecorded once with Amazon Polly's Danielle generative voice and ship as static MP3 files. The complete script is 4,922 characters; the maximum synthesis estimate at the published $30-per-million-character rate was $0.1477, below the authorized $5 ceiling. Replays use those local files and make no AWS request. Device speech remains a fallback when a browser cannot play the recordings.

The first family arc discovers Cat and Runt, then closes in the Six-Lamp Booth with four sibling signals intentionally unopened until their names, memories, and authorized references are ready.

Cat and Runt are fantasy characters made from family-authorized likeness references supplied by Chad. Their magical actions are original fiction, while Cat's connection with animals, plants, children, and nicknames and the real irony behind Runt's nickname are grounded in Chad's account. The serial's continuity, causal writing rules, and truth boundary live in [`STORY_BIBLE.md`](STORY_BIBLE.md).

The neighboring visiting Reel is not downloaded or bundled. It loads from Instagram only after a visitor asks for it, retains the original creator and music attribution, and can be closed or restarted inside the page. Restarting remounts Instagram's official public player; Instagram does not provide the host page with reliable playback-end or loop controls, and Instagram may still apply its own access or sign-in rules.

## Local development

```bash
npm install
npm run dev
```

Run the complete local quality gate:

```bash
npm run check
python3 -m unittest discover -s scripts -p "test_*.py" -v
npx playwright install chromium-headless-shell
npm run test:e2e
```

## Content boundaries

The MIT license covers source code only. Family photographs, memorial materials, and generated art remain all rights reserved by the Thompson-Smith family. Commercial game titles are referenced only as personal memories; no commercial character or cabinet artwork is reproduced.

The six memorial cabinet narratives are original metaphors inspired by known memories and the family-authorized program. They are not presented as additional facts about Cathy's life. The Guest Cabinet is separate from that route. The After Closing horror, action, and mystery stories are entirely fictional. The Signal Theater serial is also fantasy, but it uniquely uses the explicitly authorized Cat and Runt likenesses and the limited family details described above.

Period Nickels & Dimes photographs are available on Artie Romero's historical site, but are copyrighted. This project links to that source instead of copying the images. They should only be incorporated after explicit permission and with full attribution.

The visiting Instagram Reel and its commercial soundtrack remain the property of their respective creators and rights holders. They are excluded from this repository and its license; only Instagram's public embed URL is used.

Historical context is documented in [`public/credits.html`](public/credits.html).
The generated hero direction and source disclosure are documented in [`ARTWORK.md`](ARTWORK.md).
