# Cathy's Memory Arcade

Two tokens. One memory. Infinite continues.

This is a living 1986-meets-AI memorial for Cathy and a real browser arcade. It begins with a memory of the Nickels & Dimes arcade at 710 E. Fillmore Street in Colorado Springs and is designed to grow as more memories and games arrive.

## Experience

- A sourced admission timeline: the $2.50 Fillmore prototype in 1986 and the $5 all-you-can-play Boardwalk arcade in 1987
- Six original, full-canvas games with enemies, scoring systems, win/loss states, keyboard controls, and mobile controls
- Local high scores that never leave the visitor's browser
- A memory core that separates personal recollection from sourced historical context
- The real Cathy-and-Chad photo-booth portraits and a life file sourced from her family-authorized program
- A secondary builder's workshop for mobile, infrastructure, systems, and applied AI work
- A signal reel refreshed daily by GitHub Actions from a small set of respected sources
- A three-track browser jukebox, ambient arcade sound, and game effects synthesized locally with the Web Audio API
- Keyboard, touch, reduced-motion, and screen-reader support

## Playable floor

| Cabinet | Genre | Objective |
| --- | --- | --- |
| Skyline Smash | Destruction brawler | Clear five towers while defense drones attack |
| Token Trail | Three-zone platform run | Reach the sunrise terminal and collect 24 tokens |
| Dungeon Circuit | Top-down action dungeon | Clear three rooms, carry each key, defeat the Warden |
| Highrise Havoc | Facade-climbing destruction game | Break 54 windows and collapse four defended towers |
| Sunset Run | Long-form platform adventure | Find two keepsakes and reach the exit before sunset |
| Dragonfire Descent | Fog-of-war castle raid | Steal the hoard and retrace the lethal maze to escape |

All graphics and game systems are code-native and original to this project. No commercial sprites, cabinet art, characters, or sound recordings are included.

The jukebox contains two original procedural compositions and a new Web Audio arrangement of Edvard Grieg's public-domain composition "In the Hall of the Mountain King." No audio recording or commercial game sound is included.

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

Period Nickels & Dimes photographs are available on Artie Romero's historical site, but are copyrighted. This project links to that source instead of copying the images. They should only be incorporated after explicit permission and with full attribution.

Historical context is documented in [`public/credits.html`](public/credits.html).
The generated hero direction and source disclosure are documented in [`ARTWORK.md`](ARTWORK.md).
