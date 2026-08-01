import { describe, expect, it } from "vitest";
import {
  STORY_DEFINITIONS,
  applyStoryChoice,
  availableStoryChoices,
  visibleStoryCallbacks,
  type StoryChoice,
  type StoryDefinition,
  type StoryStateView,
} from "./stories";
import { STORY_SCENES, getStoryScene } from "./storyScenes";

type CompletedPath = {
  ending: string;
  decisions: number;
  callbacks: number;
  flags: string[];
};

describe("branching story catalog", () => {
  it("gives every node a concise, art-directed screen scene", () => {
    for (const story of STORY_DEFINITIONS) {
      expect(Object.keys(STORY_SCENES[story.id]).sort()).toEqual(Object.keys(story.nodes).sort());

      const scenes = Object.keys(story.nodes).map((nodeId) => getStoryScene(story.id, nodeId));
      for (const [nodeId, node] of Object.entries(story.nodes)) {
        const scene = getStoryScene(story.id, nodeId);
        const wordCount = scene.text.trim().split(/\s+/).length;

        expect(scene.title.length, `${story.id}:${node.id} screen title is too long`).toBeLessThanOrEqual(28);
        expect(wordCount, `${story.id}:${node.id} screen text is too thin`).toBeGreaterThanOrEqual(20);
        expect(wordCount, `${story.id}:${node.id} screen text obscures the art`).toBeLessThanOrEqual(45);
        expect(["world", "cast"]).toContain(scene.art);
      }

      expect(scenes.some((scene) => scene.art === "world")).toBe(true);
      expect(scenes.some((scene) => scene.art === "cast")).toBe(true);
      expect(scenes.filter((scene) => scene.expanded).length).toBeGreaterThanOrEqual(2);
      expect(scenes.filter((scene) => scene.expanded).length).toBeLessThanOrEqual(3);
    }
  });

  it("keeps every story path connected to a real scene", () => {
    for (const story of STORY_DEFINITIONS) {
      expect(story.nodes[story.start]).toBeDefined();

      for (const node of Object.values(story.nodes)) {
        expect(node.id).toBeTruthy();
        expect(node.body.length).toBeGreaterThan(0);

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

  it("offers three deep genres with recurring casts, dialogue, and multiple endings", () => {
    expect(STORY_DEFINITIONS.map((story) => story.id)).toEqual(["horror", "action", "mystery"]);

    for (const story of STORY_DEFINITIONS) {
      const nodes = Object.values(story.nodes);
      const endings = nodes.filter((node) => node.ending);
      const narrative = nodes.flatMap((node) => [
        ...node.body,
        ...(node.callbacks ?? []).flatMap((callback) => callback.body),
      ]).join(" ");

      expect(story.cast.length).toBeGreaterThanOrEqual(3);
      expect(story.cast.filter((character) => character.player)).toHaveLength(1);
      expect(story.castImage).toMatch(/^story-.+-cast-v2\.webp$/);
      expect(story.castAlt).toMatch(/original fictional cast/i);
      expect(endings.length).toBeGreaterThanOrEqual(4);
      expect(nodes.length).toBeGreaterThanOrEqual(17);
      expect(narrative.split(/\s+/).length).toBeGreaterThan(1500);
      expect((narrative.match(/"/g) ?? []).length).toBeGreaterThan(14);

      for (const character of story.cast) {
        const storyName = characterMention[character.id] ?? character.name.split(" ")[0];
        expect(narrative.match(new RegExp(storyName, "g"))?.length ?? 0, `${story.id}:${character.id} recurs in the prose`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("uses only declared inventory and relationship keys", () => {
    for (const story of STORY_DEFINITIONS) {
      const itemIds = new Set(Object.keys(story.itemLabels));
      const characterIds = new Set(story.cast.map((character) => character.id));

      expect(new Set(story.cast.map((character) => character.id)).size).toBe(story.cast.length);
      for (const item of story.initialItems) expect(itemIds.has(item), `${story.id}: initial item ${item}`).toBe(true);

      for (const node of Object.values(story.nodes)) {
        for (const condition of [...node.choices, ...(node.callbacks ?? [])]) {
          for (const item of [...(condition.requiresItems ?? []), ...(condition.excludesItems ?? [])]) {
            expect(itemIds.has(item), `${story.id}:${node.id} condition item ${item}`).toBe(true);
          }
          for (const relationship of condition.relationships ?? []) {
            expect(characterIds.has(relationship.character), `${story.id}:${node.id} relationship ${relationship.character}`).toBe(true);
          }
        }

        for (const choice of node.choices) {
          for (const item of [...(choice.addItems ?? []), ...(choice.removeItems ?? [])]) {
            expect(itemIds.has(item), `${story.id}:${node.id} changed item ${item}`).toBe(true);
          }
          for (const character of Object.keys(choice.relationshipChanges ?? {})) {
            expect(characterIds.has(character), `${story.id}:${node.id} changed relationship ${character}`).toBe(true);
          }
        }
      }
    }
  });

  it("makes inventory, relationships, and earlier choices alter later options", () => {
    for (const story of STORY_DEFINITIONS) {
      const choices = Object.values(story.nodes).flatMap((node) => node.choices);
      const callbacks = Object.values(story.nodes).flatMap((node) => node.callbacks ?? []);
      const conditionalChoices = choices.filter(hasCondition);
      const relationshipChanges = choices.flatMap((choice) => Object.keys(choice.relationshipChanges ?? {}));
      const requiredRelationships = choices.flatMap((choice) => choice.relationships?.map((condition) => condition.character) ?? []);

      expect(conditionalChoices.length).toBeGreaterThanOrEqual(4);
      expect(callbacks.length).toBeGreaterThanOrEqual(12);
      expect(new Set(relationshipChanges).size).toBeGreaterThanOrEqual(2);
      expect(new Set(requiredRelationships).size).toBeGreaterThanOrEqual(2);
      expect(choices.some((choice) => choice.addItems?.length || choice.removeItems?.length)).toBe(true);
    }
  });

  it("keeps every authored choice and callback reachable in a real playthrough", () => {
    for (const story of STORY_DEFINITIONS) {
      const statesByNode = reachableStatesByNode(story);

      for (const node of Object.values(story.nodes)) {
        const states = statesByNode.get(node.id) ?? [];
        expect(states.length, `${story.id}:${node.id} has no reachable state`).toBeGreaterThan(0);

        for (const choice of node.choices) {
          const reachable = states.some((state) => availableStoryChoices([choice], state).length === 1);
          expect(reachable, `${story.id}:${node.id} choice \"${choice.label}\" is unreachable`).toBe(true);
        }

        for (const callback of node.callbacks ?? []) {
          const reachable = states.some((state) => visibleStoryCallbacks([callback], state).length === 1);
          expect(reachable, `${story.id}:${node.id} callback \"${callback.label}\" is unreachable`).toBe(true);
        }
      }
    }
  });

  it("delivers seven-decision runs with callbacks and reachable endings", () => {
    for (const story of STORY_DEFINITIONS) {
      const paths = exploreStory(story);
      const reachedEndings = new Set(paths.map((path) => path.ending));
      const declaredEndings = Object.values(story.nodes).filter((node) => node.ending).map((node) => node.id);

      expect(paths.length).toBeGreaterThan(0);
      expect([...reachedEndings].sort()).toEqual(declaredEndings.sort());
      expect(Math.min(...paths.map((path) => path.decisions))).toBeGreaterThanOrEqual(6);
      expect(Math.max(...paths.map((path) => path.decisions))).toBeLessThanOrEqual(12);
      const pathLengths = paths.map((path) => path.decisions).sort((left, right) => left - right);
      expect(pathLengths[Math.floor(pathLengths.length / 2)], `${story.id} median path length`).toBeLessThanOrEqual(9);
      const fewestCallbacks = paths.reduce((fewest, path) => path.callbacks < fewest.callbacks ? path : fewest, paths[0]);
      expect(fewestCallbacks.callbacks, `${story.id}:${fewestCallbacks.ending} flags=${fewestCallbacks.flags.join(",")}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("produces demonstrably different late scenes from early decisions", () => {
    const horror = STORY_DEFINITIONS[0];
    const action = STORY_DEFINITIONS[1];
    const mystery = STORY_DEFINITIONS[2];

    expect(callbackLabels(horror, "h10", ["promised-cal"], ["cal-badge"])).toContain("You made a promise");
    expect(callbackLabels(action, "a8", ["case-scorched"], [])).toContain("The scorched corner matters");
    expect(callbackLabels(mystery, "m10", ["six-spoke"], [])).toContain("Six joined the record");

    const baseState = initialState(action);
    expect(availableStoryChoices(action.nodes.a13.choices, baseState)).toEqual([]);
    expect(availableStoryChoices(action.nodes.a13.choices, { ...baseState, flags: ["chose-shared"] }).map((choice) => choice.next)).toEqual(["a_end_shared"]);
    expect(availableStoryChoices(action.nodes.a13.choices, { ...baseState, flags: ["chose-fastest"] }).map((choice) => choice.next)).toEqual(["a_end_fast"]);
  });

  it("keeps transitional scenes honest about what the player actually did", () => {
    const horror = STORY_DEFINITIONS[0];
    const action = STORY_DEFINITIONS[1];
    const mystery = STORY_DEFINITIONS[2];
    const railEntries = incomingChoices(action, "a7");
    const broadcastEntries = incomingChoices(action, "a11");

    expect(horror.nodes.h7.choices.find((choice) => choice.label === "Promise to get him out")?.next).toBe("h10");
    expect(railEntries.length).toBeGreaterThan(0);
    expect(railEntries.every((choice) => choice.addFlags?.includes("bucket-named"))).toBe(true);
    expect(broadcastEntries.length).toBeGreaterThan(0);
    expect(broadcastEntries.every((choice) => choice.addFlags?.includes("distributed-map"))).toBe(true);
    expect(mystery.nodes.m8.choices.find((choice) => choice.label === "Accept the clean solution")?.next).toBe("m11_clean");
    expect(mystery.nodes.m9.body.join(" ")).toMatch(/tries to merge/i);
    expect(mystery.nodes.m11_clean.body.join(" ")).not.toMatch(/halves align/i);
  });
});

const characterMention: Record<string, string> = {
  mae: "Mae",
  cal: "Cal",
  "player-two": "(?:Player Two|June)",
  rook: "Rook",
  switch: "Switch",
  bucket: "Bucket",
  mara: "Mara",
  eli: "Eli",
  six: "Six",
};

function hasCondition(choice: StoryChoice): boolean {
  return Boolean(
    choice.requires?.length
    || choice.excludes?.length
    || choice.requiresItems?.length
    || choice.excludesItems?.length
    || choice.relationships?.length,
  );
}

function initialState(story: StoryDefinition): StoryStateView {
  return {
    flags: [],
    inventory: [...story.initialItems],
    relationships: Object.fromEntries(story.cast.filter((character) => !character.player).map((character) => [character.id, character.initialBond ?? 0])),
  };
}

function exploreStory(story: StoryDefinition): CompletedPath[] {
  const completed: CompletedPath[] = [];
  const pending = [{ nodeId: story.start, state: initialState(story), decisions: 0, callbacks: 0 }];
  const seen = new Set<string>();

  while (pending.length) {
    const current = pending.pop();
    if (!current) continue;
    const node = story.nodes[current.nodeId];
    const callbackCount = current.callbacks + visibleStoryCallbacks(node.callbacks, current.state).length;
    const key = `${current.nodeId}|${current.decisions}|${current.state.flags.slice().sort().join(",")}|${current.state.inventory.slice().sort().join(",")}|${Object.entries(current.state.relationships).sort().map(([id, value]) => `${id}:${value}`).join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (node.ending) {
      completed.push({ ending: node.id, decisions: current.decisions, callbacks: callbackCount, flags: current.state.flags });
      continue;
    }

    const choices = availableStoryChoices(node.choices, current.state);
    expect(choices.length, `${story.id}:${node.id} has no valid choices`).toBeGreaterThan(0);
    expect(current.decisions, `${story.id}:${node.id} exceeded intended book length`).toBeLessThan(12);

    for (const choice of choices) {
      pending.push({
        nodeId: choice.next,
        state: applyStoryChoice(current.state, choice),
        decisions: current.decisions + 1,
        callbacks: callbackCount,
      });
    }
  }

  return completed;
}

function callbackLabels(story: StoryDefinition, nodeId: string, flags: string[], inventory: string[]): string[] {
  const state = { ...initialState(story), flags, inventory };
  return visibleStoryCallbacks(story.nodes[nodeId].callbacks, state).map((callback) => callback.label);
}

function incomingChoices(story: StoryDefinition, nodeId: string): StoryChoice[] {
  return Object.values(story.nodes).flatMap((node) => node.choices.filter((choice) => choice.next === nodeId));
}

function reachableStatesByNode(story: StoryDefinition): Map<string, StoryStateView[]> {
  const statesByNode = new Map<string, StoryStateView[]>();
  const pending = [{ nodeId: story.start, state: initialState(story) }];
  const seen = new Set<string>();

  while (pending.length) {
    const current = pending.pop();
    if (!current) continue;
    const key = `${current.nodeId}|${current.state.flags.slice().sort().join(",")}|${current.state.inventory.slice().sort().join(",")}|${Object.entries(current.state.relationships).sort().map(([id, value]) => `${id}:${value}`).join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);

    statesByNode.set(current.nodeId, [...(statesByNode.get(current.nodeId) ?? []), current.state]);
    const node = story.nodes[current.nodeId];
    if (node.ending) continue;

    for (const choice of availableStoryChoices(node.choices, current.state)) {
      pending.push({ nodeId: choice.next, state: applyStoryChoice(current.state, choice) });
    }
  }

  return statesByNode;
}
