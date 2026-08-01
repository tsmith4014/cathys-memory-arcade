import { useEffect, useState, type CSSProperties } from "react";
import {
  STORY_DEFINITIONS,
  applyStoryChoice,
  availableStoryChoices,
  getStory,
  visibleStoryCallbacks,
  type StoryCharacter,
  type StoryChoice,
  type StoryDefinition,
  type StoryGenre,
  type StoryStateView,
} from "../data/stories";
import { getStoryScene } from "../data/storyScenes";
import "../story.css";

type StoryHistory = {
  nodeId: string;
  title: string;
  choice: string;
  snapshot?: StoryStateView;
};

type StorySession = StoryStateView & {
  version: 3;
  storyId: StoryGenre;
  nodeId: string;
  history: StoryHistory[];
};

const savePrefix = "cathy-arcade:story:";

export function StoryArcade() {
  const [session, setSession] = useState<StorySession | null>(null);
  const story = session ? getStory(session.storyId) : null;
  const node = story && session ? story.nodes[session.nodeId] : null;

  useEffect(() => {
    if (!session) return;
    try {
      window.localStorage.setItem(`${savePrefix}${session.storyId}`, JSON.stringify(session));
    } catch {
      // A hardened browser can block local storage; the current story remains playable.
    }
  }, [session]);

  const enterStory = (definition: StoryDefinition): void => {
    const saved = readSession(definition);
    setSession(saved ?? freshSession(definition));
    focusStoryPage(50);
  };

  const restartStory = (): void => {
    if (!story) return;
    const fresh = freshSession(story);
    setSession(fresh);
    try {
      window.localStorage.removeItem(`${savePrefix}${story.id}`);
    } catch {
      // Restart remains available even when storage is unavailable.
    }
    focusStoryPage();
  };

  const returnToShelf = (): void => {
    const storyId = story?.id;
    setSession(null);
    window.setTimeout(() => {
      if (!storyId) return;
      document.querySelector<HTMLButtonElement>(`[data-story-id="${storyId}"] button`)?.focus();
    }, 30);
  };

  const turnBack = (): void => {
    if (!session?.history.length) return;
    const previousPage = session.history.at(-1);
    if (!previousPage?.snapshot) return;
    setSession({
      ...session,
      ...cloneStoryState(previousPage.snapshot),
      nodeId: previousPage.nodeId,
      history: session.history.slice(0, -1),
    });
    focusStoryPage();
  };

  const choose = (choice: StoryChoice): void => {
    if (!session || !node) return;
    const nextState = applyStoryChoice(session, choice);
    setSession({
      ...session,
      ...nextState,
      nodeId: choice.next,
      history: [...session.history, {
        nodeId: node.id,
        title: node.title,
        choice: choice.label,
        snapshot: cloneStoryState(session),
      }],
    });
    focusStoryPage();
  };

  const callbacks = story && session && node ? visibleStoryCallbacks(node.callbacks, session) : [];
  const choices = story && session && node ? availableStoryChoices(node.choices, session) : [];
  const scene = story && node ? getStoryScene(story.id, node.id) : null;

  return (
    <section className="story-arcade section-shell" id="story-arcade" aria-labelledby="story-arcade-title">
      <div className="section-heading split-heading story-intro-heading">
        <div>
          <p className="kicker">After Closing // three playable paperbacks</p>
          <h2 id="story-arcade-title">Pick your trouble. The lights are already out.</h2>
        </div>
        <p>One cabinet is haunted. One city is running out of time. One case keeps rewriting its witnesses. Each story remembers who you trusted, what you carried, and what you left behind.</p>
      </div>
      <p className="story-disclaimer">Everything in After Closing is original fiction. These characters and events are separate from Cathy's life and from the documented history of the Fillmore arcade.</p>

      {!story || !session || !node || !scene ? (
        <StoryShelf onEnter={enterStory} />
      ) : (
        <article
          className={`story-stage story-${story.id}`}
          id="story-stage"
          style={{ "--story-accent": story.accent } as CSSProperties}
          data-ending={node.ending?.rank}
          data-scene-art={scene.art}
          data-text-side={scene.side ?? "left"}
          tabIndex={-1}
        >
          <img
            className="story-stage-art"
            src={`${import.meta.env.BASE_URL}art/${scene.art === "cast" ? story.castImage : story.image}`}
            alt={scene.art === "cast" ? story.castAlt : story.imageAlt}
            key={`${story.id}-${node.id}-${scene.art}`}
          />
          <span className="story-stage-atmosphere" aria-hidden="true" />
          <StoryWorldmark genre={story.id} />

          <div className="story-scene">
            <header className="story-stage-header">
              <div>
                <span>{story.shelfCode} // scene {String(session.history.length + 1).padStart(2, "0")}</span>
                <h3>{story.title}</h3>
              </div>
              <div
                className="story-page-meter"
                role="progressbar"
                aria-label="Story decisions"
                aria-valuemin={0}
                aria-valuemax={12}
                aria-valuenow={Math.min(session.history.length, 12)}
                aria-valuetext={`${session.history.length} decisions made`}
              >
                {Array.from({ length: 12 }, (_, index) => <i className={index < session.history.length ? "read" : ""} key={index} />)}
              </div>
              <div className="story-stage-actions">
                <button type="button" onClick={returnToShelf}>Story shelf</button>
                <button type="button" onClick={turnBack} disabled={!session.history.at(-1)?.snapshot} aria-label="Turn back one page">Turn back</button>
                <button type="button" onClick={restartStory}>Start over</button>
              </div>
            </header>

            <div className="story-scene-content">
              <p className="story-art-caption">
                {scene.art === "cast"
                  ? `Fictional cast // ${story.cast.map((character) => character.name).join(" // ")}`
                  : `${story.shelfCode} // original scene artwork`}
              </p>
              <div className="story-copy" aria-live="polite">
                <span>{node.chapter}</span>
                <h4>{scene.title}</h4>
                <p className="story-scene-beat">{scene.text}</p>

                {scene.expanded ? (
                  <details className="story-long-read">
                    <summary>Open the full scene</summary>
                    <div>{node.body.map((paragraph, index) => <p key={`${node.id}-body-${index}`}>{paragraph}</p>)}</div>
                  </details>
                ) : null}

                {node.ending ? (
                  <div className={`story-ending rank-${node.ending.rank}`}>
                    <span>{story.ui.endingTitle}</span>
                    <strong>{node.ending.label}</strong>
                    <button type="button" onClick={returnToShelf}>Choose another story</button>
                    <button type="button" onClick={restartStory}>Read this one again</button>
                  </div>
                ) : (
                  <div className="story-choices" aria-label="Story choices">
                    {choices.map((choice, index) => (
                      <button type="button" onClick={() => choose(choice)} key={`${node.id}-${choice.label}`}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{choice.label}</strong>
                        <small>{choice.consequence}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="story-drawers">
            {callbacks.length ? (
              <details className="story-drawer story-echo-drawer">
                <summary>
                  <span>Earlier choices</span>
                  <strong>{callbacks.length} {callbacks.length === 1 ? "consequence" : "consequences"} in motion</strong>
                </summary>
                <div className="story-echo-list">
                  {callbacks.map((callback, callbackIndex) => (
                    <aside className="story-callback" key={`${node.id}-${callback.label}-${callbackIndex}`} aria-label="An earlier choice returns">
                      <span>Earlier // {callback.label}</span>
                      {callback.body.map((paragraph, index) => <p key={`${callback.label}-${index}`}>{paragraph}</p>)}
                    </aside>
                  ))}
                </div>
              </details>
            ) : null}
            <details className="story-drawer">
              <summary>
                <span>Story state</span>
                <strong>{session.inventory.length} carried // {session.flags.length} remembered</strong>
              </summary>
              <StoryState story={story} session={session} />
            </details>
            <details className="story-drawer story-trace">
              <summary>
                <span>{story.ui.trailTitle}</span>
                <strong>{session.history.length} decisions // saved here</strong>
              </summary>
              <div>
                {session.history.length
                  ? session.history.map((entry, index) => (
                      <p key={`${entry.nodeId}-${index}`}>
                        <i>{String(index + 1).padStart(2, "0")}</i>
                        {entry.choice}
                      </p>
                    ))
                  : <p><i>00</i>The first choice is yours.</p>}
              </div>
            </details>
          </div>
        </article>
      )}
    </section>
  );
}

function StoryShelf({ onEnter }: { onEnter: (story: StoryDefinition) => void }) {
  return (
    <div className="story-shelf">
      {STORY_DEFINITIONS.map((definition) => {
        const saved = readSession(definition);
        return (
          <article className={`story-card story-${definition.id}`} data-story-id={definition.id} key={definition.id} style={{ "--story-accent": definition.accent } as CSSProperties}>
            <img src={`${import.meta.env.BASE_URL}art/${definition.image}`} alt="" loading="lazy" />
            <span className="story-card-shade" />
            <StoryWorldmark genre={definition.id} />
            <div className="story-card-copy">
              <span>{definition.shelfCode} // {saved ? "save detected" : "unread"}</span>
              <h3>{definition.title}</h3>
              <p className="story-subtitle">{definition.subtitle}</p>
              <p>{definition.teaser}</p>
              <div className="story-card-cast" role="list" aria-label={`${definition.title} cast`}>
                {definition.cast.map((character) => (
                  <span role="listitem" key={character.id}><i aria-hidden="true">{character.glyph}</i>{character.name}</span>
                ))}
              </div>
              <button type="button" onClick={() => onEnter(definition)}>
                {saved ? "Resume story" : "Enter story"} <i aria-hidden="true">-&gt;</i>
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StoryState({ story, session }: { story: StoryDefinition; session: StorySession }) {
  const protagonist = story.cast.find((character) => character.player);
  const companions = story.cast.filter((character) => !character.player);
  const visibleFlags = session.flags.filter((flag) => story.flagLabels[flag]).slice(-5);

  return (
    <aside className="story-dossier" aria-label="Current story state">
      <span>{story.ui.stateTitle}</span>
      {protagonist ? (
        <div className="story-protagonist">
          <i aria-hidden="true">{protagonist.glyph}</i>
          <div><strong>{protagonist.name}</strong><small>{protagonist.role}</small></div>
        </div>
      ) : null}

      <div className="story-relationships">
        {companions.map((character) => (
          <div className="story-relationship" data-bond={bondTone(character, session.relationships[character.id] ?? 0)} key={character.id}>
            <i aria-hidden="true">{character.glyph}</i>
            <p><strong>{character.name}</strong><span>{bondLabel(character, session.relationships[character.id] ?? 0)}</span></p>
          </div>
        ))}
      </div>

      <div className="story-inventory">
        <span>{story.ui.inventoryTitle}</span>
        {session.inventory.length
          ? session.inventory.map((item) => <small key={item}>{story.itemLabels[item] ?? humanize(item)}</small>)
          : <small>{story.ui.emptyInventory}</small>}
      </div>

      {visibleFlags.length ? (
        <div className="story-state-notes">
          <span>What the story remembers</span>
          {visibleFlags.map((flag) => <small key={flag}>{story.flagLabels[flag]}</small>)}
        </div>
      ) : null}

      <details className="story-cast-notes">
        <summary>Cast notes</summary>
        {story.cast.map((character) => (
          <p key={character.id}><strong>{character.name}</strong>{character.voice}</p>
        ))}
      </details>
    </aside>
  );
}

function StoryWorldmark({ genre }: { genre: StoryGenre }) {
  return (
    <span className={`story-worldmark worldmark-${genre}`} aria-hidden="true">
      <i /><i /><i /><b />
    </span>
  );
}

function freshSession(story: StoryDefinition): StorySession {
  return {
    version: 3,
    storyId: story.id,
    nodeId: story.start,
    flags: [],
    inventory: [...story.initialItems],
    relationships: initialRelationships(story),
    history: [],
  };
}

function readSession(story: StoryDefinition): StorySession | null {
  try {
    const value = window.localStorage.getItem(`${savePrefix}${story.id}`);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<StorySession>;
    if (parsed.storyId !== story.id || !parsed.nodeId || !story.nodes[parsed.nodeId] || !Array.isArray(parsed.flags) || !Array.isArray(parsed.history)) return null;

    return {
      version: 3,
      storyId: story.id,
      nodeId: parsed.nodeId,
      flags: parsed.flags,
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [...story.initialItems],
      relationships: { ...initialRelationships(story), ...(parsed.relationships ?? {}) },
      history: parsed.history
        .filter((entry): entry is StoryHistory => Boolean(entry?.nodeId && entry?.choice))
        .map((entry) => ({
          nodeId: entry.nodeId,
          title: entry.title,
          choice: entry.choice,
          snapshot: isStorySnapshot(entry.snapshot) ? cloneStoryState(entry.snapshot) : undefined,
        })),
    };
  } catch {
    return null;
  }
}

function cloneStoryState(state: StoryStateView): StoryStateView {
  return {
    flags: [...state.flags],
    inventory: [...state.inventory],
    relationships: { ...state.relationships },
  };
}

function isStorySnapshot(value: unknown): value is StoryStateView {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoryStateView>;
  return Array.isArray(candidate.flags)
    && Array.isArray(candidate.inventory)
    && Boolean(candidate.relationships && typeof candidate.relationships === "object");
}

function initialRelationships(story: StoryDefinition): Record<string, number> {
  return Object.fromEntries(story.cast.filter((character) => !character.player).map((character) => [character.id, character.initialBond ?? 0]));
}

function bondTone(character: StoryCharacter, value: number): "low" | "neutral" | "high" {
  if (!character.bondLabels || value === 0) return "neutral";
  return value < 0 ? "low" : "high";
}

function bondLabel(character: StoryCharacter, value: number): string {
  if (!character.bondLabels) return character.role;
  if (value < 0) return character.bondLabels.low;
  if (value > 0) return character.bondLabels.high;
  return character.bondLabels.neutral;
}

function humanize(value: string): string {
  return value.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function focusStoryPage(delay = 30): void {
  window.setTimeout(() => {
    const storyStage = document.querySelector<HTMLElement>(".story-stage");
    storyStage?.focus({ preventScroll: true });
    storyStage?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }, delay);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
