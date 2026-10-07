import { BrowserStoryNarrator, selectNarrationVoice } from "./storyNarration";

type TestVoice = {
  default: boolean;
  lang: string;
  localService: boolean;
  name: string;
};

function voice(name: string, lang = "en-US", overrides: Partial<TestVoice> = {}): TestVoice {
  return { default: false, lang, localService: true, name, ...overrides };
}

describe("story narration voice selection", () => {
  it("prefers a natural English voice over a generic default", () => {
    const selected = selectNarrationVoice([
      voice("Generic Voice", "en-US", { default: true }),
      voice("Ava Premium"),
      voice("French Voice", "fr-FR"),
    ]);

    expect(selected?.name).toBe("Ava Premium");
  });

  it("avoids compact voices when a full English voice exists", () => {
    const selected = selectNarrationVoice([
      voice("Samantha Compact"),
      voice("English Full Voice", "en-GB"),
    ]);

    expect(selected?.name).toBe("English Full Voice");
  });

  it("returns null when no English voice is installed", () => {
    expect(selectNarrationVoice([voice("Amelie", "fr-FR")])).toBeNull();
  });
});

describe("browser story narrator", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts the first utterance without canceling the user gesture", () => {
    const utterances: FakeUtterance[] = [];
    const speakingStates: boolean[] = [];
    const cancel = vi.fn();
    const synthesis = {
      cancel,
      getVoices: () => [voice("Samantha")],
      paused: false,
      pending: false,
      resume: vi.fn(),
      speak: vi.fn((utterance: FakeUtterance) => utterances.push(utterance)),
      speaking: false,
    };
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    vi.stubGlobal("speechSynthesis", synthesis);

    const narrator = new BrowserStoryNarrator({
      onSpeakingChange: (speaking) => speakingStates.push(speaking),
    });

    expect(narrator.speak("The road is open.")).toBe(true);
    expect(cancel).not.toHaveBeenCalled();
    expect(utterances).toHaveLength(1);
    expect(utterances[0].text).toBe("The road is open.");
    expect(utterances[0].voice?.name).toBe("Samantha");

    utterances[0].onstart?.();
    utterances[0].onend?.();
    expect(speakingStates).toEqual([true, false]);
    narrator.dispose();
  });

  it("plays a recorded narration clip before falling back to device speech", async () => {
    const speakingStates: boolean[] = [];
    const voices: string[] = [];
    const recordings: FakeAudio[] = [];
    class TestAudio extends FakeAudio {
      constructor() {
        super();
        recordings.push(this);
      }
    }
    vi.stubGlobal("Audio", TestAudio);

    const narrator = new BrowserStoryNarrator({
      onSpeakingChange: (speaking) => speakingStates.push(speaking),
      onVoiceChange: (voiceName) => voices.push(voiceName),
    });

    expect(narrator.speak("The road is open.", 0.92, "/audio/fantasy/cabinet-wake.mp3")).toBe(true);
    expect(recordings).toHaveLength(1);
    expect(recordings[0].src).toBe("/audio/fantasy/cabinet-wake.mp3");
    expect(recordings[0].play).toHaveBeenCalledOnce();
    expect(voices).toEqual(["Danielle // recorded generative voice"]);

    recordings[0].onplay?.();
    recordings[0].onended?.();
    await Promise.resolve();
    expect(speakingStates).toEqual([true, false]);
    narrator.dispose();
  });
});

class FakeUtterance {
  lang = "";
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onstart: (() => void) | null = null;
  pitch = 1;
  rate = 1;
  text: string;
  voice: TestVoice | null = null;
  volume = 1;

  constructor(text: string) {
    this.text = text;
  }
}

class FakeAudio {
  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onplay: (() => void) | null = null;
  playbackRate = 1;
  preload = "";
  src = "";
  pause = vi.fn();
  play = vi.fn(() => Promise.resolve());
}
