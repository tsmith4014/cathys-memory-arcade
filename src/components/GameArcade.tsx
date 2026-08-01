import { useEffect, useEffectEvent, useRef, useState } from "react";
import { arcadeGames, mountGame, type GameController, type GameDefinition, type GameHud } from "../games";
import "../gameplay.css";

type GameArcadeProps = {
  soundEnabled: boolean;
  onActiveChange: (active: boolean) => void;
};

export function GameArcade({ soundEnabled, onActiveChange }: GameArcadeProps) {
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(() => requestedGame());
  const [scoreVersion, setScoreVersion] = useState(0);
  const [progressVersion, setProgressVersion] = useState(0);

  useEffect(() => {
    onActiveChange(Boolean(activeGame));
    return () => onActiveChange(false);
  }, [activeGame, onActiveChange]);

  const closeGame = (): void => {
    const gameTitle = activeGame?.title;
    setActiveGame(null);
    setGameUrl(null);
    setScoreVersion((version) => version + 1);
    window.setTimeout(() => {
      if (!gameTitle) return;
      document.querySelector<HTMLButtonElement>(`[aria-label="Play ${gameTitle}"]`)?.focus();
    }, 0);
  };

  const launchGame = (game: GameDefinition): void => {
    setActiveGame(game);
    setGameUrl(game);
  };

  return (
    <section className="lobby section-shell" id="lobby" aria-labelledby="lobby-title">
      <div className="section-heading split-heading">
        <div>
          <p className="kicker">Free play // six cabinets humming</p>
          <h2 id="lobby-title">Pick a cabinet. Stay awhile.</h2>
        </div>
        <p>Six small games made for this room. Nothing to install, nobody keeping score except the machine, and no quarter-eating nonsense.</p>
      </div>
      <div className="game-series-heading">
        <span>The first three // quick and noisy</span>
        <p>Easy to start, worth replaying, and considerably less sticky than an actual 1986 control panel.</p>
      </div>
      <div className="game-grid">
        {arcadeGames.filter((game) => game.series === "original").map((game) => (
          <GameCard game={game} key={`${game.id}-${scoreVersion}-${progressVersion}`} onLaunch={() => launchGame(game)} />
        ))}
      </div>
      <div className="game-series-heading remix-heading">
        <span>Three longer rides // bring both tokens</span>
        <p>More rooms, stranger weather, and original characters who have made several questionable choices.</p>
      </div>
      <div className="game-grid remix-grid">
        {arcadeGames.filter((game) => game.series === "memory-remix").map((game) => (
          <GameCard game={game} key={`${game.id}-${scoreVersion}-${progressVersion}`} onLaunch={() => launchGame(game)} />
        ))}
      </div>
      <div className="floor-status" role="list" aria-label="Arcade floor status">
        <span role="listitem"><i className="status-light" /> Floor open</span>
        <span role="listitem">6 handmade games</span>
        <span role="listitem">Best scores stay here</span>
        <span role="listitem">Your place is kept on this browser</span>
      </div>
      <MemoryRoute version={progressVersion} />
      {activeGame ? (
        <GameStage
          game={activeGame}
          soundEnabled={soundEnabled}
          onClose={closeGame}
          onComplete={() => setProgressVersion((version) => version + 1)}
        />
      ) : null}
    </section>
  );
}

function GameCard({ game, onLaunch }: { game: GameDefinition; onLaunch: () => void }) {
  const [highScore, setHighScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setHighScore(readHighScore(game.id));
    setCompleted(readCompletion(game.id));
  }, [game.id]);

  return (
    <article className={`game-card tone-${game.tone}`}>
      <button type="button" className="game-launch" onClick={onLaunch} aria-label={`Play ${game.title}`}>
        <div className={`attract-screen attract-${game.id}`} aria-hidden="true">
          <img className="attract-backdrop" src={`${import.meta.env.BASE_URL}art/${backdropFor(game.id)}`} alt="" />
          <span className="attract-scan" />
          <AttractArt id={game.id} />
          <span className="attract-prompt">Press start</span>
        </div>
        <div className="game-card-copy">
          <div className="game-card-meta">
            <span className="game-cabinet">{game.cabinet} // {game.difficulty}</span>
            <span className={completed ? "chapter-state recovered" : "chapter-state"}>{completed ? "Chapter kept" : game.chapter}</span>
          </div>
          <h3>{game.title}</h3>
          <p className="game-subtitle">{game.subtitle}</p>
          <p>{game.description}</p>
          <div className="game-theme"><span>{game.theme}</span><small>{game.keepsake}</small></div>
          <div className="game-scoreline">
            <span>Local best</span>
            <strong>{String(highScore).padStart(6, "0")}</strong>
            <span className="game-card-action">Play now <i aria-hidden="true">-&gt;</i></span>
          </div>
        </div>
      </button>
    </article>
  );
}

function backdropFor(id: GameDefinition["id"]): string {
  const backdrops: Record<GameDefinition["id"], string> = {
    "skyline-smash": "highrise-havoc-backdrop-v2.webp",
    "token-trail": "sunset-run-backdrop-v2.webp",
    "dungeon-circuit": "dungeon-circuit-backdrop-v3.webp",
    "highrise-havoc": "highrise-havoc-backdrop-v3.webp",
    "sunset-run": "sunset-run-backdrop-v3.webp",
    "dragonfire-descent": "dragonfire-descent-backdrop-v3.webp",
  };
  return backdrops[id];
}

function AttractArt({ id }: { id: GameDefinition["id"] }) {
  if (id === "skyline-smash") {
    return <><i className="pixel-sun" /><i className="pixel-mountain" /><i className="pixel-tower one" /><i className="pixel-tower two" /><i className="pixel-tower three" /><i className="pixel-kaiju" /></>;
  }
  if (id === "token-trail") {
    return <><i className="trail-moon" /><i className="trail-hill one" /><i className="trail-hill two" /><i className="trail-platform one" /><i className="trail-platform two" /><i className="trail-runner" /><i className="trail-token one" /><i className="trail-token two" /><i className="trail-token three" /></>;
  }
  if (id === "dungeon-circuit") {
    return <><i className="dungeon-chamber" /><i className="dungeon-door" /><i className="dungeon-player" /><i className="dungeon-eye one" /><i className="dungeon-eye two" /><i className="dungeon-key" /></>;
  }
  if (id === "highrise-havoc") {
    return <><i className="havoc-sun" /><i className="havoc-tower one" /><i className="havoc-tower two" /><i className="havoc-tower three" /><i className="havoc-monster" /><i className="havoc-craft" /></>;
  }
  if (id === "sunset-run") {
    return <><i className="sunset-orb" /><i className="sunset-ridge" /><i className="sunset-block one" /><i className="sunset-block two" /><i className="sunset-runner" /><i className="sunset-keepsake one" /><i className="sunset-keepsake two" /></>;
  }
  return <><i className="descent-vault" /><i className="descent-fog" /><i className="descent-hero" /><i className="descent-hoard" /><i className="descent-gate" /></>;
}

function GameStage({
  game,
  soundEnabled,
  onClose,
  onComplete,
}: {
  game: GameDefinition;
  soundEnabled: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const completionReported = useRef(false);
  const [hud, setHud] = useState<GameHud>({ score: 0, status: "playing" });
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const reportCompletion = useEffectEvent(onComplete);
  const receiveHud = useEffectEvent((nextHud: GameHud) => {
    setHud(nextHud);
    setPaused(nextHud.status === "paused");
    if (nextHud.status === "won" || nextHud.status === "lost") {
      writeHighScore(game.id, nextHud.score);
      if (nextHud.status === "won" && !completionReported.current) {
        completionReported.current = true;
        writeCompletion(game.id);
        reportCompletion();
      }
    }
  });
  const requestClose = useEffectEvent(onClose);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    startButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
      if (event.key === "Escape") {
        requestClose();
        return;
      }
      if (event.repeat && ["p", "r"].includes(event.key.toLowerCase())) return;
      controllerRef.current?.setInput(event.key, true);
    };
    const onKeyUp = (event: KeyboardEvent): void => controllerRef.current?.setInput(event.key, false);
    const releaseHeldInput = (): void => {
      for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", " ", "z", "x", "Shift"]) {
        controllerRef.current?.setInput(key, false);
      }
    };
    const onVisibilityChange = (): void => { if (document.hidden) releaseHeldInput(); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseHeldInput);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseHeldInput);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [game]);

  useEffect(() => {
    if (!started) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    controllerRef.current = mountGame(canvas, game, { soundEnabled, onHud: receiveHud });
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [game, started]);

  useEffect(() => {
    controllerRef.current?.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const setControl = (key: string, active: boolean): void => controllerRef.current?.setInput(key, active);
  const togglePause = (): void => controllerRef.current?.togglePause();
  const restart = (): void => {
    completionReported.current = false;
    controllerRef.current?.restart();
  };

  return (
    <div className="game-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`game-stage tone-${game.tone}`} data-game-id={game.id} role="dialog" aria-modal="true" aria-labelledby="active-game-title">
        <header className="game-stage-header">
          <div><span>{game.cabinet} // now playing</span><h2 id="active-game-title">{game.title}</h2></div>
          <div className="game-stage-score"><span>Score</span><strong>{String(hud.score).padStart(6, "0")}</strong></div>
          <button type="button" className="game-close" onClick={onClose} aria-label={`Close ${game.title}`}>Exit</button>
        </header>
        <div className="canvas-bezel">
          <canvas ref={canvasRef} className="game-canvas" aria-label={`${game.title} game screen. ${game.objective}`} />
          {!started ? (
            <div className="game-briefing">
              <img className="game-briefing-art" src={`${import.meta.env.BASE_URL}art/${backdropFor(game.id)}`} alt="" />
              <span>{game.chapter} // {game.theme}</span>
              <h3>{game.keepsake}</h3>
              <p>{game.briefing}</p>
              <dl>
                <div><dt>Mission</dt><dd>{game.objective}</dd></div>
                <div><dt>Controls</dt><dd>{game.controls}</dd></div>
              </dl>
              <button ref={startButtonRef} type="button" onClick={() => setStarted(true)}>Begin chapter</button>
            </div>
          ) : null}
          <span className="bezel-glare" aria-hidden="true" />
        </div>
        <div className="game-console">
          <div className="game-instructions">
            <strong>{hud.status === "won" ? game.completion : game.objective}</strong>
            <span>{started ? hud.message ?? game.controls : `${game.chapter} briefing loaded`}</span>
            <small>{game.controls}</small>
          </div>
          <div className="game-console-actions">
            <button type="button" disabled={!started} onClick={togglePause}>{paused ? "Resume" : "Pause"} <kbd>P</kbd></button>
            <button type="button" disabled={!started} onClick={restart}>Restart <kbd>R</kbd></button>
          </div>
        </div>
        {started ? <TouchControls onInput={setControl} game={game} /> : null}
      </div>
    </div>
  );
}

function MemoryRoute({ version }: { version: number }) {
  const completed = arcadeGames.filter((game) => readCompletion(game.id));
  const complete = completed.length === arcadeGames.length;

  return (
    <section className="memory-route" id="memory-route" aria-labelledby="memory-route-title" data-version={version}>
      <div className="memory-route-heading">
        <div>
          <p className="kicker">Cathy route // local save file</p>
          <h3 id="memory-route-title">Six chapters. One way home.</h3>
        </div>
        <div className="route-progress" role="group" aria-label={`${completed.length} of ${arcadeGames.length} chapters finished`}>
          <strong>{completed.length}/{arcadeGames.length}</strong>
          <span>chapters carried home</span>
          <div className="route-progress-lights" aria-hidden="true">
            {arcadeGames.map((game) => <i className={readCompletion(game.id) ? "recovered" : ""} key={game.id} />)}
          </div>
        </div>
      </div>
      <p className="route-disclaimer">These cabinet stories are original metaphors inspired by known memories and Cathy's family-authorized program. They are not presented as additional biographical claims.</p>
      <div className="route-line">
        {arcadeGames.map((game, index) => {
          const recovered = readCompletion(game.id);
          return (
            <article className={`route-stop tone-${game.tone}${recovered ? " recovered" : ""}`} key={game.id}>
              <div className="route-stop-head">
                <span className="route-node">{String(index + 1).padStart(2, "0")}</span>
                <span className={`route-sigil sigil-${game.id}`} aria-hidden="true"><i /><i /><i /></span>
              </div>
              <small>{game.theme} // {recovered ? "recovered" : "chapter waiting"}</small>
              <strong>{game.keepsake}</strong>
              <p>{recovered ? game.completion : routePromise[game.id]}</p>
              <button type="button" onClick={() => {
                const target = document.querySelector<HTMLButtonElement>(`[aria-label="Play ${game.title}"]`);
                target?.click();
              }}>{recovered ? "Replay chapter" : "Enter cabinet"}</button>
            </article>
          );
        })}
      </div>
      <aside className={complete ? "route-epilogue unlocked" : "route-epilogue"}>
        <span>{complete ? "After closing // door open" : "After closing // finish all six"}</span>
        <h4>{complete ? "The lights stay on because the memory changed shape." : "There is one room behind the last cabinet."}</h4>
        <p>{complete ? "Clearing every machine was never the point. The point was making somewhere warm, a little loud, and easy to return to." : "Finish all six chapters on this browser. The last door is patient."}</p>
      </aside>
    </section>
  );
}

const routePromise: Record<GameDefinition["id"], string> = {
  "skyline-smash": "Break the skyline and keep the part of you that is still standing.",
  "token-trail": "Cross the sunrise gate with the small things you found along the way.",
  "dungeon-circuit": "Outlast three rooms and earn the continue after the hard loss.",
  "highrise-havoc": "Climb loud enough to wake the city, then stay for the beautiful mess.",
  "sunset-run": "Take the long route and bring both tokens to the same door.",
  "dragonfire-descent": "Read the guardians, break the seals, and carry morning back outside.",
};

function TouchControls({ onInput, game }: { onInput: (key: string, active: boolean) => void; game: GameDefinition }) {
  const bind = (key: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => { event.currentTarget.setPointerCapture(event.pointerId); onInput(key, true); },
    onPointerUp: () => onInput(key, false),
    onPointerCancel: () => onInput(key, false),
    onLostPointerCapture: () => onInput(key, false),
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
  });
  return (
    <div className="touch-controls" aria-label="Touch game controls">
      <div className="touch-dpad">
        <button type="button" aria-label="Move up" {...bind("ArrowUp")}>UP</button>
        <button type="button" aria-label="Move left" {...bind("ArrowLeft")}>LT</button>
        <button type="button" aria-label="Move down" {...bind("ArrowDown")}>DN</button>
        <button type="button" aria-label="Move right" {...bind("ArrowRight")}>RT</button>
      </div>
      <div className="touch-actions">
        <button type="button" className="action-secondary" aria-label={game.secondaryAction} {...bind("Shift")}>B</button>
        <button type="button" className="action-primary" aria-label={game.primaryAction} {...bind(" ")}>A</button>
      </div>
    </div>
  );
}

function readHighScore(gameId: string): number {
  try {
    return Number(window.localStorage.getItem(`cathy-arcade:${gameId}:high-score`)) || 0;
  } catch {
    return 0;
  }
}

function writeHighScore(gameId: string, score: number): void {
  try {
    const current = readHighScore(gameId);
    if (score > current) window.localStorage.setItem(`cathy-arcade:${gameId}:high-score`, String(score));
  } catch {
    // Storage can be unavailable in hardened browser modes; gameplay remains fully functional.
  }
}

function readCompletion(gameId: string): boolean {
  try {
    return window.localStorage.getItem(`cathy-arcade:${gameId}:complete`) === "true";
  } catch {
    return false;
  }
}

function writeCompletion(gameId: string): void {
  try {
    window.localStorage.setItem(`cathy-arcade:${gameId}:complete`, "true");
  } catch {
    // The story route is optional; hardened storage settings do not block gameplay.
  }
}

function requestedGame(): GameDefinition | null {
  const gameId = new URLSearchParams(window.location.search).get("game");
  return arcadeGames.find((game) => game.id === gameId) ?? null;
}

function setGameUrl(game: GameDefinition | null): void {
  const url = new URL(window.location.href);
  if (game) url.searchParams.set("game", game.id);
  else url.searchParams.delete("game");
  url.hash = "lobby";
  window.history.replaceState(null, "", url);
}
