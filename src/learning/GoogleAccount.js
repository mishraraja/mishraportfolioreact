import { useEffect, useState } from "react";

const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};
export const authConfigured = Object.values(config).every(Boolean);
let service;
async function authService() {
  if (!service) service = Promise.all([import("firebase/app"), import("firebase/auth")]).then(([app, auth]) => {
    const instance = app.getApps().length ? app.getApp() : app.initializeApp(config);
    return { ...auth, instance: auth.getAuth(instance) };
  }).catch((error) => { service = null; throw error; });
  return service;
}

export default function GoogleAccount() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!authConfigured) return undefined;
    let alive = true;
    let unsubscribe;
    authService().then((auth) => {
      if (!alive) return;
      unsubscribe = auth.onAuthStateChanged(auth.instance, (next) => { setUser(next); setReady(true); });
    }).catch(() => { if (alive) setMessage("Sign-in could not load. Check your connection and reload this page."); });
    return () => { alive = false; unsubscribe?.(); };
  }, []);

  async function signIn() {
    setBusy(true); setMessage("");
    try {
      const auth = await authService();
      await auth.setPersistence(auth.instance, auth.browserSessionPersistence);
      const provider = new auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await auth.signInWithPopup(auth.instance, provider);
    } catch (error) {
      setMessage(error.code === "auth/popup-closed-by-user" ? "Sign-in cancelled. You can continue without an account." : error.code === "auth/popup-blocked" ? "Allow the sign-in popup and try again." : "Google sign-in is unavailable. You can continue using the learning tools without it.");
    } finally { setBusy(false); }
  }
  async function leave(remove = false) {
    setBusy(true); setMessage("");
    try {
      const auth = await authService();
      if (remove) await auth.deleteUser(auth.instance.currentUser);
      else await auth.signOut(auth.instance);
      setMessage(remove ? "Your sign-in account was deleted. This browser's learning progress is unchanged." : "Signed out. This browser's learning progress is unchanged.");
    } catch (error) {
      setMessage(error.code === "auth/requires-recent-login" ? "Sign out, sign in again, then retry deleting your account." : "The action failed. Check your connection and try again.");
    } finally { setBusy(false); }
  }
  return (
    <section className="learning-card" aria-labelledby="account-title">
      <h2 id="account-title">Google sign-in</h2>
      <p>Sign-in is optional. Progress stays in this browser and is shared by anyone using this browser profile. It is not linked to your Google account or synced between devices.</p>
      {!authConfigured ? <p>Google sign-in is not available yet. You can use every learning tool without signing in.</p> : user ? <>
        <p>Signed in as {user.displayName || user.email}.</p>
        <div className="learning-actions"><button disabled={busy} onClick={() => leave()}>Sign out</button>
          <details><summary>Delete sign-in account</summary><p>This removes your account from this site's authentication service. It does not delete your Google account or local progress.</p><button disabled={busy} onClick={() => leave(true)}>Confirm account deletion</button></details></div>
      </> : <button disabled={busy || !ready} onClick={signIn}>{busy ? "Opening Google…" : "Sign in with Google"}</button>}
      <p className="learning-note">When enabled, Google and Firebase handle sign-in and store basic account information. This site does not request Gmail, Drive or Calendar access. The sign-in session lasts for this browser tab's session.</p>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
