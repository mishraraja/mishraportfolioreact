import { Chess } from "chess.js";
import { attemptMove, CHESS_PUZZLES, drawPuzzle, LEVELS, opponentReply, solutionNotation, startPuzzle, uciMove } from "./puzzleEngine";

test.each(CHESS_PUZZLES.map((puzzle) => [puzzle.id, puzzle]))("%s has a legal complete line ending in checkmate", (_, puzzle) => {
  let state = startPuzzle(puzzle);
  const player = state.player;
  for (const [index, uci] of puzzle.line.entries()) {
    state = index % 2 === 0 ? attemptMove(puzzle, state, uciMove(uci)) : opponentReply(puzzle, state);
    expect(state.mistakes).toBe(0);
    if (index < puzzle.line.length - 1) expect(state.status).toBe(index % 2 === 0 ? "replying" : "playing");
  }
  const end = new Chess(state.fen);
  expect(end.isCheckmate()).toBe(true);
  expect(end.turn()).not.toBe(player);
  expect(state.status).toBe("solved");
  expect(solutionNotation(puzzle)).toMatch(/#$/);
});

test("three wrong legal moves use exactly three attempts and preserve the position", () => {
  const puzzle = CHESS_PUZZLES[0];
  let state = startPuzzle(puzzle);
  const original = state.fen;
  const wrong = new Chess(original).moves({ verbose: true }).find((move) => {
    const result = attemptMove(puzzle, state, move);
    return result.mistakes === 1;
  });
  expect(wrong).toBeDefined();
  for (let attempt = 1; attempt <= 3; attempt++) {
    state = attemptMove(puzzle, state, wrong);
    expect(state.mistakes).toBe(attempt);
    expect(state.fen).toBe(original);
    expect(state.status).toBe(attempt === 3 ? "failed" : "playing");
  }
  expect(attemptMove(puzzle, state, uciMove(puzzle.line[0]))).toBe(state);
});

test("illegal moves do not use an attempt", () => {
  const puzzle = CHESS_PUZZLES[0], state = startPuzzle(puzzle);
  const next = attemptMove(puzzle, state, { from: "a1", to: "a1" });
  expect(next.mistakes).toBe(0); expect(next.fen).toBe(state.fen);
});

test("a different move that also checkmates is accepted", () => {
  const puzzle = { fen: "7k/5ppp/8/8/8/8/8/RR4K1 b - - 0 1", setup: "h8g8", line: ["a1a8"] };
  const state = startPuzzle(puzzle);
  const alternative = new Chess(state.fen).moves({ verbose: true }).find((move) => {
    const game = new Chess(state.fen); game.move(move);
    return game.isCheckmate() && move.from + move.to !== puzzle.line[0];
  });
  expect(alternative).toBeDefined();
  expect(attemptMove(puzzle, state, alternative).status).toBe("solved");
});

test("correct multi-move progress survives a wrong continuation", () => {
  const puzzle = CHESS_PUZZLES.find((item) => item.level === "advanced");
  let state = attemptMove(puzzle, startPuzzle(puzzle), uciMove(puzzle.line[0]));
  expect(state.status).toBe("replying");
  expect(attemptMove(puzzle, state, uciMove(puzzle.line[0]))).toBe(state);
  state = opponentReply(puzzle, state);
  const checkpoint = state.fen;
  const wrong = new Chess(state.fen).moves({ verbose: true }).find((move) => attemptMove(puzzle, state, move).mistakes === 1);
  state = attemptMove(puzzle, state, wrong);
  expect(state.fen).toBe(checkpoint); expect(state.step).toBe(2);
});

test.each(LEVELS)("%s draws every puzzle before repeating", (level) => {
  const count = CHESS_PUZZLES.filter((puzzle) => puzzle.level === level).length;
  const drawn = Array.from({ length: count }, () => drawPuzzle(level));
  expect(new Set(drawn.map((puzzle) => puzzle.id)).size).toBe(count);
  const next = drawPuzzle(level, drawn[count - 1].id);
  expect(next.id).not.toBe(drawn[count - 1].id);
});
