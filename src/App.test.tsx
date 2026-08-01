import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";

describe("Cathy's Memory Arcade", () => {
  beforeEach(() => window.localStorage.clear());

  it("presents the memorial entrance and keeps sound off by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /cathy's memory arcade/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /insert two tokens/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /jukebox off/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("turns two tokens into a full entrance ceremony before moving focus", () => {
    vi.useFakeTimers();
    const { container } = render(<App />);
    const site = container.firstElementChild;
    const entranceStatus = container.querySelector(".entry-status");
    const tokenButton = screen.getByRole("button", { name: /insert two tokens/i });

    fireEvent.click(tokenButton);
    expect(site).toHaveClass("entry-token-one");
    expect(tokenButton).toBeDisabled();
    expect(entranceStatus).toHaveTextContent(/first token drops/i);

    act(() => vi.advanceTimersByTime(620));
    expect(site).toHaveClass("entry-token-two");
    expect(entranceStatus).toHaveTextContent(/second token drops/i);

    act(() => vi.advanceTimersByTime(540));
    expect(site).toHaveClass("entry-free-play");
    expect(entranceStatus).toHaveTextContent(/every cabinet is awake/i);

    act(() => vi.advanceTimersByTime(940));
    expect(site).toHaveClass("entry-complete");
    expect(screen.getByRole("button", { name: /free play unlocked/i })).toBeEnabled();

    act(() => vi.advanceTimersByTime(620));
    expect(document.getElementById("lobby")).toHaveFocus();
    vi.useRealTimers();
  });

  it("shortens the entrance ceremony when reduced motion is requested", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /insert two tokens/i }));
    act(() => vi.advanceTimersByTime(520));
    act(() => vi.advanceTimersByTime(1));

    expect(container.firstElementChild).toHaveClass("entry-complete");
    expect(document.getElementById("lobby")).toHaveFocus();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("offers six original playable cabinets and a connected memory route", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /play skyline smash/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play token trail/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play dungeon circuit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play highrise havoc/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play sunset run/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play dragonfire descent/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Route" })).toHaveAttribute("href", "#memory-route");
    expect(screen.getByRole("link", { name: "Stories" })).toHaveAttribute("href", "#story-arcade");
    expect(screen.getByRole("heading", { name: /six chapters. one way home/i })).toBeInTheDocument();
    expect(screen.queryByText(/the work that keeps the lights on/i)).not.toBeInTheDocument();
  });

  it("documents the five-dollar unlimited-play timeline and exposes the jukebox", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /five dollars was not pocket change/i })).toBeInTheDocument();
    expect(screen.getByText("$5", { selector: ".admission-timeline strong" })).toBeInTheDocument();
    expect(screen.getByText("$2.50", { selector: ".admission-timeline strong" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pick a song. let the room breathe/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /power up the jukebox/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /mountain king/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /garden static/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /free play forever/i })).toBeInTheDocument();
    expect(screen.getByText(/six songs live inside this jukebox/i)).toBeInTheDocument();
    expect(screen.getByText(/long-form arrangements/i)).toBeInTheDocument();
  });

  it("shows each record's form before the listener powers up the jukebox", () => {
    render(<App />);
    const fillmoreForm = screen.getByRole("list", { name: /fillmore after dark arrangement/i });
    expect(within(fillmoreForm).getByText("Intro")).toBeInTheDocument();
    expect(within(fillmoreForm).getByText("Last light")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /moxie's midnight run/i }));
    const moxieForm = screen.getByRole("list", { name: /moxie's midnight run arrangement/i });
    expect(within(moxieForm).getByText("Slow bloom")).toBeInTheDocument();
    expect(within(moxieForm).getByText("Bass drop")).toBeInTheDocument();
    expect(within(moxieForm).getByText("Return")).toBeInTheDocument();
  });

  it("enters a branching story and persists its decision locally", () => {
    render(<App />);
    const horrorCard = screen.getByRole("heading", { name: "The Last Token" }).closest("article");
    expect(horrorCard).not.toBeNull();
    fireEvent.click(within(horrorCard!).getByRole("button", { name: /enter story/i }));
    expect(screen.getByRole("heading", { name: /one cabinet stays on/i })).toBeInTheDocument();
    expect(document.querySelector(".story-stage")).toHaveAttribute("data-scene-art", "world");
    expect(document.querySelector(".story-scene-beat")).toHaveTextContent(/warm token dated tomorrow/i);
    expect(screen.getByRole("button", { name: /turn back one page/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /walk straight to the cabinet/i }));
    expect(screen.getByRole("heading", { name: /player two is late/i })).toBeInTheDocument();
    expect(window.localStorage.getItem("cathy-arcade:story:horror")).toContain("\"nodeId\":\"h1\"");
    fireEvent.click(screen.getByRole("button", { name: /turn back one page/i }));
    expect(screen.getByRole("heading", { name: /one cabinet stays on/i })).toBeInTheDocument();
    expect(screen.getByText(/tomorrow-dated token/i)).toBeInTheDocument();
  });

  it("uses the authorized family photograph and Catherine's program details", () => {
    render(<App />);
    expect(screen.getByRole("img", { name: /two original photo-booth portraits/i })).toBeInTheDocument();
    expect(screen.getByText(/moxie, gardens, motorcycles/i)).toBeInTheDocument();
    expect(screen.getByText(/born january 13, 1960/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read original remembrance/i })).toHaveAttribute("href", "/memory/cathy-life-program.jpg");
  });

  it("changes the memory terminal response without a network request", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /why ai/i }));
    expect(screen.getByText(/first week at code platoon/i)).toBeInTheDocument();
  });
});
