import { Chess } from "chess.js";
import puzzles from "./chessPuzzles.json";

export const CHESS_PUZZLES = puzzles;
export const MAX_ATTEMPTS = 3;
export const LEVELS = ["beginner", "intermediate", "advanced"];
const decks = new Map();
let lastDrawn = null;

export function drawPuzzle(level = "beginner", previousId, random = Math.random) {
  const pool = puzzles.filter((puzzle) => level === "all" || puzzle.level === level);
  if (!pool.length) throw new Error("Unknown chess difficulty: " + level);
  let deck = decks.get(level) || [];
  if (!deck.length) {
    deck = [...pool];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  const previous = previousId || lastDrawn;
  if (deck.length > 1 && deck[deck.length - 1].id === previous) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
  else if (deck.length === 1 && deck[0].id === previous && pool.length > 1) {
    // Preserve the deferred last item while avoiding an immediate repeat after
    // changing difficulty filters.
    const next = pool.find((puzzle) => puzzle.id !== previous);
    lastDrawn = next.id;
    return next;
  }
  const next = deck.pop(); decks.set(level, deck); lastDrawn = next.id;
  return next;
}

export function uciMove(uci) { return { from: uci.slice(0, 2), to: uci.slice(2, 4), ...(uci[4] ? { promotion: uci[4] } : {}) }; }

export function startPuzzle(puzzle) {
  const game = new Chess(puzzle.fen);
  const setup = game.move(uciMove(puzzle.setup));
  return { fen: game.fen(), player: game.turn(), step: 0, mistakes: 0, status: "playing", message: "Find the forcing line. Select a piece, then its destination.", moves: [], lastMove: [setup.from, setup.to] };
}

export function legalMoves(state, square) {
  return state.status === "playing" ? new Chess(state.fen).moves({ square, verbose: true }) : [];
}

export function attemptMove(puzzle, state, move) {
  if (state.status !== "playing") return state;
  const game = new Chess(state.fen);
  let played;
  try { played = game.move(move); } catch { return { ...state, message: "That move is not legal. Choose a highlighted square; no attempt lost." }; }
  const uci = played.from + played.to + (played.promotion || "");
  const mate = game.isCheckmate();
  if (uci !== puzzle.line[state.step] && !mate) {
    const mistakes = state.mistakes + 1;
    return { ...state, mistakes, status: mistakes >= MAX_ATTEMPTS ? "failed" : "playing", message: mistakes >= MAX_ATTEMPTS ? "Three attempts used. Review the solution or retry this puzzle." : "That move misses the mating line. Your position is unchanged; try another idea." };
  }
  return { ...state, fen: game.fen(), step: mate ? puzzle.line.length : state.step + 1, status: mate ? "solved" : "replying", message: mate ? "Checkmate. You found the finish." : "Good move. Your opponent is responding…", moves: [...state.moves, played.san], lastMove: [played.from, played.to] };
}

export function opponentReply(puzzle, state) {
  if (state.status !== "replying") return state;
  const game = new Chess(state.fen);
  const played = game.move(uciMove(puzzle.line[state.step]));
  return { ...state, fen: game.fen(), step: state.step + 1, status: "playing", message: game.isCheck() ? "You are in check. Find the continuation." : "Your turn. Keep the mating attack going.", moves: [...state.moves, played.san], lastMove: [played.from, played.to] };
}

export function solutionNotation(puzzle) {
  const game = new Chess(startPuzzle(puzzle).fen);
  return puzzle.line.map((uci) => game.move(uciMove(uci)).san).join("  ");
}

export function puzzleHint(puzzle, state) {
  const game = new Chess(state.fen), move = uciMove(puzzle.line[state.step]);
  const names = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
  return "Look at your " + names[game.get(move.from)?.type] + " on " + move.from + ". Start with checks and restrict the king’s escape squares.";
}
