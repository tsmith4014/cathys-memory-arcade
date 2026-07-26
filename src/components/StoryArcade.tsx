import { useEffect, useState, type CSSProperties } from "react";
import {
  STORY_DEFINITIONS,
  getStory,
  type StoryChoice,
  type StoryDefinition,
  type StoryGenre,
  type StoryStat,
} from "../data/stories";

type StoryHistory = {
  nodeId: string;
  title: string;
  choice: string;
};

type StorySession = {
  storyId: StoryGenre;
  nodeId: string;
  stats: Record<StoryStat, number>;
  flags: string[];
  history: StoryHistory[];
};

const savePrefix = "cathy-arcade:story:";
const initialStats: Record<StoryStat, number> = { nerve: 50, momentum: 50, insight: 50 };

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
    window.setTimeout(() => document.getElementById("story-stage")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
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
  };

  const choose = (choice: StoryChoice): void => {
    if (!session || !node) return;
    const stats = { ...session.stats };
    for (const stat of Object.keys(choice.stats ?? {}) as StoryStat[]) {
      stats[stat] = clampStat(stats[stat] + (choice.stats?.[stat] ?? 0));
    }
    setSession({
      ...session,
      nodeId: choice.next,
      stats,
      flags: Array.from(new Set([...session.flags, ...(choice.addFlags ?? [])])),
      history: [...session.history, { nodeId: node.id, title: node.title, choice: choice.label }],
    });
    window.setTimeout(() => {
      const storyCopy = document.querySelector<HTMLElement>(".story-copy");
      storyCopy?.focus({ preventScroll: true });
      storyCopy?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  return (
    <section className="story-arcade section-shell" id="story-arcade" aria-labelledby="story-arcade-title">
      <div className="section-heading split-heading">
        <div>
          <p className="kicker">After Closing // branching fiction cabinet</p>
          <h2 id="story-arcade-title">Choose the kind of trouble.</h2>
        </div>
        <p>Three original, illustrated stories remember every choice on this browser. Horror, action, and mystery share no fixed path and no single correct ending.</p>
      </div>
      <p className="story-disclaimer">These are fictional arcade stories, not claims about Cathy's life or the historical Fillmore location. The factual memory archive remains separate below.</p>

      {!story || !session || !node ? (
        <div className="story-shelf" aria-label="Story genres">
          {STORY_DEFINITIONS.map((definition) => {
            const saved = readSession(definition);
            return (
              <article className={`story-card story-${definition.id}`} key={definition.id} style={{ "--story-accent": definition.accent } as CSSProperties}>
                <img src={`${import.meta.env.BASE_URL}art/${definition.image}`} alt="" loading="lazy" />
                <span className="story-card-shade" />
                <div className="story-card-copy">
                  <span>{definition.shelfCode} // {saved ? "save detected" : "unread"}</span>
                  <h3>{definition.title}</h3>
                  <p className="story-subtitle">{definition.subtitle}</p>
                  <p>{definition.teaser}</p>
                  <button type="button" onClick={() => enterStory(definition)}>
                    {saved ? "Resume story" : "Enter story"} <i aria-hidden="true">-&gt;</i>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <article
          className={`story-stage story-${story.id}`}
          id="story-stage"
          style={{ "--story-accent": story.accent } as CSSProperties}
          data-ending={node.ending?.rank}
        >
          <img className="story-stage-art" src={`${import.meta.env.BASE_URL}art/${story.image}`} alt="" />
          <span className="story-stage-atmosphere" aria-hidden="true" />
          <header className="story-stage-header">
            <div>
              <span>{story.shelfCode} // choice {String(session.history.length + 1).padStart(2, "0")}</span>
              <h3>{story.title}</h3>
            </div>
            <div className="story-stage-actions">
              <button type="button" onClick={() => setSession(null)}>Story shelf</button>
              <button type="button" onClick={restartStory}>Restart file</button>
            </div>
          </header>

          <div className="story-reading-room">
            <div className="story-copy" tabIndex={-1} aria-live="polite">
              <span>{node.chapter}</span>
              <h4>{node.title}</h4>
              {node.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {node.ending ? (
                <div className={`story-ending rank-${node.ending.rank}`}>
                  <span>Ending recovered</span>
                  <strong>{node.ending.label}</strong>
                  <button type="button" onClick={() => setSession(null)}>Choose another file</button>
                  <button type="button" onClick={restartStory}>Read this story again</button>
                </div>
              ) : (
                <div className="story-choices" aria-label="Story choices">
                  {availableChoices(node.choices, session.flags).map((choice, index) => (
                    <button type="button" onClick={() => choose(choice)} key={`${node.id}-${choice.label}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{choice.label}</strong>
                      <small>{choice.consequence}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <aside className="story-dossier" aria-label="Story state">
              <span>Live dossier</span>
              <div className="story-stats">
                {(Object.keys(session.stats) as StoryStat[]).map((stat) => (
                  <div key={stat}>
                    <p><span>{stat}</span><strong>{session.stats[stat]}</strong></p>
                    <i><b style={{ width: `${session.stats[stat]}%` }} /></i>
                  </div>
                ))}
              </div>
              <div className="story-flags">
                <span>Evidence carried</span>
                {session.flags.length ? session.flags.slice(-6).map((flag) => <small key={flag}>{flag.replaceAll("-", " ")}</small>) : <small>Nothing yet</small>}
              </div>
            </aside>
          </div>

          <footer className="story-trace">
            <span>Decision trace // local only</span>
            <div>
              {session.history.length
                ? session.history.slice(-5).map((entry, index) => (
                    <p key={`${entry.nodeId}-${index}`}><i>{String(Math.max(1, session.history.length - 4 + index)).padStart(2, "0")}</i>{entry.choice}</p>
                  ))
                : <p><i>00</i>The file is waiting for its first decision.</p>}
            </div>
          </footer>
        </article>
      )}
    </section>
  );
}

function freshSession(story: StoryDefinition): StorySession {
  return {
    storyId: story.id,
    nodeId: story.start,
    stats: { ...initialStats },
    flags: [],
    history: [],
  };
}

function readSession(story: StoryDefinition): StorySession | null {
  try {
    const value = window.localStorage.getItem(`${savePrefix}${story.id}`);
    if (!value) return null;
    const parsed = JSON.parse(value) as StorySession;
    if (parsed.storyId !== story.id || !story.nodes[parsed.nodeId] || !parsed.stats || !Array.isArray(parsed.flags) || !Array.isArray(parsed.history)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function availableChoices(choices: StoryChoice[], flags: string[]): StoryChoice[] {
  return choices.filter((choice) => {
    const hasRequirements = (choice.requires ?? []).every((flag) => flags.includes(flag));
    const avoidsExclusions = (choice.excludes ?? []).every((flag) => !flags.includes(flag));
    return hasRequirements && avoidsExclusions;
  });
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}
