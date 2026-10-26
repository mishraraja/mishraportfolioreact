import { useRef, useState } from "react";
import "./Chat.css";
import { OrbitMark } from "./ChatIcons";

export default function ChatLauncher() {
  const [Panel, setPanel] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const button = useRef(null);
  async function launch() {
    setError("");
    if (Panel) { setOpen(true); return; }
    setLoading(true);
    try { const module = await import("./SiteChat"); setPanel(() => module.default); setOpen(true); }
    catch { setError("Chat could not load. Check your connection and retry."); }
    finally { setLoading(false); }
  }
  return <>
    <button ref={button} className="site-chat-launch" onClick={launch} disabled={loading} aria-label={loading ? "Loading chat" : "Ask about this site"} aria-haspopup="dialog" aria-expanded={open}><span className="site-chat-launch-orbit"><OrbitMark /></span><span><span className="site-chat-launch-label">MISSION COMMS</span><span>{loading ? "Opening channel…" : "Ask about this site"}</span></span><span className="site-chat-signal" aria-hidden="true" /></button>
    {error && <p className="site-chat-load-error" role="status">{error}</p>}
    {open && Panel && <Panel onClose={() => { setOpen(false); button.current?.focus(); }} />}
  </>;
}
