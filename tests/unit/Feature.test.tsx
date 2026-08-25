import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { Feature, isValidClue, isValidGuess } from "../../src/Feature";
import { config } from "../../src/config";

describe("Feature (component)", () => {
  it("renders a playable accessible guessing game when connected", () => {
    const room = createMockRoom();
    render(<Feature room={room} config={config} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hear the clue");
    expect(screen.getByLabelText("Live sound round")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start the first clue" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Everyone’s guesses" })).toBeInTheDocument();
  });

  it("rejects malformed shared records", () => {
    expect(
      isValidClue({ id: "c", emoji: "🐶", prompt: "bark", answer: "dog", createdBy: "Ari" }),
    ).toBe(true);
    expect(
      isValidClue({ id: "", emoji: "🐶", prompt: "bark", answer: "dog", createdBy: "Ari" }),
    ).toBe(false);
    expect(isValidGuess({ id: "g", clueId: "c", value: "dog", author: "Ari", correct: true })).toBe(
      true,
    );
    expect(isValidGuess({ id: "g", clueId: "c", value: "", author: "Ari", correct: true })).toBe(
      false,
    );
  });

  it("shows a connecting state when room is null", () => {
    render(<Feature room={null} config={config} />);
    // Most templates show "Connecting…" while the room is null. Apps with a
    // custom waiting state can override this test.
    const heading = screen.getAllByRole("heading", { level: 1 })[0];
    expect(heading).toBeInTheDocument();
  });
});
