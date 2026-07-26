import { startTransition, useEffect, useRef, useState } from "react";
import { GameArcade } from "./components/GameArcade";
import { StoryArcade } from "./components/StoryArcade";
import { lifeDetails, memorialCopy, rememberedGames, terminalPrompts } from "./data/content";
import { ArcadeSoundscape, JUKEBOX_TRACKS, type JukeboxTrackId } from "./lib/audio";
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
    {
      track: "Systems",
      title: "Read the systems desk",
      url: "https://lwn.net/",
      source: "LWN.net",
      published: "Live feed warming up",
    },
    {
      track: "Architecture",
      title: "Visit the architecture shelf",
      url: "https://martinfowler.com/",
      source: "Martin Fowler",
      published: "Live feed warming up",
    },
    {
      track: "Edge and cloud",
      title: "Check the edge network",
      url: "https://blog.cloudflare.com/",
      source: "Cloudflare Blog",
      published: "Live feed warming up",
    },
    {
      track: "Play and preservation",
      title: "Enter the game history archive",
      url: "https://gamehistory.org/blog/",
      source: "Video Game History Foundation",
      published: "Live feed warming up",
    },
  ],
};

function App() {
  const [entered, setEntered] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [jukeboxTrack, setJukeboxTrack] = useState<JukeboxTrackId>("fillmore-drive");
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
      const started = await soundscape.current.start(jukeboxTrack);
      setSoundOn(started);
      return;
    }
    await soundscape.current?.stop();
    soundscape.current = null;
    setSoundOn(false);
  }

  async function selectJukeboxTrack(trackId: JukeboxTrackId) {
    setJukeboxTrack(trackId);
    soundscape.current ??= new ArcadeSoundscape();
    soundscape.current.setTrack(trackId);
    if (!soundOn) setSoundOn(await soundscape.current.start(trackId));
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
          <a href="#story-arcade">Stories</a>
          <a href="#memory-route">Route</a>
          <a href="#jukebox">Jukebox</a>
          <a href="#memory-core">Memory</a>
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
            <p className="kicker">Fillmore 1986 // Boardwalk 1987 // now</p>
            <h1 id="hero-title"><span>Cathy's</span> Memory Arcade</h1>
            <p className="hero-line">Two tokens. One memory. Infinite continues.</p>
            <button className="token-button" type="button" onClick={enterArcade}>
              <span className="token-pair" aria-hidden="true"><i>C</i><i>C</i></span>
              <span><strong>Insert two tokens</strong><small>$5 all-you-can-play // the memory was right</small></span>
              <span className="enter-arrow" aria-hidden="true">-&gt;</span>
            </button>
            <p className="hero-note">A living memorial with original games, local high scores, and infinite room to grow.</p>
          </div>
          <div className="scroll-cue" aria-hidden="true"><span>Scroll to continue</span><i /></div>
        </section>

        <GameArcade soundEnabled={soundOn} onActiveChange={(active) => soundscape.current?.setDucked(active)} />

        <StoryArcade />

        <Jukebox
          activeTrack={jukeboxTrack}
          soundOn={soundOn}
          onSelect={selectJukeboxTrack}
          onToggle={toggleSound}
        />

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
          <div className="family-memory-room section-shell" aria-labelledby="family-memory-title">
            <figure className="photo-booth-card">
              <div className="photo-booth-window">
                <img
                  src={`${import.meta.env.BASE_URL}memory/cathy-chad-photobooth-program.jpg`}
                  alt="Two original photo-booth portraits of Cathy and her son Chad laughing and making faces together"
                  loading="lazy"
                />
                <span className="photo-booth-scan" aria-hidden="true" />
              </div>
              <figcaption>
                <p className="kicker">Authorized family photograph // circa 1986</p>
                <h3 id="family-memory-title">These are the faces behind the tokens.</h3>
                <p>The exact booth and date are still unconfirmed. Chad remembers the strip as coming from around the same years as the Fillmore Street arcade trips. The expressions are unmistakably theirs.</p>
                <div className="program-links">
                  <a href={`${import.meta.env.BASE_URL}memory/cathy-chad-photobooth-program.jpg`} target="_blank" rel="noreferrer">Open program front</a>
                  <a href={`${import.meta.env.BASE_URL}memory/cathy-life-program.jpg`} target="_blank" rel="noreferrer">Read original remembrance</a>
                </div>
              </figcaption>
            </figure>
            <div className="life-file">
              <div className="life-file-heading">
                <p className="kicker">CATHY.LOG // sourced from her program</p>
                <h3>A life larger than one arcade memory.</h3>
                <p>The program provides the facts. Chad's memories provide the voice. This room keeps both visible without turning a life into a list of dates.</p>
              </div>
              <div className="life-detail-grid">
                {lifeDetails.map((detail) => (
                  <article key={detail.code}>
                    <span>{detail.code}</span>
                    <h4>{detail.title}</h4>
                    <p>{detail.body}</p>
                  </article>
                ))}
              </div>
            </div>
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

        <section className="signal-section" id="signal-machine" aria-labelledby="signal-title">
          <div className="section-shell signal-layout">
            <div className="signal-intro">
              <p className="kicker">After-hours signal booth // auto-refresh</p>
              <h2 id="signal-title">Five things worth staying late for.</h2>
              <p>The room keeps changing after closing time. A small automated reel finds one thoughtful dispatch per track from deliberately chosen independent sources.</p>
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
              <a href="#top">Return to the entrance</a>
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
  const admission = 5;
  const currentValue = valueIn2026(admission);
  const lowShare = shareOfPay(admission, 40);
  const highShare = shareOfPay(admission, 25);

  return (
    <aside className="token-ledger" aria-labelledby="ledger-title">
      <div className="ledger-display"><span>1987 // The Boardwalk</span><strong>$5</strong><small>all-you-can-play admission</small></div>
      <div className="ledger-rule"><span /><i>worth</i><span /></div>
      <div className="ledger-display current"><span>June 2026</span><strong>{formatDollars(currentValue)}</strong><small>approximate buying power</small></div>
      <div className="ledger-prototype">
        <span>Where it started</span>
        <strong>1986 // $2.50 // two hours</strong>
        <small>Saturday morning prototype at 710 E. Fillmore</small>
      </div>
      <div className="labor-share">
        <p id="ledger-title">The number that matters more</p>
        <strong>{lowShare.toFixed(1)}% - {highShare.toFixed(0)}%</strong>
        <span>of a $25-$40 large-house cleaning job</span>
      </div>
      <p className="ledger-note">CPI-U comparison using the 1987 annual index and June 2026 index. The labor comparison is Chad's family recollection; the arcade timeline is documented by the Fillmore manager.</p>
    </aside>
  );
}

function Jukebox({
  activeTrack,
  soundOn,
  onSelect,
  onToggle,
}: {
  activeTrack: JukeboxTrackId;
  soundOn: boolean;
  onSelect: (trackId: JukeboxTrackId) => void;
  onToggle: () => void;
}) {
  const selectedTrack = JUKEBOX_TRACKS.find((track) => track.id === activeTrack) ?? JUKEBOX_TRACKS[0];

  return (
    <section className="jukebox-section" id="jukebox" aria-labelledby="jukebox-title">
      <div className="section-shell jukebox-shell">
        <div className="jukebox-copy">
          <p className="kicker">Jukebox J-86 // adaptive browser score</p>
          <h2 id="jukebox-title">The room has a pulse now.</h2>
          <p>Six arrangements build and break down in real time with drums, bass, pads, lead voices, tape echo, generated reverb, and a low arcade-room hum. Five are original compositions; Mountain King '86 reimagines a public-domain Grieg melody. Free Play Forever adds a deliberately synthetic formant voice without using a singer or sample. No streams, trackers, or borrowed game audio.</p>
          <div className="mix-notes" aria-label="Soundtrack behavior">
            <span>Forms up to 24 bars</span>
            <span>20-second rave build</span>
            <span>Cabinet auto-ducking</span>
            <span>Zero audio downloads</span>
          </div>
          <button className="jukebox-power" type="button" aria-pressed={soundOn} onClick={onToggle}>
            <span className="sound-bars" aria-hidden="true"><i /><i /><i /></span>
            {soundOn ? "Stop the jukebox" : "Power up the jukebox"}
          </button>
        </div>
        <div className="jukebox-machine" aria-label="Jukebox track selector">
          <div className="jukebox-now">
            <span>{soundOn ? "Now playing // live arrangement" : "Ready // choose a reel"}</span>
            <strong>{selectedTrack.title}</strong>
            <small>{selectedTrack.mood} // {selectedTrack.bpm} BPM</small>
            <div className={soundOn ? "jukebox-meter active" : "jukebox-meter"} aria-hidden="true">
              {Array.from({ length: 16 }, (_, index) => <i key={index} />)}
            </div>
          </div>
          <div className="jukebox-tracks">
            {JUKEBOX_TRACKS.map((track, index) => (
              <button
                type="button"
                className={track.id === activeTrack ? "active" : ""}
                aria-pressed={track.id === activeTrack}
                onClick={() => onSelect(track.id)}
                key={track.id}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{track.title}</strong>
                <span className="track-bpm">{track.bpm} BPM</span>
                <small>{track.style}<br />{track.credit}</small>
                <span className="track-layers">{track.layers.join(" / ")}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;
