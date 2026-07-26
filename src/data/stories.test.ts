import { describe, expect, it } from "vitest";
import { STORY_DEFINITIONS } from "./stories";

describe("branching story catalog", () => {
  it("keeps every story path connected to a real scene", () => {
    for (const story of STORY_DEFINITIONS) {
      expect(story.nodes[story.start]).toBeDefined();

      for (const node of Object.values(story.nodes)) {
        expect(node.id).toBeTruthy();

        for (const choice of node.choices) {
          expect(story.nodes[choice.next], `${story.id}:${node.id} -> ${choice.next}`).toBeDefined();
        }
      }

      const reachable = new Set<string>();
      const pending = [story.start];
      while (pending.length) {
        const nodeId = pending.pop();
        if (!nodeId || reachable.has(nodeId)) continue;
        reachable.add(nodeId);
        pending.push(...story.nodes[nodeId].choices.map((choice) => choice.next));
      }
      expect([...reachable].sort()).toEqual(Object.keys(story.nodes).sort());
    }
  });

  it("offers three substantial genres with multiple endings", () => {
    expect(STORY_DEFINITIONS.map((story) => story.id)).toEqual(["horror", "action", "mystery"]);

    for (const story of STORY_DEFINITIONS) {
      const nodes = Object.values(story.nodes);
      const endings = nodes.filter((node) => node.ending);
      const narrativeWords = nodes.flatMap((node) => node.body).join(" ").split(/\s+/);

      expect(endings.length).toBeGreaterThanOrEqual(3);
      expect(nodes.length).toBeGreaterThanOrEqual(13);
      expect(narrativeWords.length).toBeGreaterThan(900);
    }
  });

  it("never strands a valid flag state before an ending", () => {
    for (const story of STORY_DEFINITIONS) {
      const pending = [{ nodeId: story.start, flags: [] as string[] }];
      const visited = new Set<string>();
      const reachedEndings = new Set<string>();

      while (pending.length) {
        const state = pending.pop();
        if (!state) continue;
        const stateKey = `${state.nodeId}|${[...state.flags].sort().join(",")}`;
        if (visited.has(stateKey)) continue;
        visited.add(stateKey);

        const node = story.nodes[state.nodeId];
        if (node.ending) {
          reachedEndings.add(node.id);
          continue;
        }

        const choices = node.choices.filter((choice) =>
          (choice.requires ?? []).every((flag) => state.flags.includes(flag))
          && (choice.excludes ?? []).every((flag) => !state.flags.includes(flag)),
        );
        expect(choices.length, `${story.id}:${node.id} has no valid choices`).toBeGreaterThan(0);

        for (const choice of choices) {
          pending.push({
            nodeId: choice.next,
            flags: Array.from(new Set([...state.flags, ...(choice.addFlags ?? [])])),
          });
        }
      }

      expect(reachedEndings.size).toBeGreaterThanOrEqual(3);
    }
  });
});
