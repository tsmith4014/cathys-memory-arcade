# Cathy's Memory Arcade

Two tokens. One memory. Infinite continues.

This is a living 1986-meets-AI memorial for Cathy and a real browser arcade. It begins with a memory of the Nickels & Dimes arcade at 710 E. Fillmore Street in Colorado Springs and is designed to grow as more memories and games arrive.

## Experience

- A sourced admission timeline: the $2.50 Fillmore prototype in 1986 and the $5 all-you-can-play Boardwalk arcade in 1987
- A two-token entrance ceremony with original coin, relay, marquee, and cabinet-wake sound design
- Six original, full-canvas games with enemies, scoring systems, win/loss states, keyboard controls, and mobile controls
- A six-chapter memory route with distinct save-slot art, metaphorical story keepsakes, local completion saves, and an unlockable epilogue
- A separate illustrated branching-fiction cabinet with recurring casts, persistent decisions, conditional callbacks, relationship state, inventory, page rewind, local saves, and multiple endings
- Local high scores and story progress that never leave the visitor's browser
- A memory core that separates personal recollection from sourced historical context
- The real Cathy-and-Chad photo-booth portraits and a life file sourced from her family-authorized program
- Six unique AI-assisted Colorado and fantasy game backplates plus three story environments and three original fictional cast paintings
- An after-hours signal booth refreshed daily by GitHub Actions from a small set of respected sources
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

All game systems, collision geometry, characters, and foreground graphics are code-native and original to this project. Six unique AI-assisted original environment backplates add atmosphere without reproducing commercial game art. No commercial sprites, cabinet art, characters, or sound recordings are included.

The jukebox contains five original procedural compositions and a Web Audio arrangement of Edvard Grieg's public-domain composition "In the Hall of the Mountain King." Fillmore After Dark uses a restrained lower lead and a single low last-light note. Moxie's Midnight Run takes 32 bars and more than 25 seconds to reach its first 12-bar, sub-heavy drop. Free Play Forever uses six formant call-and-response phrases for a deliberately artificial club voice. Garden Static's approved arrangement remains unchanged. No voice recording, music recording, or commercial game sound is included.

Every track exposes its named sections and current bar while it plays. The analyser drives the jukebox meter from the actual browser mix, record changes fade through the shared music bus, and the score ducks while a cabinet is open.

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

The six cabinet narratives are original metaphors inspired by known memories and the family-authorized program. They are not presented as additional facts about Cathy's life. The After Closing horror, action, and mystery stories are entirely fictional and are explicitly separated from the factual memory archive.

Period Nickels & Dimes photographs are available on Artie Romero's historical site, but are copyrighted. This project links to that source instead of copying the images. They should only be incorporated after explicit permission and with full attribution.

Historical context is documented in [`public/credits.html`](public/credits.html).
The generated hero direction and source disclosure are documented in [`ARTWORK.md`](ARTWORK.md).
