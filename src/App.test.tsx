import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("Cathy's Memory Arcade", () => {
  it("presents the memorial entrance and keeps sound off by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /cathy's memory arcade/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /insert two tokens/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sound off/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("offers four distinct cabinet destinations", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: /memory core/i })).toHaveAttribute("href", "#memory-core");
    expect(screen.getByRole("link", { name: /project arcade/i })).toHaveAttribute("href", "#project-arcade");
    expect(screen.getByRole("link", { name: /signal machine/i })).toHaveAttribute("href", "#signal-machine");
    expect(screen.getByRole("link", { name: /origin terminal/i })).toHaveAttribute("href", "#origin-terminal");
  });

  it("changes the memory terminal response without a network request", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /why ai/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/first week at code platoon/i);
  });
});
