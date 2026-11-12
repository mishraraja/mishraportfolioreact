import "./Loader.css";

export function Loader({ visible }) {
  if (!visible) return null;

  return <div className="loader" role="status" aria-label="Loading portfolio" />;
}
