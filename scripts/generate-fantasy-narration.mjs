import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE_PATH = resolve(ROOT, "src/data/signalStory.ts");
const OUTPUT_DIR = resolve(ROOT, "public/audio/fantasy");
const MANIFEST_PATH = resolve(OUTPUT_DIR, "manifest.json");
const REGION = "us-east-1";
const VOICE_ID = "Danielle";
const ENGINE = "generative";
const PRICE_PER_MILLION_USD = 30;
const MAX_AUTHORIZED_COST_USD = 5;
const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

const source = readFileSync(SOURCE_PATH, "utf8");
const chapters = Function(`"use strict"; return (${extractStoryArray(source)});`)();

const clips = chapters.flatMap((chapter) => [
  ...chapter.moments.map((moment) => ({
    id: `${chapter.id}-${moment.id}`,
    path: `audio/fantasy/${chapter.id}-${moment.id}.mp3`,
    text: moment.line,
  })),
  {
    id: `${chapter.id}-bridge`,
    path: `audio/fantasy/${chapter.id}-bridge.mp3`,
    text: `But ${chapter.bridge.but} Therefore ${chapter.bridge.therefore}`,
  },
]);
clips.push({
  id: "voice-check",
  path: "audio/fantasy/voice-check.mp3",
  text: "Narration is ready. Press play when you are ready to begin.",
});

const totalCharacters = clips.reduce((total, clip) => total + [...clip.text].length, 0);
const estimatedCostUsd = totalCharacters * PRICE_PER_MILLION_USD / 1_000_000;
if (estimatedCostUsd >= MAX_AUTHORIZED_COST_USD) {
  throw new Error(`Refusing to synthesize: estimated cost $${estimatedCostUsd.toFixed(2)} exceeds the authorized ceiling.`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
console.log(`${clips.length} clips, ${totalCharacters} characters, maximum estimated cost $${estimatedCostUsd.toFixed(4)}.`);

for (const clip of clips) {
  const outputPath = resolve(ROOT, "public", clip.path.replace(/^audio\//, "audio/"));
  if (!force && existsSync(outputPath) && statSync(outputPath).size > 1_000) continue;
  if (dryRun) {
    console.log(`[dry-run] ${clip.id}`);
    continue;
  }

  const result = spawnSync("aws", [
    "polly", "synthesize-speech",
    "--region", REGION,
    "--engine", ENGINE,
    "--voice-id", VOICE_ID,
    "--output-format", "mp3",
    "--sample-rate", "24000",
    "--text", clip.text,
    outputPath,
  ], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Polly failed for ${clip.id}: ${result.stderr.trim() || "unknown AWS CLI error"}`);
  }
  console.log(`generated ${clip.id}`);
}

const manifest = {
  engine: ENGINE,
  voice: VOICE_ID,
  region: REGION,
  sampleRate: 24_000,
  pricePerMillionCharactersUsd: PRICE_PER_MILLION_USD,
  pricingSource: "https://aws.amazon.com/polly/pricing/",
  totalCharacters,
  maximumEstimatedCostUsd: Number(estimatedCostUsd.toFixed(4)),
  clips: clips.map((clip) => ({
    id: clip.id,
    path: clip.path,
    characters: [...clip.text].length,
    textSha256: createHash("sha256").update(clip.text).digest("hex"),
  })),
};
if (!dryRun) writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

function extractStoryArray(contents) {
  const declaration = "export const FANTASY_STORY_CHAPTERS";
  const declarationIndex = contents.indexOf(declaration);
  const assignmentIndex = contents.indexOf("= [", declarationIndex);
  const start = assignmentIndex + 2;
  if (declarationIndex < 0 || assignmentIndex < 0) throw new Error("Could not find FANTASY_STORY_CHAPTERS.");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < contents.length; index += 1) {
    const character = contents[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "[") depth += 1;
    else if (character === "]") {
      depth -= 1;
      if (depth === 0) return contents.slice(start, index + 1);
    }
  }
  throw new Error("FANTASY_STORY_CHAPTERS did not contain a complete array.");
}
