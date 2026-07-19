import { useEffect, useEffectEvent, useRef, useState } from "react";
import { arcadeGames, mountGame, type GameController, type GameDefinition, type GameHud } from "../games";

type GameArcadeProps = {
  soundEnabled: boolean;
  onActiveChange: (active: boolean) => void;
};

export function GameArcade({ soundEnabled, onActiveChange }: GameArcadeProps) {
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(() => requestedGame());
  const [scoreVersion, setScoreVersion] = useState(0);

  useEffect(() => {
    onActiveChange(Boolean(activeGame));
    return () => onActiveChange(false);
  }, [activeGame, onActiveChange]);

  const closeGame = (): void => {
    setActiveGame(null);
    setGameUrl(null);
    setScoreVersion((version) => version + 1);
  };

  const launchGame = (game: GameDefinition): void => {
    setActiveGame(game);
    setGameUrl(game);
  };

  return (
    <section className="lobby section-shell" id="lobby" aria-labelledby="lobby-title">
      <div className="section-heading split-heading">
        <div>
          <p className="kicker">Free play // six cabinets online</p>
          <h2 id="lobby-title">Pick a game. Chase the board.</h2>
        </div>
        <p>Original games, rendered live in your browser. No downloads, accounts, ads, tracking, commercial characters, or borrowed cabinet art.</p>
      </div>
      <div className="game-series-heading">
        <span>Original trilogy // upgraded</span>
        <p>Fast arcade experiments with new movement, scoring, and power systems.</p>
      </div>
      <div className="game-grid">
        {arcadeGames.filter((game) => game.series === "original").map((game) => (
          <GameCard game={game} key={`${game.id}-${scoreVersion}`} onLaunch={() => launchGame(game)} />
        ))}
      </div>
      <div className="game-series-heading remix-heading">
        <span>Memory remix // three deeper successors</span>
        <p>Genre-faithful tributes built from original code, art, levels, characters, and sound.</p>
      </div>
      <div className="game-grid remix-grid">
        {arcadeGames.filter((game) => game.series === "memory-remix").map((game) => (
          <GameCard game={game} key={`${game.id}-${scoreVersion}`} onLaunch={() => launchGame(game)} />
        ))}
      </div>
      <div className="floor-status" aria-label="Arcade floor status">
        <span><i className="status-light" /> Floor open</span>
        <span>6 original games</span>
        <span>Local high scores</span>
        <span>Keyboard + touch + sound</span>
      </div>
      {activeGame ? <GameStage game={activeGame} soundEnabled={soundEnabled} onClose={closeGame} /> : null}
    </section>
  );
}

function GameCard({ game, onLaunch }: { game: GameDefinition; onLaunch: () => void }) {
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    setHighScore(readHighScore(game.id));
  }, [game.id]);

  return (
    <article className={`game-card tone-${game.tone}`}>
      <button type="button" className="game-launch" onClick={onLaunch} aria-label={`Play ${game.title}`}>
        <div className={`attract-screen attract-${game.id}`} aria-hidden="true">
          <span className="attract-scan" />
          <AttractArt id={game.id} />
          <span className="attract-prompt">Press start</span>
        </div>
        <div className="game-card-copy">
          <span className="game-cabinet">{game.cabinet} // {game.difficulty}</span>
          <h3>{game.title}</h3>
          <p className="game-subtitle">{game.subtitle}</p>
          <p>{game.description}</p>
          <div className="game-scoreline"><span>Local best</span><strong>{String(highScore).padStart(6, "0")}</strong></div>
        </div>
      </button>
    </article>
  );
}

function AttractArt({ id }: { id: GameDefinition["id"] }) {
  if (id === "skyline-smash") {
    return <><i className="pixel-sun" /><i className="pixel-mountain" /><i className="pixel-tower one" /><i className="pixel-tower two" /><i className="pixel-tower three" /><i className="pixel-kaiju" /></>;
  }
  if (id === "token-trail") {
    return <><i className="trail-moon" /><i className="trail-hill one" /><i className="trail-hill two" /><i className="trail-platform one" /><i className="trail-platform two" /><i className="trail-runner" /><i className="trail-token one" /><i className="trail-token two" /><i className="trail-token three" /></>;
  }
  if (id === "dungeon-circuit") {
    return <><i className="dungeon-grid" /><i className="dungeon-door" /><i className="dungeon-player" /><i className="dungeon-eye one" /><i className="dungeon-eye two" /><i className="dungeon-key" /></>;
  }
  if (id === "highrise-havoc") {
    return <><i className="havoc-sun" /><i className="havoc-tower one" /><i className="havoc-tower two" /><i className="havoc-tower three" /><i className="havoc-monster" /><i className="havoc-craft" /></>;
  }
  if (id === "sunset-run") {
    return <><i className="sunset-orb" /><i className="sunset-ridge" /><i className="sunset-block one" /><i className="sunset-block two" /><i className="sunset-runner" /><i className="sunset-keepsake one" /><i className="sunset-keepsake two" /></>;
  }
  return <><i className="descent-maze" /><i className="descent-fog" /><i className="descent-hero" /><i className="descent-hoard" /><i className="descent-gate" /></>;
}

function GameStage({ game, soundEnabled, onClose }: { game: GameDefinition; soundEnabled: boolean; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [hud, setHud] = useState<GameHud>({ score: 0, status: "playing" });
  const [paused, setPaused] = useState(false);
  const receiveHud = useEffectEvent((nextHud: GameHud) => {
    setHud(nextHud);
    setPaused(nextHud.status === "paused");
    if (nextHud.status === "won" || nextHud.status === "lost") writeHighScore(game.id, nextHud.score);
  });
  const requestClose = useEffectEvent(onClose);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    controllerRef.current = mountGame(canvas, game, { soundEnabled, onHud: receiveHud });
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent): void => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
      if (event.key === "Escape") {
        requestClose();
        return;
      }
      controllerRef.current?.setInput(event.key, true);
    };
    const onKeyUp = (event: KeyboardEvent): void => controllerRef.current?.setInput(event.key, false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.body.style.overflow = previousOverflow;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [game]);

  useEffect(() => {
    controllerRef.current?.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const setControl = (key: string, active: boolean): void => controllerRef.current?.setInput(key, active);
  const togglePause = (): void => controllerRef.current?.togglePause();
  const restart = (): void => controllerRef.current?.restart();

  return (
    <div className="game-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`game-stage tone-${game.tone}`} role="dialog" aria-modal="true" aria-labelledby="active-game-title">
        <header className="game-stage-header">
          <div><span>{game.cabinet} // now playing</span><h2 id="active-game-title">{game.title}</h2></div>
          <div className="game-stage-score"><span>Score</span><strong>{String(hud.score).padStart(6, "0")}</strong></div>
          <button ref={closeButtonRef} type="button" className="game-close" onClick={onClose} aria-label={`Close ${game.title}`}>Exit</button>
        </header>
        <div className="canvas-bezel">
          <canvas ref={canvasRef} className="game-canvas" aria-label={`${game.title} game screen. ${game.objective}`} />
          <span className="bezel-glare" aria-hidden="true" />
        </div>
        <div className="game-console">
          <div className="game-instructions"><strong>{game.objective}</strong><span>{hud.message ?? game.controls}</span><small>{game.controls}</small></div>
          <div className="game-console-actions">
            <button type="button" onClick={togglePause}>{paused ? "Resume" : "Pause"} <kbd>P</kbd></button>
            <button type="button" onClick={restart}>Restart <kbd>R</kbd></button>
          </div>
        </div>
        <TouchControls onInput={setControl} game={game} />
      </div>
    </div>
  );
}

function TouchControls({ onInput, game }: { onInput: (key: string, active: boolean) => void; game: GameDefinition }) {
  const bind = (key: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => { event.currentTarget.setPointerCapture(event.pointerId); onInput(key, true); },
    onPointerUp: () => onInput(key, false),
    onPointerCancel: () => onInput(key, false),
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
