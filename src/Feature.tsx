import { useMemo, useState } from "react";
import {
  MeshNameInput,
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

export function Feature({ room, config }: Props) {
  const { name, setName, myName } = useNamedPeer(config, room);
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

  const startClue = () => {
    const candidate = CLUES[clues.items.length % CLUES.length] ?? CLUES[0];
    if (!candidate) return;
    clues.add({ ...candidate, id: randomId("clue"), createdBy: myName });
    setGuess("");
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

  return (
    <main className="sound-guess">
      <section className="sound-hero" aria-labelledby="sound-guess-title">
        <p className="eyebrow">Shared sound quiz</p>
        <h1 id="sound-guess-title">Hear it in your head. Guess it together.</h1>
        <p>
          Emoji and short sound prompts travel between people in this room. No microphone,
          recording, account, or backend is needed.
        </p>
      </section>
      <section className="sound-card identity-card" aria-label="Your player identity">
        <div>
          <h2>Who is playing?</h2>
          <p>Your name is shared only with people in this room.</p>
        </div>
        <MeshNameInput
          value={name}
          onChange={setName}
          ariaLabel="Your display name"
          placeholder="Your name"
          maxLength={48}
          showCounter
        />
      </section>
      <section className="sound-card game-card" aria-live="polite">
        <div className="game-heading">
          <div>
            <p className="eyebrow">Now playing</p>
            <h2>{activeClue ? activeClue.prompt : "Start a shared sound clue"}</h2>
          </div>
          <span className="score" aria-label={`Your score: ${score}`}>
            {score} correct
          </span>
        </div>
        {activeClue ? (
          <>
            <div className="emoji-clue" role="img" aria-label={`Sound clue: ${activeClue.emoji}`}>
              {activeClue.emoji}
            </div>
            <p className="clue-byline">Chosen by {activeClue.createdBy}</p>
            <form className="guess-form" onSubmit={submitGuess}>
              <label>
                Your guess
                <input
                  value={guess}
                  onChange={(event) => setGuess(event.target.value)}
                  placeholder="Type the sound or source"
                  maxLength={80}
                  autoComplete="off"
                />
              </label>
              <button type="submit">Send guess</button>
            </form>
            <div className="answer-row">
              <details>
                <summary>Reveal the answer</summary>
                <strong>{activeClue.answer}</strong>
              </details>
              <button type="button" className="secondary-button" onClick={startClue}>
                New sound
              </button>
            </div>
          </>
        ) : (
          <div className="empty-game">
            <span aria-hidden="true">🔊</span>
            <p>Choose the first clue. Everyone in the room receives the same prompt.</p>
            <button type="button" onClick={startClue} disabled={!room}>
              Start a sound
            </button>
          </div>
        )}
      </section>
      <section className="sound-card guesses-card" aria-labelledby="guesses-title">
        <div className="game-heading">
          <div>
            <p className="eyebrow">Accessible play log</p>
            <h2 id="guesses-title">Everyone’s guesses</h2>
          </div>
          <span>{correctGuesses.length} solved</span>
        </div>
        {activeClue && clueGuesses.length > 0 ? (
          <ol className="guess-list">
            {clueGuesses.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.author}</strong>: {item.value}
                </span>
                <span className={item.correct ? "result correct" : "result"}>
                  {item.correct ? "Correct" : "Try again"}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-log">
            Guesses will appear here as readable text—not just as animation or sound.
          </p>
        )}
      </section>
      <p className="privacy-note">
        Room content is peer-to-peer and visible to participants. This game never asks for
        microphone access or captures audio.
      </p>
    </main>
  );
}
