import { AnimatePresence, motion } from "framer-motion";
import { useExperience } from "../../context/ExperienceContext";
import "./AchievementToast.css";

/** The little "secret unlocked" card that slides in on every discovery. */
export function AchievementToast() {
  const { toast, dismissToast, total } = useExperience();

  return (
    <div className="toast-layer" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toast ? (
          <motion.button
            key={toast.id}
            className="achv-toast"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            onClick={dismissToast}
            type="button"
          >
            <span className="achv-toast__icon" aria-hidden="true">
              {toast.icon}
            </span>
            <span className="achv-toast__body">
              <span className="achv-toast__label">
                Secret unlocked
                <span className="achv-toast__count">
                  {toast.count}/{total}
                </span>
              </span>
              <strong className="achv-toast__name">{toast.name}</strong>
              <span className="achv-toast__desc">{toast.desc}</span>
            </span>
            <motion.span
              className="achv-toast__bar"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4.2, ease: "linear" }}
            />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
