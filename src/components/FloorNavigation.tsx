import { useEffect, useEffectEvent, useRef, useState } from "react";

export type FloorStopId =
  | "top"
  | "lobby"
  | "memory-route"
  | "story-arcade"
  | "jukebox"
  | "memory-core"
  | "signal-machine"
  | "origin-terminal";

type FloorStop = {
  id: FloorStopId;
  code: string;
  label: string;
  title: string;
  description: string;
};

type LocalProgress = {
  completedGames: number;
  savedStories: number;
};

export const FLOOR_STOPS: FloorStop[] = [
  { id: "top", code: "00", label: "Entrance", title: "Two tokens in", description: "Start with the coin drop and wake the whole floor." },
  { id: "lobby", code: "01", label: "Games", title: "Six working cabinets", description: "Quick rounds, longer chapters, local scores, and real endings." },
  { id: "memory-route", code: "02", label: "Route 86", title: "Carry six chapters home", description: "A local save route that changes as each cabinet is cleared." },
  { id: "story-arcade", code: "03", label: "Stories", title: "After Closing", description: "Three illustrated branching stories that remember every choice." },
  { id: "jukebox", code: "04", label: "Jukebox", title: "Six browser-built records", description: "Long-form arrangements, live meters, and no borrowed game audio." },
  { id: "memory-core", code: "05", label: "Memory", title: "The five-dollar summer", description: "Family photographs, sourced history, and the person behind the tokens." },
  { id: "signal-machine", code: "06", label: "Signals", title: "The after-hours reel", description: "Five fresh links from independent technical and preservation sources." },
  { id: "origin-terminal", code: "07", label: "Ask", title: "The memory terminal", description: "Four honest answers stored locally in the page." },
];

export function useFloorPosition(): FloorStopId {
  const [activeId, setActiveId] = useState<FloorStopId>("top");

  useEffect(() => {
    let frame = 0;

    const update = (): void => {
      frame = 0;
      const marker = Math.min(window.innerHeight * 0.34, 300);
      let nextActive: FloorStopId = "top";

      for (const stop of FLOOR_STOPS) {
        const element = document.getElementById(stop.id);
        if (element && element.getBoundingClientRect().top <= marker) nextActive = stop.id;
      }

      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      document.documentElement.style.setProperty("--floor-progress", `${progress * 100}%`);
      setActiveId((current) => current === nextActive ? current : nextActive);
    };

    const schedule = (): void => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--floor-progress");
    };
  }, []);

  return activeId;
}

export function useRevealMotion(): void {
  useEffect(() => {
    const selector = [
      ".section-heading",
      ".game-series-heading",
      ".game-card",
      ".memory-route",
      ".story-intro-heading",
      ".story-card",
      ".jukebox-copy",
      ".jukebox-machine",
      ".memory-story",
      ".token-ledger",
      ".photo-booth-card",
      ".life-file",
      ".game-memory-strip",
      ".signal-intro",
      ".signal-reel",
      ".terminal",
      ".continue-copy",
      ".continue-token",
    ].join(",");
    const targets = [...document.querySelectorAll<HTMLElement>(selector)];
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    document.documentElement.classList.add("reveal-ready");
    targets.forEach((target, index) => {
      target.classList.add("reveal-target");
      target.style.setProperty("--reveal-order", String(index % 4));
    });

    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return () => cleanupRevealTargets(targets);
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

    for (const target of targets) {
      const bounds = target.getBoundingClientRect();
      if (bounds.top < window.innerHeight * 0.94 && bounds.bottom > 0) target.classList.add("is-visible");
      else observer.observe(target);
    }

    return () => {
      observer.disconnect();
      cleanupRevealTargets(targets);
    };
  }, []);
}

export function MobileFloorNav({ activeId, onOpenMap }: { activeId: FloorStopId; onOpenMap: () => void }) {
  return (
    <nav className="mobile-floor-nav" aria-label="Mobile arcade navigation">
      <MobileStop href="#lobby" code="01" label="Play" active={activeId === "lobby" || activeId === "memory-route"} />
      <MobileStop href="#story-arcade" code="P2" label="Read" active={activeId === "story-arcade"} />
      <button type="button" className="mobile-map-button" onClick={onOpenMap} aria-label="Open mobile floor map">
        <span aria-hidden="true">MAP</span>
        <small>Floor</small>
      </button>
      <MobileStop href="#jukebox" code="J6" label="Listen" active={activeId === "jukebox"} />
      <MobileStop href="#memory-core" code="C" label="Remember" active={["memory-core", "signal-machine", "origin-terminal"].includes(activeId)} />
    </nav>
  );
}

export function FloorMap({ open, activeId, onClose }: { open: boolean; activeId: FloorStopId; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [progress, setProgress] = useState<LocalProgress>({ completedGames: 0, savedStories: 0 });
  const requestClose = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    setProgress(readLocalProgress());
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  const totalProgress = progress.completedGames + progress.savedStories;
  return (
    <div className="floor-map-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="floor-map-panel" role="dialog" aria-modal="true" aria-labelledby="floor-map-title" ref={panelRef}>
        <div className="floor-map-header">
          <div>
            <span>Arcade directory // all floors</span>
            <h2 id="floor-map-title">Choose your next room.</h2>
          </div>
          <button type="button" onClick={onClose} ref={closeRef}>Close map</button>
        </div>
        <div className="floor-map-summary">
          <span className="floor-map-token" aria-hidden="true">C</span>
          <div>
            <small>Local save card</small>
            <strong>{totalProgress ? progressSummary(progress) : "Fresh floor // every door is open"}</strong>
            <p>Progress stays in this browser. Nothing here requires an account.</p>
          </div>
        </div>
        <div className="floor-map-grid">
          {FLOOR_STOPS.map((stop) => (
            <a
              href={`#${stop.id}`}
              className={activeId === stop.id ? "floor-map-stop active" : "floor-map-stop"}
              aria-current={activeId === stop.id ? "location" : undefined}
              onClick={onClose}
              key={stop.id}
            >
              <span>{stop.code}</span>
              <small>{stop.label}</small>
              <strong>{stop.title}</strong>
              <p>{stop.description}</p>
              <b>{statusFor(stop.id, progress)}</b>
            </a>
          ))}
        </div>
        <div className="floor-map-footer">
          <span><i /> Floor open</span>
          <p>Pick a room or press Escape to return.</p>
        </div>
      </div>
    </div>
  );
}

function MobileStop({ href, code, label, active }: { href: string; code: string; label: string; active: boolean }) {
  return (
    <a href={href} aria-current={active ? "location" : undefined}>
      <span aria-hidden="true">{code}</span>
      <small>{label}</small>
    </a>
  );
}

function readLocalProgress(): LocalProgress {
  const gameIds = ["skyline-smash", "token-trail", "dungeon-circuit", "highrise-havoc", "sunset-run", "dragonfire-descent"];
  const storyIds = ["horror", "action", "mystery"];
  try {
    return {
      completedGames: gameIds.filter((id) => window.localStorage.getItem(`cathy-arcade:${id}:complete`) === "true").length,
      savedStories: storyIds.filter((id) => Boolean(window.localStorage.getItem(`cathy-arcade:story:${id}`))).length,
    };
  } catch {
    return { completedGames: 0, savedStories: 0 };
  }
}

function statusFor(id: FloorStopId, progress: LocalProgress): string {
  if (id === "lobby" || id === "memory-route") return `${progress.completedGames}/6 chapters kept`;
  if (id === "story-arcade") return `${progress.savedStories}/3 files opened`;
  if (id === "jukebox") return "6 records ready";
  if (id === "signal-machine") return "5 fresh signals";
  if (id === "origin-terminal") return "4 local answers";
  if (id === "memory-core") return "Family archive";
  return "Start here";
}

function progressSummary(progress: LocalProgress): string {
  const chapters = progress.completedGames === 1 ? "chapter" : "chapters";
  const files = progress.savedStories === 1 ? "story file" : "story files";
  return `${progress.completedGames} ${chapters} kept // ${progress.savedStories} ${files} open`;
}

function cleanupRevealTargets(targets: HTMLElement[]): void {
  document.documentElement.classList.remove("reveal-ready");
  targets.forEach((target) => {
    target.classList.remove("reveal-target", "is-visible");
    target.style.removeProperty("--reveal-order");
  });
}
