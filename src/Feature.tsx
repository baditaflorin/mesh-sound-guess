import { useMemo, useState } from "react";
import {
  MeshButton,
  MeshLaunch,
  MeshNameInput,
  MeshPresence,
  MeshStatusPill,
  MeshSurface,
  useNamedPeer,
  useSharedCollection,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };
type SoundClue = { id: string; emoji: string; prompt: string; answer: string; createdBy: string };
type Guess = { id: string; clueId: string; value: string; author: string; correct: boolean };

const CLUES: Omit<SoundClue, "id" | "createdBy">[] = [
  { emoji: "🐶", prompt: "A familiar bark", answer: "dog" },
  { emoji: "🚪", prompt: "A visitor at the door", answer: "doorbell" },
  { emoji: "🌧️", prompt: "Drops on a window", answer: "rain" },
  { emoji: "🔥", prompt: "A cozy evening sound", answer: "fire" },
  { emoji: "🚂", prompt: "Rolling down the tracks", answer: "train" },
  { emoji: "👏", prompt: "A crowd celebrates", answer: "applause" },
];

const validText = (value: unknown, max: number) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

export const isValidClue = (item: SoundClue): boolean =>
  validText(item.id, 64) &&
  validText(item.emoji, 12) &&
  validText(item.prompt, 100) &&
  validText(item.answer, 40) &&
  validText(item.createdBy, 48);

export const isValidGuess = (item: Guess): boolean =>
  validText(item.id, 64) &&
  validText(item.clueId, 64) &&
  validText(item.value, 80) &&
  validText(item.author, 48) &&
  typeof item.correct === "boolean";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function randomId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function SoundWave() {
  return (
    <div className="sound-wave" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function Feature({ room, config }: Props) {
  const { name, setName, myName, names } = useNamedPeer(config, room);
  const clues = useSharedCollection<SoundClue>(room, "mesh-sound-guess:clues", {
    validate: isValidClue,
  });
  const guesses = useSharedCollection<Guess>(room, "mesh-sound-guess:guesses", {
    validate: isValidGuess,
  });
  const [guess, setGuess] = useState("");
  const activeClue = clues.items.at(-1);
  const clueGuesses = useMemo(
    () => guesses.items.filter((item) => item.clueId === activeClue?.id),
    [activeClue?.id, guesses.items],
  );
  const correctGuesses = clueGuesses.filter((item) => item.correct);
  const score = guesses.items.filter((item) => item.author === myName && item.correct).length;
  const peopleHere = room ? Math.max(1, room.peerCount + 1, Object.keys(names).length) : 0;

  const startClue = () => {
    const candidate = CLUES[clues.items.length % CLUES.length] ?? CLUES[0];
    if (!candidate || !room) return;
    clues.add({ ...candidate, id: randomId("clue"), createdBy: myName });
    setGuess("");
    document.getElementById("sound-round")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submitGuess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeClue || !validText(guess, 80)) return;
    guesses.add({
      id: randomId("guess"),
      clueId: activeClue.id,
      value: guess.trim(),
      author: myName,
      correct: normalize(guess) === normalize(activeClue.answer),
    });
    setGuess("");
  };

  const focusName = () => {
    document.getElementById("sound-identity")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    document.querySelector<HTMLInputElement>("#sound-identity .mesh-name-input-field")?.focus();
  };

  const launchPrimaryAction = room
    ? {
        label: activeClue ? "Choose another clue" : "Start the first clue",
        onClick: startClue,
      }
    : {
        label: "Preparing the room",
        onClick: startClue,
        disabled: true,
      };

  return (
    <main className="sound-guess">
      <MeshLaunch
        className="sound-launch"
        eyebrow="Shared sound room"
        heading={
          <>
            Hear the clue.
            <br />
            Make the room guess.
          </>
        }
        promise="A fast, voice-free sound game for the people already here. Start a clue, make a guess, and keep the round moving together."
        presence={
          <MeshPresence
            count={peopleHere}
            label={peopleHere === 1 ? "listener in this room" : "listeners in this room"}
            state={room ? "connected" : "connecting"}
            announce="polite"
          />
        }
        preview={
          <section className="sound-live-preview" aria-label="Live sound round">
            <div className="sound-preview-meta">
              <MeshStatusPill tone={activeClue ? "live" : "info"} dot>
                {activeClue ? "Round in play" : "Ready to play"}
              </MeshStatusPill>
              <span>{score} correct</span>
            </div>
            <SoundWave />
            <div className="sound-preview-copy">
              <p>{activeClue ? "Listen for" : "First up"}</p>
              <strong>{activeClue?.prompt ?? "A familiar bark"}</strong>
              <span>
                {activeClue
                  ? `Sent by ${activeClue.createdBy}`
                  : "Start a clue and the whole room gets the same prompt."}
              </span>
            </div>
          </section>
        }
        primaryAction={launchPrimaryAction}
        secondaryAction={{ label: "Set my name", onClick: focusName }}
        loading={!room}
        connectionHint={
          room
            ? "This room is live. Every clue and guess is shared peer-to-peer."
            : "Joining the room now. Your first clue is ready when the connection is."
        }
      />

      <section className="sound-workspace" aria-label="Sound Guess game">
        <aside id="sound-identity" className="sound-identity-wrap" aria-labelledby="identity-title">
          <MeshSurface as="section" tone="quiet" padding="md" className="identity-card">
            <div>
              <p className="sound-kicker">Your seat</p>
              <h2 id="identity-title">{name.trim() || "Name yourself"}</h2>
              <p>Everyone in this room sees this name beside your guesses.</p>
            </div>
            <MeshNameInput
              label="Your display name"
              value={name}
              onChange={setName}
              ariaLabel="Your display name"
              placeholder="How should the room know you?"
              maxLength={48}
              showCounter
            />
          </MeshSurface>
        </aside>

        <MeshSurface
          as="section"
          tone="accent"
          padding="lg"
          id="sound-round"
          className="sound-round"
          aria-live="polite"
          aria-labelledby="round-title"
          tabIndex={-1}
        >
          <div className="sound-round-header">
            <div>
              <p className="sound-kicker">Current round</p>
              <h2 id="round-title">
                {activeClue ? activeClue.prompt : "Start a shared sound clue"}
              </h2>
            </div>
            <MeshStatusPill tone={activeClue ? "live" : "neutral"} dot>
              {correctGuesses.length} solved
            </MeshStatusPill>
          </div>

          {activeClue ? (
            <>
              <div className="sound-clue-stage">
                <div
                  className="sound-clue-glyph"
                  role="img"
                  aria-label={`Sound clue: ${activeClue.emoji}`}
                >
                  {activeClue.emoji}
                </div>
                <div>
                  <p className="sound-kicker">Clue sent by</p>
                  <p className="clue-byline">{activeClue.createdBy}</p>
                </div>
              </div>
              <form className="guess-form" onSubmit={submitGuess}>
                <label>
                  Your guess
                  <input
                    value={guess}
                    onChange={(event) => setGuess(event.target.value)}
                    placeholder="Type the sound or its source"
                    maxLength={80}
                    autoComplete="off"
                  />
                </label>
                <MeshButton type="submit" variant="primary" size="lg">
                  Send guess
                </MeshButton>
              </form>
              <div className="round-actions">
                <details>
                  <summary>Reveal the answer</summary>
                  <strong>{activeClue.answer}</strong>
                </details>
                <MeshButton type="button" variant="secondary" onClick={startClue}>
                  New sound
                </MeshButton>
              </div>
            </>
          ) : (
            <div className="sound-empty-round">
              <SoundWave />
              <p>Choose the first clue. Everyone who joins this room receives the same prompt.</p>
              <MeshButton
                type="button"
                variant="primary"
                size="lg"
                onClick={startClue}
                disabled={!room}
              >
                Start a sound
              </MeshButton>
            </div>
          )}
        </MeshSurface>

        <MeshSurface
          as="section"
          tone="base"
          padding="lg"
          className="guesses-card"
          aria-labelledby="guesses-title"
        >
          <div className="sound-round-header">
            <div>
              <p className="sound-kicker">The room heard</p>
              <h2 id="guesses-title">Everyone’s guesses</h2>
            </div>
            <MeshStatusPill tone={correctGuesses.length ? "success" : "neutral"} dot>
              {clueGuesses.length} total
            </MeshStatusPill>
          </div>
          {activeClue && clueGuesses.length > 0 ? (
            <ol className="guess-list">
              {clueGuesses.map((item) => (
                <li key={item.id}>
                  <span>
                    <strong>{item.author}</strong>: {item.value}
                  </span>
                  <MeshStatusPill tone={item.correct ? "success" : "neutral"}>
                    {item.correct ? "Correct" : "Try again"}
                  </MeshStatusPill>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-log">
              Guesses stay readable for everyone in the room—no sound playback or flashing feedback
              required.
            </p>
          )}
        </MeshSurface>
      </section>

      <p className="privacy-note">
        Room content is peer-to-peer and visible to participants. Sound Guess never asks for
        microphone access or captures audio.
      </p>
    </main>
  );
}
