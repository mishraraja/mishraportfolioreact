import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { FaChessBishop, FaChessKing, FaChessKnight, FaChessPawn, FaChessQueen, FaChessRook } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { useExperience } from "../../context/ExperienceContext";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { WindowControls } from "../ui/WindowControls";
import { attemptMove, CHESS_PUZZLES, drawPuzzle, legalMoves, LEVELS, MAX_ATTEMPTS, opponentReply, puzzleHint, solutionNotation, startPuzzle } from "./puzzleEngine";
import { sfx } from "../../lib/sound";
import "./ChessPuzzle.css";

const FILES = [..."abcdefgh"];
const PIECES = { k: FaChessKing, q: FaChessQueen, r: FaChessRook, b: FaChessBishop, n: FaChessKnight, p: FaChessPawn };
const NAMES = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
const SIDES = { w: "White", b: "Black" };
let sessionLevel = "beginner";

function ChessPiece({ type, colour }) {
  const Icon = PIECES[type];
  return <span className={"chess__piece chess__piece--" + colour} aria-hidden="true"><Icon /></span>;
}

export function ChessPuzzle() {
  const { chessOpen, setChessOpen, unlock } = useExperience();
  const reduced = useReducedMotion();
  const [level, setLevel] = useState(sessionLevel);
  const [puzzle, setPuzzle] = useState(() => drawPuzzle(level));
  const [round, setRound] = useState(() => startPuzzle(puzzle));
  const [selected, setSelected] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [hint, setHint] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [focusSquare, setFocusSquare] = useState(round.lastMove[1]);
  const [session, setSession] = useState({ solved: 0, played: 1 });
  const dialogRef = useRef(null);
  const boardRef = useRef(null);
  const roundRef = useRef(round);
  const replyRef = useRef(null);
  useEffect(() => { roundRef.current = round; }, [round]);
  useLockBodyScroll(chessOpen);
  useDialogFocus(chessOpen, dialogRef, close);

  const game = useMemo(() => new Chess(round.fen), [round.fen]);
  const legal = useMemo(() => selected ? legalMoves(round, selected) : [], [round, selected]);
  const files = round.player === "b" ? [...FILES].reverse() : FILES;
  const ranks = round.player === "b" ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const active = round.status === "playing";
  const checkSquare = game.isCheck() ? game.board().flat().find((piece) => piece?.type === "k" && piece.color === game.turn())?.square : null;

  useEffect(() => {
    if (round.status !== "replying") return undefined;
    replyRef.current = setTimeout(() => {
      setRound((previous) => opponentReply(puzzle, previous));
      replyRef.current = null;
    }, reduced ? 180 : 500);
    return () => clearTimeout(replyRef.current);
  }, [puzzle, round.status, reduced]);

  function close() { clearTimeout(replyRef.current); setChessOpen(false); sfx.close(); }
  function loadPuzzle(next, nextLevel = level, focusBoard = false) {
    clearTimeout(replyRef.current);
    const state = startPuzzle(next);
    sessionLevel = nextLevel;
    roundRef.current = state;
    setPuzzle(next); setLevel(nextLevel); setRound(state); setSelected(null); setPromotion(null); setHint(""); setRevealed(false); setFocusSquare(state.lastMove[1]);
    requestAnimationFrame(() => {
      if (dialogRef.current) dialogRef.current.scrollTop = 0;
      if (focusBoard) boardRef.current?.querySelector('[data-square="' + state.lastMove[1] + '"]')?.focus({ preventScroll: true });
    });
  }
  function nextPuzzle(nextLevel = level, focusBoard = false) {
    loadPuzzle(drawPuzzle(nextLevel, puzzle.id), nextLevel, focusBoard);
    setSession((previous) => ({ ...previous, played: previous.played + 1 }));
  }
  function move(from, to, promote) {
    const previous = roundRef.current;
    const next = attemptMove(puzzle, previous, { from, to, ...(promote ? { promotion: promote } : {}) });
    roundRef.current = next;
    setRound(next); setSelected(null); setPromotion(null); setHint("");
    if (next.status === "solved" && previous.status !== "solved") {
      setSession((value) => ({ ...value, solved: value.solved + 1 })); unlock("grandmaster"); sfx.success();
    } else if (next.mistakes > previous.mistakes) sfx.error();
    else sfx.click();
  }
  function onSquare(square) {
    setFocusSquare(square);
    if (!active || promotion) return;
    if (selected) {
      const options = legal.filter((candidate) => candidate.to === square);
      if (options.length) {
        if (options.some((candidate) => candidate.promotion)) setPromotion({ from: selected, to: square });
        else move(selected, square);
        return;
      }
    }
    const piece = game.get(square);
    setSelected(piece?.color === round.player ? (selected === square ? null : square) : null);
  }
  function boardKeys(event, file, rank) {
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction) return;
    event.preventDefault();
    const nextFile = Math.max(0, Math.min(7, file + direction[0]));
    const nextRank = Math.max(0, Math.min(7, rank + direction[1]));
    const square = files[nextFile] + ranks[nextRank];
    setFocusSquare(square); boardRef.current.querySelector('[data-square="' + square + '"]')?.focus();
  }

  return <AnimatePresence>{chessOpen && <motion.div className="chess-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
    <motion.div ref={dialogRef} className="chess" role="dialog" aria-modal="true" aria-label="Chess puzzle studio"
      initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .2 }} onClick={(event) => event.stopPropagation()}>
      <div className="overlay-window-bar"><WindowControls title="puzzle" onClose={close} /><span>OFF THE CLOCK / CHESS STUDIO</span><span className="chess__session">{session.solved}/{session.played} solved</span></div>
      <header className="chess__head"><div><span className="eyebrow">A little deeper each time</span><h2 className="chess__title">Find the finish.</h2><p className="chess__sub">Random positions. Real tactics. Three attempts to find the complete mating line.</p></div>
        <div className="chess__difficulty"><label htmlFor="chess-difficulty">Difficulty</label><select id="chess-difficulty" value={level} onChange={(event) => nextPuzzle(event.target.value)}>{[...LEVELS, "all"].map((item) => <option value={item} key={item}>{item === "all" ? "Mix all levels" : item[0].toUpperCase() + item.slice(1)}</option>)}</select></div>
      </header>
      <div className="chess__workspace">
        <div className="chess__play">
          <div className="chess__board-meta"><span>YOU PLAY {SIDES[round.player].toUpperCase()}</span><span>{round.status === "replying" ? "OPPONENT’S TURN" : round.status === "solved" ? "CHECKMATE" : "MATE IN " + puzzle.mateIn}</span></div>
          <div ref={boardRef} className="chess__board" role="grid" aria-label="Chess board. Arrow keys move between squares; Enter selects a piece or move." aria-busy={round.status === "replying"}>
            {ranks.map((rank, rankIndex) => <div className="chess__rank" role="row" key={rank}>{files.map((file, fileIndex) => {
              const square = file + rank, piece = game.get(square), dark = (FILES.indexOf(file) + rank) % 2 === 0;
              const target = legal.some((candidate) => candidate.to === square);
              const last = round.lastMove?.includes(square);
              return <button key={square} type="button" role="gridcell" data-square={square} tabIndex={focusSquare === square ? 0 : -1}
                aria-label={square + (piece ? " " + SIDES[piece.color] + " " + NAMES[piece.type] : " empty")}
                aria-selected={selected === square} aria-disabled={!active || Boolean(promotion)}
                className={"chess__sq chess__sq--" + (dark ? "dark" : "light") + (last ? " is-last" : "") + (selected === square ? " is-selected" : "") + (target ? " is-target" : "") + (square === checkSquare ? " is-check" : "")}
                onClick={() => onSquare(square)} onKeyDown={(event) => boardKeys(event, fileIndex, rankIndex)}>
                {fileIndex === 0 && <span className="chess__coord chess__coord--r" aria-hidden="true">{rank}</span>}
                {rankIndex === 7 && <span className="chess__coord chess__coord--f" aria-hidden="true">{file}</span>}
                {piece && <ChessPiece type={piece.type} colour={piece.color} />}
                {target && !piece && <span className="chess__dot" aria-hidden="true" />}
              </button>;
            })}</div>)}
          </div>
          {promotion && <div className="chess__promotion" role="group" aria-label="Choose promotion">{["q", "r", "b", "n"].map((piece) => <button autoFocus={piece === "q"} key={piece} type="button" aria-label={"Promote to " + NAMES[piece]} onClick={() => move(promotion.from, promotion.to, piece)}><ChessPiece type={piece} colour={round.player} /><span>{NAMES[piece]}</span></button>)}<button type="button" onClick={() => setPromotion(null)}>Cancel</button></div>}
          <p className="chess__board-help">Select a piece, then a highlighted square. Arrow keys + Enter work too.</p>
        </div>
        <div className="chess__study">
          <div className="chess__puzzle-meta"><span>{puzzle.level} / {puzzle.rating} rating</span><span>{CHESS_PUZZLES.filter((item) => level === "all" || item.level === level).length} puzzles in this set</span></div>
          <div className="chess__attempts" aria-label={(MAX_ATTEMPTS - round.mistakes) + " attempts remaining"}><span>Attempts</span><div aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i < MAX_ATTEMPTS - round.mistakes ? "is-available" : ""} />)}</div><strong>{MAX_ATTEMPTS - round.mistakes} / 3</strong></div>
          <div className={"chess__status chess__status--" + round.status} role="status" aria-live="polite"><strong>{round.status === "solved" ? "Nicely calculated." : round.status === "failed" ? "Take a closer look." : round.status === "replying" ? "Your move connected." : "Your move."}</strong><p>{round.message}</p></div>
          {!!round.moves.length && <div className="chess__notation" aria-label="Moves played">{round.moves.map((san, i) => <span key={i}><small>{i % 2 === 0 ? "YOU" : "REPLY"}</small>{san}</span>)}</div>}
          {hint && <p className="chess__hint" role="status">{hint}</p>}
          {revealed && <div className="chess__solution"><span>FULL SOLUTION / ALTERNATING SIDES</span><p>{solutionNotation(puzzle)}</p></div>}
          <div className="chess__actions">
            {active && <button type="button" onClick={() => setHint(puzzleHint(puzzle, round))}>Show a hint</button>}
            {round.status === "failed" && <><button type="button" onClick={() => setRevealed(true)}>Show solution</button><button type="button" onClick={() => loadPuzzle(puzzle, level, true)}>Retry puzzle</button></>}
            <button type="button" className="chess__next" onClick={() => nextPuzzle(level, true)}>New random puzzle <span aria-hidden="true">↗</span></button>
          </div>
          <footer className="chess__source"><a href={"https://lichess.org/training/" + puzzle.id} target="_blank" rel="noreferrer">Lichess #{puzzle.id} ↗</a><span>CC0 puzzle set · works offline</span></footer>
        </div>
      </div>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
