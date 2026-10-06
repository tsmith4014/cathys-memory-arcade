import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  getSignalMoment,
  SIGNAL_TRANSMISSION_DURATION_MS,
  SignalTransmissionScore,
} from "../lib/signalTransmission";
import { FantasySignalStory } from "./FantasySignalStory";

const reelUrl = "https://www.instagram.com/reel/Dd_tbbsNrvu/";
const reelEmbedUrl = `${reelUrl}embed/`;

type FilmState = "idle" | "playing" | "complete";

export function SignalTheater() {
  const [reelLoaded, setReelLoaded] = useState(false);
  const [reelNonce, setReelNonce] = useState(0);
  const [filmState, setFilmState] = useState<FilmState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [scoreAvailable, setScoreAvailable] = useState<boolean | null>(null);
  const timerRef = useRef<number | null>(null);
  const scoreRef = useRef<SignalTransmissionScore | null>(null);
  const moment = getSignalMoment(elapsedMs);
  const progress = Math.min(100, (elapsedMs / SIGNAL_TRANSMISSION_DURATION_MS) * 100);
  const filmStyle = { "--film-progress": `${progress}%` } as CSSProperties;

  useEffect(() => () => stopPlayback(timerRef, scoreRef), []);

  function endFilm(nextState: FilmState, nextElapsed = 0): void {
    stopPlayback(timerRef, scoreRef);
    setFilmState(nextState);
    setElapsedMs(nextElapsed);
  }

  function playFilm(): void {
    if (filmState === "playing") {
      endFilm("idle");
      return;
    }

    setReelLoaded(false);
    stopPlayback(timerRef, scoreRef);
    setElapsedMs(0);
    setFilmState("playing");
    setScoreAvailable(null);

    const score = new SignalTransmissionScore();
    scoreRef.current = score;
    void score.start().then(setScoreAvailable);
    const startedAt = performance.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      if (elapsed >= SIGNAL_TRANSMISSION_DURATION_MS) {
        stopPlayback(timerRef, scoreRef);
        setElapsedMs(SIGNAL_TRANSMISSION_DURATION_MS);
        setFilmState("complete");
        return;
      }
      setElapsedMs(elapsed);
    }, 100);
  }

  function loadReel(): void {
    endFilm("idle");
    setReelLoaded(true);
  }

  return (
    <section className="signal-theater" id="signal-theater" aria-labelledby="signal-theater-title">
      <div className="section-shell">
        <div className="signal-theater-banner">
          <img
            src={`${import.meta.env.BASE_URL}art/signal-theater-wide-v1.webp`}
            alt="An original after-hours arcade opening onto a moonlit Colorado mountain road, with two brass tokens in the foreground"
            loading="lazy"
          />
          <div className="signal-theater-heading">
            <p className="kicker">Signal Theater // house film + visiting artist</p>
            <h2 id="signal-theater-title">One signal we made.<br />One signal we admire.</h2>
            <p>The line stays clear: original work lives here; visiting work stays with its makers.</p>
          </div>
        </div>

        <div className="signal-theater-grid">
          <article className="signal-cabinet house-signal">
            <header>
              <div><span>House transmission // 001</span><strong>Signal 86: The Room Remembers</strong></div>
              <small>00:24 // original</small>
            </header>
            <div
              className={`signal-film ${filmState === "playing" ? "is-playing" : ""}`}
              data-moment={moment.id}
              style={filmStyle}
            >
              <img
                className="signal-film-art"
                src={`${import.meta.env.BASE_URL}art/signal-86-vertical-v1.webp`}
                alt="An original retro-future arcade aisle leading to a moonlit mountain portal"
                loading="lazy"
              />
              <span className="signal-film-bloom" aria-hidden="true" />
              <span className="signal-film-sweep" aria-hidden="true" />
              <span className="signal-film-dust" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</span>
              <div className="signal-film-caption">
                <span>{moment.timecode} // {moment.id}</span>
                <p>{moment.line}</p>
              </div>
              <div className="signal-film-progress" aria-hidden="true"><i /></div>
            </div>
            <div className="signal-cabinet-copy">
              <p>A tiny original film made for this room: AI-assisted artwork, hand-directed motion, and a 112 BPM score synthesized live by your browser. No samples, stream, or borrowed footage.</p>
              <button type="button" className="signal-play" aria-pressed={filmState === "playing"} onClick={playFilm}>
                <span aria-hidden="true">{filmState === "playing" ? "■" : "▶"}</span>
                {filmState === "playing" ? "Stop transmission" : filmState === "complete" ? "Replay Signal 86" : "Play Signal 86"}
              </button>
              <a className="signal-story-link" href="#road-beyond-free-play">Continue into Chapter I</a>
              <p className="signal-status" role="status" aria-live="polite">
                {filmState === "playing"
                  ? scoreAvailable === false ? "Visual transmission running. Web Audio is unavailable in this browser." : "Transmission live. Original score is building in the room."
                  : filmState === "complete" ? "Transmission complete. The floor remembers your return." : "Sound begins only when you press play."}
              </p>
            </div>
          </article>

          <article className="signal-cabinet visiting-signal">
            <header>
              <div><span>Visiting transmission // 001</span><strong>Higgsfield Genjutsu Reel</strong></div>
              <small>Instagram // credited</small>
            </header>
            <div className="instagram-stage">
              {reelLoaded ? (
                <div className="instagram-player">
                  <div className="instagram-player-controls">
                    <button type="button" onClick={() => setReelNonce((current) => current + 1)}>Restart Reel here</button>
                    <button type="button" onClick={() => setReelLoaded(false)}>Close Reel</button>
                  </div>
                  <iframe
                    key={reelNonce}
                    src={reelEmbedUrl}
                    title="Instagram Reel by bellvtrix.ai with mr_unvrs"
                    allow="autoplay; encrypted-media; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                  <small>Restart reloads Instagram's public player in this page. Instagram does not expose reliable end or loop controls to the host page.</small>
                </div>
              ) : (
                <div className="instagram-gate">
                  <span className="visiting-orbit" aria-hidden="true"><i /><i /><i /></span>
                  <p className="kicker">Visiting signal queued</p>
                  <h3>The original stays with the original artists.</h3>
                  <p>Load Instagram's official player to watch and hear the Reel without copying it into this repository.</p>
                  <button type="button" className="signal-play" onClick={loadReel}><span aria-hidden="true">↗</span>Load official Reel</button>
                  <small>Loading contacts Instagram. Its privacy and cookie terms then apply.</small>
                </div>
              )}
            </div>
            <div className="signal-cabinet-copy">
              <p>Posted by <a href="https://www.instagram.com/bellvtrix.ai/" target="_blank" rel="noreferrer">@bellvtrix.ai</a> with <a href="https://www.instagram.com/mr_unvrs/" target="_blank" rel="noreferrer">@mr_unvrs</a>, made with Higgsfield Genjutsu. Instagram credits the soundtrack as “Smalltown Boy” by Bronski Beat.</p>
              <p className="rights-note">The Reel and music are not part of this project's license. This room embeds the public post with attribution; it does not download or rehost it.</p>
              <a className="external-reel-link" href={reelUrl} target="_blank" rel="noreferrer">Open the original post on Instagram</a>
            </div>
          </article>
        </div>

        <FantasySignalStory />
      </div>
    </section>
  );
}

function stopPlayback(
  timerRef: { current: number | null },
  scoreRef: { current: SignalTransmissionScore | null },
): void {
  if (timerRef.current !== null) {
    window.clearInterval(timerRef.current);
    timerRef.current = null;
  }
  scoreRef.current?.stop();
  scoreRef.current = null;
}
