import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";

describe("Cathy's Memory Arcade", () => {
  beforeEach(() => window.localStorage.clear());

  it("presents the memorial entrance and keeps sound off by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /cathy's memory arcade/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /insert two tokens/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sound off/i })).toHaveAttribute("aria-pressed", "false");
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
    expect(screen.getByText("$5", { selector: ".ledger-display strong" })).toBeInTheDocument();
    expect(screen.getByText(/all-you-can-play admission/i)).toBeInTheDocument();
    expect(screen.getByText(/1986 \/\/ \$2.50 \/\/ two hours/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /room has a pulse now/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /power up the jukebox/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /mountain king/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /garden static/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /free play forever/i })).toBeInTheDocument();
    expect(screen.getByText(/six arrangements build and break down/i)).toBeInTheDocument();
    expect(screen.getByText(/forms up to 24 bars/i)).toBeInTheDocument();
  });

  it("enters a branching story and persists its decision locally", () => {
    render(<App />);
    const horrorCard = screen.getByRole("heading", { name: "The Last Token" }).closest("article");
    expect(horrorCard).not.toBeNull();
    fireEvent.click(within(horrorCard!).getByRole("button", { name: /enter story/i }));
    expect(screen.getByRole("heading", { name: /something finishes booting in the dark/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /walk straight to the cabinet/i }));
    expect(screen.getByRole("heading", { name: /attract screen knows there should be two players/i })).toBeInTheDocument();
    expect(window.localStorage.getItem("cathy-arcade:story:horror")).toContain("\"nodeId\":\"h1\"");
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
    expect(screen.getByRole("status")).toHaveTextContent(/first week at code platoon/i);
  });
});
