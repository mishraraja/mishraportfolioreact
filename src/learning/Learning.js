import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../dsa/useTitle";
import { createBackup, parseBackup, restoreBackup, readProgress, recommendations, MAX_BACKUP_BYTES } from "./storage";
import { prepareOffline, removeOffline, hasOfflineCopy } from "./offline";
import GoogleAccount from "./GoogleAccount";
import "./Learning.css";

const titleOf = (slug) => slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
function downloadBackup() {
  const backup = createBackup();
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url; link.download = "learning-progress-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Learning() {
  useTitle("Learning progress and revision");
  const [revision, setRevision] = useState(0);
  const [backup, setBackup] = useState(null);
  const [message, setMessage] = useState("");
  const [offlineMessage, setOfflineMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  useEffect(() => { hasOfflineCopy().then(setOfflineSaved).catch(() => {}); }, []);
  useEffect(() => {
    const refresh = () => setRevision((n) => n + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, []);
  // Re-read when a backup is imported or another tab updates progress.
  const dsa = readProgress("dsa");
  const java = readProgress("java");
  const reviews = recommendations(readProgress("reviews"));
  const due = reviews.filter((r) => r.priority < 2);
  const scheduled = reviews.filter((r) => r.priority === 2);
  const reviewPaths = new Set(reviews.map((r) => r.href));
  const legacyDue = Object.entries(dsa?.problems || {}).filter(([slug, r]) => r.mastered && !reviewPaths.has("/dsa/" + slug) && Date.now() - (r.reviewedAt || 0) >= [2, 5, 12, 30][Math.min(r.reviews || 0, 3)] * 86400000);
  const unfinished = Object.entries(java?.bosses || {}).filter(([id, r]) => !r.won && !reviewPaths.has("/java/" + id));
  async function inspect(file) {
    setBackup(null); setMessage("");
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("Choose a backup smaller than 1 MB.");
      setBackup(parseBackup(await file.text()));
    } catch (error) { setMessage(error.message); }
  }
  async function offline(action) {
    setBusy(true); setOfflineMessage("");
    try { setOfflineMessage(await action()); setOfflineSaved(await hasOfflineCopy()); }
    catch (error) { setOfflineMessage(error.message); }
    finally { setBusy(false); }
  }
  return (
    <div className="learning-page container" data-revision={revision}>
      <header><span className="eyebrow">Learning tools</span><h1>Progress and revision</h1><p>Review topics you missed, back up your progress, and save learning pages for offline use. Everything here works without an account.</p></header>
      <nav className="learning-actions" aria-label="Learning shortcuts"><Link to="/dsa">DSA problems</Link><Link to="/java">Java topics</Link><Link to="/engineering">How this site is built</Link></nav>
      <section className="learning-card" aria-labelledby="review-title">
        <h2 id="review-title">What to review</h2>
        <p>Incorrect answers come first, followed by scheduled reviews. A correct answer schedules another review after 1, 3, 7, 14 or 30 days. Repeating a question early does not increase the interval.</p>
        <p>{Object.values(dsa?.problems || {}).filter((r) => r.mastered).length} DSA problems mastered · {Object.values(java?.concepts || {}).filter(Boolean).length} Java concepts marked understood</p>
        {due.length + legacyDue.length + unfinished.length === 0 && <p>No reviews are due. Answer a DSA mastery question or a Java topic quiz to start tracking topics you need to revisit.</p>}
        <ul className="learning-list">{due.slice(0, 20).map((r) => <li key={r.id}><Link to={r.href}>{r.title}</Link><span>{r.reason} · {r.wrong} incorrect / {r.attempts} attempts</span></li>)}
          {legacyDue.slice(0, 10).map(([slug]) => <li key={slug}><Link to={"/dsa/" + slug}>{titleOf(slug)}</Link><span>Due on your existing DSA review schedule</span></li>)}
          {unfinished.slice(0, 10).map(([id]) => <li key={id}><Link to={"/java/" + id}>{titleOf(id)}</Link><span>Retry this topic quiz</span></li>)}
        </ul>
        {due.length > 20 && <p>Showing the first 20 reviews. Complete these to work through the rest.</p>}
        {scheduled.length > 0 && <details><summary>Upcoming reviews ({scheduled.length})</summary><ul className="learning-list">{scheduled.slice(0, 20).map((r) => <li key={r.id}><Link to={r.href}>{r.title}</Link><span>Review on {new Date(r.dueAt).toLocaleDateString()}</span></li>)}</ul></details>}
      </section>
      <section className="learning-card" aria-labelledby="backup-title">
        <h2 id="backup-title">Back up or restore progress</h2><p>The backup includes DSA progress, Java progress and answer history. It contains no sign-in tokens or account details. Save a copy before clearing browser storage or switching devices.</p>
        <div className="learning-actions"><button onClick={() => { try { downloadBackup(); setMessage("Backup downloaded."); } catch { setMessage("Could not export progress. Browser storage may be blocked or damaged."); } }}>Download progress backup</button><label className="learning-file">Choose backup file<input type="file" accept=".json,application/json" onChange={(e) => { inspect(e.target.files?.[0]); e.target.value = ""; }} /></label></div>
        {backup && <div className="learning-confirm"><h3>Review this backup</h3><p>DSA XP: {backup.data.dsa?.xp || 0} · Java XP: {backup.data.java?.xp || 0} · Review records: {Object.keys(backup.data.reviews || {}).length}</p><p>Restoring replaces all learning progress in this browser, including clearing sections that are empty in the backup. Download your current progress first if you want to keep it.</p><div className="learning-actions"><button onClick={() => { try { restoreBackup(backup); setBackup(null); setRevision((n) => n + 1); setMessage("Progress restored. Open an arcade to continue."); } catch (error) { setMessage(error.message); } }}>Replace progress with this backup</button><button onClick={() => setBackup(null)}>Cancel import</button></div></div>}
        {message && <p role="status">{message}</p>}
      </section>
      <section className="learning-card" aria-labelledby="offline-title">
        <h2 id="offline-title">Offline learning</h2><p>Save the app and learning content on this device. DSA problems, Java concept cards, labs and revision pages work offline. Google sign-in, live GitHub data and external links still need a connection. Download size varies by release; this includes the learning code, not videos or a Java runtime.</p><p>{offlineSaved ? "An offline copy is saved on this device." : "No offline copy has been saved yet."}</p>
        <div className="learning-actions"><button disabled={busy} onClick={() => offline(prepareOffline)}>{busy ? "Working…" : offlineSaved ? "Update offline copy" : "Save learning pages offline"}</button><button disabled={busy || !offlineSaved} onClick={() => offline(removeOffline)}>Remove offline downloads</button></div>
        {offlineMessage && <p role="status">{offlineMessage}</p>}
      </section>
      <GoogleAccount />
    </div>
  );
}
