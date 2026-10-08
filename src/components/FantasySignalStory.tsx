import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  FANTASY_STORY_CHAPTERS,
  FANTASY_STORY_DURATION_MS,
  FANTASY_NARRATION_PREVIEW_PATH,
  FANTASY_NARRATION_VOICE,
  FANTASY_STORY_TRANSITION_MS,
  getFantasyBridgeNarrationPath,
  getFantasyMomentNarrationPath,
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
  const [narratorVoice, setNarratorVoice] = useState(`${FANTASY_NARRATION_VOICE} // recorded generative voice`);
  const [narrationSpeaking, setNarrationSpeaking] = useState(false);
  const [narrationIssue, setNarrationIssue] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const transitionRef = useRef<number | null>(null);
  const runRef = useRef(0);
  const scoreRef = useRef<FantasyTransmissionScore | null>(null);
  const narratorRef = useRef<BrowserStoryNarrator | null>(null);
  const spokenBeatRef = useRef("");
  const chapter = FANTASY_STORY_CHAPTERS[activeIndex];
  const moment = getFantasyStoryMoment(chapter, elapsedMs);
  const momentIndex = chapter.moments.indexOf(moment);
  const nextMomentStartsAt = chapter.moments[momentIndex + 1]?.startsAt ?? chapter.durationMs;
  const beatDurationMs = Math.max(2_000, nextMomentStartsAt - moment.startsAt);
  const progress = Math.min(100, (elapsedMs / chapter.durationMs) * 100);
  const stageStyle = {
    "--story-progress": `${progress}%`,
    "--story-accent": chapterAccents[activeIndex],
    "--story-duration": `${chapter.durationMs}ms`,
    "--story-beat-duration": `${beatDurationMs}ms`,
    "--story-transition-duration": `${FANTASY_STORY_TRANSITION_MS}ms`,
  } as CSSProperties;
  const isRunning = playback === "playing" || playback === "transitioning";
  const isBridge = playback === "transitioning" && transitionIndex !== null;
  const captionLine = isBridge
    ? `But ${chapter.bridge.but} Therefore ${chapter.bridge.therefore}`
    : moment.line;
  const captionLabel = isBridge ? "page turn // but therefore" : `${moment.timecode} // subtitles // ${moment.id}`;

  useEffect(() => {
    const narrator = new BrowserStoryNarrator({
      onSpeakingChange: (speaking) => {
        setNarrationSpeaking(speaking);
        scoreRef.current?.setNarrationActive(speaking);
      },
      onVoiceChange: setNarratorVoice,
      onError: setNarrationIssue,
    });
    narratorRef.current = narrator;
    const narrationSupported = BrowserStoryNarrator.isSupported();
    setNarrationAvailable(narrationSupported);
    if (!narrationSupported) setNarrationEnabled(false);

    return () => {
      runRef.current += 1;
      clearTimers(timerRef, transitionRef);
      narrator.dispose();
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

    const spokenBeat = isBridge
      ? `${chapter.id}:bridge:${transitionIndex}`
      : `${chapter.id}:${moment.id}`;
    if (spokenBeatRef.current === spokenBeat) return;

    spokenBeatRef.current = spokenBeat;
    const text = isBridge
      ? `But ${chapter.bridge.but} Therefore ${chapter.bridge.therefore}`
      : moment.line;
    const recordingPath = isBridge
      ? getFantasyBridgeNarrationPath(chapter.id)
      : getFantasyMomentNarrationPath(chapter.id, moment.id);
    const available = narrator.speak(
      text,
      isBridge ? 1.02 : 0.92,
      `${import.meta.env.BASE_URL}${recordingPath}`,
    );
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

  function startChapter(index: number, playSeries: boolean, fromUserGesture = false): void {
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

    if (fromUserGesture && narrationEnabled && narrationAvailable !== false) {
      const firstMoment = nextChapter.moments[0];
      spokenBeatRef.current = `${nextChapter.id}:${firstMoment.id}`;
      const available = narratorRef.current?.speak(
        firstMoment.line,
        0.92,
        `${import.meta.env.BASE_URL}${getFantasyMomentNarrationPath(nextChapter.id, firstMoment.id)}`,
      ) ?? false;
      if (!available) setNarrationAvailable(false);
    }

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
    startChapter(activeIndex, false, true);
  }

  function toggleNarration(): void {
    if (narrationEnabled) {
      narratorRef.current?.cancel();
      spokenBeatRef.current = "";
      setNarrationEnabled(false);
      setNarrationIssue(null);
      return;
    }

    setNarrationEnabled(true);
    setNarrationIssue(null);
  }

  function hearNarration(): void {
    if (!narrationEnabled || narrationAvailable === false) return;
    const text = playback === "playing"
      ? moment.line
      : "Narration is ready. Press play when you are ready to begin.";
    const recordingPath = playback === "playing"
      ? getFantasyMomentNarrationPath(chapter.id, moment.id)
      : FANTASY_NARRATION_PREVIEW_PATH;
    spokenBeatRef.current = playback === "playing"
      ? `${chapter.id}:${moment.id}`
      : "voice-preview";
    const available = narratorRef.current?.speak(
      text,
      playback === "playing" ? 0.92 : 0.96,
      `${import.meta.env.BASE_URL}${recordingPath}`,
    ) ?? false;
    if (!available) setNarrationAvailable(false);
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
          className={`fantasy-story-visual ${playback === "transitioning" ? "is-turning" : ""}`}
          style={stageStyle}
        >
          <div
            className={`fantasy-story-stage ${playback === "playing" ? "is-playing" : ""} ${playback === "transitioning" ? "is-turning" : ""}`}
            data-effect={chapter.effect}
            data-medium={chapter.medium}
            data-shot={momentIndex % 3}
            data-transition-ms={FANTASY_STORY_TRANSITION_MS}
          >
          <div
            key={`${chapter.id}-${moment.id}`}
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
          <div key={`light-${chapter.id}-${moment.id}`} className="fantasy-story-cinema" aria-hidden="true">
            <i className="fantasy-cinema-sweep" />
            <i className="fantasy-cinema-depth" />
            <i className="fantasy-cinema-pulse" />
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
              <aside className="fantasy-comic-hold" aria-hidden="true">
                <span>10-second reading hold</span>
                <b><i /></b>
              </aside>
            </div>
          ) : null}
          <div className="fantasy-story-progress" aria-hidden="true"><i /></div>
          </div>
          <div
            key={`caption-${chapter.id}-${isBridge ? "bridge" : moment.id}`}
            className="fantasy-story-caption"
            aria-atomic="true"
            aria-live={narrationEnabled && narrationAvailable ? "off" : "polite"}
          >
            <span>{captionLabel}</span>
            <p>{captionLine}</p>
          </div>
        </div>

        <aside className="fantasy-story-controls" aria-label="Fantasy serial controls">
          <div className="fantasy-story-number" aria-hidden="true">{chapter.number}</div>
          <p className="kicker">Chapter {chapter.number} // {chapter.medium}</p>
          <h4>{chapter.title}</h4>
          <p className="fantasy-story-subtitle">{chapter.subtitle}</p>
          <dl className="fantasy-story-specs">
            <div><dt>Runtime</dt><dd>{formatTime(chapter.durationMs)}</dd></div>
            <div><dt>Pulse</dt><dd>{chapter.bpm} BPM</dd></div>
            <div><dt>Score</dt><dd>Adaptive suite</dd></div>
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
              onClick={() => seriesRunning ? stopStory() : startChapter(0, true, true)}
            >
              {seriesRunning ? "Stop full story" : `Play full story // ${formatTime(FANTASY_STORY_DURATION_MS)}`}
            </button>
          </div>
          <div className="fantasy-narration-control">
            <div className="fantasy-narration-buttons">
              <button
                type="button"
                aria-label={narrationEnabled ? "Turn story narration off" : "Turn story narration on"}
                aria-pressed={narrationEnabled}
                disabled={narrationAvailable === false}
                onClick={toggleNarration}
              >
                <span aria-hidden="true">{narrationEnabled ? "VOICE ON" : "VOICE OFF"}</span>
                <strong>{narrationEnabled ? "Read this story aloud" : "Captions only"}</strong>
              </button>
              <button
                type="button"
                className="fantasy-voice-preview"
                disabled={!narrationEnabled || narrationAvailable === false}
                onClick={hearNarration}
              >
                <span aria-hidden="true">VOICE CHECK</span>
                <strong>{narrationSpeaking ? "Speaking now" : "Hear voice"}</strong>
              </button>
            </div>
            <p aria-live="polite" data-speaking={narrationSpeaking || undefined}>
              {narrationAvailable === false
                ? "Spoken narration is unavailable in this browser; synchronized captions remain below the film."
                : narrationIssue
                  ? narrationIssue
                : narrationEnabled
                  ? narrationSpeaking
                    ? `${narratorVoice} is speaking now. The score is lowered beneath the voice.`
                    : `${narratorVoice} ready. Press Hear voice once if your browser has not unlocked audio.`
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
                ? "The procedural score is unavailable; narration, captions, and cinematic motion continue."
                : seriesRunning ? "Full-story mode is live. Recorded narration, captions, living frames, and score are moving together." : "Chapter live. Recorded narration and an adaptive original score are playing together."
              : playback === "transitioning" ? "Turning the page. This comic panel holds for ten measured seconds." : playback === "complete" ? "Chapter complete. Replay it or choose the next reel." : "Press play for living artwork, recorded narration, clear captions, and an adaptive original score."}
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
