import { startTransition, useEffect, useRef, useState } from "react";
import { GameArcade } from "./components/GameArcade";
import { memorialCopy, projects, rememberedGames, terminalPrompts } from "./data/content";
import { ArcadeSoundscape } from "./lib/audio";
import { formatDollars, shareOfPay, valueIn2026 } from "./lib/currency";
import type { SignalPayload } from "./types";

const fallbackSignals: SignalPayload = {
  generatedAt: "",
  signals: [
    {
      track: "AI practice",
      title: "Open the live signal reel",
      url: "https://simonwillison.net/",
      source: "Simon Willison",
      published: "Live feed warming up",
    },
  ],
};

function App() {
  const [entered, setEntered] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [signals, setSignals] = useState<SignalPayload>(fallbackSignals);
  const [terminalIndex, setTerminalIndex] = useState(0);
  const soundscape = useRef<ArcadeSoundscape | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.BASE_URL}data/signals.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`signal feed returned ${response.status}`);
        return response.json() as Promise<SignalPayload>;
      })
      .then((payload) => {
        if (active && payload.signals?.length) setSignals(payload);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      void soundscape.current?.stop();
    };
  }, []);

  function enterArcade() {
    startTransition(() => setEntered(true));
    window.setTimeout(() => document.getElementById("lobby")?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  async function toggleSound() {
    const next = !soundOn;
    if (next) {
      soundscape.current ??= new ArcadeSoundscape();
      const started = await soundscape.current.start();
      setSoundOn(started);
      return;
    }
    await soundscape.current?.stop();
    soundscape.current = null;
    setSoundOn(false);
  }

  return (
    <div className={entered ? "site entered" : "site"}>
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Cathy's Memory Arcade home">
          <span className="wordmark-mark" aria-hidden="true">C</span>
          <span>Cathy's Memory Arcade</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#lobby">Games</a>
          <a href="#memory-core">Memory</a>
          <a href="#project-arcade">Workshop</a>
        </nav>
        <button className="sound-button" type="button" aria-pressed={soundOn} onClick={toggleSound}>
          <span className="sound-bars" aria-hidden="true"><i /><i /><i /></span>
          Sound {soundOn ? "on" : "off"}
        </button>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <img
            className="hero-art"
            src={`${import.meta.env.BASE_URL}art/cathy-arcade-hero.jpg`}
            alt="A people-free retro-future arcade with two tokens resting together on a cabinet"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="kicker">Colorado Springs // 710 E. Fillmore // 1986 -&gt; now</p>
            <h1 id="hero-title"><span>Cathy's</span> Memory Arcade</h1>
            <p className="hero-line">Two tokens. One memory. Infinite continues.</p>
            <button className="token-button" type="button" onClick={enterArcade}>
              <span className="token-pair" aria-hidden="true"><i>C</i><i>C</i></span>
              <span><strong>Insert two tokens</strong><small>$2.50 each, one for both of us</small></span>
              <span className="enter-arrow" aria-hidden="true">-&gt;</span>
            </button>
            <p className="hero-note">A living memorial with original games, local high scores, and infinite room to grow.</p>
          </div>
          <div className="scroll-cue" aria-hidden="true"><span>Scroll to continue</span><i /></div>
        </section>

        <GameArcade soundEnabled={soundOn} />

        <section className="memory-section" id="memory-core" aria-labelledby="memory-title">
          <div className="section-shell memory-layout">
            <div className="memory-story">
              <p className="kicker">{memorialCopy.eyebrow}</p>
              <h2 id="memory-title">{memorialCopy.title}</h2>
              <p className="lead">{memorialCopy.lead}</p>
              <blockquote>{memorialCopy.quote}</blockquote>
              <p>{memorialCopy.body}</p>
              <div className="source-links">
                <a href="https://www.artieromero.com/video_games.html" target="_blank" rel="noreferrer">See the surviving arcade history and photographs</a>
                <a href="https://www.bls.gov/data/inflation_calculator_inside.htm" target="_blank" rel="noreferrer">Inflation method</a>
              </div>
              <aside className="archive-note">
                <span>Archive note // source respected</span>
                <p>Actual Nickels &amp; Dimes photographs survive on historian Artie Romero's site. They are linked, not copied here, because the images are copyrighted. If permission is secured, they can become a future archive room with full attribution.</p>
              </aside>
            </div>
            <TokenLedger />
          </div>
          <div className="game-memory-strip section-shell" aria-labelledby="games-title">
            <div className="game-title-block">
              <p className="kicker">Chad's save file</p>
              <h3 id="games-title">Three cabinets survived the years.</h3>
            </div>
            {rememberedGames.map((game, index) => (
              <article className="game-memory" key={game.title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div><h4>{game.title}</h4><p>{game.note}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="projects-section section-shell" id="project-arcade" aria-labelledby="projects-title">
          <div className="section-heading split-heading">
            <div><p className="kicker">Builder's workshop // behind the arcade</p><h2 id="projects-title">The work that keeps the lights on.</h2></div>
            <p>The arcade is the experience. This quieter room shows the mobile, cloud, infrastructure, and AI practice behind it.</p>
          </div>
          <div className="project-grid">
            {projects.map((project) => {
              const content = (
                <>
                  <div className="project-topline"><span>{project.code}</span><span>{project.status}</span></div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <ul aria-label={`${project.title} technologies`}>
                    {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                  <span className="project-action">{project.href ? "Launch cabinet ->" : "Case study loading"}</span>
                </>
              );
              return project.href ? (
                <a className="project-card" href={project.href} target="_blank" rel="noreferrer" key={project.code}>{content}</a>
              ) : (
                <article className="project-card" key={project.code}>{content}</article>
              );
            })}
          </div>
        </section>

        <section className="signal-section" id="signal-machine" aria-labelledby="signal-title">
          <div className="section-shell signal-layout">
            <div className="signal-intro">
              <p className="kicker">Signal Machine // auto-refresh</p>
              <h2 id="signal-title">Fresh inputs, low noise.</h2>
              <p>A GitHub Actions pipeline scans a deliberately small pool of respected technical sources and keeps one fresh item per track.</p>
              <p className="generated-time">{signals.generatedAt ? `Last reel change: ${new Date(signals.generatedAt).toLocaleString()}` : "Live reel warming up"}</p>
            </div>
            <div className="signal-reel" aria-live="polite">
              {signals.signals.map((signal, index) => (
                <a href={signal.url} target="_blank" rel="noreferrer" className="signal-row" key={`${signal.track}-${signal.url}`}>
                  <span className="signal-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="signal-track">{signal.track}</span>
                  <strong>{signal.title}</strong>
                  <span className="signal-source">{signal.source} // {signal.published}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="origin-section section-shell" id="origin-terminal" aria-labelledby="origin-title">
          <div className="section-heading split-heading">
            <div><p className="kicker">Origin Terminal // human in the loop</p><h2 id="origin-title">Ask the memory core.</h2></div>
            <p>A small, local conversation. No tracking, account, API, or pretend intelligence required.</p>
          </div>
          <div className="terminal">
            <div className="terminal-bar"><span /><span /><span /><p>CATHY_OS / MEMORY_CORE</p></div>
            <div className="terminal-body">
              <div className="terminal-output" role="status" aria-live="polite">
                <p className="terminal-command">&gt; {terminalPrompts[terminalIndex].command}</p>
                <p>{terminalPrompts[terminalIndex].response}</p>
                <span className="cursor" aria-hidden="true" />
              </div>
              <div className="terminal-choices" aria-label="Memory core questions">
                {terminalPrompts.map((prompt, index) => (
                  <button type="button" className={terminalIndex === index ? "active" : ""} onClick={() => setTerminalIndex(index)} key={prompt.command}>
                    <span>{String(index + 1).padStart(2, "0")}</span>{prompt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="continue-section" aria-labelledby="continue-title">
          <div className="continue-copy">
            <p className="kicker">Continue?</p>
            <h2 id="continue-title">The archive stays unfinished on purpose.</h2>
            <p>New memories, experiments, and people can enter without erasing what came before.</p>
            <div className="continue-actions">
              <a className="primary-link" href="https://github.com/tsmith4014/cathys-memory-arcade/discussions" target="_blank" rel="noreferrer">Leave a signal</a>
              <a href="https://github.com/tsmith4014" target="_blank" rel="noreferrer">Visit Chad on GitHub</a>
            </div>
          </div>
          <div className="continue-token" aria-hidden="true"><span>C</span><p>Infinite<br />continues</p></div>
        </section>
      </main>

      <footer>
        <p>Built by Chad Thompson-Smith in memory of Cathy. Colorado Springs, 1986 -&gt; everywhere, now.</p>
        <div><a href="https://github.com/tsmith4014/cathys-memory-arcade">Source</a><a href={`${import.meta.env.BASE_URL}credits.html`}>Credits and context</a></div>
      </footer>
    </div>
  );
}

function TokenLedger() {
  const combinedAdmission = 5;
  const currentValue = valueIn2026(combinedAdmission);
  const lowShare = shareOfPay(combinedAdmission, 40);
  const highShare = shareOfPay(combinedAdmission, 25);

  return (
    <aside className="token-ledger" aria-labelledby="ledger-title">
      <div className="ledger-display"><span>1986</span><strong>$2.50 x 2</strong><small>possible Saturday admission</small></div>
      <div className="ledger-rule"><span /><i>worth</i><span /></div>
      <div className="ledger-display current"><span>June 2026</span><strong>{formatDollars(currentValue)}</strong><small>approximate buying power</small></div>
      <div className="labor-share">
        <p id="ledger-title">The number that matters more</p>
        <strong>{lowShare.toFixed(1)}% - {highShare.toFixed(0)}%</strong>
        <span>of a $25-$40 large-house cleaning job</span>
      </div>
      <p className="ledger-note">CPI-U comparison using 1986 annual and June 2026 indexes. Memory details remain labeled as memory.</p>
    </aside>
  );
}

export default App;
