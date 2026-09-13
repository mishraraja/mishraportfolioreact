import { AnimatePresence, motion } from "framer-motion";
import { useExperience } from "../context/ExperienceContext";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import { sfx } from "../lib/sound";
import "./TrophyCase.css";

/**
 * The scoreboard for the hidden-feature hunt. Locked entries show a hint
 * rather than nothing, so the panel is a map instead of a taunt.
 */
export function TrophyCase() {
  const {
    trophyOpen, setTrophyOpen, achievements, unlocked,
    unlockedCount, total, rank, resetProgress,
  } = useExperience();

  useLockBodyScroll(trophyOpen);

  const pct = Math.round((unlockedCount / total) * 100);
  const complete = unlockedCount === total;

  function close() {
    setTrophyOpen(false);
    sfx.close();
  }

  return (
    <AnimatePresence>
      {trophyOpen ? (
        <motion.div
          className="trophy-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="trophy"
            role="dialog"
            aria-modal="true"
            aria-label="Secrets found"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="trophy__head">
              <div>
                <span className="eyebrow">Secret hunt</span>
                <h2 className="trophy__title">
                  {complete ? "You found everything." : "Hidden in plain sight."}
                </h2>
                <p className="trophy__sub text-muted">
                  {complete
                    ? "Genuinely impressive. That was all of them."
                    : "This site has " + total + " things worth finding. Locked ones come with a hint."}
                </p>
              </div>
              <button type="button" className="trophy__close" onClick={close} aria-label="Close">
                &times;
              </button>
            </header>

            <div className="trophy__meter">
              <div className="trophy__meter-top">
                <span className="trophy__rank">{rank}</span>
                <span className="trophy__count">
                  {unlockedCount} / {total}
                </span>
              </div>
              <div className="trophy__bar">
                <motion.span
                  className="trophy__bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: pct + "%" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            <ul className="trophy__grid">
              {achievements.map((a, i) => {
                const got = unlocked.has(a.id);
                return (
                  <motion.li
                    key={a.id}
                    className={"trophy__item " + (got ? "trophy__item--got" : "")}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.3 }}
                  >
                    <span className="trophy__icon" aria-hidden="true">
                      {got ? a.icon : "?"}
                    </span>
                    <span className="trophy__text">
                      <strong>{got ? a.name : "Locked"}</strong>
                      <span className="trophy__desc">{got ? a.desc : a.hint}</span>
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            <footer className="trophy__foot">
              <span className="text-muted">Progress is saved in this browser only.</span>
              <button
                type="button"
                className="trophy__reset"
                onClick={() => {
                  resetProgress();
                  sfx.error();
                }}
              >
                Reset hunt
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
