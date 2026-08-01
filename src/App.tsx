import { useEffect, useRef, useState } from "react";
import {
  FloorMap,
  MobileFloorNav,
  useFloorPosition,
  useRevealMotion,
} from "./components/FloorNavigation";
import { GameArcade } from "./components/GameArcade";
import { StoryArcade } from "./components/StoryArcade";
import { lifeDetails, memorialCopy, rememberedGames, terminalPrompts } from "./data/content";
import {
  ArcadeSoundscape,
  JUKEBOX_TRACKS,
  getTrackScheduleDescriptor,
  playEntranceTokenSequence,
  type JukeboxTrackId,
  type MeterLevels,
  type TransportStatus,
} from "./lib/audio";
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

type EntryPhase = "idle" | "token-one" | "token-two" | "free-play" | "complete";

const entryCopy: Record<EntryPhase, string> = {
  idle: "Coin sound, cabinet lights, then the whole floor wakes up.",
  "token-one": "First token drops. The old counter remembers the sound.",
  "token-two": "Second token drops. Relays wake all the way down the row.",
  "free-play": "FREE PLAY. Every cabinet is awake.",
  complete: "The floor is open. Stay as long as you like.",
};

const silentMeter: MeterLevels = { low: 0, mid: 0, high: 0, overall: 0 };

function App() {
  const [entryPhase, setEntryPhase] = useState<EntryPhase>("idle");
  const [soundOn, setSoundOn] = useState(false);
  const [jukeboxTrack, setJukeboxTrack] = useState<JukeboxTrackId>("fillmore-drive");
  const [signals, setSignals] = useState<SignalPayload>(fallbackSignals);
  const [terminalIndex, setTerminalIndex] = useState(0);
  const [floorMapOpen, setFloorMapOpen] = useState(false);
  const soundscape = useRef<ArcadeSoundscape | null>(null);
  const entryTimers = useRef<number[]>([]);
  const activeFloor = useFloorPosition();
  useRevealMotion();

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
      entryTimers.current.forEach((timer) => window.clearTimeout(timer));
      void soundscape.current?.stop();
    };
  }, []);

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function enterArcade() {
    if (entryPhase !== "idle" && entryPhase !== "complete") return;

    entryTimers.current.forEach((timer) => window.clearTimeout(timer));
    entryTimers.current = [];
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const timings = reducedMotion
      ? { second: 80, accept: 180, finish: 520 }
      : { second: 620, accept: 1160, finish: 2100 };

    setEntryPhase("token-one");
    void playEntranceTokenSequence();
    entryTimers.current.push(
      window.setTimeout(() => setEntryPhase("token-two"), timings.second),
      window.setTimeout(() => setEntryPhase("free-play"), timings.accept),
      window.setTimeout(() => {
        setEntryPhase("complete");
        const lobby = document.getElementById("lobby");
        lobby?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        entryTimers.current.push(
          window.setTimeout(() => {
            if (!lobby) return;
            lobby.tabIndex = -1;
            lobby.focus({ preventScroll: true });
          }, reducedMotion ? 0 : 620),
        );
      }, timings.finish),
    );
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

  const entryRunning = entryPhase !== "idle" && entryPhase !== "complete";
  const creditReadout = entryPhase === "idle" ? "00" : entryPhase === "token-one" ? "01" : entryPhase === "token-two" ? "02" : "FREE PLAY";

  return (
    <div className={`site entry-${entryPhase}`} data-active-floor={activeFloor}>
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Cathy's Memory Arcade home" aria-current={activeFloor === "top" ? "location" : undefined}>
          <span className="wordmark-mark" aria-hidden="true">C</span>
          <span>Cathy's Memory Arcade</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#lobby" aria-current={activeFloor === "lobby" ? "location" : undefined}>Games</a>
          <a href="#memory-route" aria-current={activeFloor === "memory-route" ? "location" : undefined}>Route</a>
          <a href="#story-arcade" aria-current={activeFloor === "story-arcade" ? "location" : undefined}>Stories</a>
          <a href="#jukebox" aria-current={activeFloor === "jukebox" ? "location" : undefined}>Jukebox</a>
          <a href="#memory-core" aria-current={activeFloor === "memory-core" || activeFloor === "origin-terminal" ? "location" : undefined}>Memory</a>
          <a href="#signal-machine" aria-current={activeFloor === "signal-machine" ? "location" : undefined}>Signals</a>
        </nav>
        <div className="topbar-actions">
          <button className="floor-map-trigger" type="button" onClick={() => setFloorMapOpen(true)}>
            <span className="map-grid-icon" aria-hidden="true"><i /><i /><i /><i /></span>
            Floor map
          </button>
          <button className="sound-button" type="button" aria-pressed={soundOn} onClick={toggleSound}>
            <span className="sound-bars" aria-hidden="true"><i /><i /><i /></span>
            Jukebox {soundOn ? "on" : "off"}
          </button>
        </div>
        <span className="topbar-progress" aria-hidden="true"><i /></span>
      </header>

      <MobileFloorNav activeId={activeFloor} onOpenMap={() => setFloorMapOpen(true)} />
      <FloorMap open={floorMapOpen} activeId={activeFloor} onClose={() => setFloorMapOpen(false)} />

      <main id="top">
        <section className={`hero hero-${entryPhase}`} aria-labelledby="hero-title">
          <img
            className="hero-art"
            src={`${import.meta.env.BASE_URL}art/cathy-arcade-hero.jpg`}
            alt="A people-free retro-future arcade with two tokens resting together on a cabinet"
          />
          <div className="hero-shade" />
          <div className="entry-fx" aria-hidden="true">
            <div className="entry-marquee">
              <span className="entry-bulbs">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</span>
              <strong>Free play</strong>
              <span className="entry-bulbs">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</span>
            </div>
            <span className="entry-power-sweep" />
            <span className="entry-relay-flash" />
          </div>
          <div className="hero-copy">
            <p className="kicker">Fillmore 1986 // Boardwalk 1987 // now</p>
            <h1 id="hero-title"><span>Cathy's</span> Memory Arcade</h1>
            <p className="hero-line">Two tokens. One memory. Infinite continues.</p>
            <button className="token-button" type="button" onClick={enterArcade} disabled={entryRunning}>
              <span className="token-hardware" aria-hidden="true">
                <span className="token-pair"><i>C</i><i>C</i></span>
                <span className="coin-slot"><i /><small>25¢</small></span>
              </span>
              <span>
                <strong>{entryPhase === "free-play" || entryPhase === "complete" ? "Free play unlocked" : "Insert two tokens"}</strong>
                <small>{entryCopy[entryPhase]}</small>
              </span>
              <span className="credit-readout" aria-hidden="true"><small>Credit</small><b>{creditReadout}</b></span>
            </button>
            <p className="entry-status" role="status" aria-live="polite">{entryCopy[entryPhase]}</p>
            <p className="hero-note">A living memorial where the games work, the stories remember, and there is always room for one more chapter.</p>
          </div>
          <div className="scroll-cue" aria-hidden="true"><span>Scroll to continue</span><i /></div>
        </section>

        <GameArcade soundEnabled={soundOn} onActiveChange={(active) => soundscape.current?.setDucked(active)} />

        <StoryArcade />

        <Jukebox
          activeTrack={jukeboxTrack}
          soundscape={soundscape.current}
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
              <p>After closing, the reel goes looking for one thoughtful piece in each lane. The sources are independent, curious, and chosen by hand; the fresh links arrive automatically.</p>
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
            <p>Four honest answers stored right here in the page. No account, tracking, or network call.</p>
          </div>
          <div className="terminal">
            <div className="terminal-bar"><span /><span /><span /><p>CATHY_OS / MEMORY_CORE</p></div>
            <div className="terminal-body">
              <div className="terminal-output" role="status" aria-live="polite">
                <p className="terminal-command">&gt; {terminalPrompts[terminalIndex].command}</p>
                <p>{terminalPrompts[terminalIndex].response}</p>
                <span className="cursor" aria-hidden="true" />
              </div>
              <div className="terminal-choices" role="group" aria-label="Memory core questions">
                {terminalPrompts.map((prompt, index) => (
                  <button type="button" className={terminalIndex === index ? "active" : ""} aria-pressed={terminalIndex === index} onClick={() => setTerminalIndex(index)} key={prompt.command}>
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
            <h2 id="continue-title">There is still room on the floor.</h2>
            <p>This place can grow as more memories come home. New games and stories do not replace the old ones; they pull up another chair.</p>
            <div className="continue-actions">
              <a className="primary-link" href="https://github.com/tsmith4014/cathys-memory-arcade/discussions" target="_blank" rel="noreferrer">Leave a signal</a>
              <a href="#top">Return to the entrance</a>
            </div>
          </div>
          <div className="continue-token" aria-hidden="true"><span>C</span><p>Infinite<br />continues</p></div>
        </section>
      </main>

      <footer>
        <p>Made by Chad Thompson-Smith for Cathy. Colorado Springs, 1986 -&gt; everywhere, now.</p>
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
      <p className="kicker">What the tokens cost</p>
      <h3 id="ledger-title">Five dollars was not pocket change.</h3>
      <p className="ledger-lead">A large house might pay Cathy $25 to $40 to clean. The arcade admission could take one-eighth to one-fifth of that job.</p>
      <div className="ledger-keepsake">
        <span className="keepsake-token" aria-hidden="true">5</span>
        <p><strong>She turned the money into time together.</strong> Decades later, Chad still remembers the cabinets, the hard games, and who brought him through the door.</p>
      </div>
      <div className="admission-timeline" aria-label="Unlimited-play arcade timeline">
        <article><span>1986 // Fillmore</span><strong>$2.50</strong><p>Two hours on a Saturday morning. The experiment begins.</p></article>
        <article><span>1987 // Boardwalk</span><strong>$5</strong><p>The whole arcade goes to free play. Stay until it is time to go home.</p></article>
      </div>
      <details className="ledger-math">
        <summary>Put the five dollars in context</summary>
        <p>That admission was about {formatDollars(currentValue)} in June 2026 buying power, using CPI-U. Against the remembered cleaning pay, it was roughly {lowShare.toFixed(1)}% to {highShare.toFixed(0)}% of one large-house job.</p>
        <small>The pay comparison is Chad's family recollection. The arcade timeline comes from the Fillmore manager's surviving account.</small>
      </details>
    </aside>
  );
}

function Jukebox({
  activeTrack,
  soundscape,
  soundOn,
  onSelect,
  onToggle,
}: {
  activeTrack: JukeboxTrackId;
  soundscape: ArcadeSoundscape | null;
  soundOn: boolean;
  onSelect: (trackId: JukeboxTrackId) => void;
  onToggle: () => void;
}) {
  const [meterLevels, setMeterLevels] = useState<MeterLevels>(silentMeter);
  const [transportStatus, setTransportStatus] = useState<TransportStatus | null>(null);
  const selectedTrack = JUKEBOX_TRACKS.find((track) => track.id === activeTrack) ?? JUKEBOX_TRACKS[0];
  const trackForm = getTrackScheduleDescriptor(activeTrack);
  const formLabel = transportStatus?.section.replaceAll("-", " ") ?? "needle lifted";
  const meterBands = [
    meterLevels.low, meterLevels.low, meterLevels.low, meterLevels.low, meterLevels.low,
    meterLevels.mid, meterLevels.mid, meterLevels.mid, meterLevels.mid, meterLevels.mid, meterLevels.mid,
    meterLevels.high, meterLevels.high, meterLevels.high, meterLevels.high, meterLevels.high,
  ];

  useEffect(() => {
    if (!soundOn || !soundscape) {
      setMeterLevels(silentMeter);
      setTransportStatus(null);
      return undefined;
    }

    const readSoundscape = (): void => {
      setMeterLevels(soundscape.getMeterLevels());
      setTransportStatus(soundscape.getTransportStatus());
    };
    readSoundscape();
    const timer = window.setInterval(readSoundscape, 120);
    return () => window.clearInterval(timer);
  }, [activeTrack, soundOn, soundscape]);

  return (
    <section className="jukebox-section" id="jukebox" aria-labelledby="jukebox-title">
      <div className="section-shell jukebox-shell">
        <div className="jukebox-copy">
          <p className="kicker">Jukebox J-86 // music made in the room</p>
          <h2 id="jukebox-title">Pick a song. Let the room breathe.</h2>
          <p>Six songs live inside this jukebox. They stretch, build, break, and find their way home a little differently each time you press play. Most are original; Mountain King '86 gives a public-domain Grieg melody a new set of neon shoes.</p>
          <div className="mix-notes" role="list" aria-label="About the jukebox">
            <span role="listitem">Long-form arrangements</span>
            <span role="listitem">Built in your browser</span>
            <span role="listitem">Ducks while you play</span>
            <span role="listitem">No borrowed game audio</span>
          </div>
          <button className="jukebox-power" type="button" aria-pressed={soundOn} onClick={onToggle}>
            <span className="sound-bars" aria-hidden="true"><i /><i /><i /></span>
            {soundOn ? "Stop the jukebox" : "Power up the jukebox"}
          </button>
        </div>
        <div className="jukebox-machine" role="group" aria-label="Jukebox track selector">
          <div className="jukebox-now">
            <div className={soundOn ? "jukebox-reel spinning" : "jukebox-reel"} aria-hidden="true">
              <i className="reel-groove one" />
              <i className="reel-groove two" />
              <span>C</span>
              <b className="selection-arm" />
            </div>
            <p className="entry-status" role="status" aria-live="polite">{soundOn ? `Now playing ${selectedTrack.title}` : "Jukebox ready"}</p>
            <div className="jukebox-display">
              <span>{soundOn ? "Now playing // live arrangement" : "Ready // choose a record"}</span>
              <strong>{selectedTrack.title}</strong>
              <small>{selectedTrack.mood} // {selectedTrack.bpm} BPM</small>
              <div className="transport-line" aria-hidden="true">
                <span>{formLabel}</span>
                <b>{transportStatus ? `bar ${transportStatus.bar + 1} / ${transportStatus.formBars}` : "waiting for play"}</b>
              </div>
              <ol className="arrangement-map" aria-label={`${selectedTrack.title} arrangement`}>
                {trackForm.sections.map((section) => (
                  <li className={transportStatus?.section === section.id ? "active" : ""} key={section.id}>
                    <span>{section.label}</span>
                    <small>{section.startBar + 1}-{section.endBar + 1}</small>
                  </li>
                ))}
              </ol>
              <div className={soundOn ? "jukebox-meter active" : "jukebox-meter"} aria-hidden="true">
                {meterBands.map((level, index) => {
                  const ripple = [0.72, 0.9, 1, 0.82][index % 4];
                  const height = soundOn ? Math.max(8, Math.min(100, level * ripple * 185)) : 10;
                  return <i key={index} style={{ height: `${height}%` }} />;
                })}
              </div>
            </div>
          </div>
          <div className="jukebox-tracks" role="group" aria-label="Records">
            {JUKEBOX_TRACKS.map((track, index) => (
              <button
                type="button"
                className={track.id === activeTrack ? "active" : ""}
                aria-pressed={track.id === activeTrack}
                aria-label={`${track.title}. ${track.style}. ${track.credit}. ${track.bpm} BPM.`}
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
