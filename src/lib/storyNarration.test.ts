import { selectNarrationVoice } from "./storyNarration";

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
