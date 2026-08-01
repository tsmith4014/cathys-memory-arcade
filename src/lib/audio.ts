type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export type JukeboxTrackId =
  | "fillmore-drive"
  | "moxies-midnight-run"
  | "garden-static"
  | "open-road-86"
  | "mountain-king-86"
  | "free-play-forever";

export type JukeboxTrack = {
  id: JukeboxTrackId;
  title: string;
  style: string;
  credit: string;
  bpm: number;
  mood: string;
  layers: string[];
};

type Step = number | null;

type Arrangement = {
  swing: number;
  bass: Step[];
  lead: Step[];
  chords: number[][];
  kick: number[];
  snare: number[];
  hats: number[];
  wave: OscillatorType;
  leadCutoff: number;
  leadGain?: number;
  leadLift?: boolean;
  formBars?: number;
};

export type MeterLevels = {
  low: number;
  mid: number;
  high: number;
  overall: number;
};

export type TransportStatus = {
  state: "stopped" | "suspended" | "running";
  trackId: JukeboxTrackId;
  step: number;
  bar: number;
  formBars: number;
  section: string;
};

export type TrackFormSection = {
  id: string;
  label: string;
  startBar: number;
  endBar: number;
  textures: readonly string[];
};

export type TrackScheduleDescriptor = {
  track: JukeboxTrack;
  scheduler: string;
  formBars: number;
  sections: readonly TrackFormSection[];
  arrangement: {
    swing: number;
    bass: Step[];
    lead: Step[];
    chords: number[][];
    kick: number[];
    snare: number[];
    hats: number[];
    wave: OscillatorType;
    leadCutoff: number;
    leadGain: number | null;
    leadLift: boolean | null;
  };
};

export type EntranceTokenSoundEvent = {
  id: string;
  kind: "metal-drop" | "ratchet" | "chute" | "acceptance-chime";
  at: number;
  duration: number;
  pan: number;
  frequencies: readonly number[];
};

export const ENTRANCE_TOKEN_SOUND_DURATION = 2.2;

export const ENTRANCE_TOKEN_SOUND_EVENTS: readonly EntranceTokenSoundEvent[] = [
  { id: "token-one", kind: "metal-drop", at: 0.04, duration: 0.34, pan: -0.24, frequencies: [1840, 2730, 4210] },
  { id: "ratchet-one", kind: "ratchet", at: 0.2, duration: 0.24, pan: -0.12, frequencies: [1180, 910, 690, 520] },
  { id: "chute-one", kind: "chute", at: 0.36, duration: 0.28, pan: -0.08, frequencies: [760, 180] },
  { id: "token-two", kind: "metal-drop", at: 0.62, duration: 0.38, pan: 0.24, frequencies: [1510, 2390, 3670] },
  { id: "ratchet-two", kind: "ratchet", at: 0.79, duration: 0.26, pan: 0.12, frequencies: [1040, 830, 610, 430] },
  { id: "chute-two", kind: "chute", at: 0.96, duration: 0.3, pan: 0.08, frequencies: [680, 145] },
  { id: "free-play", kind: "acceptance-chime", at: 1.16, duration: 0.62, pan: 0, frequencies: [261.63, 329.63, 392, 523.25] },
];

export const JUKEBOX_TRACKS: JukeboxTrack[] = [
  {
    id: "fillmore-drive",
    title: "Fillmore After Dark",
    style: "Slow-burn neon road anthem",
    credit: "Original procedural composition",
    bpm: 104,
    mood: "Streetlights / last game",
    layers: ["analog bass", "glass lead", "night-drive drums", "arcade room"],
  },
  {
    id: "moxies-midnight-run",
    title: "Moxie's Midnight Run",
    style: "Long-build mountain rave",
    credit: "Original procedural composition",
    bpm: 142,
    mood: "Patient fuse / heavy drop",
    layers: ["slow-bloom pads", "rising pulse", "sub-bass drop", "warehouse hats"],
  },
  {
    id: "garden-static",
    title: "Garden Static",
    style: "After-hours ambient synth",
    credit: "Original procedural composition",
    bpm: 88,
    mood: "Quiet / growing",
    layers: ["warm pad", "bell melody", "soft pulse", "summer static"],
  },
  {
    id: "open-road-86",
    title: "Open Road '86",
    style: "Chrome-and-coral outrun",
    credit: "Original procedural composition",
    bpm: 118,
    mood: "Wild heart / horizon",
    layers: ["motor bass", "brass lead", "tom fill", "mountain air"],
  },
  {
    id: "mountain-king-86",
    title: "Mountain King '86",
    style: "Public-domain melody reimagined",
    credit: "Edvard Grieg composition / original browser arrangement",
    bpm: 126,
    mood: "Dungeon / rising danger",
    layers: ["pizzicato pulse", "8-bit melody", "march drums", "stone reverb"],
  },
  {
    id: "free-play-forever",
    title: "Free Play Forever",
    style: "Formant-voice after-hours rave",
    credit: "Original procedural composition and synthetic voice",
    bpm: 132,
    mood: "Club lights / one more continue",
    layers: ["acid pulse", "formant voice", "sub pressure", "laser percussion"],
  },
];

const trackById = new Map(JUKEBOX_TRACKS.map((track) => [track.id, track]));

const arrangements: Record<JukeboxTrackId, Arrangement> = {
  "fillmore-drive": {
    swing: 0.08,
    bass: [40, null, 40, null, 43, null, 47, null, 40, null, 40, 43, 38, null, 35, null, 40, null, 47, null, 48, null, 47, null, 43, null, 40, 38, 35, null, 38, null],
    lead: [59, null, null, null, 62, null, null, null, 64, null, null, 62, null, null, 57, null, null, null, 59, null, null, null, 64, null, 62, null, null, null, 57, null, null, null],
    chords: [[52, 55, 59], [55, 59, 62], [48, 52, 55], [50, 54, 57]],
    kick: [0, 8, 14, 16, 24, 30],
    snare: [4, 12, 20, 28],
    hats: [2, 6, 10, 14, 18, 22, 26, 30],
    wave: "triangle",
    leadCutoff: 1450,
    leadGain: 0.044,
    leadLift: false,
    formBars: 12,
  },
  "moxies-midnight-run": {
    swing: 0.13,
    bass: [45, null, 45, 52, 43, null, 43, 50, 41, null, 48, null, 40, 40, 43, null, 45, null, 52, 57, 43, null, 50, 55, 41, null, 48, 53, 40, null, 43, 47],
    lead: [69, 72, 76, 81, 67, 71, 74, 79, 65, 69, 72, 77, 64, 67, 71, 76, 81, 76, 72, 69, 79, 74, 71, 67, 77, 72, 69, 65, 76, 71, 67, 64],
    chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]],
    kick: [0, 6, 8, 14, 16, 22, 24, 29],
    snare: [4, 12, 20, 28],
    hats: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    wave: "square",
    leadCutoff: 3600,
    leadGain: 0.062,
    formBars: 32,
  },
  "garden-static": {
    swing: 0.04,
    bass: [36, null, null, null, 43, null, null, null, 45, null, null, null, 40, null, null, null, 36, null, null, 43, 45, null, null, 48, 43, null, null, 40, 38, null, null, null],
    lead: [72, null, null, 76, null, null, 79, null, 76, null, null, 72, null, 69, null, null, 67, null, null, 72, null, 76, null, null, 74, null, 72, null, 69, null, 67, null],
    chords: [[48, 52, 55, 59], [55, 59, 62, 67], [57, 60, 64, 69], [52, 55, 59, 64]],
    kick: [0, 16],
    snare: [8, 24],
    hats: [6, 14, 22, 30],
    wave: "sine",
    leadCutoff: 1800,
  },
  "open-road-86": {
    swing: 0.06,
    bass: [38, null, 38, 45, 50, null, 45, null, 36, null, 36, 43, 48, null, 43, null, 38, null, 45, 50, 53, null, 50, 45, 36, null, 43, 48, 50, 48, 45, 43],
    lead: [62, null, 65, 69, 74, null, 72, 69, 60, null, 64, 67, 72, null, 69, 67, 74, 72, 69, 65, 76, 74, 72, 69, 67, 65, 64, 62, 60, null, 62, 65],
    chords: [[50, 53, 57], [48, 52, 55], [46, 50, 53], [43, 47, 50]],
    kick: [0, 7, 8, 14, 16, 23, 24, 30],
    snare: [4, 12, 20, 28],
    hats: [2, 6, 10, 14, 18, 22, 26, 30],
    wave: "sawtooth",
    leadCutoff: 2600,
    formBars: 16,
  },
  "mountain-king-86": {
    swing: 0.02,
    bass: [38, null, 38, null, 38, null, 38, null, 40, null, 40, null, 40, null, 40, null, 41, null, 41, null, 41, null, 41, null, 43, null, 43, null, 45, null, 45, null],
    lead: [62, 64, 65, 67, 69, 65, 69, 70, 64, 66, 67, 69, 71, 67, 71, 72, 65, 67, 69, 70, 72, 69, 72, 74, 67, 69, 70, 72, 74, 70, 74, 75],
    chords: [[50, 53, 57], [52, 55, 59], [53, 57, 60], [55, 58, 62]],
    kick: [0, 8, 16, 24],
    snare: [4, 12, 20, 28],
    hats: [2, 6, 10, 14, 18, 22, 26, 30],
    wave: "square",
    leadCutoff: 3000,
    formBars: 12,
  },
  "free-play-forever": {
    swing: 0.035,
    bass: [36, null, 36, 43, 36, null, 48, null, 34, null, 34, 41, 34, null, 46, null, 36, null, 43, 48, 36, null, 48, 51, 34, null, 41, 46, 34, 36, 41, 43],
    lead: [72, null, 75, null, 79, null, 82, null, 70, null, 74, null, 77, null, 81, null, 84, 82, 79, 75, 82, 79, 75, 72, 81, 77, 74, 70, 75, null, 79, null],
    chords: [[48, 51, 55, 58], [46, 50, 53, 58], [43, 46, 51, 55], [41, 46, 50, 53]],
    kick: [0, 4, 8, 12, 16, 20, 24, 28],
    snare: [4, 12, 20, 28],
    hats: [2, 6, 10, 14, 18, 22, 26, 30],
    wave: "sawtooth",
    leadCutoff: 3100,
    leadGain: 0.052,
    formBars: 16,
  },
};

const GENERIC_SECTIONS: readonly TrackFormSection[] = [
  { id: "intro", label: "Intro", startBar: 0, endBar: 1, textures: ["chords", "bass", "light percussion"] },
  { id: "build", label: "Build", startBar: 2, endBar: 3, textures: ["bass", "lead", "drums"] },
  { id: "full-band", label: "Full band", startBar: 4, endBar: 5, textures: ["bass", "lead", "drums", "fills"] },
  { id: "breakdown", label: "Breakdown", startBar: 6, endBar: 6, textures: ["chords", "lead"] },
  { id: "finale", label: "Finale", startBar: 7, endBar: 7, textures: ["full band", "tom fill"] },
];

const OPEN_ROAD_SECTIONS: readonly TrackFormSection[] = [
  { id: "ignition", label: "Ignition", startBar: 0, endBar: 1, textures: ["ignition", "motor bass", "road noise"] },
  { id: "cruise", label: "Cruise", startBar: 2, endBar: 4, textures: ["motor bass", "brass", "cruise drums", "road noise"] },
  { id: "climb", label: "Mountain climb", startBar: 5, endBar: 6, textures: ["driving motor bass", "rising brass", "stereo toms"] },
  { id: "chorus", label: "Open-road chorus", startBar: 7, endBar: 10, textures: ["wide brass", "motor bass", "full drums", "mountain air"] },
  { id: "overlook", label: "Quiet overlook", startBar: 11, endBar: 12, textures: ["low motor pulse", "soft brass", "mountain air"] },
  { id: "homeward-chorus", label: "Homeward chorus", startBar: 13, endBar: 15, textures: ["octave brass", "motor bass", "full drums", "homeward toms"] },
];

const MOXIE_SECTIONS: readonly TrackFormSection[] = [
  { id: "slow-bloom", label: "Slow bloom", startBar: 0, endBar: 7, textures: ["pads", "low pulse"] },
  { id: "movement", label: "Movement", startBar: 8, endBar: 11, textures: ["bass", "half-time drums"] },
  { id: "riser", label: "Long riser", startBar: 12, endBar: 15, textures: ["riser", "drums", "pre-drop vacuum"] },
  { id: "drop", label: "Bass drop", startBar: 16, endBar: 27, textures: ["sub bass", "lead", "warehouse drums"] },
  { id: "afterglow", label: "Afterglow", startBar: 28, endBar: 29, textures: ["pads", "low pulse"] },
  { id: "return", label: "Return", startBar: 30, endBar: 31, textures: ["bass", "drums", "riser"] },
];

const MOUNTAIN_KING_SECTIONS: readonly TrackFormSection[] = [
  { id: "stalking", label: "Stalking", startBar: 0, endBar: 2, textures: ["pizzicato pulse", "sparse melody"] },
  { id: "march", label: "March", startBar: 3, endBar: 5, textures: ["melody", "march drums"] },
  { id: "chase", label: "Chase", startBar: 6, endBar: 8, textures: ["dense melody", "rising bass", "drums"] },
  { id: "stone-breath", label: "Stone breath", startBar: 9, endBar: 9, textures: ["chord", "stone reverb"] },
  { id: "climax", label: "Climax", startBar: 10, endBar: 11, textures: ["octave melody", "march drums", "toms"] },
];

const FREE_PLAY_SECTIONS: readonly TrackFormSection[] = [
  { id: "doors-open", label: "Doors open", startBar: 0, endBar: 3, textures: ["pads", "acid pulse"] },
  { id: "call", label: "Synthetic call", startBar: 4, endBar: 7, textures: ["formant voice", "drums"] },
  { id: "drop", label: "Free-play drop", startBar: 8, endBar: 13, textures: ["sub pressure", "laser percussion", "formant voice"] },
  { id: "breath", label: "One breath", startBar: 14, endBar: 14, textures: ["pads"] },
  { id: "continue", label: "Continue", startBar: 15, endBar: 15, textures: ["riser", "synthetic voice"] },
];

const FILLMORE_SECTIONS: readonly TrackFormSection[] = [
  ...GENERIC_SECTIONS,
  { id: "late-drive", label: "Late drive", startBar: 8, endBar: 10, textures: ["analog bass", "restrained lead", "night air"] },
  { id: "last-light", label: "Last light", startBar: 11, endBar: 11, textures: ["low lead", "tom fill", "night air"] },
];

const OPEN_ROAD_CHORD_VOLUMES: Readonly<Record<string, number>> = {
  ignition: 0.022,
  cruise: 0.03,
  climb: 0.033,
  chorus: 0.04,
  overlook: 0.021,
  "homeward-chorus": 0.043,
};

const FREE_PLAY_VOWEL_PHRASES: Readonly<Record<number, readonly ["ah" | "oh" | "ee", "ah" | "oh" | "ee"]>> = {
  4: ["oh", "ah"],
  7: ["ee", "oh"],
  8: ["ah", "oh"],
  11: ["oh", "ee"],
  13: ["ee", "ah"],
  15: ["oh", "ah"],
};

export function getFreePlayVocalPhrase(bar: number): readonly ["ah" | "oh" | "ee", "ah" | "oh" | "ee"] | null {
  return FREE_PLAY_VOWEL_PHRASES[bar] ?? null;
}

function formSectionsFor(trackId: JukeboxTrackId): readonly TrackFormSection[] {
  if (trackId === "open-road-86") return OPEN_ROAD_SECTIONS;
  if (trackId === "moxies-midnight-run") return MOXIE_SECTIONS;
  if (trackId === "mountain-king-86") return MOUNTAIN_KING_SECTIONS;
  if (trackId === "free-play-forever") return FREE_PLAY_SECTIONS;
  if (trackId === "fillmore-drive") return FILLMORE_SECTIONS;
  return GENERIC_SECTIONS;
}

function sectionAt(trackId: JukeboxTrackId, bar: number): TrackFormSection {
  const sections = formSectionsFor(trackId);
  return sections.find((section) => bar >= section.startBar && bar <= section.endBar) ?? sections[sections.length - 1];
}

export function getTrackScheduleDescriptor(trackId: JukeboxTrackId): TrackScheduleDescriptor {
  const track = trackById.get(trackId) ?? JUKEBOX_TRACKS[0];
  const arrangement = arrangements[trackId];
  const scheduler = trackId === "open-road-86"
    ? "open-road-16-v1"
    : trackId === "moxies-midnight-run"
      ? "moxie-32-v3"
      : trackId === "mountain-king-86"
        ? "mountain-king-12-v1"
        : trackId === "free-play-forever"
          ? "free-play-16-v2"
          : trackId === "fillmore-drive"
            ? "fillmore-12-v2"
            : "generic-v1";

  return {
    track: { ...track, layers: [...track.layers] },
    scheduler,
    formBars: arrangement.formBars ?? 8,
    sections: formSectionsFor(trackId).map((section) => ({ ...section, textures: [...section.textures] })),
    arrangement: {
      swing: arrangement.swing,
      bass: [...arrangement.bass],
      lead: [...arrangement.lead],
      chords: arrangement.chords.map((chord) => [...chord]),
      kick: [...arrangement.kick],
      snare: [...arrangement.snare],
      hats: [...arrangement.hats],
      wave: arrangement.wave,
      leadCutoff: arrangement.leadCutoff,
      leadGain: arrangement.leadGain ?? null,
      leadLift: arrangement.leadLift ?? null,
    },
  };
}

export type TrackStepEvent = {
  texture: "chord" | "bass" | "lead" | "kick" | "snare" | "hat" | "tom" | "ignition" | "motor-bass" | "brass" | "road-noise" | "road-tom";
  note?: number;
  notes?: readonly number[];
  durationSteps?: number;
  volume?: number;
  pan?: number;
  open?: boolean;
  frequency?: number;
};

export type TrackStepDescriptor = {
  trackId: JukeboxTrackId;
  bar: number;
  stepInBar: number;
  section: string;
  events: readonly TrackStepEvent[];
};

function describeGenericStep(trackId: JukeboxTrackId, absoluteStep: number, arrangement: Arrangement): TrackStepDescriptor {
  const patternStep = absoluteStep % 32;
  const formBars = arrangement.formBars ?? 8;
  const bar = Math.floor(absoluteStep / 16) % formBars;
  const stepInBar = absoluteStep % 16;
  const phraseBuild = bar >= 2;
  const fullBand = bar >= 4;
  const breakdown = bar === 6;
  const bassNote = arrangement.bass[patternStep];
  const leadNote = arrangement.lead[patternStep];
  const events: TrackStepEvent[] = [];

  if (patternStep % 16 === 0) {
    events.push({
      texture: "chord",
      notes: arrangement.chords[Math.floor(absoluteStep / 16) % arrangement.chords.length],
      durationSteps: 14,
      volume: breakdown ? 0.026 : 0.038,
    });
  }
  if (bassNote !== null && !breakdown) events.push({ texture: "bass", note: bassNote, durationSteps: 1.7 });
  if (leadNote !== null && phraseBuild && (!breakdown || patternStep % 4 === 0)) {
    const lift = arrangement.leadLift !== false && fullBand && patternStep % 8 === 6 ? 12 : 0;
    events.push({ texture: "lead", note: leadNote + lift, durationSteps: 0.86, pan: 0.2 });
  }
  if (arrangement.leadLift !== false && fullBand && patternStep % 16 === 15) {
    events.push({ texture: "lead", note: arrangement.lead[(patternStep + 1) % 32] ?? 72, durationSteps: 1.8, pan: -0.35 });
  }
  if (arrangement.kick.includes(patternStep) && !breakdown) events.push({ texture: "kick", volume: fullBand ? 0.19 : 0.15 });
  if (arrangement.snare.includes(patternStep) && phraseBuild) events.push({ texture: "snare", volume: fullBand ? 0.1 : 0.075 });
  if (arrangement.hats.includes(patternStep) && (bar > 0 || patternStep % 4 === 2)) {
    events.push({ texture: "hat", volume: fullBand ? 0.038 : 0.027, open: patternStep % 8 === 6 });
  }
  if (bar === formBars - 1 && patternStep >= 28) {
    events.push({ texture: "tom", frequency: 62 - (patternStep - 28) * 7, volume: 0.07 });
  }

  return { trackId, bar, stepInBar, section: sectionAt(trackId, bar).id, events };
}

export function getGardenStaticStepDescriptor(absoluteStep: number): TrackStepDescriptor {
  return describeGenericStep("garden-static", absoluteStep, arrangements["garden-static"]);
}

export function getFillmoreStepDescriptor(absoluteStep: number): TrackStepDescriptor {
  const trackId: JukeboxTrackId = "fillmore-drive";
  const arrangement = arrangements[trackId];
  const base = describeGenericStep(trackId, absoluteStep, arrangement);
  const bar = base.bar;
  const stepInBar = base.stepInBar;
  const events = base.events
    .filter((event) => {
      if (event.texture !== "lead") return true;
      if (bar === 11) return false;
      if (bar >= 8) return stepInBar === 0;
      if (bar === 6) return stepInBar % 8 === 0;
      return [0, 8, 14].includes(stepInBar);
    })
    .map((event) => event.texture === "lead" && bar >= 8 && event.note !== undefined
      ? { ...event, note: event.note - 12, volume: 0.024 }
      : event);

  if (stepInBar === 0 && [0, 4, 8, 11].includes(bar)) {
    events.push({
      texture: "road-noise",
      durationSteps: 14,
      volume: bar === 11 ? 0.01 : 0.006,
      pan: bar % 2 === 0 ? -0.22 : 0.22,
    });
  }
  if (bar === 11 && stepInBar === 8) {
    events.push({ texture: "lead", note: 55, durationSteps: 3.2, volume: 0.022, pan: -0.16 });
  }

  return { ...base, events };
}

export function getOpenRoadStepDescriptor(absoluteStep: number): TrackStepDescriptor {
  const trackId: JukeboxTrackId = "open-road-86";
  const arrangement = arrangements[trackId];
  const patternStep = absoluteStep % 32;
  const bar = Math.floor(absoluteStep / 16) % 16;
  const stepInBar = absoluteStep % 16;
  const section = sectionAt(trackId, bar).id;
  const bassNote = arrangement.bass[patternStep];
  const leadNote = arrangement.lead[patternStep];
  const events: TrackStepEvent[] = [];
  if (stepInBar === 0) {
    events.push({
      texture: "chord",
      notes: arrangement.chords[bar % arrangement.chords.length],
      durationSteps: section === "overlook" ? 15 : 14,
      volume: OPEN_ROAD_CHORD_VOLUMES[section],
    });
    events.push({
      texture: "road-noise",
      durationSteps: 15,
      volume: section === "overlook" ? 0.018 : section === "ignition" ? 0.014 : 0.009,
      pan: bar % 2 === 0 ? -0.3 : 0.3,
    });
    if (bar === 0) events.push({ texture: "ignition", durationSteps: 13, volume: 0.065 });
  }

  if (section === "ignition") {
    if (stepInBar === 0) events.push({ texture: "motor-bass", note: (bassNote ?? 38) - 12, durationSteps: 6.5, volume: 0.058 });
    if (bar === 1 && [0, 8].includes(stepInBar)) events.push({ texture: "kick", volume: 0.105 });
    if (bar === 1 && [6, 14].includes(stepInBar)) events.push({ texture: "hat", volume: 0.018, open: stepInBar === 14 });
  } else if (section === "cruise") {
    if (bassNote !== null && stepInBar % 2 === 0) events.push({ texture: "motor-bass", note: bassNote, durationSteps: 1.75, volume: 0.072 });
    if (leadNote !== null && stepInBar % 4 === 0) events.push({ texture: "brass", note: leadNote, durationSteps: 1.15, volume: 0.041, pan: bar % 2 === 0 ? -0.18 : 0.18 });
    if ([0, 8].includes(stepInBar)) events.push({ texture: "kick", volume: 0.14 });
    if ([4, 12].includes(stepInBar)) events.push({ texture: "snare", volume: 0.072 });
    if (stepInBar % 2 === 0) events.push({ texture: "hat", volume: 0.022, open: stepInBar === 14 });
  } else if (section === "climb") {
    if (bassNote !== null) events.push({ texture: "motor-bass", note: bassNote, durationSteps: 1.5, volume: 0.082 });
    if (leadNote !== null && (stepInBar % 2 === 0 || bar === 6)) events.push({ texture: "brass", note: leadNote, durationSteps: 0.92, volume: 0.048, pan: stepInBar < 8 ? -0.22 : 0.22 });
    if ([0, 6, 8, 14].includes(stepInBar)) events.push({ texture: "kick", volume: 0.17 });
    if ([4, 12].includes(stepInBar)) events.push({ texture: "snare", volume: 0.082 });
    if (stepInBar % 2 === 0) events.push({ texture: "hat", volume: 0.029, open: stepInBar === 14 });
    if (bar === 6 && stepInBar >= 12) events.push({ texture: "road-tom", frequency: 128 - (stepInBar - 12) * 19, volume: 0.083, pan: stepInBar % 2 === 0 ? -0.35 : 0.35 });
  } else if (section === "chorus" || section === "homeward-chorus") {
    const homeward = section === "homeward-chorus";
    if (bassNote !== null) events.push({ texture: "motor-bass", note: bassNote, durationSteps: 1.55, volume: homeward ? 0.094 : 0.088 });
    if (leadNote !== null && (stepInBar % 2 === 0 || bar % 2 === 1)) {
      events.push({ texture: "brass", note: leadNote, durationSteps: 0.9, volume: homeward ? 0.061 : 0.055, pan: stepInBar < 8 ? -0.28 : 0.28 });
    }
    if (homeward && leadNote !== null && [0, 8].includes(stepInBar)) {
      events.push({ texture: "brass", note: leadNote + 12, durationSteps: 1.5, volume: 0.034, pan: stepInBar === 0 ? 0.34 : -0.34 });
    }
    if (stepInBar % 4 === 0) events.push({ texture: "kick", volume: homeward ? 0.21 : 0.19 });
    if ([4, 12].includes(stepInBar)) events.push({ texture: "snare", volume: homeward ? 0.1 : 0.09 });
    if (stepInBar % 2 === 0) events.push({ texture: "hat", volume: homeward ? 0.038 : 0.034, open: stepInBar === 14 });
    if ((bar === 10 || bar === 15) && stepInBar >= 12) {
      events.push({ texture: "road-tom", frequency: 118 - (stepInBar - 12) * 18, volume: homeward ? 0.1 : 0.086, pan: stepInBar % 2 === 0 ? -0.38 : 0.38 });
    }
  } else {
    if (stepInBar === 0) events.push({ texture: "motor-bass", note: (bassNote ?? 38) - 12, durationSteps: 7, volume: 0.047 });
    if (leadNote !== null && [0, 8].includes(stepInBar)) events.push({ texture: "brass", note: leadNote - 12, durationSteps: 3.2, volume: 0.025, pan: stepInBar === 0 ? -0.14 : 0.14 });
    if (bar === 12 && stepInBar === 14) events.push({ texture: "hat", volume: 0.014, open: true });
  }

  return { trackId, bar, stepInBar, section, events };
}

export class ArcadeSoundscape {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private ambience: GainNode | null = null;
  private delay: DelayNode | null = null;
  private reverb: ConvolverNode | null = null;
  private analyser: AnalyserNode | null = null;
  private timer: number | null = null;
  private transitionTimer: number | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private ambienceSources: AudioScheduledSourceNode[] = [];
  private nextStepTime = 0;
  private step = 0;
  private trackId: JukeboxTrackId = "fillmore-drive";

  async start(trackId: JukeboxTrackId = this.trackId): Promise<boolean> {
    try {
      const changedTrack = trackId !== this.trackId;
      this.trackId = trackId;
      if (this.context) {
        await this.context.resume();
        if (changedTrack) this.transitionToCurrentTrack();
        else this.restartTransport();
        return true;
      }

      const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (!AudioContextClass) return false;

      this.context = new AudioContextClass();
      this.buildSignalPath();
      this.startAmbience();
      this.restartTransport();
      return true;
    } catch {
      await this.closeContext();
      return false;
    }
  }

  setTrack(trackId: JukeboxTrackId): void {
    if (!trackById.has(trackId) || trackId === this.trackId) return;
    this.trackId = trackId;
    if (this.context) this.transitionToCurrentTrack();
  }

  setDucked(ducked: boolean): void {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(ducked ? 0.2 : 0.62, now + 0.22);
  }

  getMeterLevels(): MeterLevels {
    if (!this.context || !this.analyser || this.context.state !== "running") {
      return { low: 0, mid: 0, high: 0, overall: 0 };
    }

    const bins = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(bins);
    const nyquist = this.context.sampleRate / 2;
    const averageRange = (minimum: number, maximum: number): number => {
      const start = Math.max(0, Math.floor(minimum / nyquist * bins.length));
      const end = Math.min(bins.length, Math.max(start + 1, Math.ceil(maximum / nyquist * bins.length)));
      let sum = 0;
      for (let index = start; index < end; index += 1) sum += bins[index];
      return sum / (end - start) / 255;
    };

    let total = 0;
    for (const value of bins) total += value;
    return {
      low: averageRange(35, 250),
      mid: averageRange(250, 2200),
      high: averageRange(2200, 9000),
      overall: total / bins.length / 255,
    };
  }

  getTransportStatus(): TransportStatus {
    const arrangement = arrangements[this.trackId];
    const formBars = arrangement.formBars ?? 8;
    const currentStep = Math.max(0, this.step - 1);
    const bar = Math.floor(currentStep / 16) % formBars;
    const state = !this.context || this.context.state === "closed"
      ? "stopped"
      : this.context.state === "running"
        ? "running"
        : "suspended";
    return {
      state,
      trackId: this.trackId,
      step: currentStep % (formBars * 16),
      bar,
      formBars,
      section: sectionAt(this.trackId, bar).id,
    };
  }

  async stop(): Promise<void> {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.transitionTimer !== null) {
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    if (this.context && this.master && this.context.state !== "closed") {
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), now);
      this.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      await wait(110);
    }
    await this.closeContext();
  }

  private async closeContext(): Promise<void> {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.transitionTimer !== null) {
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    for (const source of this.ambienceSources) {
      try {
        source.stop();
      } catch {
        // A source can already be stopped while the context is closing.
      }
    }
    this.ambienceSources = [];
    if (this.context && this.context.state !== "closed") {
      try {
        await this.context.close();
      } catch {
        // Closing is best-effort during browser teardown.
      }
    }
    this.context = null;
    this.master = null;
    this.music = null;
    this.ambience = null;
    this.delay = null;
    this.reverb = null;
    this.analyser = null;
    this.noiseBuffer = null;
    this.step = 0;
  }

  private buildSignalPath(): void {
    if (!this.context) return;

    const master = this.context.createGain();
    const compressor = this.context.createDynamicsCompressor();
    const music = this.context.createGain();
    const ambience = this.context.createGain();
    const delay = this.context.createDelay(1);
    const delayFeedback = this.context.createGain();
    const delayWet = this.context.createGain();
    const reverb = this.context.createConvolver();
    const reverbWet = this.context.createGain();
    const analyser = this.context.createAnalyser();

    master.gain.value = 0.62;
    music.gain.value = 0.7;
    ambience.gain.value = 0.028;
    compressor.threshold.value = -18;
    compressor.knee.value = 14;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.24;
    delay.delayTime.value = 0.285;
    delayFeedback.gain.value = 0.22;
    delayWet.gain.value = 0.17;
    reverb.buffer = this.createImpulse(1.75, 2.8);
    reverbWet.gain.value = 0.13;
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;

    music.connect(master);
    ambience.connect(master);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(delayWet);
    delayWet.connect(master);
    reverb.connect(reverbWet);
    reverbWet.connect(master);
    master.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(this.context.destination);

    this.master = master;
    this.music = music;
    this.ambience = ambience;
    this.delay = delay;
    this.reverb = reverb;
    this.analyser = analyser;
    this.noiseBuffer = this.createNoiseBuffer(2);
  }

  private transitionToCurrentTrack(): void {
    if (!this.context || !this.music) return;
    if (this.transitionTimer !== null) window.clearTimeout(this.transitionTimer);
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.step = 0;
    const now = this.context.currentTime;
    this.music.gain.cancelScheduledValues(now);
    this.music.gain.setValueAtTime(Math.max(0.0001, this.music.gain.value), now);
    this.music.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    this.transitionTimer = window.setTimeout(() => {
      this.transitionTimer = null;
      if (!this.context || !this.music) return;
      this.restartTransport();
      const restartTime = this.context.currentTime;
      this.music.gain.cancelScheduledValues(restartTime);
      this.music.gain.setValueAtTime(0.0001, restartTime);
      this.music.gain.exponentialRampToValueAtTime(0.7, restartTime + 0.32);
    }, 230);
  }

  private restartTransport(): void {
    if (!this.context) return;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.step = 0;
    this.nextStepTime = this.context.currentTime + 0.06;
    this.schedulerTick();
    this.timer = window.setInterval(() => this.schedulerTick(), 25);
  }

  private schedulerTick(): void {
    if (!this.context) return;
    const track = trackById.get(this.trackId) ?? JUKEBOX_TRACKS[0];
    const arrangement = arrangements[this.trackId];
    const baseStepDuration = 60 / track.bpm / 4;
    while (this.nextStepTime < this.context.currentTime + 0.14) {
      this.scheduleStep(this.nextStepTime, this.step, arrangement, baseStepDuration);
      const swing = this.step % 2 === 0 ? 1 + arrangement.swing : 1 - arrangement.swing;
      this.nextStepTime += baseStepDuration * swing;
      this.step += 1;
    }
  }

  private scheduleStep(when: number, absoluteStep: number, arrangement: Arrangement, stepDuration: number): void {
    if (this.trackId === "open-road-86") {
      this.scheduleOpenRoadStep(when, absoluteStep, stepDuration);
      return;
    }
    if (this.trackId === "moxies-midnight-run") {
      this.scheduleMoxieStep(when, absoluteStep, arrangement, stepDuration);
      return;
    }
    if (this.trackId === "mountain-king-86") {
      this.scheduleMountainKingStep(when, absoluteStep, arrangement, stepDuration);
      return;
    }
    if (this.trackId === "free-play-forever") {
      this.scheduleFreePlayStep(when, absoluteStep, arrangement, stepDuration);
      return;
    }
    if (this.trackId === "fillmore-drive") {
      this.scheduleFillmoreStep(when, absoluteStep, arrangement, stepDuration);
      return;
    }
    this.scheduleGenericStep(when, absoluteStep, arrangement, stepDuration);
  }

  private scheduleGenericStep(when: number, absoluteStep: number, arrangement: Arrangement, stepDuration: number): void {
    const descriptor = describeGenericStep(this.trackId, absoluteStep, arrangement);
    for (const event of descriptor.events) this.renderStepEvent(event, when, stepDuration, arrangement);
  }

  private renderStepEvent(event: TrackStepEvent, when: number, stepDuration: number, arrangement: Arrangement): void {
    const duration = stepDuration * (event.durationSteps ?? 1);
    if (event.texture === "chord" && event.notes) this.playChord([...event.notes], when, duration, event.volume ?? 0.038);
    else if (event.texture === "bass" && event.note !== undefined) this.playBass(event.note, when, duration);
    else if (event.texture === "lead" && event.note !== undefined) this.playLead(event.note, when, duration, arrangement, event.pan, event.volume);
    else if (event.texture === "kick") this.kick(when, event.volume ?? 0.15);
    else if (event.texture === "snare") this.snare(when, event.volume ?? 0.075);
    else if (event.texture === "hat") this.hat(when, event.volume ?? 0.027, event.open ?? false);
    else if (event.texture === "tom") this.tom(when, event.frequency ?? 72, event.volume ?? 0.07);
    else if (event.texture === "ignition") this.playIgnition(when, duration, event.volume ?? 0.06);
    else if (event.texture === "motor-bass" && event.note !== undefined) this.playMotorBass(event.note, when, duration, event.volume ?? 0.08);
    else if (event.texture === "brass" && event.note !== undefined) this.playBrassStack(event.note, when, duration, event.volume ?? 0.05, event.pan ?? 0);
    else if (event.texture === "road-noise") this.playRoadNoise(when, duration, event.volume ?? 0.01, event.pan ?? 0);
    else if (event.texture === "road-tom") this.playRoadTom(when, event.frequency ?? 90, event.volume ?? 0.08, event.pan ?? 0);
  }

  private scheduleOpenRoadStep(when: number, absoluteStep: number, stepDuration: number): void {
    const arrangement = arrangements["open-road-86"];
    const descriptor = getOpenRoadStepDescriptor(absoluteStep);
    for (const event of descriptor.events) this.renderStepEvent(event, when, stepDuration, arrangement);
  }

  private scheduleFillmoreStep(when: number, absoluteStep: number, arrangement: Arrangement, stepDuration: number): void {
    const descriptor = getFillmoreStepDescriptor(absoluteStep);
    for (const event of descriptor.events) this.renderStepEvent(event, when, stepDuration, arrangement);
  }

  private scheduleMoxieStep(when: number, absoluteStep: number, arrangement: Arrangement, stepDuration: number): void {
    const patternStep = absoluteStep % 32;
    const stepInBar = absoluteStep % 16;
    const bar = Math.floor(absoluteStep / 16) % 32;
    const bassNote = arrangement.bass[patternStep];
    const leadNote = arrangement.lead[patternStep];
    const chord = arrangement.chords[bar % arrangement.chords.length];

    if (stepInBar === 0) {
      const chordVolume = bar < 4 ? 0.034 : bar < 12 ? 0.026 : bar < 16 ? 0.022 : bar < 28 ? 0.038 : 0.032;
      this.playChord(chord, when, stepDuration * (bar === 15 ? 12.5 : 15), chordVolume);
    }

    if (bar < 4) {
      if (stepInBar === 0) this.playBass((bassNote ?? 45) - 12, when, stepDuration * 5);
      if (bar === 3 && stepInBar === 12) this.hat(when, 0.018, true);
      return;
    }

    if (bar < 8) {
      if (bassNote !== null && stepInBar % 4 === 0) this.playBass(bassNote - 12, when, stepDuration * 2.8);
      if (bar >= 6 && (stepInBar === 0 || stepInBar === 8)) this.kick(when, 0.1 + (bar - 6) * 0.015);
      if (bar === 7 && stepInBar % 4 === 2) this.hat(when, 0.019, false);
      return;
    }

    if (bar < 12) {
      if (bassNote !== null && patternStep % 2 === 0) this.playBass(bassNote - (bar === 8 ? 12 : 0), when, stepDuration * 1.8);
      if ([0, 8].includes(stepInBar)) this.kick(when, 0.145);
      if ([4, 12].includes(stepInBar)) this.snare(when, 0.065);
      if (stepInBar % 2 === 0) this.hat(when, 0.023, stepInBar === 14);
      return;
    }

    if (bar < 16) {
      if (bar === 15 && stepInBar >= 14) return;
      if (stepInBar === 0) this.playRiser(when, stepDuration * (bar === 15 ? 13 : 15), (bar - 11) / 4);
      if (bassNote !== null && stepInBar % 2 === 0) this.playBass(bassNote, when, stepDuration * 1.3);
      if ([0, 6, 8, 14].includes(stepInBar)) this.kick(when, 0.16 + (bar - 12) * 0.012);
      if ([4, 12].includes(stepInBar)) this.snare(when, 0.078);
      if (stepInBar % 2 === 0) this.hat(when, 0.028 + (bar - 12) * 0.004, stepInBar === 14);
      if (bar === 15 && stepInBar >= 12) this.tom(when, 105 - (stepInBar - 12) * 16, 0.08);
      return;
    }

    if (bar < 28) {
      if (bassNote !== null) this.playBass(bassNote, when, stepDuration * 1.55);
      if (leadNote !== null && (stepInBar % 2 === 0 || bar % 2 === 1)) this.playLead(leadNote, when, stepDuration * 0.78, arrangement, bar % 2 ? 0.28 : -0.28);
      if (stepInBar % 4 === 0) this.kick(when, 0.24);
      if (stepInBar === 0 || stepInBar === 8) this.subImpact(when, bar === 12 && stepInBar === 0 ? 0.21 : 0.18);
      if ([4, 12].includes(stepInBar)) this.snare(when, 0.11);
      if (stepInBar % 2 === 0) this.hat(when, 0.042, stepInBar === 14);
      if ((bar - 16) % 4 === 3 && stepInBar >= 12) this.tom(when, 88 - (stepInBar - 12) * 12, 0.075);
      return;
    }

    if (bar < 30) {
      if (stepInBar === 0) this.playBass((bassNote ?? 41) - 12, when, stepDuration * 5);
      if (bar === 29 && stepInBar >= 8 && stepInBar % 2 === 0) this.hat(when, 0.02 + (stepInBar - 8) * 0.003, false);
      return;
    }

    if (bassNote !== null && stepInBar % 2 === 0) this.playBass(bassNote, when, stepDuration * 1.45);
    if ([0, 8, 12].includes(stepInBar)) this.kick(when, 0.17);
    if ([4, 12].includes(stepInBar)) this.snare(when, 0.082);
    if (stepInBar % 2 === 0) this.hat(when, 0.032, stepInBar === 14);
    if (bar === 31 && stepInBar === 0) this.playRiser(when, stepDuration * 15, 1);
  }

  private scheduleMountainKingStep(when: number, absoluteStep: number, arrangement: Arrangement, stepDuration: number): void {
    const patternStep = absoluteStep % 32;
    const stepInBar = absoluteStep % 16;
    const bar = Math.floor(absoluteStep / 16) % 12;
    const bassNote = arrangement.bass[patternStep];
    const leadNote = arrangement.lead[patternStep];
    const stalking = bar < 3;
    const march = bar >= 3 && bar < 6;
    const chase = bar >= 6 && bar < 9;
    const breath = bar === 9;
    const climax = bar >= 10;

    if (stepInBar === 0) {
      const chord = arrangement.chords[bar % arrangement.chords.length];
      this.playChord(chord, when, stepDuration * (breath ? 15 : 13.5), breath ? 0.028 : 0.02 + bar * 0.0018);
    }
    if (bassNote !== null && !breath && (stalking ? stepInBar % 4 === 0 : march ? stepInBar % 2 === 0 : true)) {
      this.playBass(bassNote + (climax ? 12 : 0), when, stepDuration * (stalking ? 1.5 : 1.18));
    }
    if (leadNote !== null && !breath && (stalking ? stepInBar % 2 === 0 : true)) {
      const lift = climax && stepInBar >= 8 ? 12 : chase && stepInBar % 4 === 3 ? 12 : 0;
      this.playLead(leadNote + lift, when, stepDuration * (stalking ? 0.58 : 0.48), arrangement, stepInBar < 8 ? -0.2 : 0.2);
    }
    if (march && [0, 8].includes(stepInBar)) this.kick(when, 0.13);
    if (chase && [0, 6, 8, 14].includes(stepInBar)) this.kick(when, 0.16);
    if (climax && stepInBar % 4 === 0) this.kick(when, 0.19);
    if (!stalking && !breath && [4, 12].includes(stepInBar)) this.snare(when, climax ? 0.096 : 0.072);
    if ((march || chase || climax) && stepInBar % 2 === 0) this.hat(when, climax ? 0.036 : 0.026, stepInBar === 14);
    if (bar === 11 && stepInBar >= 12) this.tom(when, 132 - (stepInBar - 12) * 21, 0.087);
  }

  private scheduleFreePlayStep(when: number, absoluteStep: number, arrangement: Arrangement, stepDuration: number): void {
    const patternStep = absoluteStep % 32;
    const stepInBar = absoluteStep % 16;
    const bar = Math.floor(absoluteStep / 16) % 16;
    const bassNote = arrangement.bass[patternStep];
    const leadNote = arrangement.lead[patternStep];
    const fullDrop = bar >= 8 && bar < 14;

    if (stepInBar === 0) {
      const chord = arrangement.chords[bar % arrangement.chords.length];
      this.playChord(chord, when, stepDuration * 14, bar < 2 || bar === 14 ? 0.032 : 0.026);
    }
    if (bar >= 2 && bar !== 14 && bassNote !== null && (fullDrop || patternStep % 2 === 0)) {
      this.playBass(bassNote, when, stepDuration * (fullDrop ? 1.45 : 1.8));
    }
    if (bar >= 4 && bar !== 14 && stepInBar % 4 === 0) this.kick(when, fullDrop ? 0.23 : 0.15);
    if (bar >= 4 && bar !== 14 && [4, 12].includes(stepInBar)) this.snare(when, fullDrop ? 0.105 : 0.074);
    if (bar >= 3 && bar !== 14 && stepInBar % 2 === 0) this.hat(when, fullDrop ? 0.04 : 0.026, stepInBar === 14);
    if (fullDrop && leadNote !== null && stepInBar % 2 === 0) this.playLead(leadNote, when, stepDuration * 0.72, arrangement, stepInBar < 8 ? -0.32 : 0.32);
    if (fullDrop && (stepInBar === 0 || stepInBar === 8)) this.subImpact(when, 0.16);
    if ([4, 7, 8, 11, 13, 15].includes(bar) && (stepInBar === 0 || stepInBar === 8)) {
      const phrase = getFreePlayVocalPhrase(bar);
      if (!phrase) return;
      const vowel = phrase[stepInBar === 0 ? 0 : 1];
      this.playVocalConsonant(when, fullDrop ? 0.034 : 0.024, stepInBar === 0 ? -0.18 : 0.18);
      this.playFormantVoice(when + 0.026, vowel, stepDuration * (stepInBar === 0 ? 5.6 : 3.2), 0.07 + (fullDrop ? 0.018 : 0));
    }
    if (fullDrop && [2, 6, 10, 14].includes(stepInBar)) this.playLaserTick(when, stepInBar < 8 ? -0.26 : 0.26);
    if ((bar === 7 || bar === 15) && stepInBar === 0) this.playRiser(when, stepDuration * 15, 1);
  }

  private playIgnition(when: number, duration: number, volume: number): void {
    if (!this.context || !this.music) return;
    const motor = this.context.createOscillator();
    const harmonic = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const end = when + Math.max(0.4, duration);
    const catchTime = when + duration * 0.18;
    motor.type = "sawtooth";
    motor.frequency.setValueAtTime(31, when);
    motor.frequency.exponentialRampToValueAtTime(58, catchTime);
    motor.frequency.linearRampToValueAtTime(52, end);
    harmonic.type = "square";
    harmonic.frequency.setValueAtTime(62, when);
    harmonic.frequency.exponentialRampToValueAtTime(108, catchTime);
    harmonic.frequency.linearRampToValueAtTime(104, end);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, when);
    filter.frequency.exponentialRampToValueAtTime(720, when + duration * 0.42);
    filter.frequency.exponentialRampToValueAtTime(340, end);
    filter.Q.value = 3.2;
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + 0.09);
    envelope.gain.setValueAtTime(volume * 0.72, when + duration * 0.62);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    motor.connect(filter);
    harmonic.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.music);
    motor.start(when);
    harmonic.start(when);
    motor.stop(end + 0.03);
    harmonic.stop(end + 0.03);
  }

  private playMotorBass(note: number, when: number, duration: number, volume: number): void {
    if (!this.context || !this.music) return;
    const primary = this.context.createOscillator();
    const cylinder = this.context.createOscillator();
    const sub = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const end = when + Math.max(0.06, duration);
    const frequency = midiToFrequency(note);
    primary.type = "sawtooth";
    primary.frequency.setValueAtTime(frequency, when);
    primary.detune.value = -5;
    cylinder.type = "square";
    cylinder.frequency.setValueAtTime(frequency, when);
    cylinder.detune.value = 5;
    sub.type = "sine";
    sub.frequency.setValueAtTime(frequency / 2, when);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(780, when);
    filter.frequency.exponentialRampToValueAtTime(260, end);
    filter.Q.value = 3.8;
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    panner.pan.value = -0.08;
    primary.connect(filter);
    cylinder.connect(filter);
    sub.connect(envelope);
    filter.connect(envelope);
    envelope.connect(panner);
    panner.connect(this.music);
    primary.start(when);
    cylinder.start(when);
    sub.start(when);
    primary.stop(end + 0.03);
    cylinder.stop(end + 0.03);
    sub.stop(end + 0.03);
  }

  private playBrassStack(note: number, when: number, duration: number, volume: number, pan: number): void {
    if (!this.context || !this.music) return;
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const end = when + Math.max(0.08, duration);
    const frequency = midiToFrequency(note);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(620, when);
    filter.frequency.exponentialRampToValueAtTime(2600, when + Math.min(0.11, duration * 0.28));
    filter.frequency.exponentialRampToValueAtTime(760, end);
    filter.Q.value = 2.7;
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + Math.min(0.045, duration * 0.24));
    envelope.gain.setValueAtTime(volume * 0.72, when + duration * 0.58);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    panner.pan.value = pan;
    filter.connect(envelope);
    envelope.connect(panner);
    panner.connect(this.music);
    if (this.delay) panner.connect(this.delay);
    if (this.reverb) panner.connect(this.reverb);
    [-9, 0, 8].forEach((detune, index) => {
      const oscillator = this.context!.createOscillator();
      oscillator.type = index === 1 ? "square" : "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, when);
      oscillator.detune.value = detune;
      oscillator.connect(filter);
      oscillator.start(when);
      oscillator.stop(end + 0.03);
    });
  }

  private playRoadNoise(when: number, duration: number, volume: number, pan: number): void {
    if (!this.context || !this.music || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const bandpass = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const end = when + Math.max(0.08, duration);
    source.buffer = this.noiseBuffer;
    source.loop = true;
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(420, when);
    bandpass.frequency.linearRampToValueAtTime(980, end);
    bandpass.Q.value = 0.55;
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + Math.min(0.12, duration * 0.25));
    envelope.gain.setValueAtTime(volume * 0.78, when + duration * 0.65);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    panner.pan.setValueAtTime(pan, when);
    panner.pan.linearRampToValueAtTime(-pan, end);
    source.connect(bandpass);
    bandpass.connect(envelope);
    envelope.connect(panner);
    panner.connect(this.music);
    if (this.reverb) panner.connect(this.reverb);
    source.start(when, (when * 0.37) % 1.7);
    source.stop(end + 0.03);
  }

  private playRoadTom(when: number, frequency: number, volume: number, pan: number): void {
    if (!this.context || !this.music) return;
    const body = this.context.createOscillator();
    const click = this.context.createOscillator();
    const envelope = this.context.createGain();
    const clickEnvelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    body.type = "triangle";
    body.frequency.setValueAtTime(frequency, when);
    body.frequency.exponentialRampToValueAtTime(Math.max(36, frequency * 0.48), when + 0.19);
    click.type = "square";
    click.frequency.setValueAtTime(frequency * 3.4, when);
    click.frequency.exponentialRampToValueAtTime(frequency, when + 0.045);
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    clickEnvelope.gain.setValueAtTime(volume * 0.28, when);
    clickEnvelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    panner.pan.value = pan;
    body.connect(envelope);
    click.connect(clickEnvelope);
    envelope.connect(panner);
    clickEnvelope.connect(panner);
    panner.connect(this.music);
    if (this.reverb) panner.connect(this.reverb);
    body.start(when);
    click.start(when);
    body.stop(when + 0.24);
    click.stop(when + 0.07);
  }

  private playVocalConsonant(when: number, volume: number, pan: number): void {
    if (!this.context || !this.music || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    source.buffer = this.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = 4100;
    filter.Q.value = 1.6;
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.065);
    panner.pan.value = pan;
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(panner);
    panner.connect(this.music);
    source.start(when, (when * 0.19) % 1.8, 0.07);
  }

  private playLaserTick(when: number, pan: number): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(1850, when);
    oscillator.frequency.exponentialRampToValueAtTime(240, when + 0.085);
    envelope.gain.setValueAtTime(0.031, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
    panner.pan.value = pan;
    oscillator.connect(envelope);
    envelope.connect(panner);
    panner.connect(this.music);
    if (this.delay) panner.connect(this.delay);
    oscillator.start(when);
    oscillator.stop(when + 0.1);
  }

  private playRiser(when: number, duration: number, intensity: number): void {
    if (!this.context || !this.music || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const end = when + duration;
    source.buffer = this.noiseBuffer;
    source.loop = true;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(280 + intensity * 180, when);
    filter.frequency.exponentialRampToValueAtTime(4200 + intensity * 2600, end);
    filter.Q.setValueAtTime(0.7, when);
    filter.Q.linearRampToValueAtTime(4.2, end);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(0.026 + intensity * 0.03, when + duration * 0.72);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.music);
    if (this.reverb) envelope.connect(this.reverb);
    source.start(when, Math.random());
    source.stop(end + 0.02);
  }

  private subImpact(when: number, volume: number): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(72, when);
    oscillator.frequency.exponentialRampToValueAtTime(28, when + 0.42);
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.52);
    oscillator.connect(envelope);
    envelope.connect(this.music);
    oscillator.start(when);
    oscillator.stop(when + 0.54);
  }

  private playFormantVoice(when: number, vowel: "ah" | "oh" | "ee", duration: number, volume: number): void {
    if (!this.context || !this.music) return;
    const formants = {
      ah: [760, 1160, 2850],
      oh: [480, 820, 2550],
      ee: [310, 2250, 3020],
    }[vowel];
    const oscillator = this.context.createOscillator();
    const vibrato = this.context.createOscillator();
    const vibratoDepth = this.context.createGain();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const end = when + Math.max(0.18, duration);

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(vowel === "oh" ? 92.5 : 110, when);
    oscillator.frequency.linearRampToValueAtTime(vowel === "ee" ? 123.47 : 104, end);
    vibrato.type = "sine";
    vibrato.frequency.value = 5.2;
    vibratoDepth.gain.value = 4.8;
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(oscillator.frequency);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + Math.min(0.08, duration * 0.18));
    envelope.gain.setValueAtTime(volume * 0.72, when + duration * 0.58);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    panner.pan.setValueAtTime(vowel === "ah" ? -0.18 : vowel === "ee" ? 0.2 : 0, when);

    formants.forEach((frequency, index) => {
      const filter = this.context!.createBiquadFilter();
      const bandGain = this.context!.createGain();
      filter.type = "bandpass";
      filter.frequency.value = frequency;
      filter.Q.value = 7 + index * 2;
      bandGain.gain.value = [0.95, 0.5, 0.22][index];
      oscillator.connect(filter);
      filter.connect(bandGain);
      bandGain.connect(envelope);
    });
    envelope.connect(panner);
    panner.connect(this.music);
    if (this.delay) panner.connect(this.delay);
    if (this.reverb) panner.connect(this.reverb);
    oscillator.start(when);
    vibrato.start(when);
    oscillator.stop(end + 0.03);
    vibrato.stop(end + 0.03);
  }

  private startAmbience(): void {
    if (!this.context || !this.ambience || !this.noiseBuffer) return;
    const roomNoise = this.context.createBufferSource();
    const roomFilter = this.context.createBiquadFilter();
    const hum = this.context.createOscillator();
    const upperHum = this.context.createOscillator();
    const humGain = this.context.createGain();

    roomNoise.buffer = this.noiseBuffer;
    roomNoise.loop = true;
    roomFilter.type = "bandpass";
    roomFilter.frequency.value = 820;
    roomFilter.Q.value = 0.38;
    hum.type = "sine";
    hum.frequency.value = 58;
    upperHum.type = "sine";
    upperHum.frequency.value = 116.4;
    humGain.gain.value = 0.28;

    roomNoise.connect(roomFilter);
    roomFilter.connect(this.ambience);
    hum.connect(humGain);
    upperHum.connect(humGain);
    humGain.connect(this.ambience);
    roomNoise.start();
    hum.start();
    upperHum.start();
    this.ambienceSources = [roomNoise, hum, upperHum];
  }

  private playLead(note: number, when: number, duration: number, arrangement: Arrangement, pan = 0.2, volume = arrangement.leadGain ?? 0.075): void {
    this.synthNote(note, when, duration, arrangement.wave, volume, arrangement.leadCutoff, pan, 5, true);
  }

  private playBass(note: number, when: number, duration: number): void {
    this.synthNote(note, when, duration, "sawtooth", 0.09, 520, -0.12, -4, false);
    this.synthNote(note - 12, when, duration * 0.9, "sine", 0.055, 280, 0, 0, false);
  }

  private playChord(notes: number[], when: number, duration: number, volume: number): void {
    notes.forEach((note, index) => {
      this.synthNote(note, when + index * 0.012, duration, index % 2 === 0 ? "triangle" : "sawtooth", volume, 920, (index - 1.5) * 0.22, index * 3 - 4, true);
    });
  }

  private synthNote(
    note: number,
    when: number,
    duration: number,
    wave: OscillatorType,
    volume: number,
    cutoff: number,
    pan: number,
    detune: number,
    effects: boolean,
  ): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const end = when + Math.max(0.05, duration);

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(midiToFrequency(note), when);
    oscillator.detune.value = detune;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(180, cutoff * 0.42), end);
    filter.Q.value = 1.4;
    panner.pan.value = pan;
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + Math.min(0.018, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(panner);
    panner.connect(this.music);
    if (effects) {
      if (this.delay) panner.connect(this.delay);
      if (this.reverb) panner.connect(this.reverb);
    }
    oscillator.start(when);
    oscillator.stop(end + 0.03);
  }

  private kick(when: number, volume: number): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(148, when);
    oscillator.frequency.exponentialRampToValueAtTime(42, when + 0.13);
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.15);
    oscillator.connect(envelope);
    envelope.connect(this.music);
    oscillator.start(when);
    oscillator.stop(when + 0.16);
  }

  private snare(when: number, volume: number): void {
    this.noiseHit(when, 0.16, 1150, volume);
    this.tom(when, 176, volume * 0.45);
  }

  private hat(when: number, volume: number, open: boolean): void {
    this.noiseHit(when, open ? 0.11 : 0.045, 5200, volume);
  }

  private tom(when: number, frequency: number, volume: number): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(38, frequency * 0.58), when + 0.12);
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
    oscillator.connect(envelope);
    envelope.connect(this.music);
    oscillator.start(when);
    oscillator.stop(when + 0.15);
  }

  private noiseHit(when: number, duration: number, highpass: number, volume: number): void {
    if (!this.context || !this.music || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = highpass;
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.music);
    source.start(when, Math.random(), duration);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.context) throw new Error("Audio context is required");
    const buffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * duration), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[index] = white * 0.42 + last * 0.58;
    }
    return buffer;
  }

  private createImpulse(duration: number, decay: number): AudioBuffer {
    if (!this.context) throw new Error("Audio context is required");
    const length = Math.floor(this.context.sampleRate * duration);
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, decay);
      }
    }
    return impulse;
  }
}

export async function playEntranceTokenSequence(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioContextClass) return false;

  let context: AudioContext | null = null;
  try {
    context = new AudioContextClass();
    const resume = context.state === "suspended" ? context.resume() : Promise.resolve();
    await resume;
    if (context.state === "closed") return false;

    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const reverb = context.createConvolver();
    const reverbWet = context.createGain();
    const delay = context.createDelay(0.5);
    const delayFeedback = context.createGain();
    const delayWet = context.createGain();
    const noise = createOneShotNoiseBuffer(context, 0.8);
    const now = context.currentTime + 0.012;
    const end = now + ENTRANCE_TOKEN_SOUND_DURATION;

    master.gain.setValueAtTime(0.7, now);
    master.gain.setValueAtTime(0.7, end - 0.18);
    master.gain.exponentialRampToValueAtTime(0.0001, end - 0.02);
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    reverb.buffer = createOneShotImpulse(context, 0.72, 2.7);
    reverbWet.gain.value = 0.16;
    delay.delayTime.value = 0.18;
    delayFeedback.gain.value = 0.16;
    delayWet.gain.value = 0.12;

    master.connect(compressor);
    reverb.connect(reverbWet);
    reverbWet.connect(compressor);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(delayWet);
    delayWet.connect(compressor);
    compressor.connect(context.destination);

    for (const event of ENTRANCE_TOKEN_SOUND_EVENTS) {
      const when = now + event.at;
      if (event.kind === "metal-drop") synthesizeMetalDrop(context, master, reverb, noise, event, when);
      else if (event.kind === "ratchet") synthesizeRatchet(context, master, noise, event, when);
      else if (event.kind === "chute") synthesizeChute(context, master, noise, event, when);
      else synthesizeAcceptanceChime(context, master, reverb, delay, event, when);
    }

    const oneShotContext = context;
    const sentinel = context.createConstantSource();
    const silent = context.createGain();
    let closing = false;
    const closeOneShot = (): void => {
      if (closing || oneShotContext.state === "closed") return;
      closing = true;
      void oneShotContext.close().catch(() => undefined);
    };
    silent.gain.value = 0;
    sentinel.connect(silent);
    silent.connect(master);
    sentinel.onended = closeOneShot;
    sentinel.start(now);
    sentinel.stop(end);
    window.setTimeout(closeOneShot, Math.ceil((ENTRANCE_TOKEN_SOUND_DURATION + 0.25) * 1000));
    return true;
  } catch {
    if (context?.state !== "closed") {
      try {
        await context?.close();
      } catch {
        // Unsupported or interrupted audio must not block the entrance action.
      }
    }
    return false;
  }
}

function synthesizeMetalDrop(
  context: AudioContext,
  output: AudioNode,
  reverb: AudioNode,
  noise: AudioBuffer,
  event: EntranceTokenSoundEvent,
  when: number,
): void {
  const panner = context.createStereoPanner();
  const transient = context.createBufferSource();
  const transientFilter = context.createBiquadFilter();
  const transientGain = context.createGain();
  panner.pan.value = event.pan;
  panner.connect(output);
  panner.connect(reverb);
  transient.buffer = noise;
  transientFilter.type = "highpass";
  transientFilter.frequency.value = 3200;
  transientGain.gain.setValueAtTime(0.16, when);
  transientGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.045);
  transient.connect(transientFilter);
  transientFilter.connect(transientGain);
  transientGain.connect(panner);
  transient.start(when, event.id === "token-one" ? 0.08 : 0.31, 0.05);

  event.frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const partialDuration = event.duration * (1 - index * 0.16);
    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (0.93 - index * 0.015), when + partialDuration);
    envelope.gain.setValueAtTime([0.12, 0.075, 0.04][index], when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + partialDuration);
    oscillator.connect(envelope);
    envelope.connect(panner);
    oscillator.start(when);
    oscillator.stop(when + partialDuration + 0.02);
  });
}

function synthesizeRatchet(
  context: AudioContext,
  output: AudioNode,
  noise: AudioBuffer,
  event: EntranceTokenSoundEvent,
  when: number,
): void {
  event.frequencies.forEach((frequency, index) => {
    const tickTime = when + index * (event.duration / event.frequencies.length);
    const oscillator = context.createOscillator();
    const oscillatorGain = context.createGain();
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    const panner = context.createStereoPanner();
    panner.pan.value = event.pan + (index % 2 === 0 ? -0.04 : 0.04);
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, tickTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.62, tickTime + 0.038);
    oscillatorGain.gain.setValueAtTime(0.055 - index * 0.006, tickTime);
    oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, tickTime + 0.045);
    source.buffer = noise;
    filter.type = "bandpass";
    filter.frequency.value = frequency * 1.8;
    filter.Q.value = 2.2;
    noiseGain.gain.setValueAtTime(0.045, tickTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, tickTime + 0.028);
    oscillator.connect(oscillatorGain);
    source.connect(filter);
    filter.connect(noiseGain);
    oscillatorGain.connect(panner);
    noiseGain.connect(panner);
    panner.connect(output);
    oscillator.start(tickTime);
    oscillator.stop(tickTime + 0.055);
    source.start(tickTime, 0.4 + index * 0.07, 0.032);
  });
}

function synthesizeChute(
  context: AudioContext,
  output: AudioNode,
  noise: AudioBuffer,
  event: EntranceTokenSoundEvent,
  when: number,
): void {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  const panner = context.createStereoPanner();
  const thud = context.createOscillator();
  const thudGain = context.createGain();
  const end = when + event.duration;
  source.buffer = noise;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(event.frequencies[0], when);
  filter.frequency.exponentialRampToValueAtTime(event.frequencies[1], end);
  filter.Q.value = 0.7;
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.exponentialRampToValueAtTime(0.075, when + 0.035);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  panner.pan.setValueAtTime(event.pan, when);
  panner.pan.linearRampToValueAtTime(0, end);
  thud.type = "sine";
  thud.frequency.setValueAtTime(event.frequencies[1] * 1.4, end - 0.055);
  thud.frequency.exponentialRampToValueAtTime(48, end);
  thudGain.gain.setValueAtTime(0.06, end - 0.055);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, end);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(panner);
  thud.connect(thudGain);
  thudGain.connect(panner);
  panner.connect(output);
  source.start(when, event.id === "chute-one" ? 0.12 : 0.48, event.duration);
  thud.start(end - 0.055);
  thud.stop(end + 0.01);
}

function synthesizeAcceptanceChime(
  context: AudioContext,
  output: AudioNode,
  reverb: AudioNode,
  delay: AudioNode,
  event: EntranceTokenSoundEvent,
  when: number,
): void {
  event.frequencies.forEach((frequency, index) => {
    const noteTime = when + (index === event.frequencies.length - 1 ? 0.24 : index * 0.018);
    const duration = index === event.frequencies.length - 1 ? event.duration - 0.24 : event.duration * 0.68;
    const oscillator = context.createOscillator();
    const warmth = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const panner = context.createStereoPanner();
    const end = noteTime + duration;
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, noteTime);
    warmth.type = "sine";
    warmth.frequency.setValueAtTime(frequency / 2, noteTime);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, noteTime);
    filter.frequency.exponentialRampToValueAtTime(900, end);
    envelope.gain.setValueAtTime(0.0001, noteTime);
    envelope.gain.exponentialRampToValueAtTime(index === 3 ? 0.105 : 0.075, noteTime + 0.028);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    panner.pan.value = index === 0 ? -0.18 : index === 2 ? 0.18 : 0;
    oscillator.connect(filter);
    warmth.connect(filter);
    filter.connect(envelope);
    envelope.connect(panner);
    panner.connect(output);
    panner.connect(reverb);
    if (index === event.frequencies.length - 1) panner.connect(delay);
    oscillator.start(noteTime);
    warmth.start(noteTime);
    oscillator.stop(end + 0.03);
    warmth.stop(end + 0.03);
  });
}

function createOneShotNoiseBuffer(context: AudioContext, duration: number): AudioBuffer {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 0x19861987;
  for (let index = 0; index < data.length; index += 1) {
    seed = Math.imul(seed ^ seed >>> 15, 1 | seed);
    seed ^= seed + Math.imul(seed ^ seed >>> 7, 61 | seed);
    data[index] = (((seed ^ seed >>> 14) >>> 0) / 4294967296) * 2 - 1;
  }
  return buffer;
}

function createOneShotImpulse(context: AudioContext, duration: number, decay: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * duration);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  let seed = 0xcafef17;
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      seed = Math.imul(1664525, seed) + 1013904223 | 0;
      const noise = ((seed >>> 0) / 4294967296) * 2 - 1;
      data[index] = noise * Math.pow(1 - index / length, decay);
    }
  }
  return impulse;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function midiToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}
