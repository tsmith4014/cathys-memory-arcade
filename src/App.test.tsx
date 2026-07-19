import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("Cathy's Memory Arcade", () => {
  it("presents the memorial entrance and keeps sound off by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /cathy's memory arcade/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /insert two tokens/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sound off/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("offers three original playable cabinets before the portfolio content", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /play skyline smash/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play token trail/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play dungeon circuit/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workshop" })).toHaveAttribute("href", "#project-arcade");
  });

  it("changes the memory terminal response without a network request", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /why ai/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/first week at code platoon/i);
  });
});
