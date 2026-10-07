import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  FANTASY_STORY_CHAPTERS,
  FANTASY_STORY_DURATION_MS,
  FANTASY_STORY_TRANSITION_MS,
  getFantasyStoryMoment,
} from "../data/signalStory";
import { FantasyTransmissionScore } from "../lib/fantasyTransmission";
import { BrowserStoryNarrator } from "../lib/storyNarration";

type PlaybackState = "idle" | "playing" | "transitioning" | "complete";

const chapterAccents = ["#ffbf57", "#ff8c5a", "#7ce0a5", "#e8a46d", "#76efe0", "#ff6f61", "#ffd978", "#f3bd62"] as const;

export function FantasySignalStory() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [seriesRunning, setSeriesRunning] = useState(false);
  const [transitionIndex, setTransitionIndex] = useState<number | null>(null);
  const [scoreAvailable, setScoreAvailable] = useState<boolean | null>(null);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [narrationAvailable, setNarrationAvailable] = useState<boolean | null>(null);
  const [narratorVoice, setNarratorVoice] = useState("Best available English voice");
  const timerRef = useRef<number | null>(null);
  const transitionRef = useRef<number | null>(null);
  const runRef = useRef(0);
  const scoreRef = useRef<FantasyTransmissionScore | null>(null);
  const narratorRef = useRef<BrowserStoryNarrator | null>(null);
  const spokenBeatRef = useRef("");
  const chapter = FANTASY_STORY_CHAPTERS[activeIndex];
  const moment = getFantasyStoryMoment(chapter, elapsedMs);
  const progress = Math.min(100, (elapsedMs / chapter.durationMs) * 100);
  const stageStyle = {
    "--story-progress": `${progress}%`,
    "--story-accent": chapterAccents[activeIndex],
    "--story-duration": `${chapter.durationMs}ms`,
    "--story-transition-duration": `${FANTASY_STORY_TRANSITION_MS}ms`,
  } as CSSProperties;
  const isRunning = playback === "playing" || playback === "transitioning";

  useEffect(() => {
    const narrator = new BrowserStoryNarrator({
      onSpeakingChange: (speaking) => scoreRef.current?.setNarrationActive(speaking),
      onVoiceChange: setNarratorVoice,
    });
    narratorRef.current = narrator;
    const narrationSupported = BrowserStoryNarrator.isSupported();
    setNarrationAvailable(narrationSupported);
    if (!narrationSupported) setNarrationEnabled(false);

    return () => {
      runRef.current += 1;
      clearTimers(timerRef, transitionRef);
      narrator.cancel();
      narratorRef.current = null;
      scoreRef.current?.stop();
      scoreRef.current = null;
    };
  }, []);

  useEffect(() => {
    const narrator = narratorRef.current;
    if (!narrator) return;

    if (!narrationEnabled || playback === "idle" || playback === "complete") {
      narrator.cancel();
      spokenBeatRef.current = "";
      return;
    }

    const isBridge = playback === "transitioning" && transitionIndex !== null;
    const spokenBeat = isBridge
      ? `${chapter.id}:bridge:${transitionIndex}`
      : `${chapter.id}:${moment.id}`;
    if (spokenBeatRef.current === spokenBeat) return;

    spokenBeatRef.current = spokenBeat;
    const text = isBridge
      ? `But ${chapter.bridge.but} Therefore ${chapter.bridge.therefore}`
      : moment.line;
    const available = narrator.speak(text, isBridge ? 1.02 : 0.92);
    if (!available) setNarrationAvailable(false);
  }, [chapter, moment, narrationEnabled, playback, transitionIndex]);

  function stopStory(nextState: PlaybackState = "idle"): void {
    runRef.current += 1;
    clearTimers(timerRef, transitionRef);
    scoreRef.current?.silence();
    narratorRef.current?.cancel();
    spokenBeatRef.current = "";
    setSeriesRunning(false);
    setTransitionIndex(null);
    setPlayback(nextState);
  }

  function selectChapter(index: number): void {
    stopStory();
    setActiveIndex(index);
    setElapsedMs(0);
    setScoreAvailable(null);
  }

  function startChapter(index: number, playSeries: boolean): void {
    clearTimers(timerRef, transitionRef);
    const nextChapter = FANTASY_STORY_CHAPTERS[index];
    const run = ++runRef.current;
    setActiveIndex(index);
    setElapsedMs(0);
    setPlayback("playing");
    setSeriesRunning(playSeries);
    setTransitionIndex(null);
    setScoreAvailable(null);

    scoreRef.current ??= new FantasyTransmissionScore();
    void scoreRef.current.play(nextChapter).then((available) => {
      if (runRef.current === run) setScoreAvailable(available);
    });

    const startedAt = performance.now();
    timerRef.current = window.setInterval(() => {
      if (runRef.current !== run) return;
      const nextElapsed = performance.now() - startedAt;
      if (nextElapsed < nextChapter.durationMs) {
        setElapsedMs(nextElapsed);
        return;
      }

      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
      setElapsedMs(nextChapter.durationMs);
      scoreRef.current?.silence();

      if (playSeries && index < FANTASY_STORY_CHAPTERS.length - 1) {
        const followingChapter = FANTASY_STORY_CHAPTERS[index + 1];
        setPlayback("transitioning");
        setTransitionIndex(index + 1);
        scoreRef.current?.playBridge(followingChapter);
        transitionRef.current = window.setTimeout(() => {
          transitionRef.current = null;
          if (runRef.current === run) startChapter(index + 1, true);
        }, FANTASY_STORY_TRANSITION_MS);
        return;
      }

      setPlayback("complete");
      setSeriesRunning(false);
    }, 100);
  }

  function toggleChapter(): void {
    if (isRunning) {
      stopStory();
      return;
    }
    startChapter(activeIndex, false);
  }

  const playbackLabel = isRunning
    ? "Stop chapter"
    : playback === "complete" ? `Replay chapter ${chapter.number}` : `Play chapter ${chapter.number}`;
  const storyFrames = [chapter.art, ...(chapter.animationFrames ?? [])];

  return (
    <section className="fantasy-signal-story" id="road-beyond-free-play" aria-labelledby="fantasy-story-title">
      <header className="fantasy-story-heading">
        <div>
          <p className="kicker">House serial // eight chapters // original fantasy</p>
          <h3 id="fantasy-story-title">The Road Beyond Free Play</h3>
        </div>
        <div className="fantasy-story-deck">
          <p>Signal 86 was only the door. Follow Coda, Cat, Runt, a brass raven with flexible ethics, and the last song before midnight.</p>
          <span>Original fantasy // Cat and Runt use family-authorized likenesses</span>
        </div>
      </header>

      <div className="fantasy-story-console">
        <div
          className={`fantasy-story-stage ${playback === "playing" ? "is-playing" : ""} ${playback === "transitioning" ? "is-turning" : ""}`}
          data-effect={chapter.effect}
          data-medium={chapter.medium}
          style={stageStyle}
        >
          <div
            key={chapter.id}
            className={`fantasy-story-art ${storyFrames.length > 1 ? "has-living-frames" : ""}`}
          >
            {storyFrames.map((frame, index) => (
              <img
                key={frame}
                src={`${import.meta.env.BASE_URL}${frame}`}
                alt={index === 0 ? chapter.alt : ""}
                aria-hidden={index === 0 ? undefined : true}
              />
            ))}
          </div>
          <div className="fantasy-story-shade" aria-hidden="true" />
          <div className="fantasy-story-motion" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => (
              <i
                key={index}
                style={{
                  "--particle-x": `${(index * 37 + 11) % 96}%`,
                  "--particle-delay": `${-(index % 9) * 0.47}s`,
                  "--particle-size": `${3 + (index % 4) * 2}px`,
                } as CSSProperties}
              />
            ))}
          </div>
          <div className="fantasy-story-scope" aria-hidden="true">
            <span>CH {chapter.number}</span>
            <span>{chapter.bpm} BPM</span>
          </div>
          <div
            className="fantasy-story-caption"
            aria-atomic="true"
            aria-live={narrationEnabled && narrationAvailable ? "off" : "polite"}
          >
            <span>{moment.timecode} // subtitles // {moment.id}</span>
            <p>{moment.line}</p>
          </div>
          {transitionIndex !== null ? (
            <div
              className="fantasy-comic-break"
              role="status"
              aria-live={narrationEnabled && narrationAvailable ? "off" : "polite"}
            >
              <div><span>But</span><p>{chapter.bridge.but}</p></div>
              <i aria-hidden="true" />
              <div>
                <span>Therefore</span>
                <p>{chapter.bridge.therefore}</p>
                <strong>Next // Chapter {FANTASY_STORY_CHAPTERS[transitionIndex].number}</strong>
              </div>
            </div>
          ) : null}
          <div className="fantasy-story-progress" aria-hidden="true"><i /></div>
        </div>

        <aside className="fantasy-story-controls" aria-label="Fantasy serial controls">
          <div className="fantasy-story-number" aria-hidden="true">{chapter.number}</div>
          <p className="kicker">Chapter {chapter.number} // {chapter.medium}</p>
          <h4>{chapter.title}</h4>
          <p className="fantasy-story-subtitle">{chapter.subtitle}</p>
          <dl className="fantasy-story-specs">
            <div><dt>Runtime</dt><dd>{formatTime(chapter.durationMs)}</dd></div>
            <div><dt>Pulse</dt><dd>{chapter.bpm} BPM</dd></div>
            <div><dt>Score</dt><dd>Live synthesis</dd></div>
          </dl>
          <div className="fantasy-story-actions">
            {!seriesRunning ? (
              <button type="button" className="signal-play" aria-pressed={isRunning} onClick={toggleChapter}>
                <span aria-hidden="true">{isRunning ? "■" : "▶"}</span>{playbackLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="fantasy-series-play"
              aria-pressed={seriesRunning}
              onClick={() => seriesRunning ? stopStory() : startChapter(0, true)}
            >
              {seriesRunning ? "Stop full story" : `Play full story // ${formatTime(FANTASY_STORY_DURATION_MS)}`}
            </button>
          </div>
          <div className="fantasy-narration-control">
            <button
              type="button"
              aria-label={narrationEnabled ? "Turn story narration off" : "Turn story narration on"}
              aria-pressed={narrationEnabled}
              disabled={narrationAvailable === false}
              onClick={() => setNarrationEnabled((enabled) => !enabled)}
            >
              <span aria-hidden="true">{narrationEnabled ? "VOICE ON" : "VOICE OFF"}</span>
              <strong>{narrationEnabled ? "Read this story aloud" : "Captions only"}</strong>
            </button>
            <p>
              {narrationAvailable === false
                ? "Spoken narration is unavailable in this browser; synchronized captions remain on."
                : narrationEnabled
                  ? `${narratorVoice}. The score lowers automatically beneath each line.`
                  : "Narration is off. Captions and the original score remain on."}
            </p>
          </div>
          <div className="fantasy-story-skip">
            <button type="button" onClick={() => selectChapter(activeIndex - 1)} disabled={activeIndex === 0}>← Previous</button>
            <span>{activeIndex + 1} / {FANTASY_STORY_CHAPTERS.length}</span>
            <button type="button" onClick={() => selectChapter(activeIndex + 1)} disabled={activeIndex === FANTASY_STORY_CHAPTERS.length - 1}>Next →</button>
          </div>
          <p className="signal-status" role="status" aria-live="polite">
            {playback === "playing"
              ? scoreAvailable === false
                ? "The film is running silently because Web Audio is unavailable."
                : seriesRunning ? "Full-story mode is live. Narration, captions, and score are moving together." : "Chapter live. Narration and the original score are being performed by your browser."
              : playback === "transitioning" ? "Turning the page. The comic panel stays up long enough to read and hear." : playback === "complete" ? "Chapter complete. Replay it or choose the next reel." : "Press play for synchronized motion, spoken captions, and an original procedural score."}
          </p>
        </aside>
      </div>

      <ol className="fantasy-chapter-reel" aria-label="The Road Beyond Free Play chapters">
        {FANTASY_STORY_CHAPTERS.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={index === activeIndex ? "step" : undefined}
              aria-label={`Open chapter ${item.number}: ${item.title}`}
              onClick={() => selectChapter(index)}
            >
              <span className="fantasy-chapter-thumb">
                <img src={`${import.meta.env.BASE_URL}${item.art}`} alt="" loading="lazy" />
                <i aria-hidden="true">{item.number}</i>
              </span>
              <span><small>Chapter {item.number}</small><strong>{item.title}</strong></span>
            </button>
          </li>
        ))}
      </ol>

      <aside className="sibling-signal-map" aria-labelledby="sibling-signal-title">
        <div>
          <p className="kicker">World file // season one</p>
          <h4 id="sibling-signal-title">Two lights found.<br />Four stories protected.</h4>
          <p>Cat and Runt open the first road. The remaining siblings enter this world one at a time, only when their names, memories, and images are ready.</p>
        </div>
        <ol aria-label="Six sibling story signals">
          <li className="found"><i aria-hidden="true">01</i><span><small>Signal found</small><strong>Cat</strong></span></li>
          <li className="found"><i aria-hidden="true">02</i><span><small>Signal found</small><strong>Runt</strong></span></li>
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index}><i aria-hidden="true">{String(index + 3).padStart(2, "0")}</i><span><small>Story protected</small><strong>Waiting</strong></span></li>
          ))}
        </ol>
      </aside>
    </section>
  );
}

function clearTimers(
  timerRef: { current: number | null },
  transitionRef: { current: number | null },
): void {
  if (timerRef.current !== null) window.clearInterval(timerRef.current);
  if (transitionRef.current !== null) window.clearTimeout(transitionRef.current);
  timerRef.current = null;
  transitionRef.current = null;
}

function formatTime(milliseconds: number): string {
  const seconds = Math.round(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
