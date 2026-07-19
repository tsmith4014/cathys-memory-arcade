import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";

const requiredFiles = [
  "dist/index.html",
  "dist/credits.html",
  "dist/token.svg",
  "dist/art/cathy-arcade-hero.jpg",
  "dist/memory/cathy-chad-photobooth-program.jpg",
  "dist/memory/cathy-life-program.jpg",
  "dist/data/signals.json",
];

const familyImages = [
  "dist/memory/cathy-chad-photobooth-program.jpg",
  "dist/memory/cathy-life-program.jpg",
];

async function assertNoPrivateJpegMetadata(file) {
  const jpeg = await readFile(file);
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error(`${file} is not a JPEG`);

  for (let offset = 2; offset < jpeg.length;) {
    while (jpeg[offset] === 0xff) offset += 1;
    const marker = jpeg[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;

    const segmentLength = jpeg.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > jpeg.length) {
      throw new Error(`${file} contains an invalid JPEG segment`);
    }
    if (marker === 0xe1 || marker === 0xed || marker === 0xfe) {
      throw new Error(`${file} contains embedded EXIF, XMP, Photoshop, or comment metadata`);
    }
    offset += segmentLength;
  }
}

await Promise.all(requiredFiles.map((file) => access(file, constants.R_OK)));
await Promise.all(familyImages.map(assertNoPrivateJpegMetadata));

const html = await readFile("dist/index.html", "utf8");
const signals = JSON.parse(await readFile("dist/data/signals.json", "utf8"));

if (!html.includes("Cathy's Memory Arcade")) {
  throw new Error("production HTML is missing the memorial title");
}
const assetFiles = await readdir("dist/assets");
const entryScript = assetFiles.find((file) => file.startsWith("index-") && file.endsWith(".js"));
if (!entryScript) throw new Error("production bundle entry script is missing");
const javascript = await readFile(`dist/assets/${entryScript}`, "utf8");
for (const gameTitle of ["Skyline Smash", "Token Trail", "Dungeon Circuit", "Highrise Havoc", "Sunset Run", "Dragonfire Descent"]) {
  if (!javascript.includes(gameTitle)) throw new Error(`production bundle is missing ${gameTitle}`);
}
for (const requiredCopy of ["$5", "all-you-can-play admission", "Fillmore Drive", "Moxie's Midnight Run", "Mountain King '86"]) {
  if (!javascript.includes(requiredCopy)) throw new Error(`production bundle is missing required copy: ${requiredCopy}`);
}
for (const lifeDetail of ["Moxie, gardens, motorcycles", "Enid, Oklahoma", "A caring spirit"]) {
  if (!javascript.includes(lifeDetail)) throw new Error(`production bundle is missing Cathy detail: ${lifeDetail}`);
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
