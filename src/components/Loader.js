import { motion, AnimatePresence } from "framer-motion";
import "./Loader.css";

/** A brief, non-blocking loading indicator. */
export function Loader({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="loader"
          role="status"
          aria-label="Loading portfolio"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <span className="loader__bar" aria-hidden="true" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
