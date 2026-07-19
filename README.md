# Cathy's Memory Arcade

Two tokens. One memory. Infinite continues.

This is a living 1986-meets-AI memorial for Cathy and a working digital arcade for Chad Thompson-Smith's projects, engineering signals, and experiments. It begins with a memory of the Nickels & Dimes arcade at 710 E. Fillmore Street in Colorado Springs and is designed to grow as more memories return.

## Experience

- A two-token entrance built around the likely $2.50 admission for both Cathy and Chad
- A memory core that separates personal recollection from sourced historical context
- Project cabinets for mobile, infrastructure, systems, and applied AI work
- A signal reel refreshed daily by GitHub Actions from a small set of respected sources
- An optional procedural soundtrack created locally with the Web Audio API
- Keyboard, touch, reduced-motion, and screen-reader support

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

Historical context is documented in [`public/credits.html`](public/credits.html).
The generated hero direction and source disclosure are documented in [`ARTWORK.md`](ARTWORK.md).
