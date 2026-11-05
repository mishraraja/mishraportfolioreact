import { useId } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./SegmentedControl.css";

/** Sliding selection inspired by Watermelon UI's Continuous Tabs pattern.
 * These are filter buttons, so pressed states preserve native keyboard use.
 */
export function SegmentedControl({ label, options, value, onChange }) {
  const id = useId();
  const reduced = useReducedMotion();
  return (
    <div className="segments" role="group" aria-label={label}>
      {options.map((option) => (
        <button type="button" key={option.id} className="segments__button"
          aria-pressed={value === option.id} onClick={() => onChange(option.id)}>
          {value === option.id && (
            <motion.span className="segments__selection" layoutId={reduced ? undefined : id}
              transition={{ type: "spring", stiffness: 420, damping: 34 }} aria-hidden="true" />
          )}
          <span className="segments__label">{option.label}</span>
          {option.count !== undefined && <span className="segments__count">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
