import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const requiredFiles = [
  "dist/index.html",
  "dist/credits.html",
  "dist/token.svg",
  "dist/art/cathy-arcade-hero.jpg",
  "dist/data/signals.json",
];

await Promise.all(requiredFiles.map((file) => access(file, constants.R_OK)));

const html = await readFile("dist/index.html", "utf8");
const signals = JSON.parse(await readFile("dist/data/signals.json", "utf8"));

if (!html.includes("Cathy's Memory Arcade")) {
  throw new Error("production HTML is missing the memorial title");
}
if (!Array.isArray(signals.signals) || signals.signals.length < 4) {
  throw new Error("signal reel must contain at least four tracks");
}
for (const signal of signals.signals) {
  if (!signal.track || !signal.title || !signal.url.startsWith("https://")) {
    throw new Error(`invalid signal payload: ${JSON.stringify(signal)}`);
  }
}

console.log(`Validated ${requiredFiles.length} artifacts and ${signals.signals.length} signal tracks.`);
