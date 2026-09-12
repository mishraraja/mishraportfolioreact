import "./Tag.css";

export function Tag({ children, active = false, ...rest }) {
  return (
    <span className={`tag ${active ? "tag--active" : ""}`} {...rest}>
      {children}
    </span>
  );
}
