import { useRef } from "react";
import "./Button.css";

/**
 * Shared button/link. Applies a subtle magnetic pull toward the cursor on
 * pointer devices; falls back to a plain hover state on touch / reduced motion.
 */
export function Button({
  as = "button",
  variant = "primary",
  className = "",
  children,
  magnetic = true,
  ...rest
}) {
  const ref = useRef(null);
  const Component = as;

  function onMouseMove(e) {
    if (!magnetic || !ref.current || window.matchMedia("(pointer: coarse)").matches) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
  }

  function onMouseLeave() {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0, 0)";
  }

  return (
    <Component
      ref={ref}
      className={`btn btn--${variant} ${className}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      {...rest}
    >
      <span className="btn__label">{children}</span>
    </Component>
  );
}
