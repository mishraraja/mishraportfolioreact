import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import entries from "./site-index.json";
import { fallback } from "./search.mjs";
import { OrbitMark, SendArrow, CloseIcon } from "./ChatIcons";

export default function SiteChat({ onClose }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const panel = useRef(null);
  const input = useRef(null);
  const log = useRef(null);
  const request = useRef(null);
  const pending = useRef(false);
  const sequence = useRef(0);
  useLockBodyScroll(true);
  useEffect(() => {
    input.current?.focus();
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 4000);
    (async () => {
      try {
        const response = await fetch("/api/chat", { signal: controller.signal, cache: "no-store" });
        if (response.ok) { const config = await response.json(); if (active) setAiEnabled(config.aiEnabled === true); }
      } catch { /* Static hosting and offline visits keep local search. */ }
      finally { clearTimeout(timer); }
    })();
    return () => { active = false; clearTimeout(timer); controller.abort(); request.current?.abort(); };
  }, []);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, busy]);
  function keys(event) {
    // Keep global portfolio keyboard shortcuts from firing while chatting.
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
    if (event.key !== "Tab") return;
    const controls = [...panel.current.querySelectorAll('button:not(:disabled), a[href], input, textarea')];
    const first = controls[0]; const last = controls[controls.length - 1];
    if (!controls.includes(document.activeElement)) { event.preventDefault(); first?.focus(); }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  async function send(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || text.length > 600 || pending.current) return;
    pending.current = true;
    setBusy(true); setQuestion("");
    const controller = new AbortController(); request.current = controller;
    let answer = fallback(text, entries);
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      if (useAI && aiEnabled) {
        const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text, useAI: true }), signal: controller.signal });
        if (!response.ok) throw new Error("unavailable");
        const result = await response.json();
        if (typeof result.answer !== "string" || result.answer.length > 2000 || !Array.isArray(result.sources) || !["ai", "local"].includes(result.mode)) throw new Error("invalid response");
        // Link destinations and excerpts always come from our bundled index.
        answer = { ...result, sources: result.sources.map((s) => entries.find((e) => e.id === s.id)).filter(Boolean).slice(0, 3) };
      }
    } catch { answer = { ...answer, notice: "AI could not reply. Showing site search results instead." }; }
    finally { clearTimeout(timer); }
    if (request.current !== controller) return;
    // On close, the DOM ref is cleared; avoid updating an unmounted panel.
    pending.current = false;
    const id = ++sequence.current;
    if (panel.current) { setMessages((prev) => [...prev.slice(-5), { id, question: text, ...answer }]); setBusy(false); input.current?.focus(); }
  }
  return createPortal(<div className="site-chat-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={panel} className="site-chat" role="dialog" aria-modal="true" aria-labelledby="site-chat-title" aria-describedby="site-chat-description" onKeyDown={keys}>
      <header className="site-chat-header"><span className="site-chat-emblem"><OrbitMark /></span><div><span className="site-chat-kicker">MISSION COMMS / RM</span><h2 id="site-chat-title">Ask about this site</h2></div><button className="site-chat-close" type="button" onClick={onClose} aria-label="Close site chat" title="Close (Esc)"><CloseIcon /></button></header>
      <div className="site-chat-channel"><span><i className="site-chat-signal" aria-hidden="true" />{useAI && aiEnabled ? "AI + SITE SOURCES" : "SITE SEARCH"}</span><span>{entries.length} PUBLIC SOURCES</span></div>
      <p id="site-chat-description" className="site-chat-description">Raja's work, projects, Java and DSA. Every result links back to the site.</p>
      {aiEnabled && <label className="site-chat-consent"><input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} /><span><strong>Use AI replies</strong> — Your question and public site passages go to Google. Free-tier messages may improve its products. Don't share sensitive information.</span></label>}
      <div className="site-chat-log" ref={log} role="log" aria-label="Chat responses" aria-live="polite" aria-relevant="additions">
        {!messages.length && <div className="site-chat-welcome"><div className="site-chat-radar" aria-hidden="true"><span /><OrbitMark /><i /></div><span className="site-chat-kicker">CHOOSE A STARTING POINT</span><h3>What brings you here?</h3><p>Explore the work. Find a topic. Get in touch.</p><div className="site-chat-prompts">{[["01", "Projects", "What projects has Raja built?"], ["02", "Java & DSA", "Explain Two Sum"], ["03", "Contact", "How do I contact Raja?"]].map(([number, label, prompt]) => <button key={number} type="button" onClick={() => { setQuestion(prompt); input.current?.focus(); }}><span>{number}</span>{label}<span aria-hidden="true">↗</span></button>)}</div></div>}
        {messages.map((message) => <div className="site-chat-exchange" key={message.id}>
          <div className="site-chat-user"><span className="site-chat-message-label">YOU</span><p>{message.question}</p></div>
          <div className="site-chat-reply"><span className="site-chat-message-label"><span className="site-chat-mini-orbit"><OrbitMark /></span>{message.mode === "ai" ? "AI ANSWER" : "FROM THE SITE"}</span><p>{message.answer}</p>
          {message.notice && <p className="site-chat-note">{message.notice}</p>}
          {message.sources.length > 0 && <ul className="site-chat-sources">{message.sources.map((source, index) => <li key={source.id}><a href={source.href} onClick={onClose}><span className="site-chat-source-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{source.title}<span aria-hidden="true">↗</span></a>{message.mode === "local" && <p>{source.text.slice(0, 1100)}{source.text.length > 1100 ? "…" : ""}</p>}</li>)}</ul>}</div>
        </div>)}
      </div>
      <div className="site-chat-footer"><p className="site-chat-note">{useAI ? "AI can make mistakes. Check the sources. " : ""}Clears on close. Ask each question in full.</p>
      <form onSubmit={send}><label className="site-chat-input-label" htmlFor="site-chat-question">Your question</label><div className="site-chat-composer"><textarea ref={input} id="site-chat-question" maxLength={600} rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) send(event); }} placeholder="Type your question…" aria-describedby="site-chat-keyboard-hint" /><button className="site-chat-send" type="submit" aria-label="Send question" title="Send question (Enter)" disabled={busy || !question.trim()}>{busy ? <span className="site-chat-spinner" aria-hidden="true" /> : <SendArrow />}</button></div><div className="site-chat-controls"><span id="site-chat-keyboard-hint">Enter to send <span aria-hidden="true">·</span> Shift + Enter for a new line</span><span>{question.length}/600</span></div><span className="site-chat-busy" role="status">{busy ? "Searching site sources…" : ""}</span></form></div>
    </section>
  </div>, document.body);
}
