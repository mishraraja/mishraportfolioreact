import { motion } from "framer-motion";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./Button.css";

const motionComponents = new WeakMap();
function animatedComponent(component) {
  if (typeof component === "string") return motion[component];
  if (!motionComponents.has(component)) motionComponents.set(component, motion.create(component));
  return motionComponents.get(component);
}

/**
 * Shared button/link. Small spring feedback confirms hover and press without
 * moving the target away from the pointer or running an idle animation loop.
 */
export function Button({
  as = "button",
  variant = "primary",
  className = "",
  children,
  magnetic = true,
  ...rest
}) {
  const reduced = useReducedMotion();
  const Component = animatedComponent(as);
  const animate = !reduced && magnetic && !rest.disabled && rest["aria-disabled"] !== "true";

  return (
    <Component
      className={`btn btn--${variant} ${className}`}
      whileHover={animate ? { y: -2 } : undefined}
      whileTap={animate ? { scale: .98, y: 0 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      {...rest}
    >
      <span className="btn__label">{children}</span>
    </Component>
  );
}
