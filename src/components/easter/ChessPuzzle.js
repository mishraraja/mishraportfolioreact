import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExperience } from "../../context/ExperienceContext";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { sfx } from "../../lib/sound";
import "./ChessPuzzle.css";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

/**
 * A classic back-rank mate in one. White rook lifts to the eighth rank; the
 * black king is sealed in by its own pawns. One move, one answer: Rd8#.
 */
/**
 * Every piece carries its own id. framer-motion animates by layoutId, so two
 * pieces sharing one would be treated as the same element and collapse into
 * each other the moment anything moves.
 */
const START = {
  g8: { id: "bk", type: "k", color: "b" },
  f7: { id: "bp-f", type: "p", color: "b" },
  g7: { id: "bp-g", type: "p", color: "b" },
  h7: { id: "bp-h", type: "p", color: "b" },
  d1: { id: "wr", type: "r", color: "w" },
  g1: { id: "wk", type: "k", color: "w" },
};

const SOLUTION = { from: "d1", to: "d8" };

const GLYPH = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};

function square(fileIndex, rankIndex) {
  return FILES[fileIndex] + RANKS[rankIndex];
}

/** Legal destinations for the two white pieces on the board. */
function movesFor(sq, board) {
  const piece = board[sq];
  if (!piece || piece.color !== "w") return [];

  const f = FILES.indexOf(sq[0]);
  const r = RANKS.indexOf(Number(sq[1]));
  const out = [];

  function walk(df, dr, once) {
    let nf = f + df;
    let nr = r + dr;
    while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
      const target = square(nf, nr);
      const occupant = board[target];
      if (!occupant) out.push(target);
      else {
        if (occupant.color !== piece.color) out.push(target);
        break;
      }
      if (once) break;
      nf += df;
      nr += dr;
    }
  }

  if (piece.type === "r") {
    walk(1, 0); walk(-1, 0); walk(0, 1); walk(0, -1);
  }
  if (piece.type === "k") {
    [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([df, dr]) =>
      walk(df, dr, true)
    );
  }
  return out;
}

export function ChessPuzzle() {
  const { chessOpen, setChessOpen, unlock, fireConfetti, hasUnlocked } = useExperience();
  const [board, setBoard] = useState(START);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useLockBodyScroll(chessOpen);

  const legal = useMemo(
    () => (selected ? movesFor(selected, board) : []),
    [selected, board]
  );

  const solved = result === "solved";

  function reset() {
    setBoard(START);
    setSelected(null);
    setResult(null);
  }

  function close() {
    setChessOpen(false);
    sfx.close();
    setTimeout(reset, 300);
  }

  function onSquare(sq) {
    if (solved) return;

    const piece = board[sq];

    if (selected && legal.includes(sq)) {
      const moved = { ...board };
      delete moved[selected];
      moved[sq] = board[selected];
      setBoard(moved);

      if (selected === SOLUTION.from && sq === SOLUTION.to) {
        setResult("solved");
        sfx.success();
        fireConfetti();
        unlock("grandmaster");
      } else {
        setResult("wrong");
        setAttempts((a) => a + 1);
        sfx.error();
        // Put the piece back so the puzzle stays solvable.
        setTimeout(() => {
          setBoard(START);
          setResult(null);
        }, 1100);
      }
      setSelected(null);
      return;
    }

    if (piece && piece.color === "w") {
      setSelected(sq === selected ? null : sq);
      sfx.click();
      return;
    }
    setSelected(null);
  }

  return (
    <AnimatePresence>
      {chessOpen ? (
        <motion.div
          className="chess-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="chess"
            role="dialog"
            aria-modal="true"
            aria-label="Chess puzzle: mate in one"
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="chess__head">
              <div>
                <span className="eyebrow">Off the clock</span>
                <h2 className="chess__title">Mate in one.</h2>
                <p className="chess__sub text-muted">
                  You are White. One move ends it. Chess is on his list of things
                  he actually does away from a keyboard.
                </p>
              </div>
              <button type="button" className="chess__close" onClick={close} aria-label="Close puzzle">
                &times;
              </button>
            </header>

            <div className="chess__board" role="grid" aria-label="Chess board">
              {RANKS.map((rank, rIdx) => (
                <div className="chess__rank" role="row" key={rank}>
                  {FILES.map((file, fIdx) => {
                    const sq = file + rank;
                    const piece = board[sq];
                    const dark = (fIdx + rIdx) % 2 === 1;
                    const isTarget = legal.includes(sq);
                    const isSel = selected === sq;

                    return (
                      <button
                        key={sq}
                        role="gridcell"
                        type="button"
                        className={
                          "chess__sq " +
                          (dark ? "chess__sq--dark " : "chess__sq--light ") +
                          (isSel ? "chess__sq--sel " : "") +
                          (isTarget ? "chess__sq--target " : "") +
                          (solved && sq === SOLUTION.to ? "chess__sq--mate" : "")
                        }
                        onClick={() => onSquare(sq)}
                        aria-label={sq + (piece ? " " + piece.color + piece.type : " empty")}
                      >
                        {fIdx === 0 ? <span className="chess__coord chess__coord--r">{rank}</span> : null}
                        {rIdx === 7 ? <span className="chess__coord chess__coord--f">{file}</span> : null}
                        {piece ? (
                          <motion.span
                            layoutId={"piece-" + piece.id}
                            className={"chess__piece chess__piece--" + piece.color}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          >
                            {GLYPH[piece.color + piece.type]}
                          </motion.span>
                        ) : null}
                        {isTarget && !piece ? <span className="chess__dot" aria-hidden="true" /> : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="chess__status" aria-live="polite">
              {solved ? (
                <motion.p
                  className="chess__msg chess__msg--win"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <strong>Rd8#</strong> - back-rank mate. His own pawns locked the king in.
                  Well played.
                </motion.p>
              ) : result === "wrong" ? (
                <p className="chess__msg chess__msg--bad">Not mate. Resetting the position…</p>
              ) : (
                <p className="chess__msg text-muted">
                  {attempts >= 2
                    ? "Hint: the black king has no squares on the seventh rank."
                    : "Click a white piece, then its destination."}
                </p>
              )}
            </div>

            <footer className="chess__foot">
              <button type="button" className="chess__reset" onClick={reset}>
                Reset position
              </button>
              {hasUnlocked("grandmaster") ? (
                <span className="chess__solved-tag">Solved</span>
              ) : null}
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
