import { describe, expect, it } from "vitest";
import {
  ArcadeSoundscape,
  ENTRANCE_TOKEN_SOUND_DURATION,
  ENTRANCE_TOKEN_SOUND_EVENTS,
  getFillmoreStepDescriptor,
  getFreePlayVocalPhrase,
  getGardenStaticStepDescriptor,
  getOpenRoadStepDescriptor,
  getTrackScheduleDescriptor,
  playEntranceTokenSequence,
} from "./audio";

function fingerprint(value: unknown): string {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function texturesAt(bar: number, stepInBar = 0): string[] {
  return getOpenRoadStepDescriptor(bar * 16 + stepInBar).events.map((event) => event.texture);
}

describe("entrance token sequence", () => {
  it("describes two distinct coins, two mechanisms, and one finite acceptance tail", () => {
    const metalDrops = ENTRANCE_TOKEN_SOUND_EVENTS.filter((event) => event.kind === "metal-drop");
    const ratchets = ENTRANCE_TOKEN_SOUND_EVENTS.filter((event) => event.kind === "ratchet");
    const chutes = ENTRANCE_TOKEN_SOUND_EVENTS.filter((event) => event.kind === "chute");
    const chimes = ENTRANCE_TOKEN_SOUND_EVENTS.filter((event) => event.kind === "acceptance-chime");

    expect(metalDrops).toHaveLength(2);
    expect(metalDrops[0].frequencies).not.toEqual(metalDrops[1].frequencies);
    expect(metalDrops[0].pan).toBeLessThan(0);
    expect(metalDrops[1].pan).toBeGreaterThan(0);
    expect(ratchets).toHaveLength(2);
    expect(chutes).toHaveLength(2);
    expect(chimes).toHaveLength(1);
    expect(chimes[0].frequencies).toEqual([261.63, 329.63, 392, 523.25]);
    expect(Math.max(...ENTRANCE_TOKEN_SOUND_EVENTS.map((event) => event.at + event.duration))).toBeLessThan(ENTRANCE_TOKEN_SOUND_DURATION);
  });

  it("fails safely without Web Audio and leaves the jukebox stopped", async () => {
    const audioContext = window.AudioContext;
    const webkitAudioContext = (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: undefined });
    const jukebox = new ArcadeSoundscape();

    await expect(playEntranceTokenSequence()).resolves.toBe(false);
    expect(jukebox.getTransportStatus().state).toBe("stopped");
    expect(jukebox.getMeterLevels()).toEqual({ low: 0, mid: 0, high: 0, overall: 0 });

    Object.defineProperty(window, "AudioContext", { configurable: true, value: audioContext });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: webkitAudioContext });
  });
});

describe("Garden Static regression contract", () => {
  it("preserves the approved metadata and arrangement exactly", () => {
    const descriptor = getTrackScheduleDescriptor("garden-static");

    expect(descriptor).toEqual({
      track: {
        id: "garden-static",
        title: "Garden Static",
        style: "After-hours ambient synth",
        credit: "Original procedural composition",
        bpm: 88,
        mood: "Quiet / growing",
        layers: ["warm pad", "bell melody", "soft pulse", "summer static"],
      },
      scheduler: "generic-v1",
      formBars: 8,
      sections: [
        { id: "intro", label: "Intro", startBar: 0, endBar: 1, textures: ["chords", "bass", "light percussion"] },
        { id: "build", label: "Build", startBar: 2, endBar: 3, textures: ["bass", "lead", "drums"] },
        { id: "full-band", label: "Full band", startBar: 4, endBar: 5, textures: ["bass", "lead", "drums", "fills"] },
        { id: "breakdown", label: "Breakdown", startBar: 6, endBar: 6, textures: ["chords", "lead"] },
        { id: "finale", label: "Finale", startBar: 7, endBar: 7, textures: ["full band", "tom fill"] },
      ],
      arrangement: {
        swing: 0.04,
        bass: [36, null, null, null, 43, null, null, null, 45, null, null, null, 40, null, null, null, 36, null, null, 43, 45, null, null, 48, 43, null, null, 40, 38, null, null, null],
        lead: [72, null, null, 76, null, null, 79, null, 76, null, null, 72, null, 69, null, null, 67, null, null, 72, null, 76, null, null, 74, null, 72, null, 69, null, 67, null],
        chords: [[48, 52, 55, 59], [55, 59, 62, 67], [57, 60, 64, 69], [52, 55, 59, 64]],
        kick: [0, 16],
        snare: [8, 24],
        hats: [6, 14, 22, 30],
        wave: "sine",
        leadCutoff: 1800,
        leadGain: null,
        leadLift: null,
      },
    });
  });

  it("locks the complete eight-bar generic event form", () => {
    const form = Array.from({ length: 8 * 16 }, (_, step) => getGardenStaticStepDescriptor(step));
    expect(fingerprint(form)).toBe("24a7075b");
  });
});

describe("Open Road '86 form", () => {
  it("uses a dedicated 16-bar scheduler with six named sections", () => {
    const descriptor = getTrackScheduleDescriptor("open-road-86");
    expect(descriptor.scheduler).toBe("open-road-16-v1");
    expect(descriptor.formBars).toBe(16);
    expect(descriptor.sections.map((section) => [section.id, section.startBar, section.endBar])).toEqual([
      ["ignition", 0, 1],
      ["cruise", 2, 4],
      ["climb", 5, 6],
      ["chorus", 7, 10],
      ["overlook", 11, 12],
      ["homeward-chorus", 13, 15],
    ]);
  });

  it("changes orchestration and density across every section", () => {
    expect(getOpenRoadStepDescriptor(0).section).toBe("ignition");
    expect(texturesAt(0)).toEqual(expect.arrayContaining(["ignition", "motor-bass", "road-noise"]));

    expect(getOpenRoadStepDescriptor(3 * 16).section).toBe("cruise");
    expect(texturesAt(3)).toEqual(expect.arrayContaining(["motor-bass", "brass", "kick"]));

    expect(getOpenRoadStepDescriptor(5 * 16).section).toBe("climb");
    expect(texturesAt(5)).toEqual(expect.arrayContaining(["motor-bass", "brass", "kick"]));
    expect(texturesAt(6, 12)).toContain("road-tom");

    expect(getOpenRoadStepDescriptor(7 * 16).section).toBe("chorus");
    expect(texturesAt(7)).toEqual(expect.arrayContaining(["motor-bass", "brass", "kick"]));

    expect(getOpenRoadStepDescriptor(11 * 16).section).toBe("overlook");
    expect(texturesAt(11)).toEqual(expect.arrayContaining(["road-noise", "motor-bass", "brass"]));
    expect(texturesAt(11)).not.toEqual(expect.arrayContaining(["kick", "snare", "hat"]));

    expect(getOpenRoadStepDescriptor(13 * 16).section).toBe("homeward-chorus");
    expect(texturesAt(13).filter((texture) => texture === "brass")).toHaveLength(2);
    expect(texturesAt(15, 12)).toContain("road-tom");
  });

  it("does not collapse the six sections into the same event signature", () => {
    const sections = getTrackScheduleDescriptor("open-road-86").sections;
    const signatures = sections.map((section) => fingerprint(
      Array.from(
        { length: (section.endBar - section.startBar + 1) * 16 },
        (_, offset) => getOpenRoadStepDescriptor(section.startBar * 16 + offset),
      ),
    ));
    expect(new Set(signatures).size).toBe(signatures.length);
  });
});

describe("track-specific forms", () => {
  it("keeps refinements isolated from the Garden scheduler", () => {
    expect(getTrackScheduleDescriptor("fillmore-drive")).toMatchObject({ scheduler: "fillmore-12-v2", formBars: 12 });
    expect(getTrackScheduleDescriptor("moxies-midnight-run")).toMatchObject({ scheduler: "moxie-32-v3", formBars: 32 });
    expect(getTrackScheduleDescriptor("mountain-king-86")).toMatchObject({ scheduler: "mountain-king-12-v1", formBars: 12 });
    expect(getTrackScheduleDescriptor("free-play-forever")).toMatchObject({ scheduler: "free-play-16-v2", formBars: 16 });
    expect(getTrackScheduleDescriptor("garden-static")).toMatchObject({ scheduler: "generic-v1", formBars: 8 });
  });

  it("makes Moxie's drop wait for a real long-form build", () => {
    const descriptor = getTrackScheduleDescriptor("moxies-midnight-run");
    const drop = descriptor.sections.find((section) => section.id === "drop");
    expect(descriptor.sections.map((section) => [section.id, section.startBar, section.endBar])).toEqual([
      ["slow-bloom", 0, 7],
      ["movement", 8, 11],
      ["riser", 12, 15],
      ["drop", 16, 27],
      ["afterglow", 28, 29],
      ["return", 30, 31],
    ]);
    expect(drop).toBeDefined();
    expect((drop!.startBar * 4 * 60) / descriptor.track.bpm).toBeGreaterThan(25);
  });

  it("keeps Fillmore's late lead sparse and low instead of letting one note take over", () => {
    const form = Array.from({ length: 12 * 16 }, (_, step) => getFillmoreStepDescriptor(step));
    const lateLead = form
      .filter((descriptor) => descriptor.bar >= 8)
      .flatMap((descriptor) => descriptor.events)
      .filter((event) => event.texture === "lead");
    const lastLightLead = form
      .filter((descriptor) => descriptor.bar === 11)
      .flatMap((descriptor) => descriptor.events)
      .filter((event) => event.texture === "lead");

    expect(lateLead.length).toBeLessThanOrEqual(3);
    expect(lateLead.every((event) => (event.note ?? 0) <= 55)).toBe(true);
    expect(lastLightLead).toHaveLength(1);
    expect(lastLightLead[0]).toMatchObject({ note: 55, volume: 0.022 });
  });

  it("gives the synthetic-voice record six deliberate call-and-response phrases", () => {
    expect([4, 7, 8, 11, 13, 15].map((bar) => getFreePlayVocalPhrase(bar))).toEqual([
      ["oh", "ah"], ["ee", "oh"], ["ah", "oh"], ["oh", "ee"], ["ee", "ah"], ["oh", "ah"],
    ]);
    expect(getFreePlayVocalPhrase(3)).toBeNull();
  });
});
